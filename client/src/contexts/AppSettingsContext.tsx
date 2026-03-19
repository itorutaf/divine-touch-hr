import React, { createContext, useContext, useState, useEffect } from "react";

type Density = "compact" | "default" | "comfortable";
type SidebarPosition = "left" | "right";

interface AppSettings {
  density: Density;
  sidebarPosition: SidebarPosition;
  setDensity: (d: Density) => void;
  setSidebarPosition: (p: SidebarPosition) => void;
}

const AppSettingsContext = createContext<AppSettings | undefined>(undefined);

const DENSITY_CLASSES: Record<Density, string> = {
  compact: "density-compact",
  default: "",
  comfortable: "density-comfortable",
};

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<Density>(() => {
    return (localStorage.getItem("carebase-density") as Density) || "default";
  });
  const [sidebarPosition, setSidebarPositionState] = useState<SidebarPosition>(() => {
    return (localStorage.getItem("carebase-sidebar-pos") as SidebarPosition) || "left";
  });

  const setDensity = (d: Density) => {
    setDensityState(d);
    localStorage.setItem("carebase-density", d);
  };

  const setSidebarPosition = (p: SidebarPosition) => {
    setSidebarPositionState(p);
    localStorage.setItem("carebase-sidebar-pos", p);
  };

  // Apply density class to root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("density-compact", "density-comfortable");
    const cls = DENSITY_CLASSES[density];
    if (cls) root.classList.add(cls);
  }, [density]);

  return (
    <AppSettingsContext.Provider value={{ density, sidebarPosition, setDensity, setSidebarPosition }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return ctx;
}
