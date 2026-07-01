"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { BUSINESS_PROFILES, type ProfileId } from "@/lib/signals/profiles";

const STORAGE_KEY = "radar-profile";
const DEFAULT_PROFILE: ProfileId = "splosno";

interface RadarProfileContextValue {
  profile: ProfileId;
  setProfile: (profile: ProfileId) => void;
}

const RadarProfileContext = createContext<RadarProfileContextValue | null>(null);

export function RadarProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ProfileId>(DEFAULT_PROFILE);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && BUSINESS_PROFILES.some((p) => p.id === stored)) {
      setProfileState(stored as ProfileId);
    }
  }, []);

  function setProfile(next: ProfileId) {
    setProfileState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <RadarProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </RadarProfileContext.Provider>
  );
}

export function useRadarProfile() {
  const ctx = useContext(RadarProfileContext);
  if (!ctx) throw new Error("useRadarProfile must be used within a RadarProfileProvider");
  return ctx;
}
