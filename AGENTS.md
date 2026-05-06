# AGENTS.md for Natal Chart API

This repo teaches AI coding agents (Cursor, Claude Code, Aider, Codex, Windsurf, RooCode, Gemini CLI) how to use the RoxyAPI natal chart endpoint.

## Endpoint
- Method: `POST`
- URL: `https://roxyapi.com/api/v2/astrology/natal-chart`
- Auth: `X-API-Key` header
- Domain: `astrology` (one of 10 in the RoxyAPI catalog)
- Operation ID: `generateNatalChart` matches the SDK method name in camelCase
- MCP tool: `post_astrology_natal_chart` on `https://roxyapi.com/mcp/astrology`

## TypeScript SDK
```ts
import { createRoxy } from '@roxyapi/sdk';
const roxy = createRoxy(process.env.ROXY_API_KEY!);
const { data, error } = await roxy.astrology.generateNatalChart({
  body: {
    date: '1990-07-15',
    time: '14:30:00',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
    houseSystem: 'placidus',
  },
});
```

## Python SDK
```python
import os
from roxy_sdk import create_roxy
roxy = create_roxy(os.environ["ROXY_API_KEY"])
result = roxy.astrology.generate_natal_chart(
    date="1990-07-15",
    time="14:30:00",
    latitude=40.7128,
    longitude=-74.006,
    timezone="America/New_York",
    house_system="placidus",
)
```

## Setup step (coordinate-dependent endpoint)
Always call `GET /location/search?q={city}` first. Take `latitude`, `longitude`, `timezone` from `cities[0]` and pipe them in. Never ask the user to type coordinates.

```ts
const { data: loc } = await roxy.location.searchCities({ query: { q: 'New York' } });
const { latitude, longitude, timezone } = loc.cities[0];
const { data } = await roxy.astrology.generateNatalChart({
  body: { date: '1990-07-15', time: '14:30:00', latitude, longitude, timezone },
});
```

## Request fields
- `date` (string, required): birth date YYYY-MM-DD. Determines planetary positions for the calendar day
- `time` (string, required): birth time HH:MM:SS, 24-hour. Determines the Ascendant and house cusps. Use 12:00:00 if unknown
- `latitude` (number, required): -90 to 90. Get from `/location/search`
- `longitude` (number, required): -180 to 180. Get from `/location/search`
- `timezone` (number or IANA string, required): UTC offset (e.g. -5) or IANA name (e.g. "America/New_York", "Asia/Kolkata"). Server resolves DST-correct offset for the birth date
- `houseSystem` (string, optional): `placidus` (default), `whole-sign`, `equal`, `koch`

## Response top level keys
- `birthDetails`: echoed input (date, time, latitude, longitude, resolved timezone offset)
- `planets[]`: 13 entries (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, North Node, South Node, Chiron). Each has `name`, `longitude`, `latitude`, `sign`, `degree`, `house`, `speed`, `isRetrograde`, and `interpretation` object with `summary`, `detailed`, `keywords`
- `houses[]`: 12 entries with `number`, `longitude`, `sign`, `degree`. Cusps for the chosen house system
- `houseSystem`: echoed enum value
- `aspects[]`: planetary aspects with `planet1`, `planet2`, `type`, `angle`, `orb`, `isApplying`, `strength` (0-100), `interpretation` (harmonious/challenging/neutral)
- `aspectsInterpretation`: `summary` narrative, `dominant` flag, `harmonious`, `challenging`, `neutral` counts
- `ascendant`: `sign`, `degree`, `longitude`. Rising sign at the eastern horizon
- `midheaven`: `sign`, `degree`, `longitude`. MC, highest point of the ecliptic
- `summary`: `dominantElement`, `dominantModality`, `retrogradePlanets[]`, `elementDistribution` (Fire/Earth/Air/Water counts), `modalityDistribution` (Cardinal/Fixed/Mutable counts)

## Domain rules
- Always call `/location/search` first. Never hardcode coordinates.
- `timezone` accepts both decimal UTC offset and IANA name. Prefer passing `cities[0].timezone` (the IANA string) directly. The server resolves DST-correct offset per birth date, so a summer 1990 New York birth and a winter 1992 New York birth get different offsets automatically.
- The chart is tropical zodiac (Western astrology). For sidereal Vedic charts use `POST /vedic-astrology/birth-chart` instead.
- `houseSystem` defaults to Placidus. Use Whole Sign for ancient or Hellenistic style charts, Equal for Ascendant-anchored 30 degree blocks, Koch for births at high latitudes where Placidus distorts.
- `aspects[]` includes both major (CONJUNCTION, OPPOSITION, TRINE, SQUARE, SEXTILE) and minor aspects (QUINCUNX, SEMISEXTILE, SEMISQUARE, SESQUIQUADRATE).
- `interpretation: "neutral"` usually means a conjunction: the outcome depends on which planets are conjunct.
- `planets[].house` is computed from `houseSystem`. Switching the house system can move a planet across a cusp; this is expected.
- For relationship astrology between two people use `POST /astrology/synastry` instead. For current sky against a natal chart use `POST /astrology/transits`.

## Related endpoints
- `POST /astrology/synastry` (`calculateSynastry`): inter-chart aspect analysis between two natal charts plus compatibility score
- `POST /astrology/transits` (`calculateTransits`): current sky transits against a natal chart for live timing overlays
- `GET /astrology/horoscope/{sign}/daily` (`getDailyHoroscope`): daily horoscope by zodiac sign

## Verified
2026-Q2 against `https://roxyapi.com/api/v2/openapi.json`. Re-fetch the spec for ground truth before changing this file.

## Discovery
- Full catalog: https://roxyapi.com/AGENTS.md
- LLM index: https://roxyapi.com/llms.txt
- Methodology: https://roxyapi.com/methodology
