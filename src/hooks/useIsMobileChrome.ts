import { useMemo } from "react";

/**
 * Detects Mobile Chrome (Android + Chrome, excluding Edge and Opera)
 * synchronously via useMemo so the value is available on the first render.
 * This avoids the useEffect delay that caused glitchy View Transitions.
 *
 * Extracted from 4 duplicate useMemo blocks across the codebase.
 */
export const useIsMobileChrome = (): boolean => {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isChrome =
      /Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua);
    return isAndroid && isChrome;
  }, []);
};
