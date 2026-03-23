/**
 * Configuration globale des tests Vitest
 * Ce fichier est charge avant chaque fichier de test
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/dom";

// Nettoyage automatique apres chaque test pour React Testing Library
afterEach(() => {
  cleanup();
});

// Mock des variables d'environnement
vi.stubEnv("NODE_ENV", "test");

// Mock de next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock de next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock de sonner (notifications toast)
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock de window.matchMedia pour les tests de composants Radix UI
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
}));

// Suppression des warnings console pendant les tests
// (decommenter si necessaire pour le debug)
// vi.spyOn(console, 'warn').mockImplementation(() => {})
// vi.spyOn(console, 'error').mockImplementation(() => {})

// Assertion personnalisee pour les montants FCFA
expect.extend({
  toBeValidFCFA(received: number) {
    const pass = Number.isInteger(received) && received >= 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid FCFA amount`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid FCFA amount (integer >= 0)`,
        pass: false,
      };
    }
  },
});

// Declaration TypeScript pour l'assertion personnalisee
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Assertion<T> {
    toBeValidFCFA(): this;
  }
  interface AsymmetricMatchersContaining {
    toBeValidFCFA(): unknown;
  }
}
