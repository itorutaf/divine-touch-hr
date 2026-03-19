import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { Palette } from "lucide-react";

export default function GeneralSettings() {
  const { theme } = useTheme();
  const { density, sidebarPosition, setDensity, setSidebarPosition } = useAppSettings();

  return (
    <AppShell title="General Settings">
      <div className="space-y-6 max-w-[800px]">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground">
                  Switch between light and dark mode. Currently using <strong>{theme}</strong> mode.
                </p>
              </div>
              <ThemeToggle />
            </div>

            <Separator />

            {/* Display Density */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Display Density</p>
                <p className="text-xs text-muted-foreground">
                  Adjust the spacing and sizing of UI elements.
                </p>
              </div>
              <div className="flex gap-1.5">
                {(["compact", "default", "comfortable"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDensity(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                      density === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Sidebar Position */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Sidebar Position</p>
                <p className="text-xs text-muted-foreground">
                  Choose where the navigation sidebar appears.
                </p>
              </div>
              <div className="flex gap-1.5">
                {(["left", "right"] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setSidebarPosition(pos)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                      sidebarPosition === pos
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
