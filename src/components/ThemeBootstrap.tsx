import { useEffect } from "react";
import { apiRequest } from "@/integrations/api/client";
import { applyThemeSettings, ThemeSettings } from "@/lib/theme";

const ThemeBootstrap = () => {
  useEffect(() => {
    let cancelled = false;
    apiRequest<ThemeSettings>("/api/theme")
      .then((settings) => {
        if (cancelled) return;
        if (settings?.enabled && settings?.palette) {
          applyThemeSettings(settings);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};

export default ThemeBootstrap;
