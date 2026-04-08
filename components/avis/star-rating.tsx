"use client";

/**
 * StarRating - Notation par étoiles interactive (1-5)
 * Supporte lecture seule, hover highlight, demi-étoiles
 */

import { useState, useCallback } from "react";
import { Star, StarHalf } from "@phosphor-icons/react";
import { Flex } from "@/components/ui";

interface StarRatingProps {
  value: number;
  onChange?: (note: number) => void;
  size?: number;
  readOnly?: boolean;
}

export function StarRating({
  value,
  onChange,
  size = 24,
  readOnly = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleMouseEnter = useCallback(
    (starIndex: number) => {
      if (readOnly) return;
      setHoverValue(starIndex);
    },
    [readOnly]
  );

  const handleMouseLeave = useCallback(() => {
    if (readOnly) return;
    setHoverValue(null);
  }, [readOnly]);

  const handleClick = useCallback(
    (starIndex: number) => {
      if (readOnly || !onChange) return;
      onChange(starIndex);
    },
    [readOnly, onChange]
  );

  const displayValue = hoverValue ?? value;
  const isInteractive = !readOnly && !!onChange;

  return (
    <Flex
      align="center"
      gap="1"
      role={isInteractive ? "radiogroup" : "img"}
      aria-label={`Note : ${value} sur 5 étoiles`}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFull = displayValue >= starIndex;
        const isHalf = !isFull && displayValue >= starIndex - 0.5;

        return (
          <button
            key={starIndex}
            type="button"
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            disabled={readOnly}
            aria-label={`${starIndex} étoile${starIndex > 1 ? "s" : ""}`}
            role={isInteractive ? "radio" : undefined}
            aria-checked={isInteractive ? value === starIndex : undefined}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: isInteractive ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              transition: "transform 0.15s ease",
              transform:
                isInteractive && hoverValue === starIndex
                  ? "scale(1.2)"
                  : "scale(1)",
            }}
          >
            {isHalf ? (
              <StarHalf
                size={size}
                weight="fill"
                style={{ color: "var(--amber-9)" }}
              />
            ) : (
              <Star
                size={size}
                weight={isFull ? "fill" : "regular"}
                style={{
                  color: isFull ? "var(--amber-9)" : "var(--gray-6)",
                }}
              />
            )}
          </button>
        );
      })}
    </Flex>
  );
}
