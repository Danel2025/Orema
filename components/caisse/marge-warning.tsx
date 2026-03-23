"use client";

/**
 * MargeWarning - Warning affiché quand un produit est vendu sous sa marge minimum
 */

import { Callout } from "@radix-ui/themes";
import { Warning } from "@phosphor-icons/react";

interface MargeWarningProps {
  produitNom: string;
  margeActuelle: number;
  margeMinimum: number;
}

export function MargeWarning({
  produitNom,
  margeActuelle,
  margeMinimum,
}: MargeWarningProps) {
  return (
    <Callout.Root color="red" size="1" variant="soft" role="alert">
      <Callout.Icon>
        <Warning size={16} weight="duotone" />
      </Callout.Icon>
      <Callout.Text size="1">
        Attention : la marge sur <strong>{produitNom}</strong> est de{" "}
        {margeActuelle}% (minimum requis : {margeMinimum}%)
      </Callout.Text>
    </Callout.Root>
  );
}
