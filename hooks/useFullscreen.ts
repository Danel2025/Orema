import { useState, useEffect, useCallback } from 'react';

interface UseFullscreenReturn {
  /** Whether the browser is currently in fullscreen mode */
  isFullscreen: boolean;
  /** Whether the Fullscreen API is supported by the browser */
  isSupported: boolean;
  /** Toggle fullscreen mode on/off */
  toggleFullscreen: () => Promise<void>;
  /** Enter fullscreen mode */
  enterFullscreen: () => Promise<void>;
  /** Exit fullscreen mode */
  exitFullscreen: () => Promise<void>;
}

/** CSS class added to document.body when in fullscreen KDS mode */
const FULLSCREEN_CLASS = 'kds-fullscreen';

/**
 * Returns the correct fullscreen element across browser prefixes.
 */
function getFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;

  return (
    document.fullscreenElement ??
    (document as unknown as Record<string, unknown>).webkitFullscreenElement ??
    (document as unknown as Record<string, unknown>).mozFullScreenElement ??
    null
  ) as Element | null;
}

/**
 * Returns whether the Fullscreen API is available.
 */
function isFullscreenEnabled(): boolean {
  if (typeof document === 'undefined') return false;

  return (
    document.fullscreenEnabled ??
    ((document as unknown as Record<string, unknown>).webkitFullscreenEnabled as boolean | undefined) ??
    ((document as unknown as Record<string, unknown>).mozFullScreenEnabled as boolean | undefined) ??
    false
  );
}

/**
 * Requests fullscreen on the document element, handling browser prefixes.
 */
async function requestFullscreen(): Promise<void> {
  const el = document.documentElement;

  if (el.requestFullscreen) {
    await el.requestFullscreen();
  } else if ((el as unknown as Record<string, unknown>).webkitRequestFullscreen) {
    await ((el as unknown as Record<string, unknown>).webkitRequestFullscreen as () => Promise<void>)();
  } else if ((el as unknown as Record<string, unknown>).mozRequestFullScreen) {
    await ((el as unknown as Record<string, unknown>).mozRequestFullScreen as () => Promise<void>)();
  }
}

/**
 * Exits fullscreen, handling browser prefixes.
 */
async function exitFullscreenCall(): Promise<void> {
  if (document.exitFullscreen) {
    await document.exitFullscreen();
  } else if ((document as unknown as Record<string, unknown>).webkitExitFullscreen) {
    await ((document as unknown as Record<string, unknown>).webkitExitFullscreen as () => Promise<void>)();
  } else if ((document as unknown as Record<string, unknown>).mozCancelFullScreen) {
    await ((document as unknown as Record<string, unknown>).mozCancelFullScreen as () => Promise<void>)();
  }
}

/**
 * Hook for managing fullscreen mode on KDS screens.
 *
 * - Exposes `isFullscreen`, `toggleFullscreen`, `enterFullscreen`, `exitFullscreen`
 * - Adds/removes a `kds-fullscreen` class on `document.body` to hide sidebar/header
 * - Intercepts F11 to toggle fullscreen via the API (instead of native browser behavior)
 * - SSR-safe: all browser API checks are guarded
 */
export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Derived value — no need for state + effect (rerender-derived-state-no-effect)
  const isSupported = typeof document !== "undefined" && isFullscreenEnabled();

  // Sync state with browser fullscreen changes and manage body class
  useEffect(() => {
    if (typeof document === 'undefined') return;

    function handleFullscreenChange() {
      const active = getFullscreenElement() !== null;
      setIsFullscreen(active);

      if (active) {
        document.body.classList.add(FULLSCREEN_CLASS);
      } else {
        document.body.classList.remove(FULLSCREEN_CLASS);
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      // Ensure the class is removed on cleanup
      document.body.classList.remove(FULLSCREEN_CLASS);
    };
  }, []);

  const enterFullscreenFn = useCallback(async () => {
    if (typeof document === 'undefined' || !isFullscreenEnabled()) return;
    if (getFullscreenElement() !== null) return; // already fullscreen
    await requestFullscreen();
  }, []);

  const exitFullscreenFn = useCallback(async () => {
    if (typeof document === 'undefined') return;
    if (getFullscreenElement() === null) return; // not in fullscreen
    await exitFullscreenCall();
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (getFullscreenElement() !== null) {
      await exitFullscreenFn();
    } else {
      await enterFullscreenFn();
    }
  }, [enterFullscreenFn, exitFullscreenFn]);

  // Intercept F11 to use the Fullscreen API instead of native browser behavior
  useEffect(() => {
    if (typeof document === 'undefined') return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'F11') {
        e.preventDefault();
        void toggleFullscreen();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleFullscreen]);

  return {
    isFullscreen,
    isSupported,
    toggleFullscreen,
    enterFullscreen: enterFullscreenFn,
    exitFullscreen: exitFullscreenFn,
  };
}
