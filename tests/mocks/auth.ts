/**
 * Mock des fonctions d'authentification pour les tests
 */

import { vi } from "vitest";

// Session mock par defaut
export const mockSession = {
  userId: "00000000-0000-0000-0000-000000000001",
  email: "test@orema.ga",
  role: "ADMIN" as const,
  etablissementId: "00000000-0000-0000-0000-000000000001",
  nom: "Test",
  prenom: "Utilisateur",
  isPinAuth: false,
};

// Mock des fonctions d'auth
export const mockGetSession = vi.fn().mockResolvedValue(mockSession);
export const mockRequireAuth = vi.fn().mockResolvedValue(mockSession);
export const mockGetEtablissementId = vi.fn().mockResolvedValue(mockSession.etablissementId);

// Mock du module @/lib/auth
vi.mock("@/lib/auth", () => ({
  getSession: mockGetSession,
  requireAuth: mockRequireAuth,
  hashPassword: vi.fn().mockResolvedValue("hashed_password"),
  hashPin: vi.fn().mockResolvedValue("hashed_pin"),
  verifyPassword: vi.fn().mockResolvedValue(true),
  verifyPin: vi.fn().mockResolvedValue(true),
  createSession: vi.fn().mockResolvedValue("mock_token"),
  setSessionCookie: vi.fn(),
  deleteSessionCookie: vi.fn(),
}));

// Mock du module @/lib/etablissement
vi.mock("@/lib/etablissement", () => ({
  getEtablissementId: mockGetEtablissementId,
}));

// Helper pour simuler un utilisateur non connecte
export function mockUnauthenticated() {
  mockGetSession.mockResolvedValueOnce(null);
  mockRequireAuth.mockRejectedValueOnce(new Error("Non authentifie"));
}

// Helper pour simuler un utilisateur avec un role specifique
export function mockUserWithRole(
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "CAISSIER" | "SERVEUR"
) {
  const sessionWithRole = { ...mockSession, role };
  mockGetSession.mockResolvedValueOnce(sessionWithRole);
  mockRequireAuth.mockResolvedValueOnce(sessionWithRole);
  return sessionWithRole;
}

// Reset tous les mocks d'auth
export function resetAuthMocks() {
  mockGetSession.mockReset().mockResolvedValue(mockSession);
  mockRequireAuth.mockReset().mockResolvedValue(mockSession);
  mockGetEtablissementId.mockReset().mockResolvedValue(mockSession.etablissementId);
}

export default {
  mockSession,
  mockGetSession,
  mockRequireAuth,
  mockGetEtablissementId,
  mockUnauthenticated,
  mockUserWithRole,
  resetAuthMocks,
};
