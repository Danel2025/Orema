/**
 * Systeme de verrouillage de compte apres tentatives echouees
 *
 * Utilise une Map en memoire pour tracker les tentatives.
 * En production avec plusieurs instances, envisager Redis.
 */

interface LockoutConfig {
  /** Nombre maximum de tentatives avant blocage */
  maxAttempts: number;
  /** Duree de la fenetre de tentatives en millisecondes */
  windowMs: number;
  /** Duree du blocage en millisecondes */
  lockoutMs: number;
}

interface AttemptRecord {
  /** Nombre de tentatives echouees dans la fenetre courante */
  count: number;
  /** Timestamp de la premiere tentative dans la fenetre */
  firstAttempt: number;
  /** Timestamp du verrouillage (null si pas verrouille) */
  lockedUntil: number | null;
}

interface LockoutResult {
  locked: boolean;
  remainingAttempts: number;
  lockoutEndsAt: number | null;
}

/** Configuration pour les logins email/password */
const LOGIN_CONFIG: LockoutConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutMs: 15 * 60 * 1000, // 15 minutes de blocage
};

/** Configuration pour les PINs (plus restrictif) */
const PIN_CONFIG: LockoutConfig = {
  maxAttempts: 3,
  windowMs: 5 * 60 * 1000, // 5 minutes
  lockoutMs: 5 * 60 * 1000, // 5 minutes de blocage
};

/** Map en memoire pour stocker les tentatives */
const attempts = new Map<string, AttemptRecord>();

/** Intervalle de nettoyage (5 minutes) */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/** Reference au timer de nettoyage */
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Demarre le nettoyage periodique des entrees expirees
 */
function ensureCleanupRunning(): void {
  if (cleanupTimer !== null) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attempts.entries()) {
      const config = key.startsWith("pin:") ? PIN_CONFIG : LOGIN_CONFIG;
      const isWindowExpired = now - record.firstAttempt > config.windowMs;
      const isLockoutExpired = record.lockedUntil !== null && now > record.lockedUntil;

      if (isWindowExpired && (record.lockedUntil === null || isLockoutExpired)) {
        attempts.delete(key);
      }
    }

    // Si la map est vide, arreter le timer
    if (attempts.size === 0 && cleanupTimer !== null) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL_MS);

  // Ne pas bloquer le process Node.js
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Genere la cle de la map en fonction du type d'authentification
 */
function getKey(identifier: string, isPin: boolean): string {
  return isPin ? `pin:${identifier}` : `login:${identifier}`;
}

/**
 * Verifie si un identifiant est verrouille
 *
 * @param identifier - Email ou identifiant unique de l'utilisateur
 * @param isPin - true si c'est une tentative de PIN (config plus stricte)
 * @returns Resultat du check de verrouillage
 */
export function checkLockout(identifier: string, isPin = false): LockoutResult {
  const key = getKey(identifier, isPin);
  const config = isPin ? PIN_CONFIG : LOGIN_CONFIG;
  const record = attempts.get(key);
  const now = Date.now();

  // Pas de tentatives enregistrees
  if (!record) {
    return {
      locked: false,
      remainingAttempts: config.maxAttempts,
      lockoutEndsAt: null,
    };
  }

  // Verifier si le lockout est actif
  if (record.lockedUntil !== null && now < record.lockedUntil) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockoutEndsAt: record.lockedUntil,
    };
  }

  // Si le lockout a expire, reset
  if (record.lockedUntil !== null && now >= record.lockedUntil) {
    attempts.delete(key);
    return {
      locked: false,
      remainingAttempts: config.maxAttempts,
      lockoutEndsAt: null,
    };
  }

  // Verifier si la fenetre de tentatives a expire
  if (now - record.firstAttempt > config.windowMs) {
    attempts.delete(key);
    return {
      locked: false,
      remainingAttempts: config.maxAttempts,
      lockoutEndsAt: null,
    };
  }

  // Fenetre active, retourner les tentatives restantes
  const remaining = Math.max(0, config.maxAttempts - record.count);
  return {
    locked: false,
    remainingAttempts: remaining,
    lockoutEndsAt: null,
  };
}

/**
 * Enregistre une tentative echouee
 *
 * @param identifier - Email ou identifiant unique de l'utilisateur
 * @param isPin - true si c'est une tentative de PIN (config plus stricte)
 * @returns Resultat apres enregistrement (peut etre verrouille)
 */
export function recordFailedAttempt(identifier: string, isPin = false): LockoutResult {
  ensureCleanupRunning();

  const key = getKey(identifier, isPin);
  const config = isPin ? PIN_CONFIG : LOGIN_CONFIG;
  const now = Date.now();
  const existing = attempts.get(key);

  // Si pas de record existant ou fenetre expiree, creer un nouveau
  if (!existing || now - existing.firstAttempt > config.windowMs) {
    const newRecord: AttemptRecord = {
      count: 1,
      firstAttempt: now,
      lockedUntil: null,
    };

    // Verifier si on atteint le max des la premiere tentative (ne devrait pas arriver avec maxAttempts >= 1)
    if (newRecord.count >= config.maxAttempts) {
      newRecord.lockedUntil = now + config.lockoutMs;
    }

    attempts.set(key, newRecord);

    return {
      locked: newRecord.lockedUntil !== null,
      remainingAttempts: Math.max(0, config.maxAttempts - newRecord.count),
      lockoutEndsAt: newRecord.lockedUntil,
    };
  }

  // Incrementer le compteur
  existing.count += 1;

  // Verifier si on atteint le seuil de blocage
  if (existing.count >= config.maxAttempts) {
    existing.lockedUntil = now + config.lockoutMs;
  }

  attempts.set(key, existing);

  return {
    locked: existing.lockedUntil !== null,
    remainingAttempts: Math.max(0, config.maxAttempts - existing.count),
    lockoutEndsAt: existing.lockedUntil,
  };
}

/**
 * Remet a zero les tentatives apres un login reussi
 *
 * @param identifier - Email ou identifiant unique de l'utilisateur
 * @param isPin - true pour reset le compteur PIN
 */
export function resetAttempts(identifier: string, isPin = false): void {
  const key = getKey(identifier, isPin);
  attempts.delete(key);
}
