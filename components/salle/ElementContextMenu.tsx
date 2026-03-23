"use client";

/**
 * ElementContextMenu - Menu contextuel pour les éléments du plan
 */

import { useEffect, useRef } from "react";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowsOut,
  ArrowsIn,
  Copy,
  Trash,
  FlipHorizontal,
  ArrowsHorizontal,
  ArrowsVertical,
} from "@phosphor-icons/react";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRotate180: () => void;
  onIncreaseSize: () => void;
  onDecreaseSize: () => void;
  onIncreaseWidth: () => void;
  onIncreaseHeight: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  separator?: boolean;
}

export function ElementContextMenu({
  x,
  y,
  onClose,
  onRotateLeft,
  onRotateRight,
  onRotate180,
  onIncreaseSize,
  onDecreaseSize,
  onIncreaseWidth,
  onIncreaseHeight,
  onDuplicate,
  onDelete,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const menuItems: MenuItem[] = [
    { label: "Rotation -90°", icon: <ArrowCounterClockwise size={14} />, onClick: onRotateLeft },
    { label: "Rotation +90°", icon: <ArrowClockwise size={14} />, onClick: onRotateRight },
    { label: "Rotation 180°", icon: <FlipHorizontal size={14} />, onClick: onRotate180 },
    { label: "", icon: null, onClick: () => {}, separator: true },
    { label: "Agrandir", icon: <ArrowsOut size={14} />, onClick: onIncreaseSize },
    { label: "Réduire", icon: <ArrowsIn size={14} />, onClick: onDecreaseSize },
    { label: "Plus large", icon: <ArrowsHorizontal size={14} />, onClick: onIncreaseWidth },
    { label: "Plus haut", icon: <ArrowsVertical size={14} />, onClick: onIncreaseHeight },
    { label: "", icon: null, onClick: () => {}, separator: true },
    { label: "Dupliquer", icon: <Copy size={14} />, onClick: onDuplicate },
    { label: "Supprimer", icon: <Trash size={14} />, onClick: onDelete, danger: true },
  ];

  // Ajuster la position pour ne pas sortir de l'écran
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 350);

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: adjustedX,
        top: adjustedY,
        zIndex: 1000,
        backgroundColor: "var(--color-panel-solid)",
        borderRadius: 10,
        border: "1px solid var(--gray-a5)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        padding: 6,
        minWidth: 180,
      }}
    >
      {menuItems.map((item, index) => {
        if (item.separator) {
          return (
            <div
              key={index}
              style={{
                height: 1,
                backgroundColor: "var(--gray-a5)",
                margin: "6px 0",
              }}
            />
          );
        }

        return (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "transparent",
              color: item.danger ? "var(--red-9)" : "var(--gray-12)",
              fontSize: 13,
              cursor: "pointer",
              textAlign: "left",
              transition: "background-color 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = item.danger
                ? "var(--red-a3)"
                : "var(--gray-a4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span style={{ opacity: 0.8 }}>{item.icon}</span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
