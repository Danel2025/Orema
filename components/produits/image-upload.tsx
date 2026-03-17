"use client";

/**
 * ImageUpload - Composant d'upload d'image pour les produits
 */

import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "produits");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erreur lors de l'upload");
        return;
      }

      onChange(result.url);
    } catch {
      setError("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        style={{ display: "none" }}
      />

      {value ? (
        // Image prévisualisée
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 160,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--gray-a6)",
          }}
        >
          <img
            src={value}
            alt="Aperçu"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "none",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        // Zone de drop
        <div
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            width: "100%",
            height: 160,
            borderRadius: 12,
            border: `2px dashed ${dragOver ? "var(--accent-9)" : "var(--gray-a6)"}`,
            backgroundColor: dragOver ? "var(--accent-a2)" : "var(--gray-a2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: disabled || isUploading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {isUploading ? (
            <>
              <Loader2 size={32} style={{ color: "var(--accent-9)", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 14, color: "var(--gray-11)" }}>Upload en cours...</span>
            </>
          ) : (
            <>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "var(--gray-a3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {dragOver ? (
                  <Upload size={24} style={{ color: "var(--accent-9)" }} />
                ) : (
                  <ImageIcon size={24} style={{ color: "var(--gray-10)" }} />
                )}
              </div>
              <span style={{ fontSize: 14, color: "var(--gray-11)" }}>
                Cliquez ou glissez une image
              </span>
              <span style={{ fontSize: 12, color: "var(--gray-10)" }}>
                JPG, PNG, WebP ou GIF (max 5MB)
              </span>
            </>
          )}
        </div>
      )}

      {error ? <p style={{ fontSize: 13, color: "var(--red-11)", margin: 0 }}>
          {error}
        </p> : null}
    </div>
  );
}
