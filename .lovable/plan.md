# Fix: ingevulde benchmarks tonen op het dashboard

## Probleem

De Fran-tijd (en andere waarden) op `/athlete` komt niet overeen met wat je in de onboarding hebt ingevuld.

Oorzaak: als je de onboarding afrondt zonder ingelogd te zijn (of in demo-modus), worden je waarden alleen lokaal in de React-context bewaard, niet in de database. Het dashboard leest echter alleen uit de database. Vindt het daar niets, dan valt het terug op een **normatief archetype** (gemiddelde Beginner/Intermediate-tijden) — vandaar de "vreemde" Fran-tijd die je nu ziet.

## Oplossing

Twee niveaus:

1. **Lokale fallback eerst** — wanneer de database leeg is, gebruik je eigen onboarding-invoer uit de `AthleteContext` in plaats van het archetype. Zo zie je exact terug wat je hebt getypt.
2. **Archetype als laatste vangnet** — alleen wanneer er noch in de database, noch in de lokale context iets staat (bv. een verse demo-sessie zonder onboarding), val je terug op het Beginner/Intermediate-archetype.

## Wat er verandert

- `useAthleteSnapshot` krijgt een optionele "lokale onboarding-snapshot" mee (uit `AthleteContext`).
- Volgorde van waarheid:
  1. Database-records van een ingelogde gebruiker
  2. Lokale onboarding-invoer (recent ingevuld, nog niet/persistent)
  3. Normatief archetype (laatste vangnet)
- `AthleteDashboard` geeft de lokale waarden door en toont een duidelijk label ("lokale waarden — log in om te bewaren") als je nog geen account hebt.
- De Fran-kaart toont voortaan de exacte tijd zoals jij hem hebt ingevoerd (mm:ss).

## Niet veranderd

- Auth, routing, RLS, database-schema's en de bestaande persist-flow voor ingelogde gebruikers blijven ongewijzigd.
- Het archetype-bestand (`normativeData.json`) wordt niet aangepast.
