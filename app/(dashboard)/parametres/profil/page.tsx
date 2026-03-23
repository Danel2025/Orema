"use client";

/**
 * Page de profil utilisateur
 * Permet de voir et modifier ses informations personnelles
 */

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EnvelopeSimple,
  ShieldCheck,
  Buildings,
  Lock,
  Key,
  Eye,
  EyeSlash,
  CircleNotch,
  Check,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/context";
import { updatePassword, updatePin } from "@/actions/auth";
import { updatePasswordSchema, updatePinSchema } from "@/schemas/auth";
import type { Role } from "@/lib/db/types";

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrateur",
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  CAISSIER: "Caissier",
  SERVEUR: "Serveur",
};

const roleColors: Record<Role, string> = {
  SUPER_ADMIN: "var(--red-9)",
  ADMIN: "var(--accent-9)",
  MANAGER: "var(--blue-9)",
  CAISSIER: "var(--green-9)",
  SERVEUR: "var(--purple-9)",
};

export default function ProfilPage() {
  const { user, isLoading } = useAuth();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [showPins, setShowPins] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [isPendingPassword, startPasswordTransition] = useTransition();
  const [isPendingPin, startPinTransition] = useTransition();

  const passwordForm = useForm({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const pinForm = useForm({
    resolver: zodResolver(updatePinSchema),
    defaultValues: {
      currentPin: "",
      newPin: "",
      confirmPin: "",
    },
  });

  const onPasswordSubmit = passwordForm.handleSubmit((data) => {
    setPasswordSuccess(false);
    startPasswordTransition(async () => {
      const result = await updatePassword(data);
      if (result.success) {
        setPasswordSuccess(true);
        passwordForm.reset();
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        passwordForm.setError("currentPassword", {
          message: result.error || "Erreur lors de la mise à jour",
        });
      }
    });
  });

  const onPinSubmit = pinForm.handleSubmit((data) => {
    setPinSuccess(false);
    startPinTransition(async () => {
      const result = await updatePin(data);
      if (result.success) {
        setPinSuccess(true);
        pinForm.reset();
        setTimeout(() => setPinSuccess(false), 3000);
      } else {
        pinForm.setError("currentPin", {
          message: result.error || "Erreur lors de la mise à jour",
        });
      }
    });
  });

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
        }}
      >
        <CircleNotch
          size={32}
          className="animate-spin"
          style={{ color: "var(--accent-9)" }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 16,
        }}
      >
        <WarningCircle size={48} style={{ color: "var(--red-9)" }} />
        <p style={{ color: "var(--gray-11)" }}>Impossible de charger le profil</p>
      </div>
    );
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    borderRadius: 8,
    border: "1px solid var(--gray-a6)",
    backgroundColor: "var(--gray-a2)",
    color: "var(--gray-12)",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--gray-12)",
    marginBottom: 6,
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* En-tête */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--gray-12)",
            marginBottom: 8,
          }}
        >
          Mon profil
        </h1>
        <p style={{ fontSize: 14, color: "var(--gray-10)" }}>
          Consultez et gérez vos informations personnelles
        </p>
      </div>

      {/* Carte profil */}
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          borderRadius: 16,
          border: "1px solid var(--gray-a6)",
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "var(--accent-9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 28,
              color: "white",
            }}
          >
            {getInitials(user.prenom, user.nom)}
          </div>

          {/* Informations */}
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "var(--gray-12)",
                marginBottom: 4,
              }}
            >
              {user.prenom} {user.nom}
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 20,
                  backgroundColor: roleColors[user.role] + "15",
                  color: roleColors[user.role],
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={12} />
                {roleLabels[user.role]}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "var(--gray-11)",
                }}
              >
                <EnvelopeSimple size={16} />
                {user.email}
              </div>

              {user.etablissementNom ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    color: "var(--gray-11)",
                  }}
                >
                  <Buildings size={16} />
                  {user.etablissementNom}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Sections sécurité */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Modifier mot de passe */}
        <div
          style={{
            backgroundColor: "var(--color-panel-solid)",
            borderRadius: 16,
            border: "1px solid var(--gray-a6)",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "var(--blue-a3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lock size={20} weight="duotone" style={{ color: "var(--blue-9)" }} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--gray-12)",
                }}
              >
                Mot de passe
              </h3>
              <p style={{ fontSize: 12, color: "var(--gray-10)" }}>Modifier votre mot de passe</p>
            </div>
          </div>

          {passwordSuccess ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                backgroundColor: "var(--green-a3)",
                color: "var(--green-11)",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              <Check size={16} />
              Mot de passe mis à jour avec succès
            </div>
          ) : null}

          <form onSubmit={onPasswordSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Mot de passe actuel */}
              <div>
                <label style={labelStyle}>Mot de passe actuel</label>
                <div style={{ position: "relative" }}>
                  <input
                    {...passwordForm.register("currentPassword")}
                    type={showPasswords.current ? "text" : "password"}
                    autoComplete="current-password"
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      borderColor: passwordForm.formState.errors.currentPassword
                        ? "var(--red-9)"
                        : "var(--gray-a6)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--gray-9)",
                    }}
                  >
                    {showPasswords.current ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword ? (
                  <p style={{ fontSize: 12, color: "var(--red-11)", marginTop: 4 }}>
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                ) : null}
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label style={labelStyle}>Nouveau mot de passe</label>
                <div style={{ position: "relative" }}>
                  <input
                    {...passwordForm.register("newPassword")}
                    type={showPasswords.new ? "text" : "password"}
                    autoComplete="new-password"
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      borderColor: passwordForm.formState.errors.newPassword
                        ? "var(--red-9)"
                        : "var(--gray-a6)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--gray-9)",
                    }}
                  >
                    {showPasswords.new ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword ? (
                  <p style={{ fontSize: 12, color: "var(--red-11)", marginTop: 4 }}>
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                ) : null}
              </div>

              {/* Confirmer mot de passe */}
              <div>
                <label style={labelStyle}>Confirmer le mot de passe</label>
                <div style={{ position: "relative" }}>
                  <input
                    {...passwordForm.register("confirmPassword")}
                    type={showPasswords.confirm ? "text" : "password"}
                    autoComplete="new-password"
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      borderColor: passwordForm.formState.errors.confirmPassword
                        ? "var(--red-9)"
                        : "var(--gray-a6)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--gray-9)",
                    }}
                  >
                    {showPasswords.confirm ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword ? (
                  <p style={{ fontSize: 12, color: "var(--red-11)", marginTop: 4 }}>
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isPendingPassword}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "var(--blue-9)",
                  color: "white",
                  cursor: isPendingPassword ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: isPendingPassword ? 0.7 : 1,
                }}
              >
                {isPendingPassword ? <CircleNotch size={16} className="animate-spin" /> : null}
                Mettre à jour
              </button>
            </div>
          </form>
        </div>

        {/* Modifier PIN */}
        <div
          style={{
            backgroundColor: "var(--color-panel-solid)",
            borderRadius: 16,
            border: "1px solid var(--gray-a6)",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "var(--purple-a3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Key size={20} weight="duotone" style={{ color: "var(--purple-9)" }} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--gray-12)",
                }}
              >
                Code PIN
              </h3>
              <p style={{ fontSize: 12, color: "var(--gray-10)" }}>Modifier votre code PIN</p>
            </div>
          </div>

          {pinSuccess ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                backgroundColor: "var(--green-a3)",
                color: "var(--green-11)",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              <Check size={16} />
              Code PIN mis à jour avec succès
            </div>
          ) : null}

          <form onSubmit={onPinSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* PIN actuel */}
              <div>
                <label style={labelStyle}>PIN actuel</label>
                <div style={{ position: "relative" }}>
                  <input
                    {...pinForm.register("currentPin")}
                    type={showPins.current ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="off"
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      fontFamily: "var(--font-google-sans-code), monospace",
                      letterSpacing: 4,
                      borderColor: pinForm.formState.errors.currentPin
                        ? "var(--red-9)"
                        : "var(--gray-a6)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPins((p) => ({ ...p, current: !p.current }))}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--gray-9)",
                    }}
                  >
                    {showPins.current ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {pinForm.formState.errors.currentPin ? (
                  <p style={{ fontSize: 12, color: "var(--red-11)", marginTop: 4 }}>
                    {pinForm.formState.errors.currentPin.message}
                  </p>
                ) : null}
              </div>

              {/* Nouveau PIN */}
              <div>
                <label style={labelStyle}>Nouveau PIN (4-6 chiffres)</label>
                <div style={{ position: "relative" }}>
                  <input
                    {...pinForm.register("newPin")}
                    type={showPins.new ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="off"
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      fontFamily: "var(--font-google-sans-code), monospace",
                      letterSpacing: 4,
                      borderColor: pinForm.formState.errors.newPin
                        ? "var(--red-9)"
                        : "var(--gray-a6)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPins((p) => ({ ...p, new: !p.new }))}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--gray-9)",
                    }}
                  >
                    {showPins.new ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {pinForm.formState.errors.newPin ? (
                  <p style={{ fontSize: 12, color: "var(--red-11)", marginTop: 4 }}>
                    {pinForm.formState.errors.newPin.message}
                  </p>
                ) : null}
              </div>

              {/* Confirmer PIN */}
              <div>
                <label style={labelStyle}>Confirmer le PIN</label>
                <div style={{ position: "relative" }}>
                  <input
                    {...pinForm.register("confirmPin")}
                    type={showPins.confirm ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="off"
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      fontFamily: "var(--font-google-sans-code), monospace",
                      letterSpacing: 4,
                      borderColor: pinForm.formState.errors.confirmPin
                        ? "var(--red-9)"
                        : "var(--gray-a6)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPins((p) => ({ ...p, confirm: !p.confirm }))}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--gray-9)",
                    }}
                  >
                    {showPins.confirm ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {pinForm.formState.errors.confirmPin ? (
                  <p style={{ fontSize: 12, color: "var(--red-11)", marginTop: 4 }}>
                    {pinForm.formState.errors.confirmPin.message}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isPendingPin}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "var(--purple-9)",
                  color: "white",
                  cursor: isPendingPin ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: isPendingPin ? 0.7 : 1,
                }}
              >
                {isPendingPin ? <CircleNotch size={16} className="animate-spin" /> : null}
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
