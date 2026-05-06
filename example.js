import { createRoxy } from '@roxyapi/sdk';

const roxy = createRoxy(process.env.ROXY_API_KEY);

/**
 * Natal Chart API: complete Western birth chart with planets, houses, aspects,
 * Ascendant, Midheaven. Call /location/search first -- never hardcode coordinates.
 */
async function main() {
  // Step 1: geocode the birth city
  const { data: loc, error: locErr } = await roxy.location.searchCities({
    query: { q: 'New York' },
  });
  if (locErr) throw new Error(locErr.error);
  const { latitude, longitude, timezone } = loc.cities[0];

  // Step 2: generate the natal chart
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

  console.log(`Ascendant: ${data.ascendant.sign} ${data.ascendant.degree.toFixed(2)}`);
  console.log(`Midheaven: ${data.midheaven.sign} ${data.midheaven.degree.toFixed(2)}`);
  console.log(`Dominant element: ${data.summary.dominantElement}`);
  console.log(`Dominant modality: ${data.summary.dominantModality}`);

  console.log('\nFirst 5 planets:');
  for (const p of data.planets.slice(0, 5)) {
    const retro = p.isRetrograde ? ' (R)' : '';
    console.log(`  ${p.name} in ${p.sign} (house ${p.house})${retro}`);
  }

  console.log('\nTop 3 aspects:');
  for (const a of data.aspects.slice(0, 3)) {
    console.log(`  ${a.planet1} -> ${a.planet2}: ${a.type} orb=${a.orb.toFixed(2)} strength=${a.strength}`);
  }
}

main().catch(console.error);
