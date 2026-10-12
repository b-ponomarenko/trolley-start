import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/modules/ui-store';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

/**
 * Switches between light and dark. Both icons are rendered and CSS shows the right one, so the
 * server (which cannot know a `system` preference) and the browser render identical markup.
 * The tooltip relies on the global `TooltipProvider` registered through `LAYOUT_OPTIONS_TOKEN`.
 */
export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          data-testid="theme-toggle"
          data-theme-value={theme}
          aria-label="Switch between light and dark theme"
        >
          <Moon aria-hidden="true" className="dark:hidden" />
          <Sun aria-hidden="true" className="hidden dark:block" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span className="dark:hidden">Switch to dark theme</span>
        <span className="hidden dark:inline">Switch to light theme</span>
      </TooltipContent>
    </Tooltip>
  );
};
