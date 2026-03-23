/**
 * Validation tarifaire côté client
 * Miroir simplifié de l'enforcement serveur pour feedback instantané dans le POS
 */

export interface ReglesUtilisateur {
  remiseMaxPourcent: number;
  peutAppliquerRemise: boolean;
  peutModifierPrix: boolean;
  plafondRemiseTransaction: number;
  necessiteApprobationAuDela: number | null;
  protectionMargeActive: boolean;
  margeMinimumGlobale: number;
  approbationRemiseActive: boolean;
  tarifsHorairesActifs: boolean;
}

export interface ResultatVerificationRemise {
  autorise: boolean;
  raison?: string;
  necessiteApprobation?: boolean;
}

export interface ResultatVerificationMarge {
  valide: boolean;
  marge: number;
  raison?: string;
}

/**
 * Vérifie si une remise est autorisée selon les règles du rôle courant
 */
export function verifierRemiseAutorisee(
  regles: ReglesUtilisateur,
  pourcentageRemise: number,
  montantRemise: number
): ResultatVerificationRemise {
  // Vérifier si l'utilisateur peut appliquer des remises
  if (!regles.peutAppliquerRemise) {
    return {
      autorise: false,
      raison: "Votre rôle ne permet pas d'appliquer des remises.",
    };
  }

  // Vérifier le pourcentage maximum autorisé
  if (pourcentageRemise > regles.remiseMaxPourcent) {
    // Si l'approbation est active et un seuil est défini, proposer l'approbation
    if (
      regles.approbationRemiseActive &&
      regles.necessiteApprobationAuDela !== null &&
      pourcentageRemise > regles.necessiteApprobationAuDela
    ) {
      return {
        autorise: false,
        raison: `Votre rôle est limité à ${regles.remiseMaxPourcent}% de remise maximum. Une approbation manager est requise pour ${pourcentageRemise}%.`,
        necessiteApprobation: true,
      };
    }

    return {
      autorise: false,
      raison: `Votre rôle est limité à ${regles.remiseMaxPourcent}% de remise maximum.`,
    };
  }

  // Vérifier le plafond de remise par transaction (0 = illimité)
  if (regles.plafondRemiseTransaction > 0 && montantRemise > regles.plafondRemiseTransaction) {
    return {
      autorise: false,
      raison: `Le montant de la remise (${montantRemise} FCFA) dépasse le plafond autorisé de ${regles.plafondRemiseTransaction} FCFA par transaction.`,
    };
  }

  // Vérifier si une approbation est nécessaire au-delà d'un certain seuil
  if (
    regles.approbationRemiseActive &&
    regles.necessiteApprobationAuDela !== null &&
    pourcentageRemise > regles.necessiteApprobationAuDela
  ) {
    return {
      autorise: false,
      raison: `Les remises supérieures à ${regles.necessiteApprobationAuDela}% nécessitent l'approbation d'un manager.`,
      necessiteApprobation: true,
    };
  }

  return { autorise: true };
}

/**
 * Vérifie la marge d'un produit
 */
export function verifierMarge(
  prixVente: number,
  prixAchat: number | null | undefined,
  margeMinimum: number
): ResultatVerificationMarge {
  // Si pas de prix d'achat, on ne peut pas vérifier la marge
  if (prixAchat == null || prixAchat <= 0) {
    return { valide: true, marge: 100 };
  }

  const marge = ((prixVente - prixAchat) / prixVente) * 100;
  const margeArrondie = Math.round(marge * 100) / 100;

  if (margeArrondie < margeMinimum) {
    return {
      valide: false,
      marge: margeArrondie,
      raison: `La marge est de ${margeArrondie}% (minimum requis : ${margeMinimum}%).`,
    };
  }

  return { valide: true, marge: margeArrondie };
}

/**
 * Calcule le prix ajusté par un tarif horaire
 */
export function calculerPrixAvecTarifHoraire(
  prixBase: number,
  typeAjustement: "pourcentage" | "montant_fixe",
  valeurAjustement: number
): number {
  if (typeAjustement === "pourcentage") {
    // valeurAjustement peut être négatif (réduction) ou positif (majoration)
    const ajustement = Math.round((prixBase * valeurAjustement) / 100);
    return Math.max(0, prixBase + ajustement);
  }

  // Montant fixe : ajouter directement (négatif = réduction)
  return Math.max(0, prixBase + valeurAjustement);
}
