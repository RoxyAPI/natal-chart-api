import { createRoxy } from '@roxyapi/sdk';

const roxy = createRoxy(process.env.ROXY_API_KEY!);

/**
 * Natal Chart API: complete Western birth chart with all 10 planetary positions,
 * 12 house cusps, major and minor aspects, Ascendant, Midheaven, dominant
 * elements and modalities. Roxy Ephemeris, verified against NASA JPL Horizons.
 * Call /location/search first -- never hardcode coordinates.
 */
async function main() {
  // Step 1: geocode the birth city
  const { data: loc, error: locErr } = await roxy.location.searchCities({
    query: { q: 'New York' },
  });
  if (locErr) throw new Error(locErr.error);
  const { latitude, longitude, timezone } = loc.cities[0];

  // Step 2: generate the full natal chart with planets, houses, aspects
  const { data, error } = await roxy.astrology.generateNatalChart({
    body: {
      date: '1990-07-15',
      time: '14:30:00',
      latitude,
      longitude,
      timezone,
      houseSystem: 'placidus',
    },
  });

  if (error) throw new Error(error.error);

  console.log(`Birth: ${data.birthDetails.date} ${data.birthDetails.time} (timezone offset ${data.birthDetails.timezone})`);
  console.log(`Ascendant: ${data.ascendant.sign} ${data.ascendant.degree.toFixed(2)}`);
  console.log(`Midheaven: ${data.midheaven.sign} ${data.midheaven.degree.toFixed(2)}`);

  console.log(`\nDominant element: ${data.summary.dominantElement}`);
  console.log(`Dominant modality: ${data.summary.dominantModality}`);
  console.log(`Retrograde planets: ${data.summary.retrogradePlanets.join(', ') || 'none'}`);

  console.log('\nBig three:');
  const sun = data.planets.find(p => p.name === 'Sun');
  const moon = data.planets.find(p => p.name === 'Moon');
  if (sun) console.log(`  Sun in ${sun.sign} (house ${sun.house})`);
  if (moon) console.log(`  Moon in ${moon.sign} (house ${moon.house})`);
  console.log(`  Rising in ${data.ascendant.sign}`);

  console.log('\nAll planetary placements:');
  for (const p of data.planets) {
    const retro = p.isRetrograde ? ' (R)' : '';
    console.log(`  ${p.name.padEnd(12)} ${p.sign.padEnd(12)} ${p.degree.toFixed(2).padStart(6)} house ${p.house}${retro}`);
  }

  console.log(`\nAspect pattern: ${data.aspectsInterpretation.dominant}`);
  console.log(`  ${data.aspectsInterpretation.harmonious} harmonious, ${data.aspectsInterpretation.challenging} challenging, ${data.aspectsInterpretation.neutral} neutral`);

  console.log('\nTop 5 aspects by strength:');
  for (const a of data.aspects.slice(0, 5)) {
    console.log(`  ${a.planet1} -> ${a.planet2}: ${a.type} orb ${a.orb.toFixed(2)} strength ${a.strength} [${a.interpretation}]`);
  }

  if (sun?.interpretation) {
    console.log('\nSun placement narrative:');
    console.log(' ', sun.interpretation.summary);
  }
}

main().catch(console.error);
