import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_SECTIONS } from "@/config/navigation";
import { useAuth } from "@/_core/hooks/useAuth";
import { getVisibleGroups } from "@shared/roles";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const visibleGroups = getVisibleGroups(user?.role ?? "user");
  const sections = NAV_SECTIONS.filter((s) => visibleGroups.includes(s.group));

  const handleSelect = (href: string) => {
    setOpen(false);
    setLocation(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, workers, clients..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {sections.flatMap((section) =>
            section.items.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => handleSelect(item.href)}
                className="gap-3"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>
                  {section.label} &rsaquo; {item.label}
                </span>
              </CommandItem>
            ))
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect("/employees/new")} className="gap-3">
            <span className="text-muted-foreground text-sm">+</span>
            <span>New Worker</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/clients/profitability")} className="gap-3">
            <span className="text-muted-foreground text-sm">$</span>
            <span>Run Profitability Calculator</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
