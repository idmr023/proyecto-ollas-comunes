'use client';

import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useThemeStore, type Theme } from '@/store/theme-store';
import { useTheme } from 'next-themes';

export default function PreferenciasPage() {
  const theme = useThemeStore((state) => state.theme);
  const setStoreTheme = useThemeStore((state) => state.setTheme);
  const { setTheme } = useTheme();

  const themeLabel = theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Sistema';

  const handleThemeChange = (nextTheme: Theme) => {
    setStoreTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold font-heading text-foreground">Preferencias</h1>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Aspecto</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 min-w-32 justify-between rounded-xl px-3 text-sm">
                <span>{themeLabel}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuRadioGroup value={theme} onValueChange={(value) => handleThemeChange(value as Theme)}>
                <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Oscuro</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>
    </div>
  );
}
