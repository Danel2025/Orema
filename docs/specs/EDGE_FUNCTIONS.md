# Edge Functions - Recommandations pour Oréma N+

> Analyse des cas d'utilisation des Supabase Edge Functions pour le projet POS.

## Qu'est-ce qu'une Edge Function ?

Les Edge Functions sont des fonctions serverless qui s'exécutent au plus proche de l'utilisateur (edge network). Elles sont écrites en TypeScript et tournent sur un runtime Deno.

**Caractéristiques :**

- Faible latence (exécution en edge)
- TypeScript natif
- Pas de gestion de serveur
- Facturation à l'usage
- Accès direct à Supabase (auth, database, storage)

## Analyse pour Oréma N+

### Fonctions RECOMMANDÉES

| Fonction                     | Priorité | Justification                                 |
| ---------------------------- | -------- | --------------------------------------------- |
| **Webhooks Mobile Money**    | Haute    | Réception sécurisée des callbacks Airtel/Moov |
| **Rapport Z automatique**    | Haute    | Tâche planifiée fin de journée                |
| **Notifications SMS**        | Moyenne  | Envoi SMS clients (commande prête, livraison) |
| **Intégration comptabilité** | Moyenne  | Export vers logiciels comptables              |
| **Génération code-barres**   | Basse    | Génération dynamique d'images                 |

### Fonctions NON NÉCESSAIRES

| Fonction                   | Raison                         |
| -------------------------- | ------------------------------ |
| **Génération PDF**         | html2pdf.js côté client suffit |
| **Validation formulaires** | Zod + Server Actions suffisent |
| **CRUD basique**           | API Routes Next.js + Prisma    |
| **Auth**                   | Supabase Auth natif            |

## Edge Functions recommandées

### 1. Webhook Mobile Money (Airtel/Moov)

**Priorité : Haute**

Réception des callbacks de paiement mobile money pour confirmer les transactions.

```typescript
// supabase/functions/webhook-mobile-money/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  // Vérifier la signature du webhook
  const signature = req.headers.get("X-Webhook-Signature");
  const body = await req.text();

  if (!verifySignature(body, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(body);

  // Traiter selon le provider
  if (payload.provider === "airtel_money") {
    await handleAirtelCallback(payload);
  } else if (payload.provider === "moov_money") {
    await handleMoovCallback(payload);
  }

  // Mettre à jour le paiement en base
  const { error } = await supabase
    .from("paiements")
    .update({
      statut: "CONFIRME",
      referenceExterne: payload.transaction_id,
      confirmeAt: new Date().toISOString(),
    })
    .eq("referenceInterne", payload.reference);

  if (error) {
    console.error("Erreur mise à jour paiement:", error);
    return new Response("Error", { status: 500 });
  }

  // Broadcast pour notification temps réel
  await supabase.channel("paiements").send({
    type: "broadcast",
    event: "paiement:confirme",
    payload: { reference: payload.reference },
  });

  return new Response("OK", { status: 200 });
});

function verifySignature(body: string, signature: string | null): boolean {
  // Implémenter la vérification selon le provider
  return true; // TODO
}

async function handleAirtelCallback(payload: any) {
  // Logique spécifique Airtel Money
}

async function handleMoovCallback(payload: any) {
  // Logique spécifique Moov Money
}
```

### 2. Rapport Z automatique

**Priorité : Haute**

Génération automatique du rapport de fin de journée à minuit.

```typescript
// supabase/functions/rapport-z-auto/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  // Vérifier que c'est un appel CRON autorisé
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Récupérer tous les établissements actifs
  const { data: etablissements } = await supabase
    .from("etablissements")
    .select("id")
    .eq("actif", true);

  if (!etablissements) {
    return new Response("No establishments", { status: 200 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Générer le rapport Z pour chaque établissement
  for (const etab of etablissements) {
    const { data: ventes } = await supabase
      .from("ventes")
      .select("*, paiements(*)")
      .eq("etablissementId", etab.id)
      .eq("statut", "PAYEE")
      .gte("createdAt", today.toISOString())
      .lt("createdAt", tomorrow.toISOString());

    if (!ventes || ventes.length === 0) continue;

    // Calculer les totaux
    const rapport = calculerRapportZ(ventes);

    // Sauvegarder le rapport
    await supabase.from("rapports_z").insert({
      etablissementId: etab.id,
      date: today.toISOString(),
      nombreVentes: rapport.nombreVentes,
      totalHT: rapport.totalHT,
      totalTVA: rapport.totalTVA,
      totalTTC: rapport.totalTTC,
      totalEspeces: rapport.especes,
      totalCartes: rapport.cartes,
      totalMobileMoney: rapport.mobileMoney,
      totalAutres: rapport.autres,
      data: rapport, // JSON complet
    });
  }

  return new Response("Rapports Z générés", { status: 200 });
});

function calculerRapportZ(ventes: any[]) {
  // Calculs du rapport Z
  return {
    nombreVentes: ventes.length,
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    especes: 0,
    cartes: 0,
    mobileMoney: 0,
    autres: 0,
  };
}
```

**Configuration CRON (Supabase Dashboard) :**

```
0 0 * * *  # Tous les jours à minuit
```

### 3. Notifications SMS

**Priorité : Moyenne**

Envoi de SMS aux clients (commande prête, livraison en cours).

```typescript
// supabase/functions/send-sms/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { telephone, message } = await req.json();

  // Utiliser un provider SMS compatible Gabon
  // Ex: Orange SMS API, Twilio, etc.
  const response = await fetch("https://api.sms-provider.com/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("SMS_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: telephone,
      message: message,
      from: "OREMA",
    }),
  });

  if (!response.ok) {
    return new Response("SMS failed", { status: 500 });
  }

  return new Response("SMS sent", { status: 200 });
});
```

### 4. Export comptabilité

**Priorité : Moyenne**

Export automatique vers les logiciels de comptabilité.

```typescript
// supabase/functions/export-comptabilite/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { etablissementId, dateDebut, dateFin, format } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Récupérer les ventes de la période
  const { data: ventes } = await supabase
    .from("ventes")
    .select("*, lignes(*), paiements(*)")
    .eq("etablissementId", etablissementId)
    .gte("createdAt", dateDebut)
    .lte("createdAt", dateFin);

  // Formater selon le logiciel cible
  let exportData;
  switch (format) {
    case "sage":
      exportData = formatForSage(ventes);
      break;
    case "ciel":
      exportData = formatForCiel(ventes);
      break;
    default:
      exportData = formatGeneric(ventes);
  }

  return new Response(JSON.stringify(exportData), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## Déploiement

### Structure recommandée

```
gabon-pos/
├── supabase/
│   └── functions/
│       ├── webhook-mobile-money/
│       │   └── index.ts
│       ├── rapport-z-auto/
│       │   └── index.ts
│       ├── send-sms/
│       │   └── index.ts
│       └── export-comptabilite/
│           └── index.ts
```

### Commandes CLI

```bash
# Développement local
supabase functions serve

# Déploiement
supabase functions deploy webhook-mobile-money
supabase functions deploy rapport-z-auto

# Logs
supabase functions logs webhook-mobile-money
```

### Variables d'environnement

```bash
# Définir les secrets
supabase secrets set CRON_SECRET=xxx
supabase secrets set SMS_API_KEY=xxx
supabase secrets set AIRTEL_WEBHOOK_SECRET=xxx
supabase secrets set MOOV_WEBHOOK_SECRET=xxx
```

## Coûts estimés

| Fonction              | Fréquence estimée | Coût/mois           |
| --------------------- | ----------------- | ------------------- |
| Webhooks Mobile Money | ~500 appels/mois  | < $1                |
| Rapport Z auto        | 30 appels/mois    | Gratuit             |
| SMS                   | ~200 SMS/mois     | Variable (provider) |
| Export compta         | ~10 appels/mois   | Gratuit             |

**Total estimé : < $5/mois** (hors coûts SMS du provider)

## Alternatives aux Edge Functions

Pour certains cas, les Server Actions Next.js peuvent suffire :

| Cas d'usage        | Edge Function  | Server Action |
| ------------------ | -------------- | ------------- |
| Webhook externe    | Recommandé     | Non adapté    |
| Tâche planifiée    | Recommandé     | Non adapté    |
| Action utilisateur | Non nécessaire | Recommandé    |
| Validation         | Non nécessaire | Recommandé    |
| CRUD               | Non nécessaire | Recommandé    |

## Conclusion

Les Edge Functions sont recommandées pour :

1. **Webhooks** - Réception sécurisée de callbacks externes
2. **Tâches planifiées** - CRON jobs (rapport Z)
3. **Intégrations tierces** - APIs externes (SMS, comptabilité)

Pour les opérations standard (CRUD, validation, génération PDF), les Server Actions Next.js sont préférables car :

- Plus simples à développer
- Mieux intégrées à l'application
- Pas de coût supplémentaire
- TypeScript partagé avec le frontend
