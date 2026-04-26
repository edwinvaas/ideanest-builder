import { Dumbbell, Users, Target, ClipboardList, LucideIcon } from "lucide-react";

export type BuddyPersona = "athlete" | "coach";

export interface BuddyConfig {
  persona: BuddyPersona;
  name: string; // The buddy's name shown in the UI
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: string; // tailwind class fragment, used for badges
  initialSuggestions: string[];
  emptyStateBullets: string[];
  inputPlaceholder: string;
  ctaLabel: string;
}

export const ATHLETE_BUDDY: BuddyConfig = {
  persona: "athlete",
  name: "Focus",
  tagline: "Your personal performance assistant",
  description:
    "Tells you exactly where to focus this week to improve faster. Built on your benchmarks, lifts and gymnastics data.",
  icon: Target,
  accent: "primary",
  initialSuggestions: [
    "What is my single biggest limiter right now?",
    "Where should I focus this week to improve fastest?",
    "Give me a WOD strategy and what feedback you need after",
    "I finished the workout — here’s how the pacing felt",
  ],
  emptyStateBullets: [
    "Identifies your weakest link from your profile",
    "Turns data into a concrete next action",
    "Learns from your post-workout feedback",
  ],
  inputPlaceholder: "Ask Focus about your training...",
  ctaLabel: "Talk to Focus",
};

export const COACH_BUDDY: BuddyConfig = {
  persona: "coach",
  name: "Command",
  tagline: "Your AI assistant coach",
  description:
    "Saves you hours of analysis. Tells you who to watch, where to focus today's class, and how to scale — based on the full roster of your box.",
  icon: ClipboardList,
  accent: "primary",
  initialSuggestions: [
    "Which 3 athletes in today's class need extra attention?",
    "What is the dominant limiter in my box right now?",
    "Plan today's class and tell me what feedback to collect after",
    "Class is done — here’s what I observed",
  ],
  emptyStateBullets: [
    "Highlights the right athletes before each class",
    "Recommends focus, scaling and cues per session",
    "Improves from post-class coach feedback",
  ],
  inputPlaceholder: "Ask Command about your class or roster...",
  ctaLabel: "Talk to Command",
};

export const BUDDIES: Record<BuddyPersona, BuddyConfig> = {
  athlete: ATHLETE_BUDDY,
  coach: COACH_BUDDY,
};

export const ICONS = { Dumbbell, Users };
