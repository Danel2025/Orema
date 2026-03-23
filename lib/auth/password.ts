/**
 * Utilitaires pour le hachage et la vérification des mots de passe
 * Utilise Node.js crypto (scrypt) pour le hachage sécurisé
 */

import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

/**
 * Hache un mot de passe avec scrypt
 * @param password - Mot de passe en clair
 * @returns Mot de passe haché (format: salt:hash)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Vérifie qu'un mot de passe correspond à son hash
 * @param password - Mot de passe en clair
 * @param hashedPassword - Mot de passe haché (format: salt:hash)
 * @returns true si le mot de passe correspond
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
  const derivedKey = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return timingSafeEqual(hashBuffer, derivedKey);
}

/**
 * Hache un code PIN (4-6 chiffres)
 * @param pin - Code PIN en clair
 * @returns PIN haché (format: salt:hash)
 */
export async function hashPin(pin: string): Promise<string> {
  // Valider que le PIN ne contient que des chiffres
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error("Le PIN doit contenir entre 4 et 6 chiffres");
  }
  return hashPassword(pin);
}

/**
 * Vérifie qu'un PIN correspond à son hash
 * @param pin - PIN en clair
 * @param hashedPin - PIN haché (format: salt:hash)
 * @returns true si le PIN correspond
 */
export async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
  return verifyPassword(pin, hashedPin);
}
