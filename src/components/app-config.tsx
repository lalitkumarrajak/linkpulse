"use client";

import { createContext, useContext } from "react";

interface AppConfig {
  appUrl: string;
  user: { id: string; email: string; name: string | null; avatarUrl: string | null };
}

const AppConfigContext = createContext<AppConfig | null>(null);

export function AppConfigProvider({ value, children }: { value: AppConfig; children: React.ReactNode }) {
  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error("useAppConfig must be used inside AppConfigProvider");
  return ctx;
}

export function useShortHost() {
  return useAppConfig().appUrl.replace(/^https?:\/\//, "");
}
