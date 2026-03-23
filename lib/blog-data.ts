import type { LucideIcon } from "lucide-react";
import {
  Lightbulb,
  Zap,
  Store,
  Shield,
  ChefHat,
  TrendingUp,
  Smartphone,
  CreditCard,
  Users,
  Globe,
} from "lucide-react";

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: "tips" | "product" | "business" | "security";
  icon: LucideIcon;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  color: string;
  tags: string[];
  featured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: "moderniser-commerce-gabon-2026",
    title: "Comment moderniser son commerce au Gabon en 2026",
    excerpt:
      "Découvrez les tendances clés qui transforment le commerce africain et comment votre établissement peut en tirer profit. De la digitalisation des paiements à la gestion intelligente des stocks.",
    category: "business",
    icon: Globe,
    author: "Équipe Oréma N+",
    authorRole: "Rédaction",
    date: "28 janvier 2026",
    readTime: "8 min",
    color: "violet",
    tags: ["Digitalisation", "Commerce", "Gabon"],
    featured: true,
    content: `
## L'ère de la transformation digitale au Gabon

Le commerce gabonais est en pleine mutation. En 2026, les consommateurs s'attendent à des expériences d'achat modernes, même dans les marchés traditionnels et les petits commerces. Cette transformation n'est plus une option, c'est une nécessité pour rester compétitif.

### Les tendances qui redéfinissent le commerce

#### 1. La montée en puissance du Mobile Money

Le Gabon a connu une adoption massive du Mobile Money ces dernières années. Airtel Money et Moov Money sont devenus des moyens de paiement incontournables :

- **65%** des transactions de moins de 50 000 FCFA se font via Mobile Money
- Les clients préfèrent ne plus porter de cash
- Les commerçants qui n'acceptent pas le Mobile Money perdent des ventes

**Action concrète** : Équipez-vous d'un système de caisse qui intègre nativement Airtel Money et Moov Money, comme Oréma N+.

#### 2. La gestion des données en temps réel

Fini les cahiers et les calculs approximatifs. Les commerçants modernes ont besoin de :

- Voir leurs ventes en temps réel
- Connaître leurs produits les plus rentables
- Anticiper les ruptures de stock
- Analyser les heures de pointe

**Exemple** : Un restaurant de Libreville a augmenté son chiffre d'affaires de 23% en analysant ses données de vente et en ajustant ses horaires de service.

#### 3. L'expérience client améliorée

Les clients gabonais sont de plus en plus exigeants :

- Rapidité de service (surtout à l'heure du déjeuner)
- Tickets de caisse clairs et professionnels
- Possibilité de payer comme ils le souhaitent
- Programme de fidélité

### Comment Oréma N+ vous accompagne

Notre solution a été conçue spécifiquement pour le marché gabonais :

- **Interface en français** avec terminologie locale
- **TVA gabonaise** (18%) préconfigurée
- **Mobile Money** intégré nativement
- **Mode hors-ligne** pour les coupures Internet
- **Support local** basé à Libreville

### Témoignage : Le Maquis du Bord de Mer

> "Depuis que nous utilisons Oréma N+, notre service est plus rapide, nos clients peuvent payer par Airtel Money, et je peux voir mes ventes depuis mon téléphone même quand je ne suis pas là."
> — Jean-Pierre M., propriétaire

### Commencer la transformation

La bonne nouvelle ? Moderniser son commerce n'est plus réservé aux grandes enseignes. Avec des solutions cloud comme Oréma N+, même un petit maquis peut bénéficier des outils utilisés par les grandes chaînes.

**Nos conseils pour démarrer :**

1. Évaluez vos besoins actuels
2. Testez gratuitement pendant 14 jours
3. Formez votre équipe (nous vous accompagnons)
4. Analysez vos premières données
5. Optimisez en continu

### Conclusion

2026 est l'année idéale pour franchir le pas. Les outils sont accessibles, le marché est prêt, et vos clients attendent cette modernisation. Ne laissez pas vos concurrents prendre de l'avance.

---

*Vous souhaitez moderniser votre commerce ? [Essayez Oréma N+ gratuitement pendant 14 jours](/register).*
    `,
  },
  {
    id: 2,
    slug: "5-astuces-reduire-erreurs-caisse",
    title: "5 astuces pour réduire les erreurs de caisse",
    excerpt:
      "Des conseils pratiques pour former votre équipe et paramétrer votre système de caisse afin de minimiser les écarts de caisse.",
    category: "tips",
    icon: Lightbulb,
    author: "Marie K.",
    authorRole: "Consultante Formation",
    date: "25 janvier 2026",
    readTime: "5 min",
    color: "amber",
    tags: ["Formation", "Caisse"],
    content: `
## Réduire les erreurs de caisse : un enjeu quotidien

Les écarts de caisse sont le cauchemar de tout gérant. Qu'ils soient positifs ou négatifs, ils signalent un problème dans votre processus. Voici 5 astuces éprouvées pour les minimiser.

### Astuce 1 : Standardisez le comptage du fond de caisse

Chaque ouverture et fermeture de caisse doit suivre le même protocole :

1. Comptez les billets par valeur (du plus grand au plus petit)
2. Comptez les pièces séparément
3. Utilisez une feuille de comptage standardisée
4. Double-vérifiez le total

**Outil Oréma N+** : Notre écran de comptage guide le caissier étape par étape.

### Astuce 2 : Un caissier = une session

Ne partagez jamais une session de caisse entre plusieurs employés. Chaque caissier doit :

- Ouvrir sa propre session avec son code PIN
- Être responsable de sa caisse
- Fermer sa session avant de partir

Cela facilite l'identification des problèmes si un écart apparaît.

### Astuce 3 : Formez au rendu de monnaie

Le rendu de monnaie est la source principale d'erreurs. Formez vos équipes à :

- Toujours annoncer le montant reçu à voix haute
- Compter le rendu devant le client
- Ne jamais mettre le billet du client dans le tiroir avant d'avoir rendu

**Script recommandé** : "Vous me donnez 10 000, je vous rends 2 500 FCFA."

### Astuce 4 : Évitez les manipulations de cash inutiles

Chaque manipulation augmente le risque d'erreur :

- Ne faites pas de "change" pour les clients (utilisez un tiroir séparé)
- Les retraits et dépôts doivent être documentés
- Limitez l'accès au tiroir-caisse

### Astuce 5 : Analysez les patterns

Utilisez les rapports pour détecter les tendances :

- Écarts récurrents à certaines heures ?
- Écarts avec certains employés ?
- Écarts certains jours de la semaine ?

**Dans Oréma N+** : Le rapport d'écarts identifie automatiquement les sessions problématiques.

### Bonus : Check-list quotidienne

Téléchargez notre check-list gratuite pour des clôtures de caisse sans erreur :

- [ ] Fond de caisse vérifié à l'ouverture
- [ ] Reçus Mobile Money archivés
- [ ] Comptage méthodique à la fermeture
- [ ] Écarts justifiés et documentés
- [ ] Rapport Z imprimé et signé

### Conclusion

Zéro erreur est un objectif atteignable avec de la rigueur et les bons outils. En combinant formation, procédures et technologie, vous pouvez réduire vos écarts de caisse de plus de 90%.

---

*Besoin d'aide pour former votre équipe ? [Contactez-nous](/partners) pour une session de formation personnalisée.*
    `,
  },
  {
    id: 3,
    slug: "nouvelle-fonctionnalite-division-addition",
    title: "Nouvelle fonctionnalité : Division d'addition simplifiée",
    excerpt:
      "Découvrez comment diviser facilement une addition entre plusieurs clients avec notre nouvelle interface intuitive.",
    category: "product",
    icon: Zap,
    author: "Tech Team",
    authorRole: "Équipe Produit",
    date: "22 janvier 2026",
    readTime: "3 min",
    color: "blue",
    tags: ["Mise à jour", "Restaurant"],
    content: `
## Diviser une addition n'a jamais été aussi simple

Nous avons écouté vos retours. La demande numéro 1 de nos utilisateurs restaurant : une meilleure façon de diviser les additions. C'est chose faite !

### Ce qui change

#### Avant
1. Calculer manuellement les parts
2. Créer plusieurs tickets
3. Encaisser un par un
4. Risque d'erreur élevé

#### Maintenant
1. Cliquez sur "Diviser"
2. Choisissez le mode (égal ou par produit)
3. Glissez-déposez les produits si nécessaire
4. Encaissez chaque part en un clic

### Les 3 modes de division

#### 1. Division égale
L'addition est divisée en parts égales. Parfait pour les groupes qui partagent tout.

**Exemple** : 4 amis, addition de 32 000 FCFA = 8 000 FCFA chacun

#### 2. Division par produit
Chaque convive paie ce qu'il a commandé. Glissez-déposez les produits vers chaque part.

**Exemple** : Marie paie son plat et sa boisson, Paul paie les siens.

#### 3. Division personnalisée
Définissez des montants personnalisés pour chaque part.

**Exemple** : "Je paie 20 000, les autres se partagent le reste."

### Comment ça marche ?

1. Ouvrez la table à encaisser
2. Cliquez sur le bouton **"Diviser"**
3. Sélectionnez le nombre de parts
4. Choisissez le mode de division
5. Ajustez si nécessaire (drag & drop)
6. Cliquez sur **"Créer les parts"**
7. Encaissez chaque part individuellement

### Vidéo tutoriel

[Regardez notre tutoriel de 2 minutes sur la division d'addition]

### Disponibilité

Cette fonctionnalité est disponible dès maintenant pour tous les utilisateurs sur le plan Restaurant et supérieur.

### Vos retours

Cette mise à jour est le fruit de vos suggestions. Continuez à nous faire part de vos idées via le bouton "Feedback" dans l'application !

---

*Pas encore sur Oréma N+ ? [Essayez gratuitement pendant 14 jours](/register).*
    `,
  },
  {
    id: 4,
    slug: "mobile-money-guide-complet-commercants",
    title: "Mobile Money : Guide complet pour les commerçants",
    excerpt:
      "Tout ce que vous devez savoir sur l'intégration d'Airtel Money et Moov Money dans votre point de vente.",
    category: "tips",
    icon: Store,
    author: "Paul M.",
    authorRole: "Expert Paiements",
    date: "18 janvier 2026",
    readTime: "7 min",
    color: "green",
    tags: ["Paiements", "Mobile Money"],
    content: `
## Mobile Money : L'incontournable du commerce gabonais

En 2026, refuser le Mobile Money revient à refuser des ventes. Ce guide complet vous accompagne dans l'intégration d'Airtel Money et Moov Money dans votre commerce.

### Pourquoi accepter le Mobile Money ?

Les chiffres parlent d'eux-mêmes :

- **8 millions** d'utilisateurs Mobile Money au Gabon
- **+45%** de transactions en 2025 vs 2024
- **73%** des 18-35 ans préfèrent le Mobile Money au cash

### Les avantages pour votre commerce

1. **Moins de cash** = moins de risques (vol, faux billets, erreurs)
2. **Paiements traçables** pour votre comptabilité
3. **Clients satisfaits** qui peuvent payer comme ils préfèrent
4. **Encaissements sécurisés** et instantanés

### Prérequis

#### Pour Airtel Money
- Compte marchand Airtel Money
- Numéro marchand (format : 074XXXXXX)
- RCCM et NIF de votre entreprise

#### Pour Moov Money
- Compte marchand Moov Money
- Numéro marchand (format : 062XXXXXX)
- Documents légaux de l'entreprise

### Configuration dans Oréma N+

#### Étape 1 : Activer les modes de paiement
1. Allez dans **Paramètres > Paiements**
2. Activez **Airtel Money** et/ou **Moov Money**
3. Entrez vos numéros marchands

#### Étape 2 : Tester
1. Effectuez une petite transaction test
2. Vérifiez la réception sur votre compte marchand
3. Validez le paramétrage

### En caisse : Comment ça se passe ?

1. Le client choisit Mobile Money au moment de payer
2. Vous sélectionnez Airtel ou Moov dans Oréma N+
3. Le client effectue le paiement sur son téléphone
4. Vous entrez le numéro de référence
5. La transaction est validée

### Gérer les références

**Important** : Toujours enregistrer le numéro de transaction Mobile Money. Cela permet :
- Le rapprochement avec vos relevés
- La preuve de paiement en cas de litige
- La traçabilité comptable

### Frais et commissions

| Opérateur | Frais marchand | Plafond |
|-----------|----------------|---------|
| Airtel Money | 1% | 1 000 000 FCFA |
| Moov Money | 1.2% | 800 000 FCFA |

*Les frais peuvent varier selon votre accord avec l'opérateur.*

### Bonnes pratiques

1. **Affichez clairement** que vous acceptez le Mobile Money
2. **Formez votre équipe** à la procédure
3. **Vérifiez quotidiennement** les transactions reçues
4. **Conservez les références** pendant 1 an minimum

### Résoudre les problèmes courants

**Le client dit avoir payé mais je n'ai pas reçu**
- Vérifiez le numéro de référence
- Attendez quelques minutes (délai possible)
- Vérifiez votre solde marchand

**Le paiement est refusé**
- Le client a-t-il assez de solde ?
- Le montant dépasse-t-il le plafond ?
- Y a-t-il un problème réseau ?

### Conclusion

Le Mobile Money n'est plus une option, c'est un standard. En l'intégrant à votre système de caisse, vous offrez à vos clients la flexibilité qu'ils attendent et vous modernisez votre gestion.

---

*Besoin d'aide pour configurer le Mobile Money ? Notre équipe support est disponible au +241 77 00 00 00.*
    `,
  },
  {
    id: 5,
    slug: "securiser-acces-equipe-bonnes-pratiques",
    title: "Sécuriser les accès de votre équipe : bonnes pratiques",
    excerpt:
      "Apprenez à configurer les rôles et permissions pour protéger vos données sensibles tout en gardant votre équipe productive.",
    category: "security",
    icon: Shield,
    author: "Sécurité Team",
    authorRole: "Équipe Sécurité",
    date: "15 janvier 2026",
    readTime: "6 min",
    color: "red",
    tags: ["Sécurité", "Équipe"],
    content: `
## La sécurité commence par les accès

Un système de caisse contient des données sensibles : transactions, chiffre d'affaires, informations clients. Protéger ces données commence par une bonne gestion des accès.

### Le principe du moindre privilège

Chaque utilisateur doit avoir accès **uniquement** à ce dont il a besoin pour son travail. Ni plus, ni moins.

**Exemple** :
- Un serveur n'a pas besoin de voir les rapports financiers
- Un caissier n'a pas besoin de modifier les produits
- Un manager n'a pas besoin d'accéder aux paramètres système

### Les rôles dans Oréma N+

| Rôle | Caisse | Salle | Produits | Rapports | Employés | Paramètres |
|------|--------|-------|----------|----------|----------|------------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Manager | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Caissier | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Serveur | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Bonnes pratiques de mots de passe

1. **Minimum 8 caractères** avec chiffres et lettres
2. **Unique** pour chaque utilisateur
3. **Changement** tous les 3 mois
4. **Ne jamais partager** son mot de passe

### Le code PIN : rapidité et sécurité

Pour les caissiers qui doivent se connecter rapidement :

- Activez la connexion par PIN (4-6 chiffres)
- Chaque caissier a son propre PIN
- Le PIN est hashé (jamais stocké en clair)
- 3 tentatives maximum avant blocage

### Que faire quand un employé part ?

**Immédiatement** :
1. Désactivez son compte (ne le supprimez pas)
2. Changez les accès partagés (WiFi, codes d'alarme)
3. Récupérez les équipements

**Pourquoi désactiver plutôt que supprimer ?**
Pour conserver l'historique des transactions effectuées par cet employé.

### Auditer les accès

Vérifiez régulièrement :
- Qui a accès à quoi
- Les connexions inhabituelles
- Les tentatives de connexion échouées

**Dans Oréma N+** : Paramètres > Sécurité > Journal des connexions

### Actions sensibles à surveiller

Certaines actions méritent une attention particulière :
- Annulations de vente
- Remises supérieures à 20%
- Modifications de prix
- Suppressions de produits

Activez les alertes pour ces actions dans Paramètres > Alertes.

### Check-list sécurité

- [ ] Chaque employé a son propre compte
- [ ] Les rôles sont correctement attribués
- [ ] Les mots de passe sont forts et uniques
- [ ] Les comptes inactifs sont désactivés
- [ ] Le journal des connexions est consulté régulièrement

### Conclusion

La sécurité n'est pas un produit, c'est un processus. En appliquant ces bonnes pratiques et en utilisant les outils d'Oréma N+, vous protégez efficacement vos données et votre activité.

---

*Des questions sur la sécurité ? Contactez notre équipe à security@orema-nplus.ga*
    `,
  },
  {
    id: 6,
    slug: "restaurant-optimiser-service-salle",
    title: "Restaurant : optimiser le service en salle",
    excerpt:
      "Conseils pour améliorer la rotation des tables et la satisfaction client grâce à une gestion efficace du plan de salle.",
    category: "business",
    icon: ChefHat,
    author: "Jean-Pierre L.",
    authorRole: "Consultant Restauration",
    date: "12 janvier 2026",
    readTime: "6 min",
    color: "purple",
    tags: ["Restaurant", "Service"],
    content: `
## Optimiser le service en salle : l'art de la rotation

Dans la restauration, le temps c'est de l'argent. Une table qui tourne plus vite, c'est plus de couverts, donc plus de chiffre d'affaires. Mais attention à ne pas sacrifier l'expérience client !

### L'équation parfaite

**Rotation optimale = Rapidité de service + Satisfaction client**

### Indicateur clé : le temps moyen par table

Mesurez le temps entre :
- L'installation du client
- Le règlement de l'addition

**Objectifs par type de service** :
| Type | Temps cible |
|------|-------------|
| Fast-food | 15-20 min |
| Déjeuner rapide | 30-45 min |
| Dîner standard | 60-90 min |
| Gastronomique | 90-120 min |

### Les goulots d'étranglement courants

#### 1. L'attente de la commande
**Problème** : Le serveur met du temps à prendre la commande
**Solution** : Prise de commande sur tablette directement à table

#### 2. Le délai en cuisine
**Problème** : Les plats arrivent en retard
**Solution** : KDS (écran cuisine) avec timing et alertes

#### 3. L'addition qui tarde
**Problème** : Le client attend pour payer
**Solution** : Pré-calculer l'addition, proposer le paiement à table

### Utiliser le plan de salle Oréma N+

#### Visualisation en temps réel
- 🟢 Vert : Table libre
- 🟡 Jaune : Table occupée
- 🔵 Bleu : Commande en préparation
- 🟠 Orange : Addition demandée
- 🔴 Rouge : À nettoyer

#### Temps d'occupation affiché
Chaque table montre depuis combien de temps elle est occupée. Rouge si dépassement du temps cible.

### Techniques pour améliorer la rotation

#### 1. Le pré-débarrassage
Débarrassez les assiettes terminées sans attendre la fin du repas. Cela :
- Libère de l'espace sur la table
- Donne un signal subtil
- Prépare la suite

#### 2. La suggestion proactive
"Puis-je vous proposer un café pour terminer ?"

Cette question :
- Accélère la décision
- Évite l'attente du serveur
- Augmente le ticket moyen

#### 3. L'addition anticipée
Apportez l'addition avec le café/dessert. Le client paie quand il est prêt, sans attendre.

### Statistiques à suivre

Dans Oréma N+ > Rapports > Salle :
- Temps moyen d'occupation par table
- Taux de rotation par service
- Tables les plus/moins rentables
- Heures de pointe

### Cas pratique : +15% de couverts

Un restaurant de Libreville a augmenté ses couverts de 15% en :
1. Réduisant le temps de prise de commande (tablette)
2. Affichant le temps sur chaque table
3. Formant l'équipe au pré-débarrassage
4. Proposant l'addition avec le dessert

### Conclusion

L'optimisation du service en salle est un équilibre délicat entre efficacité et hospitalité. Avec les bons outils et les bonnes pratiques, vous pouvez servir plus de clients tout en améliorant leur satisfaction.

---

*Vous gérez un restaurant ? [Découvrez les fonctionnalités salle d'Oréma N+](/docs/plan-salle)*
    `,
  },
  {
    id: 7,
    slug: "analyser-ventes-indicateurs-cles",
    title: "Analyser vos ventes : les indicateurs clés",
    excerpt:
      "Quels KPIs suivre pour piloter efficacement votre activité ? Tour d'horizon des métriques essentielles.",
    category: "business",
    icon: TrendingUp,
    author: "Analytics Team",
    authorRole: "Équipe Data",
    date: "8 janvier 2026",
    readTime: "5 min",
    color: "cyan",
    tags: ["Statistiques", "Business"],
    content: `
## Les indicateurs clés pour piloter votre commerce

"Ce qui ne se mesure pas ne s'améliore pas." Cette maxime est particulièrement vraie dans le commerce. Voici les KPIs essentiels à suivre.

### 1. Chiffre d'affaires (CA)

**Définition** : Total des ventes sur une période

**À suivre** :
- CA journalier
- CA hebdomadaire
- CA mensuel
- Évolution vs période précédente

**Dans Oréma N+** : Tableau de bord > CA en temps réel

### 2. Nombre de tickets

**Définition** : Nombre de transactions

**Ce que ça révèle** :
- Affluence de votre commerce
- Tendances horaires/journalières
- Impact des promotions

### 3. Panier moyen

**Définition** : CA ÷ Nombre de tickets

**Exemple** : 500 000 FCFA ÷ 100 tickets = 5 000 FCFA de panier moyen

**Comment l'améliorer** :
- Vente additionnelle ("Avec ceci ?")
- Formules/menus
- Mise en avant des produits à forte marge

### 4. Marge brute

**Définition** : (Prix de vente - Coût d'achat) ÷ Prix de vente × 100

**Objectif typique** :
- Restauration : 65-75%
- Commerce : 30-50%

**Attention** : Un produit qui se vend bien mais avec une faible marge peut être moins rentable qu'un produit qui se vend moins.

### 5. Top & Flop produits

**Top produits** : Vos best-sellers
- Assurez-vous de ne jamais être en rupture
- Mettez-les en avant

**Flop produits** : Les produits qui ne se vendent pas
- Faut-il les retirer ?
- Faut-il les repositionner ?
- Le prix est-il adapté ?

### 6. Taux de transformation (restaurant)

**Définition** : Clients servis ÷ Clients entrés

**Utilité** : Mesurer si votre capacité est bien utilisée

### 7. Ventes par mode de paiement

**Pourquoi c'est important** :
- Anticipez vos besoins en cash
- Suivez l'adoption du Mobile Money
- Détectez les tendances

### 8. Ventes par employé

**Utilité** :
- Identifier les meilleurs vendeurs
- Détecter les besoins en formation
- Répartir équitablement les shifts

### 9. Heures de pointe

**Question clé** : Quand faites-vous le plus de ventes ?

**Actions** :
- Renforcez l'équipe aux heures de pointe
- Proposez des promotions en heures creuses
- Ajustez vos horaires d'ouverture

### 10. Écarts de caisse

**Objectif** : 0% d'écart

**Suivi** :
- Écart par session
- Écart par caissier
- Tendance sur le mois

### Tableau de bord recommandé

| Indicateur | Fréquence | Objectif |
|------------|-----------|----------|
| CA | Quotidien | +5% vs mois précédent |
| Panier moyen | Hebdomadaire | Selon secteur |
| Top 10 produits | Hebdomadaire | Stabilité |
| Marge brute | Mensuel | >65% resto |
| Écarts de caisse | Quotidien | 0% |

### Conclusion

Les données sont votre meilleur allié pour prendre des décisions éclairées. Avec Oréma N+, tous ces indicateurs sont disponibles en quelques clics, actualisés en temps réel.

---

*Découvrez tous nos rapports dans [Documentation > Rapports](/docs/rapports)*
    `,
  },
];

// Helper functions
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  if (category === "all") return blogPosts;
  return blogPosts.filter((post) => post.category === category);
}

export function getFeaturedPost(): BlogPost | undefined {
  return blogPosts.find((post) => post.featured);
}

export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPost[] {
  const current = getPostBySlug(currentSlug);
  if (!current) return [];

  return blogPosts
    .filter(
      (post) =>
        post.slug !== currentSlug &&
        (post.category === current.category || post.tags.some((tag) => current.tags.includes(tag)))
    )
    .slice(0, limit);
}
