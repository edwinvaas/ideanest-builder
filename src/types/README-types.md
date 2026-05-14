# BoxBrain type usage guide

| Situation | Type to use |
|---|---|
| Calling the Edge Function and typing the response | `WodInterpreterResponse` |
| Displaying analysis data in a component | `WodAnalysis` |
| Querying `wod_analyses` directly via supabase-js | `WodAnalysisRow` |
| Handling the Realtime `analysis_complete` broadcast | `WodAnalysisBroadcastPayload` |
| Typing a pacing strategy badge/label | `PacingStrategy` |
| Typing a limiter chip/icon | `LimiterType` |
| Typing the stimulus classification card | `DominantStimulus` |
