"""
Natal Chart API: complete Western birth chart with all 10 planetary positions,
12 house cusps, major and minor aspects, Ascendant, Midheaven, dominant elements
and modalities. Roxy Ephemeris, verified against NASA JPL Horizons.
Call /location/search first -- never hardcode coordinates.
"""

import os
from roxy_sdk import create_roxy

roxy = create_roxy(os.environ["ROXY_API_KEY"])


def main():
    # Step 1: geocode the birth city
    loc = roxy.location.search_cities(q="New York")
    city = loc["cities"][0]

    # Step 2: generate the full natal chart
    result = roxy.astrology.generate_natal_chart(
        date="1990-07-15",
        time="14:30:00",
        latitude=city["latitude"],
        longitude=city["longitude"],
        timezone=city["timezone"],
        house_system="placidus",
    )

    bd = result["birthDetails"]
    print(f"Birth: {bd['date']} {bd['time']} (timezone offset {bd['timezone']})")
    print(f"Ascendant: {result['ascendant']['sign']} {result['ascendant']['degree']:.2f}")
    print(f"Midheaven: {result['midheaven']['sign']} {result['midheaven']['degree']:.2f}")

    summary = result["summary"]
    print(f"\nDominant element: {summary['dominantElement']}")
    print(f"Dominant modality: {summary['dominantModality']}")
    retros = summary["retrogradePlanets"]
    print(f"Retrograde planets: {', '.join(retros) if retros else 'none'}")

    sun = next((p for p in result["planets"] if p["name"] == "Sun"), None)
    moon = next((p for p in result["planets"] if p["name"] == "Moon"), None)
    print("\nBig three:")
    if sun:
        print(f"  Sun in {sun['sign']} (house {sun['house']})")
    if moon:
        print(f"  Moon in {moon['sign']} (house {moon['house']})")
    print(f"  Rising in {result['ascendant']['sign']}")

    print("\nAll planetary placements:")
    for p in result["planets"]:
        retro = " (R)" if p["isRetrograde"] else ""
        print(f"  {p['name']:<12} {p['sign']:<12} {p['degree']:>6.2f} house {p['house']}{retro}")

    pattern = result["aspectsInterpretation"]
    print(f"\nAspect pattern: {pattern['dominant']}")
    print(
        f"  {pattern['harmonious']} harmonious, "
        f"{pattern['challenging']} challenging, "
        f"{pattern['neutral']} neutral"
    )

    print("\nTop 5 aspects by strength:")
    for a in result["aspects"][:5]:
        print(
            f"  {a['planet1']} -> {a['planet2']}: {a['type']} "
            f"orb {a['orb']:.2f} strength {a['strength']} [{a['interpretation']}]"
        )

    if sun and sun.get("interpretation"):
        print("\nSun placement narrative:")
        print(" ", sun["interpretation"]["summary"])


if __name__ == "__main__":
    main()
