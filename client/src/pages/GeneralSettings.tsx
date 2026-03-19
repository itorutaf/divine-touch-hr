import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/contexts/ThemeContext";
import { Palette, Monitor } from "lucide-react";

export default function GeneralSettings() {
  const { theme } = useTheme();

  return (
    <AppShell title="General Settings">
      <div className="space-y-6 max-w-[800px]">
        {/* Appearance */}
        <Card className="bg-card shadow-sm">
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
                <p className="text-sm font-medium text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground">
                  Switch between light and dark mode. Currently using <strong>{theme}</strong> mode.
                </p>
              </div>
              <ThemeToggle />
            </div>

            <Separator />

            {/* Display density — placeholder for future */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Display Density</p>
                <p className="text-xs text-muted-foreground">
                  Adjust the spacing and sizing of UI elements.
                </p>
              </div>
              <div className="flex gap-2">
                {["Compact", "Default", "Comfortable"].map((density) => (
                  <button
                    key={density}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      density === "Default"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Sidebar position — placeholder for future */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Sidebar Position</p>
                <p className="text-xs text-muted-foreground">
                  Choose where the navigation sidebar appears.
                </p>
              </div>
              <div className="flex gap-2">
                {["Left", "Right"].map((pos) => (
                  <button
                    key={pos}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      pos === "Left"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
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
