import { supabase } from "@/integrations/supabase/client";
import type { WodInterpreterResponse } from "@/types/wod-analysis";

export interface InvokeWodInterpreterOptions {
  /** Called immediately so the UI can show a skeleton before the analysis arrives. */
  onAnalyzing?: () => void;
  /** Called with the full response payload on success. */
  onSuccess?: (response: WodInterpreterResponse) => void;
  /** Called with a human-readable message on failure. */
  onError?: (message: string) => void;
}

/**
 * Trigger a (re-)analysis of a WOD via the wod-interpreter Edge Function.
 *
 * The Edge Function upserts to wod_analyses and then broadcasts `analysis_complete`
 * on the `wod:{wod_id}` Realtime channel. If you have useWodAnalysis() mounted for
 * this wod_id, the UI updates automatically — you do not need to handle onSuccess
 * to refresh the display.
 *
 * Use onSuccess for side-effects only (e.g., showing a toast, logging).
 */
export async function invokeWodInterpreter(
  wodId: string,
  options: InvokeWodInterpreterOptions = {},
): Promise<WodInterpreterResponse | null> {
  const { onAnalyzing, onSuccess, onError } = options;

  onAnalyzing?.();

  const { data, error } = await supabase.functions.invoke<WodInterpreterResponse>(
    "wod-interpreter",
    { body: { wod_id: wodId } },
  );

  if (error) {
    const message =
      error instanceof Error ? error.message : "WOD-analyse mislukt. Probeer opnieuw.";
    onError?.(message);
    return null;
  }

  if (!data) {
    onError?.("Geen response ontvangen van de WOD Interpreter.");
    return null;
  }

  onSuccess?.(data);
  return data;
}
