/**
 * Tests unitaires pour lib/validation.ts
 *
 * Teste les fonctions de sanitization et validation securisee:
 * - escapeHtml() - Echappement de caracteres HTML
 * - stripHtml() - Suppression de balises HTML
 * - sanitizeString() - Sanitization complete (stripHtml + escapeHtml)
 * - sanitizeObject() - Sanitization recursive d'objets
 * - containsDangerousChars() - Detection de patterns XSS
 * - hasPathTraversal() - Detection de path traversal
 * - sanitizeFilename() - Nettoyage de noms de fichiers
 * - validateImageFile() - Validation de fichiers image
 * - validateCsvFile() - Validation de fichiers CSV
 * - Schemas Zod: uuid, email, password, pin, phone, montant, quantite, pourcentage, nom, adresse
 */

import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  stripHtml,
  sanitizeString,
  sanitizeObject,
  containsDangerousChars,
  hasPathTraversal,
  sanitizeFilename,
  validateImageFile,
  validateCsvFile,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_CSV_SIZE,
  // Schemas
  uuidSchema,
  emailSchema,
  passwordSchema,
  pinSchema,
  phoneSchema,
  montantSchema,
  quantiteSchema,
  pourcentageSchema,
  nomSchema,
  adresseSchema,
  codeBarreSchema,
  nifSchema,
  rccmSchema,
  safeStringSchema,
} from "@/lib/validation";

// ============================================================================
// Tests de sanitization HTML
// ============================================================================

describe("escapeHtml - Echappement HTML", () => {
  it("echappe les balises script", () => {
    const input = '<script>alert("XSS")</script>';
    const result = escapeHtml(input);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
  });

  it("echappe tous les caracteres HTML dangereux", () => {
    expect(escapeHtml("&")).toBe("&amp;");
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml(">")).toBe("&gt;");
    expect(escapeHtml('"')).toBe("&quot;");
    expect(escapeHtml("'")).toBe("&#x27;");
    expect(escapeHtml("/")).toBe("&#x2F;");
    expect(escapeHtml("`")).toBe("&#x60;");
    expect(escapeHtml("=")).toBe("&#x3D;");
  });

  it("preserve le texte normal", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
    expect(escapeHtml("Prix: 5000 FCFA")).toBe("Prix: 5000 FCFA");
    expect(escapeHtml("")).toBe("");
  });

  it("echappe les tentatives d'attaque combinee", () => {
    const input = '"><img src=x onerror=alert(1)>';
    const result = escapeHtml(input);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).not.toContain('"');
  });

  it("echappe une chaine avec plusieurs caracteres speciaux", () => {
    const input = '<div class="test">Hello & World</div>';
    const result = escapeHtml(input);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).toContain("&amp;");
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
  });
});

describe("stripHtml - Suppression balises HTML", () => {
  it("supprime les balises simples", () => {
    expect(stripHtml("<p>Hello</p>")).toBe("Hello");
    expect(stripHtml("<div>World</div>")).toBe("World");
  });

  it("supprime les balises avec attributs", () => {
    expect(stripHtml('<a href="test">Link</a>')).toBe("Link");
    expect(stripHtml('<img src="test" />')).toBe("");
  });

  it("gere les balises imbriquees", () => {
    expect(stripHtml("<div><p>Hello</p></div>")).toBe("Hello");
  });

  it("preserve le texte sans balises", () => {
    expect(stripHtml("Just text")).toBe("Just text");
  });

  it("supprime les commentaires HTML", () => {
    expect(stripHtml("Hello <!-- comment --> World")).toBe("Hello  World");
  });

  it("gere une chaine vide", () => {
    expect(stripHtml("")).toBe("");
  });

  it("supprime les balises auto-fermantes", () => {
    expect(stripHtml("<br/>Hello<hr/>")).toBe("Hello");
  });
});

describe("sanitizeString - Sanitization complete", () => {
  it("combine stripHtml et escapeHtml", () => {
    const input = '<script>alert("XSS")</script>';
    const result = sanitizeString(input);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("preserve le contenu textuel normal", () => {
    expect(sanitizeString("Poulet braise - 5000 FCFA")).toBe("Poulet braise - 5000 FCFA");
  });

  it("sanitize et preserve le texte entre balises", () => {
    const result = sanitizeString("<b>Important</b>");
    expect(result).toBe("Important");
  });

  it("gere les chaines vides", () => {
    expect(sanitizeString("")).toBe("");
  });

  it("sanitize les caracteres speciaux restants apres strip", () => {
    // Apres stripHtml, le texte d'un script reste (alert("XSS"))
    // Puis escapeHtml echappe les guillemets
    const result = sanitizeString('<script>alert("XSS")</script>');
    expect(result).not.toContain('"');
  });
});

describe("sanitizeObject - Sanitization recursive", () => {
  it("sanitize les strings dans un objet plat", () => {
    const input = {
      nom: "<script>alert(1)</script>",
      prix: 5000,
    };
    const result = sanitizeObject(input);
    expect(result.nom).not.toContain("<script>");
    expect(result.prix).toBe(5000);
  });

  it("sanitize les objets imbriques", () => {
    const input = {
      produit: {
        nom: "<img onerror=alert(1)>Test",
      },
    };
    const result = sanitizeObject(input);
    expect(result.produit.nom).not.toContain("<img");
  });

  it("sanitize les tableaux de strings", () => {
    const input = {
      tags: ["<script>", "normal", "<b>bold</b>"],
    };
    const result = sanitizeObject(input);
    expect(result.tags[0]).not.toContain("<");
    expect(result.tags[1]).toBe("normal");
    expect(result.tags[2]).toBe("bold");
  });

  it("preserve les nombres, booleens et null", () => {
    const input = {
      nombre: 42,
      actif: true,
      vide: null,
    };
    const result = sanitizeObject(input);
    expect(result.nombre).toBe(42);
    expect(result.actif).toBe(true);
    expect(result.vide).toBe(null);
  });

  it("ne modifie pas l'objet original (immutabilite)", () => {
    const input = { nom: "<b>test</b>" };
    const original = { ...input };
    sanitizeObject(input);
    expect(input.nom).toBe(original.nom);
  });

  it("gere les tableaux d'objets", () => {
    const input = {
      items: [
        { nom: "<script>hack</script>" },
        { nom: "normal" },
      ],
    };
    const result = sanitizeObject(input);
    expect(result.items[0].nom).not.toContain("<script>");
    expect(result.items[1].nom).toBe("normal");
  });
});

describe("containsDangerousChars - Detection XSS", () => {
  it("detecte les scripts", () => {
    expect(containsDangerousChars("<script>alert(1)</script>")).toBe(true);
    expect(containsDangerousChars("javascript:alert(1)")).toBe(true);
  });

  it("detecte les handlers d'evenements", () => {
    expect(containsDangerousChars("onclick=alert(1)")).toBe(true);
    expect(containsDangerousChars("onload=alert(1)")).toBe(true);
    expect(containsDangerousChars("onerror=alert(1)")).toBe(true);
    expect(containsDangerousChars("onmouseover=hack()")).toBe(true);
  });

  it("detecte les data URIs", () => {
    expect(containsDangerousChars("data:text/html")).toBe(true);
    expect(containsDangerousChars("data:image/svg+xml")).toBe(true);
  });

  it("detecte les iframes, objects et embeds", () => {
    expect(containsDangerousChars('<iframe src="evil.com">')).toBe(true);
    expect(containsDangerousChars('<object data="evil.swf">')).toBe(true);
    expect(containsDangerousChars('<embed src="evil.swf">')).toBe(true);
  });

  it("detecte vbscript", () => {
    expect(containsDangerousChars("vbscript:msgbox")).toBe(true);
  });

  it("est insensible a la casse", () => {
    expect(containsDangerousChars("<SCRIPT>")).toBe(true);
    expect(containsDangerousChars("JAVASCRIPT:")).toBe(true);
    expect(containsDangerousChars("ONCLICK=")).toBe(true);
  });

  it("accepte le texte normal", () => {
    expect(containsDangerousChars("Poulet braise")).toBe(false);
    expect(containsDangerousChars("Prix: 5000 FCFA")).toBe(false);
    expect(containsDangerousChars("email@example.com")).toBe(false);
    expect(containsDangerousChars("Quartier Louis, Libreville")).toBe(false);
    expect(containsDangerousChars("")).toBe(false);
  });
});

// ============================================================================
// Tests de validation de chemins
// ============================================================================

describe("hasPathTraversal - Detection path traversal", () => {
  it("detecte ../", () => {
    expect(hasPathTraversal("../etc/passwd")).toBe(true);
    expect(hasPathTraversal("foo/../bar")).toBe(true);
    expect(hasPathTraversal("../../secret")).toBe(true);
  });

  it("detecte ..\\", () => {
    expect(hasPathTraversal("..\\windows\\system32")).toBe(true);
    expect(hasPathTraversal("foo\\..\\bar")).toBe(true);
  });

  it("detecte les encodages URL", () => {
    expect(hasPathTraversal("%2e%2e/etc/passwd")).toBe(true);
    expect(hasPathTraversal("%252e%252e/etc/passwd")).toBe(true);
  });

  it("accepte les chemins normaux", () => {
    expect(hasPathTraversal("/images/produit.jpg")).toBe(false);
    expect(hasPathTraversal("uploads/2025/01/file.png")).toBe(false);
    expect(hasPathTraversal("document.pdf")).toBe(false);
    expect(hasPathTraversal("")).toBe(false);
  });
});

describe("sanitizeFilename - Nom de fichier securise", () => {
  it("supprime les caracteres Windows invalides", () => {
    expect(sanitizeFilename('file<>:"/\\|?*name.txt')).toBe("file_________name.txt");
  });

  it("supprime les path traversal (..)  ", () => {
    expect(sanitizeFilename("../secret.txt")).toBe("__secret.txt");
  });

  it("remplace le point initial (fichiers caches)", () => {
    expect(sanitizeFilename(".htaccess")).toBe("_htaccess");
    expect(sanitizeFilename(".env")).toBe("_env");
  });

  it("tronque les noms trop longs a 255 caracteres", () => {
    const longName = "a".repeat(300) + ".txt";
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it("preserve les noms valides", () => {
    expect(sanitizeFilename("document.pdf")).toBe("document.pdf");
    expect(sanitizeFilename("image_2025.jpg")).toBe("image_2025.jpg");
    expect(sanitizeFilename("rapport-z-2025-01-15.pdf")).toBe("rapport-z-2025-01-15.pdf");
  });

  it("gere les noms avec espaces", () => {
    const result = sanitizeFilename("my document.pdf");
    expect(result).toBe("my document.pdf");
  });
});

// ============================================================================
// Tests de validation de fichiers
// ============================================================================

describe("validateImageFile - Validation images", () => {
  const createMockFile = (name: string, type: string, size: number): File => {
    const content = new Uint8Array(size);
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  };

  it("accepte tous les types d'image autorises", () => {
    const types = [
      { name: "test.jpg", type: "image/jpeg" },
      { name: "test.png", type: "image/png" },
      { name: "test.gif", type: "image/gif" },
      { name: "test.webp", type: "image/webp" },
    ];

    for (const { name, type } of types) {
      const file = createMockFile(name, type, 1000);
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    }
  });

  it("accepte l'extension jpeg", () => {
    const file = createMockFile("photo.jpeg", "image/jpeg", 1000);
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
  });

  it("rejette les types MIME non autorises", () => {
    const file = createMockFile("test.exe", "application/x-msdownload", 1000);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Type de fichier");
  });

  it("rejette les fichiers depassant 5 MB", () => {
    const file = createMockFile("big.jpg", "image/jpeg", 6 * 1024 * 1024);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("volumineux");
  });

  it("accepte un fichier de exactement 5 MB", () => {
    const file = createMockFile("exact.jpg", "image/jpeg", MAX_IMAGE_SIZE);
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
  });

  it("rejette les extensions de fichier invalides", () => {
    const file = createMockFile("test.txt", "image/jpeg", 1000);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Extension");
  });

  it("rejette un fichier SVG (non dans la liste autorisee)", () => {
    const file = createMockFile("icon.svg", "image/svg+xml", 1000);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
  });
});

describe("validateCsvFile - Validation CSV", () => {
  const createMockFile = (name: string, type: string, size: number): File => {
    const content = new Uint8Array(size);
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  };

  it("accepte les fichiers CSV avec type text/csv", () => {
    const file = createMockFile("data.csv", "text/csv", 1000);
    const result = validateCsvFile(file);
    expect(result.valid).toBe(true);
  });

  it("accepte les fichiers avec extension .csv meme si type incorrect", () => {
    const file = createMockFile("data.csv", "application/octet-stream", 1000);
    const result = validateCsvFile(file);
    expect(result.valid).toBe(true);
  });

  it("accepte les fichiers text/plain avec extension .csv", () => {
    const file = createMockFile("data.csv", "text/plain", 1000);
    const result = validateCsvFile(file);
    expect(result.valid).toBe(true);
  });

  it("rejette les fichiers non-CSV (type et extension incorrects)", () => {
    const file = createMockFile("data.xlsx", "application/vnd.openxmlformats", 1000);
    const result = validateCsvFile(file);
    expect(result.valid).toBe(false);
  });

  it("rejette les fichiers depassant 10 MB", () => {
    const file = createMockFile("big.csv", "text/csv", 11 * 1024 * 1024);
    const result = validateCsvFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("volumineux");
  });

  it("accepte un fichier de exactement 10 MB", () => {
    const file = createMockFile("exact.csv", "text/csv", MAX_CSV_SIZE);
    const result = validateCsvFile(file);
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// Constantes
// ============================================================================

describe("Constantes de validation", () => {
  it("definit les types d'image autorises", () => {
    expect(ALLOWED_IMAGE_TYPES).toContain("image/jpeg");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/png");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/gif");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/webp");
    expect(ALLOWED_IMAGE_TYPES).toHaveLength(4);
  });

  it("definit la taille max image a 5 MB", () => {
    expect(MAX_IMAGE_SIZE).toBe(5 * 1024 * 1024);
  });

  it("definit la taille max CSV a 10 MB", () => {
    expect(MAX_CSV_SIZE).toBe(10 * 1024 * 1024);
  });
});

// ============================================================================
// Tests des schemas Zod
// ============================================================================

describe("uuidSchema - Validation UUID", () => {
  it("accepte un UUID v4 valide", () => {
    expect(uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true);
  });

  it("accepte un autre UUID valide", () => {
    expect(uuidSchema.safeParse("123e4567-e89b-12d3-a456-426614174000").success).toBe(true);
  });

  it("rejette un UUID invalide", () => {
    expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(uuidSchema.safeParse("").success).toBe(false);
    expect(uuidSchema.safeParse("12345").success).toBe(false);
  });
});

describe("emailSchema - Validation email", () => {
  it("accepte un email valide", () => {
    expect(emailSchema.safeParse("test@orema.ga").success).toBe(true);
    expect(emailSchema.safeParse("user@example.com").success).toBe(true);
  });

  it("normalise en minuscules", () => {
    const result = emailSchema.safeParse("TEST@OREMA.GA");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("test@orema.ga");
    }
  });

  it("rejette un email avec espaces autour", () => {
    // Zod valide l'email avant le transform, les espaces rendent l'email invalide
    expect(emailSchema.safeParse("  test@orema.ga  ").success).toBe(false);
  });

  it("rejette un email invalide", () => {
    expect(emailSchema.safeParse("invalid-email").success).toBe(false);
    expect(emailSchema.safeParse("@example.com").success).toBe(false);
    expect(emailSchema.safeParse("user@").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
  });

  it("rejette un email trop long", () => {
    const longEmail = "a".repeat(250) + "@b.com";
    expect(emailSchema.safeParse(longEmail).success).toBe(false);
  });
});

describe("passwordSchema - Validation mot de passe", () => {
  it("accepte un mot de passe securise", () => {
    expect(passwordSchema.safeParse("MyP@ssw0rd!").success).toBe(true);
    expect(passwordSchema.safeParse("Str0ng&Pass!").success).toBe(true);
  });

  it("rejette un mot de passe trop court", () => {
    expect(passwordSchema.safeParse("Aa1!").success).toBe(false);
  });

  it("rejette un mot de passe sans majuscule", () => {
    expect(passwordSchema.safeParse("password1!").success).toBe(false);
  });

  it("rejette un mot de passe sans minuscule", () => {
    expect(passwordSchema.safeParse("PASSWORD1!").success).toBe(false);
  });

  it("rejette un mot de passe sans chiffre", () => {
    expect(passwordSchema.safeParse("Password!@").success).toBe(false);
  });

  it("rejette un mot de passe sans caractere special", () => {
    expect(passwordSchema.safeParse("Password1").success).toBe(false);
  });

  it("rejette un mot de passe trop long (> 128)", () => {
    const longPass = "Aa1!" + "a".repeat(125);
    expect(passwordSchema.safeParse(longPass).success).toBe(false);
  });
});

describe("pinSchema - Validation PIN", () => {
  it("accepte un PIN 4 chiffres", () => {
    expect(pinSchema.safeParse("1234").success).toBe(true);
  });

  it("accepte un PIN 5 chiffres", () => {
    expect(pinSchema.safeParse("12345").success).toBe(true);
  });

  it("accepte un PIN 6 chiffres", () => {
    expect(pinSchema.safeParse("123456").success).toBe(true);
  });

  it("rejette un PIN trop court (3 chiffres)", () => {
    expect(pinSchema.safeParse("123").success).toBe(false);
  });

  it("rejette un PIN trop long (7 chiffres)", () => {
    expect(pinSchema.safeParse("1234567").success).toBe(false);
  });

  it("rejette un PIN avec lettres", () => {
    expect(pinSchema.safeParse("12ab").success).toBe(false);
    expect(pinSchema.safeParse("abcd").success).toBe(false);
  });

  it("rejette un PIN vide", () => {
    expect(pinSchema.safeParse("").success).toBe(false);
  });
});

describe("phoneSchema - Validation telephone gabonais", () => {
  it("accepte un numero local (7-8 chiffres) et ajoute +241", () => {
    const result = phoneSchema.safeParse("77123456");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("+24177123456");
    }
  });

  it("accepte un numero avec indicatif +241", () => {
    const result = phoneSchema.safeParse("+24177123456");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("+24177123456");
    }
  });

  it("accepte un numero a 8 chiffres", () => {
    const result = phoneSchema.safeParse("77123456");
    expect(result.success).toBe(true);
  });

  it("accepte un numero a 7 chiffres", () => {
    const result = phoneSchema.safeParse("7712345");
    expect(result.success).toBe(true);
  });

  it("rejette un numero trop court", () => {
    expect(phoneSchema.safeParse("12345").success).toBe(false);
    expect(phoneSchema.safeParse("123").success).toBe(false);
  });

  it("rejette un numero avec lettres", () => {
    expect(phoneSchema.safeParse("7712abc6").success).toBe(false);
  });
});

describe("montantSchema - Validation montant FCFA", () => {
  it("accepte un montant entier positif", () => {
    expect(montantSchema.safeParse(5000).success).toBe(true);
    expect(montantSchema.safeParse(1).success).toBe(true);
    expect(montantSchema.safeParse(999999999).success).toBe(true);
  });

  it("accepte zero", () => {
    expect(montantSchema.safeParse(0).success).toBe(true);
  });

  it("rejette un montant negatif", () => {
    expect(montantSchema.safeParse(-100).success).toBe(false);
    expect(montantSchema.safeParse(-1).success).toBe(false);
  });

  it("rejette un montant decimal", () => {
    expect(montantSchema.safeParse(100.5).success).toBe(false);
    expect(montantSchema.safeParse(0.1).success).toBe(false);
  });

  it("rejette un montant trop eleve (> 999999999)", () => {
    expect(montantSchema.safeParse(9999999999).success).toBe(false);
    expect(montantSchema.safeParse(1000000000).success).toBe(false);
  });

  it("rejette les types non-numeriques", () => {
    expect(montantSchema.safeParse("5000").success).toBe(false);
    expect(montantSchema.safeParse(null).success).toBe(false);
  });
});

describe("quantiteSchema - Validation quantite", () => {
  it("accepte une quantite positive", () => {
    expect(quantiteSchema.safeParse(1).success).toBe(true);
    expect(quantiteSchema.safeParse(5).success).toBe(true);
    expect(quantiteSchema.safeParse(99999).success).toBe(true);
  });

  it("rejette zero (doit etre positive, pas non-negative)", () => {
    expect(quantiteSchema.safeParse(0).success).toBe(false);
  });

  it("rejette une quantite negative", () => {
    expect(quantiteSchema.safeParse(-1).success).toBe(false);
  });

  it("rejette une quantite decimale", () => {
    expect(quantiteSchema.safeParse(1.5).success).toBe(false);
  });

  it("rejette une quantite trop elevee (> 99999)", () => {
    expect(quantiteSchema.safeParse(100000).success).toBe(false);
  });
});

describe("pourcentageSchema - Validation pourcentage", () => {
  it("accepte les bornes 0 et 100", () => {
    expect(pourcentageSchema.safeParse(0).success).toBe(true);
    expect(pourcentageSchema.safeParse(100).success).toBe(true);
  });

  it("accepte les valeurs intermediaires", () => {
    expect(pourcentageSchema.safeParse(50).success).toBe(true);
    expect(pourcentageSchema.safeParse(18).success).toBe(true);
    expect(pourcentageSchema.safeParse(10).success).toBe(true);
  });

  it("accepte les decimales dans la plage", () => {
    expect(pourcentageSchema.safeParse(18.5).success).toBe(true);
    expect(pourcentageSchema.safeParse(0.5).success).toBe(true);
  });

  it("rejette > 100", () => {
    expect(pourcentageSchema.safeParse(101).success).toBe(false);
    expect(pourcentageSchema.safeParse(200).success).toBe(false);
  });

  it("rejette < 0", () => {
    expect(pourcentageSchema.safeParse(-1).success).toBe(false);
    expect(pourcentageSchema.safeParse(-0.1).success).toBe(false);
  });
});

describe("nomSchema - Validation nom", () => {
  it("accepte un nom simple", () => {
    expect(nomSchema.safeParse("Dupont").success).toBe(true);
  });

  it("accepte un nom compose avec tiret", () => {
    expect(nomSchema.safeParse("Jean-Pierre").success).toBe(true);
  });

  it("accepte les apostrophes (noms gabonais)", () => {
    expect(nomSchema.safeParse("N'Guema").success).toBe(true);
    expect(nomSchema.safeParse("M'Ba").success).toBe(true);
  });

  it("accepte les accents", () => {
    expect(nomSchema.safeParse("Rene").success).toBe(true);
    expect(nomSchema.safeParse("Mbengue").success).toBe(true);
  });

  it("accepte les espaces", () => {
    expect(nomSchema.safeParse("Jean Pierre").success).toBe(true);
  });

  it("trim les espaces", () => {
    const result = nomSchema.safeParse("  Dupont  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("Dupont");
    }
  });

  it("rejette les chiffres", () => {
    expect(nomSchema.safeParse("Jean123").success).toBe(false);
  });

  it("rejette les caracteres speciaux", () => {
    expect(nomSchema.safeParse("Jean@Dupont").success).toBe(false);
    expect(nomSchema.safeParse("Jean#Dupont").success).toBe(false);
  });

  it("rejette une chaine vide", () => {
    expect(nomSchema.safeParse("").success).toBe(false);
  });

  it("rejette un nom trop long (> 100)", () => {
    expect(nomSchema.safeParse("a".repeat(101)).success).toBe(false);
  });
});

describe("adresseSchema - Validation adresse", () => {
  it("accepte une adresse valide", () => {
    const result = adresseSchema.safeParse("Quartier Louis, BP 123, Libreville");
    expect(result.success).toBe(true);
  });

  it("rejette une adresse trop courte (< 5 caracteres)", () => {
    expect(adresseSchema.safeParse("BP").success).toBe(false);
    expect(adresseSchema.safeParse("Rue").success).toBe(false);
  });

  it("sanitize les caracteres dangereux", () => {
    const result = adresseSchema.safeParse("Rue <script>alert(1)</script> Libreville");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toContain("<script>");
    }
  });

  it("rejette une adresse trop longue (> 500)", () => {
    expect(adresseSchema.safeParse("a".repeat(501)).success).toBe(false);
  });
});

describe("codeBarreSchema - Validation code-barres", () => {
  it("accepte un code EAN-8 (8 chiffres)", () => {
    expect(codeBarreSchema.safeParse("12345678").success).toBe(true);
  });

  it("accepte un code EAN-13 (13 chiffres)", () => {
    expect(codeBarreSchema.safeParse("1234567890123").success).toBe(true);
  });

  it("accepte un code a 14 chiffres", () => {
    expect(codeBarreSchema.safeParse("12345678901234").success).toBe(true);
  });

  it("accepte undefined (champ optionnel)", () => {
    expect(codeBarreSchema.safeParse(undefined).success).toBe(true);
  });

  it("rejette un code trop court", () => {
    expect(codeBarreSchema.safeParse("1234567").success).toBe(false);
  });

  it("rejette un code trop long", () => {
    expect(codeBarreSchema.safeParse("123456789012345").success).toBe(false);
  });

  it("rejette un code avec lettres", () => {
    expect(codeBarreSchema.safeParse("12345ABC").success).toBe(false);
  });
});

describe("nifSchema - Validation NIF gabonais", () => {
  it("accepte un NIF valide (10-15 caracteres alphanum)", () => {
    expect(nifSchema.safeParse("AB12345678").success).toBe(true);
    expect(nifSchema.safeParse("GABONAIS12345").success).toBe(true);
  });

  it("accepte undefined (champ optionnel)", () => {
    expect(nifSchema.safeParse(undefined).success).toBe(true);
  });

  it("rejette un NIF trop court", () => {
    expect(nifSchema.safeParse("AB123").success).toBe(false);
  });

  it("rejette les minuscules", () => {
    expect(nifSchema.safeParse("ab12345678").success).toBe(false);
  });
});

describe("rccmSchema - Validation RCCM", () => {
  it("accepte un RCCM valide", () => {
    expect(rccmSchema.safeParse("GA-LBV-2025-B-123").success).toBe(true);
    expect(rccmSchema.safeParse("RCCM12345").success).toBe(true);
  });

  it("accepte undefined (champ optionnel)", () => {
    expect(rccmSchema.safeParse(undefined).success).toBe(true);
  });

  it("rejette un RCCM trop court", () => {
    expect(rccmSchema.safeParse("AB").success).toBe(false);
  });
});

describe("safeStringSchema - Validation chaine securisee", () => {
  it("accepte du texte normal", () => {
    const result = safeStringSchema.safeParse("Poulet braise");
    expect(result.success).toBe(true);
  });

  it("sanitize et accepte du texte avec HTML simple", () => {
    const result = safeStringSchema.safeParse("<b>Important</b>");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toContain("<b>");
    }
  });

  it("rejette les chaines trop longues (> 1000)", () => {
    expect(safeStringSchema.safeParse("a".repeat(1001)).success).toBe(false);
  });
});
