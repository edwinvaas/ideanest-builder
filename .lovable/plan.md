Ik stel voor om de AI buddy uit te breiden met een duidelijke post-workout feedback loop, zonder de huidige layout of functionaliteit om te gooien.

## Aanpassing

De AI buddy moet niet alleen strategie geven vóór de workout, maar ook consequent feedback ophalen ná de workout. Dat maakt de buddy meer coachend en sluit aan op het idee dat athlete feedback cruciaal is voor betere toekomstige adviezen.

## Wat ik ga aanpassen

1. **AI-instructies uitbreiden**
   - De athlete buddy krijgt de vaste instructie om bij workoutstrategie, pacingadvies, limiteradvies of trainingsplan altijd een korte post-workout feedbackvraag mee te geven.
   - De coach buddy krijgt dezelfde logica, maar gericht op coach-observaties na de les: wat klopte, wie week af, waar zat overscaling/underscaling?

2. **Feedback microcopy toevoegen in de chat**
   - In de athlete buddy komt subtiele tekst zoals:
     - “After your workout, tell Focus how the strategy felt so your next advice gets sharper.”
   - In de coach buddy:
     - “After class, share what you observed so Command can sharpen future pacing and scaling cues.”
   - Dit blijft binnen de bestaande chat-header/contextslot en verandert de layout niet wezenlijk.

3. **Suggested questions aanpassen**
   - Athlete buddy krijgt één of meer concrete feedback-prompts, bijvoorbeeld:
     - “I finished the workout — here’s how the pacing felt.”
     - “The strategy felt too easy / too hard — what should change next time?”
   - Coach buddy krijgt feedback-prompts zoals:
     - “Class is done — here’s what I observed.”
     - “Which scaling advice should I adjust next time?”

4. **Follow-up gedrag aanscherpen**
   - De AI moet na een strategieadvies altijd eindigen met relevante follow-ups, waarvan minstens één gericht is op post-workout feedback.
   - Voor atleten: RPE, pacing, limiter, waar het plan brak.
   - Voor coaches: groepsrespons, athletes-to-watch, scaling accuracy, stimulus match.

## Technische details

- `supabase/functions/chat/index.ts`
  - Update van `SHARED_INTERACTION_RULES`, `buildAthletePrompt` en `buildCoachPrompt` met een verplichte feedback-loop.
  - Geen nieuwe backend-tabellen nodig in deze stap; feedback blijft voorlopig onderdeel van de chatcontext.

- `src/lib/buddyConfig.ts`
  - Update van initial suggestions en eventueel empty-state bullets voor beide buddies.

- `src/pages/AthleteBuddy.tsx` en `src/pages/CoachBuddy.tsx`
  - Kleine microcopy-aanpassing in de bestaande RoleBadge/contexttekst.

## Bewuste beperking

Ik sla feedback nog niet permanent op in de database. Dat zou een volgende stap kunnen zijn wanneer je echte model-learning/progress tracking wilt bouwen. Voor nu houden we het licht: de buddy vraagt structureel om feedback en gebruikt die binnen het gesprek om vervolgadvies te verbeteren.