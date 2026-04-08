import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPlanQuotas } from "@/lib/config/plans";

const LOG_PREFIX = "[Cron:Subscriptions]";

export async function GET(request: Request) {
  // 1. Vérifier le secret d'authentification
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn(`${LOG_PREFIX} Tentative non autorisée`);
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  let expiredCount = 0;
  let trialWarningCount = 0;
  const errors: string[] = [];

  // 2. Trouver les abonnements expirés (actif ou en_essai avec date_fin dépassée)
  const { data: expiredSubscriptions, error: fetchError } = await supabase
    .from("abonnements" as never)
    .select("id, etablissement_id, plan, statut, date_fin" as never)
    .in("statut", ["actif", "en_essai"])
    .lt("date_fin", now);

  if (fetchError) {
    console.error(`${LOG_PREFIX} Erreur récupération abonnements expirés:`, fetchError.message);
    return NextResponse.json(
      { error: "Erreur lors de la vérification des abonnements", details: fetchError.message },
      { status: 500 }
    );
  }

  const subscriptions = ((expiredSubscriptions ?? []) as unknown) as Array<{
    id: string;
    etablissement_id: string;
    plan: string;
    statut: string;
    date_fin: string;
  }>;

  console.log(`${LOG_PREFIX} ${subscriptions.length} abonnement(s) expiré(s) trouvé(s)`);

  // 3. Pour chaque abonnement expiré : marquer expire + downgrade établissement
  for (const abo of subscriptions) {
    try {
      // Marquer l'abonnement comme expiré
      const { error: updateAboError } = await supabase
        .from("abonnements" as never)
        .update({
          statut: "expire",
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", abo.id);

      if (updateAboError) {
        const msg = `Erreur mise à jour abonnement ${abo.id}: ${updateAboError.message}`;
        console.error(`${LOG_PREFIX} ${msg}`);
        errors.push(msg);
        continue;
      }

      // Downgrade l'établissement vers le plan essentiel (même logique que handleSubscriptionDeleted)
      const essentialQuotas = getPlanQuotas("essentiel");

      const { error: etabDowngradeError } = await supabase
        .from("etablissements")
        .update({
          plan: "essentiel",
          max_utilisateurs: essentialQuotas.max_utilisateurs,
          max_produits: essentialQuotas.max_produits,
          max_ventes_mois: essentialQuotas.max_ventes_mois,
          max_etablissements: essentialQuotas.max_etablissements,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", abo.etablissement_id);

      if (etabDowngradeError) {
        const msg = `Erreur downgrade établissement ${abo.etablissement_id}: ${etabDowngradeError.message}`;
        console.error(`${LOG_PREFIX} ${msg}`);
        errors.push(msg);
        continue;
      }

      // Créer un audit_log
      const { error: auditError } = await supabase
        .from("audit_logs")
        .insert({
          action: "UPDATE",
          entite: "abonnement",
          entite_id: abo.id,
          description: `Abonnement expiré (plan: ${abo.plan}, statut: ${abo.statut}). Downgrade vers essentiel.`,
          ancienne_valeur: JSON.stringify({ plan: abo.plan, statut: abo.statut }),
          nouvelle_valeur: JSON.stringify({ plan: "essentiel", statut: "expire" }),
          etablissement_id: abo.etablissement_id,
        } as never);

      if (auditError) {
        console.warn(`${LOG_PREFIX} Erreur audit_log pour ${abo.id}:`, auditError.message);
      }

      expiredCount++;
      console.log(
        `${LOG_PREFIX} Abonnement ${abo.id} expiré -> établissement ${abo.etablissement_id} downgrade vers essentiel`
      );
    } catch (err) {
      const msg = `Erreur inattendue pour abonnement ${abo.id}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`${LOG_PREFIX} ${msg}`);
      errors.push(msg);
    }
  }

  // 4. Trouver les essais qui expirent dans moins de 3 jours (avertissement)
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const { data: expiringTrials, error: trialFetchError } = await supabase
    .from("abonnements" as never)
    .select("id, etablissement_id, plan, date_fin" as never)
    .eq("statut", "en_essai")
    .gt("date_fin", now)
    .lt("date_fin", threeDaysFromNow.toISOString());

  if (trialFetchError) {
    console.warn(`${LOG_PREFIX} Erreur récupération essais expirant bientôt:`, trialFetchError.message);
  } else {
    const trials = ((expiringTrials ?? []) as unknown) as Array<{
      id: string;
      etablissement_id: string;
      plan: string;
      date_fin: string;
    }>;
    trialWarningCount = trials.length;

    for (const trial of trials) {
      const daysLeft = Math.ceil(
        (new Date(trial.date_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      console.log(
        `${LOG_PREFIX} Essai expirant bientôt: abonnement ${trial.id}, établissement ${trial.etablissement_id}, ${daysLeft} jour(s) restant(s)`
      );
    }
  }

  // 5. Retourner le résumé
  const summary = {
    timestamp: now,
    expired_processed: expiredCount,
    expired_found: subscriptions.length,
    trial_warnings: trialWarningCount,
    errors: errors.length > 0 ? errors : undefined,
  };

  console.log(`${LOG_PREFIX} Terminé:`, JSON.stringify(summary));

  return NextResponse.json(summary, { status: 200 });
}
