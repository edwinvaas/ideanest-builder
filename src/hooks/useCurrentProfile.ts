import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DbProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  gender: "male" | "female" | "other" | null;
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  experience: "beginner" | "intermediate" | "advanced" | "elite" | null;
  box_id: string | null;
  onboarded: boolean;
  goals: string[] | null;
}

export type AppRole = "athlete" | "coach" | "admin";

export function useCurrentProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: p }, { data: roles }] = await Promise.all([
      (supabase as any).from("profiles").select("*").eq("id", user.id).maybeSingle(),
      (supabase as any).from("user_roles").select("role").eq("user_id", user.id),
    ]);
    setProfile((p ?? null) as DbProfile | null);
    const rs = (roles ?? []).map((r: any) => r.role) as AppRole[];
    setRole(
      rs.includes("admin") ? "admin" : rs.includes("coach") ? "coach" : "athlete",
    );
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  return { profile, role, loading: authLoading || loading, refetch: load };
}
