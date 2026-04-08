/**
 * Tests unitaires pour les schemas d'authentification
 *
 * Teste les VRAIS schemas Zod de:
 * - schemas/auth.ts (loginSchema, pinLoginSchema, createUserSchema, updatePasswordSchema, updatePinSchema)
 * - schemas/auth.schema.ts (loginEmailSchema, loginPinSchema, utilisateurSchema)
 */

import { describe, it, expect } from "vitest";

// Schemas de schemas/auth.ts
import {
  loginSchema,
  pinLoginSchema,
  createUserSchema,
  updatePasswordSchema,
  updatePinSchema,
} from "@/schemas/auth";

// Schemas de schemas/auth.schema.ts
import { loginEmailSchema, loginPinSchema, utilisateurSchema } from "@/schemas/auth.schema";

// ============================================================================
// Tests des schemas de schemas/auth.ts
// ============================================================================

describe("loginSchema - Connexion email/password (auth.ts)", () => {
  it("valide des données correctes", () => {
    const result = loginSchema.safeParse({
      email: "test@orema.ga",
      password: "password123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@orema.ga");
      expect(result.data.password).toBe("password123");
    }
  });

  it("rejette un email invalide", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
      expect(result.error.issues[0].message).toBe("Email invalide");
    }
  });

  it("rejette un mot de passe trop court (< 6 caracteres)", () => {
    const result = loginSchema.safeParse({
      email: "test@orema.ga",
      password: "12345",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password");
    }
  });

  it("rejette un email vide", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe vide", () => {
    const result = loginSchema.safeParse({
      email: "test@orema.ga",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepte exactement 6 caracteres de mot de passe", () => {
    const result = loginSchema.safeParse({
      email: "test@orema.ga",
      password: "123456",
    });

    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Tests du schema pinLoginSchema (auth.ts)
// ============================================================================

describe("pinLoginSchema - Connexion PIN (auth.ts)", () => {
  it("valide un PIN a 4 chiffres", () => {
    const result = pinLoginSchema.safeParse({
      email: "caissier@orema.ga",
      pin: "1234",
    });

    expect(result.success).toBe(true);
  });

  it("valide un PIN a 6 chiffres", () => {
    const result = pinLoginSchema.safeParse({
      email: "caissier@orema.ga",
      pin: "123456",
    });

    expect(result.success).toBe(true);
  });

  it("valide un PIN a 5 chiffres", () => {
    const result = pinLoginSchema.safeParse({
      email: "caissier@orema.ga",
      pin: "12345",
    });

    expect(result.success).toBe(true);
  });

  it("rejette un PIN a 3 chiffres", () => {
    const result = pinLoginSchema.safeParse({
      email: "caissier@orema.ga",
      pin: "123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("pin");
    }
  });

  it("rejette un PIN a 7 chiffres", () => {
    const result = pinLoginSchema.safeParse({
      email: "caissier@orema.ga",
      pin: "1234567",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un PIN avec des lettres", () => {
    const result = pinLoginSchema.safeParse({
      email: "caissier@orema.ga",
      pin: "12ab",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un PIN avec des caracteres speciaux", () => {
    const result = pinLoginSchema.safeParse({
      email: "caissier@orema.ga",
      pin: "12-34",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un email invalide", () => {
    const result = pinLoginSchema.safeParse({
      email: "not-an-email",
      pin: "1234",
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tests du schema createUserSchema (auth.ts)
// ============================================================================

describe("createUserSchema - Creation utilisateur (auth.ts)", () => {
  const validUser = {
    email: "nouveau@orema.ga",
    password: "Password1",
    nom: "Dupont",
    prenom: "Jean",
    role: "CAISSIER" as const,
    etablissementId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  };

  it("valide un utilisateur complet", () => {
    const result = createUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("valide tous les roles autorises", () => {
    const roles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"] as const;

    for (const role of roles) {
      const result = createUserSchema.safeParse({ ...validUser, role });
      expect(result.success).toBe(true);
    }
  });

  it("rejette un role invalide", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      role: "INVALID_ROLE",
    });

    expect(result.success).toBe(false);
  });

  it("valide avec un PIN optionnel (4-6 chiffres)", () => {
    const result4 = createUserSchema.safeParse({ ...validUser, pinCode: "1234" });
    const result6 = createUserSchema.safeParse({ ...validUser, pinCode: "123456" });

    expect(result4.success).toBe(true);
    expect(result6.success).toBe(true);
  });

  it("rejette un mot de passe sans majuscule", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: "password1",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe sans minuscule", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: "PASSWORD1",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe sans chiffre", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: "Password",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe trop court (< 8 caracteres)", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: "Pass1",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un nom trop court (< 2 caracteres)", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      nom: "D",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un prenom trop court (< 2 caracteres)", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      prenom: "J",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un etablissementId invalide (non UUID)", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      etablissementId: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tests du schema updatePasswordSchema (auth.ts)
// ============================================================================

describe("updatePasswordSchema - Mise a jour mot de passe (auth.ts)", () => {
  it("valide une mise a jour correcte", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "OldPassword1",
      newPassword: "NewPassword1",
      confirmPassword: "NewPassword1",
    });

    expect(result.success).toBe(true);
  });

  it("rejette si les mots de passe ne correspondent pas", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "OldPassword1",
      newPassword: "NewPassword1",
      confirmPassword: "DifferentPassword1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Les mots de passe ne correspondent pas");
      expect(result.error.issues[0].path).toContain("confirmPassword");
    }
  });

  it("rejette un nouveau mot de passe faible", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "OldPassword1",
      newPassword: "weak",
      confirmPassword: "weak",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe actuel vide", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "NewPassword1",
      confirmPassword: "NewPassword1",
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tests du schema updatePinSchema (auth.ts)
// ============================================================================

describe("updatePinSchema - Mise a jour PIN (auth.ts)", () => {
  it("valide une mise a jour correcte", () => {
    const result = updatePinSchema.safeParse({
      currentPin: "1234",
      newPin: "5678",
      confirmPin: "5678",
    });

    expect(result.success).toBe(true);
  });

  it("rejette si les PINs ne correspondent pas", () => {
    const result = updatePinSchema.safeParse({
      currentPin: "1234",
      newPin: "5678",
      confirmPin: "9999",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Les PINs ne correspondent pas");
    }
  });

  it("rejette un PIN invalide (trop court)", () => {
    const result = updatePinSchema.safeParse({
      currentPin: "1234",
      newPin: "12",
      confirmPin: "12",
    });

    expect(result.success).toBe(false);
  });

  it("accepte des PINs de longueurs differentes (4-6)", () => {
    const result1 = updatePinSchema.safeParse({
      currentPin: "1234",
      newPin: "123456",
      confirmPin: "123456",
    });

    const result2 = updatePinSchema.safeParse({
      currentPin: "123456",
      newPin: "1234",
      confirmPin: "1234",
    });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it("accepte un currentPin vide (creation nouveau PIN)", () => {
    const result = updatePinSchema.safeParse({
      currentPin: "",
      newPin: "5678",
      confirmPin: "5678",
    });

    expect(result.success).toBe(true);
  });

  it("accepte un currentPin absent (optionnel)", () => {
    const result = updatePinSchema.safeParse({
      newPin: "5678",
      confirmPin: "5678",
    });

    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Tests des schemas de schemas/auth.schema.ts
// ============================================================================

describe("loginEmailSchema - Connexion email/password (auth.schema.ts)", () => {
  it("valide des données correctes", () => {
    const result = loginEmailSchema.safeParse({
      email: "test@orema.ga",
      password: "password123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@orema.ga");
    }
  });

  it("rejette un email invalide", () => {
    const result = loginEmailSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe trop court (< 6 caracteres)", () => {
    const result = loginEmailSchema.safeParse({
      email: "test@orema.ga",
      password: "12345",
    });

    expect(result.success).toBe(false);
  });
});

describe("loginPinSchema - Connexion PIN (auth.schema.ts)", () => {
  it("valide un PIN de 4 chiffres", () => {
    const result = loginPinSchema.safeParse({
      pinCode: "1234",
    });

    expect(result.success).toBe(true);
  });

  it("rejette un PIN de longueur differente de 4", () => {
    const result3 = loginPinSchema.safeParse({ pinCode: "123" });
    const result5 = loginPinSchema.safeParse({ pinCode: "12345" });

    expect(result3.success).toBe(false);
    expect(result5.success).toBe(false);
  });

  it("rejette un PIN avec des lettres", () => {
    const result = loginPinSchema.safeParse({
      pinCode: "12ab",
    });

    expect(result.success).toBe(false);
  });
});

describe("utilisateurSchema - Creation utilisateur (auth.schema.ts)", () => {
  const validUser = {
    email: "nouveau@orema.ga",
    nom: "Dupont",
    prenom: "Jean",
    role: "CAISSIER" as const,
    etablissementId: "some-id",
  };

  it("valide un utilisateur complet sans PIN", () => {
    const result = utilisateurSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("valide un utilisateur avec PIN optionnel", () => {
    const result = utilisateurSchema.safeParse({
      ...validUser,
      pinCode: "1234",
    });

    expect(result.success).toBe(true);
  });

  it("valide tous les roles autorises", () => {
    const roles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"] as const;

    for (const role of roles) {
      const result = utilisateurSchema.safeParse({ ...validUser, role });
      expect(result.success).toBe(true);
    }
  });

  it("rejette un nom trop court", () => {
    const result = utilisateurSchema.safeParse({
      ...validUser,
      nom: "D",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un prenom trop court", () => {
    const result = utilisateurSchema.safeParse({
      ...validUser,
      prenom: "J",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un email invalide", () => {
    const result = utilisateurSchema.safeParse({
      ...validUser,
      email: "invalid",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un role invalide", () => {
    const result = utilisateurSchema.safeParse({
      ...validUser,
      role: "DIRECTEUR",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un etablissementId vide", () => {
    const result = utilisateurSchema.safeParse({
      ...validUser,
      etablissementId: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un PIN non numerique", () => {
    const result = utilisateurSchema.safeParse({
      ...validUser,
      pinCode: "abcd",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un PIN de mauvaise longueur", () => {
    const result = utilisateurSchema.safeParse({
      ...validUser,
      pinCode: "123",
    });

    expect(result.success).toBe(false);
  });
});
