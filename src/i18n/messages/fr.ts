import { plural } from "../format";
import type { Messages } from "./en";

// French — machine-assisted draft. Requires native-speaker review (docs/TRANSLATION_REVIEW.md).
const fr: Messages = {
  meta: {
    siteName: "Maison Web Studio",
    home: {
      title: "Maison Web Studio — Sites web sur mesure pour les entreprises en croissance",
      description:
        "Des sites web modernes, pensés pour convertir, pour les petites entreprises. Tarifs fixes dès 499 $, un processus clair et une mise en ligne en 7 à 10 jours seulement.",
    },
    work: {
      title: "Réalisations — Sites web d’exemple",
      description:
        "Découvrez des sites web d’exemple conçus par Maison Web Studio pour la beauté, la restauration, le bien-être, l’architecture d’intérieur et les services professionnels.",
    },
    services: {
      title: "Services — Conception web, e-commerce et refontes",
      description:
        "Conception de sites, boutiques en ligne, refontes, pages d’atterrissage et stratégie web, avec des options comme la rédaction, le SEO et la livraison express.",
    },
    pricing: {
      title: "Tarifs — Formules de site web dès 499 $",
      description:
        "Comparez les formules Starter (499 $), Business (899 $) et Premium (1 499 $). Prix unique, réglé en totalité lors du paiement.",
    },
    process: {
      title: "Processus — De la commande à la mise en ligne en cinq étapes",
      description:
        "Comment Maison Web Studio mène votre site de la commande à la mise en ligne : configuration, appel de lancement, design, développement et ajustements, mise en ligne.",
    },
    about: {
      title: "À propos du studio",
      description:
        "Maison Web Studio allie le savoir-faire d’un studio de design éditorial à la clarté d’un produit moderne : formules fixes, tarifs transparents, processus défini.",
    },
    start: {
      title: "Lancez votre site — Configurez et commandez",
      description:
        "Choisissez une formule, ajoutez des options, partagez les détails de votre projet et vos éléments de marque, puis payez en toute sécurité avec Stripe.",
    },
    project: { title: "{name} — Site web d’exemple ({industry})" },
    demo: { title: "{name} — Démo en direct" },
    success: { title: "Confirmation de commande" },
    notFound: { title: "Page introuvable" },
    privacy: { title: "Politique de confidentialité", description: "Comment Maison Web Studio collecte, utilise et protège vos informations personnelles." },
    terms: { title: "Conditions générales", description: "Les conditions applicables à l’utilisation de ce site et à l’achat d’un projet web auprès de Maison Web Studio." },
    cookies: { title: "Politique relative aux cookies", description: "Les cookies et le stockage du navigateur utilisés par ce site, et pourquoi." },
    payment: { title: "Politique de paiement et de remboursement", description: "Paiement intégral lors de la commande et notre politique de paiements définitifs." },
    accessibility: { title: "Déclaration d’accessibilité", description: "Notre engagement pour un site accessible, les limites connues et comment signaler un obstacle." },
  },

  common: {
    skipToContent: "Aller au contenu principal",
    startYourWebsite: "Lancer votre site",
    startHint: "Environ 10 minutes · Vous ne payez qu’à la dernière étape",
    viewOurWork: "Voir nos réalisations",
    viewProject: "Voir le projet",
    openLiveDemo: "Ouvrir la démo",
    allWork: "Toutes les réalisations",
    backToHome: "Retour à l’accueil",
    comparePackages: "Comparer les formules",
    oneTime: "paiement unique",
    mostChosen: "La plus choisie",
    optional: "(facultatif)",
    sampleProject: "Projet d’exemple",
    opensInNewTab: "(s’ouvre dans un nouvel onglet)",
    loading: "Chargement…",
  },

  nav: {
    label: "Principal",
    work: "Réalisations",
    services: "Services",
    pricing: "Tarifs",
    process: "Processus",
    about: "À propos",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    home: "Maison Web Studio — accueil",
  },

  language: { label: "Langue", button: "Langue : {name}", listLabel: "Choisissez une langue" },

  footer: {
    tagline: "De beaux sites web pour les entreprises prêtes à grandir.",
    startLink: "Lancer votre site",
    studio: "Studio",
    start: "Commencer",
    contact: "Contact",
    legal: "Mentions légales",
    nav: "Pied de page",
    links: {
      work: "Réalisations",
      services: "Services",
      process: "Processus",
      about: "À propos",
      pricing: "Tarifs",
      compare: "Comparer les formules",
      configure: "Configurer votre site",
      faq: "FAQ",
      privacy: "Politique de confidentialité",
      terms: "Conditions générales",
      cookies: "Politique relative aux cookies",
      payment: "Paiement et remboursement",
      accessibility: "Accessibilité",
    },
    hours: "Lun–ven, 9 h–18 h (heure de l’Est des États-Unis)",
    location: "À distance · Partout dans le monde",
    rights: "© {year} Maison Web Studio. Tous droits réservés.",
    slogan: "Des sites professionnels, sans les tracas d’une agence.",
  },

  hero: {
    eyebrow: "Maison Web Studio — Nous acceptons de nouveaux projets",
    headline: "Des sites web conçus pour faire avancer votre entreprise.",
    lede:
      "Maison Web Studio crée des sites modernes, pensés pour convertir, pour les entreprises qui veulent paraître aussi professionnelles en ligne que dans la vraie vie.",
    showcaseLabel: "Sites web d’exemple conçus par Maison Web Studio, affichés sur un ordinateur portable et un téléphone",
    trust: [
      { k: "Dès 499 $", v: "Des tarifs clairs et fixes, sans surprise" },
      { k: "7 à 10 jours", v: "Délai habituel pour un site Starter" },
      { k: "Il vous appartient", v: "Votre domaine, votre contenu, votre site" },
    ],
  },

  home: {
    industriesLabel: "Secteurs avec lesquels nous travaillons",
    industries: [
      "Marques de soins",
      "Restaurants",
      "Architectes d’intérieur",
      "Studios de bien-être",
      "Cabinets d’avocats et d’expertise comptable",
      "Boutiques",
      "Salons et spas",
      "Consultants",
      "Immobilier",
      "Cafés",
    ],
    pauseAnimation: "Mettre l’animation en pause",
    playAnimation: "Reprendre l’animation",
    work: {
      eyebrow: "Réalisations",
      title: "Des sites qui ont du caractère.",
      description:
        "Une sélection de sites web d’exemple pour la beauté, l’hôtellerie-restauration, le bien-être et les services professionnels, chacun conçu à partir d’une page blanche.",
    },
    services: { eyebrow: "Services", title: "Tout ce dont votre site a besoin. Rien de superflu.", cta: "Nos services" },
    why: {
      eyebrow: "Pourquoi Maison",
      title: "Des sites professionnels, sans les tracas d’une agence.",
      lede: "Le savoir-faire d’un studio de design, avec la clarté d’un produit que l’on achète en ligne.",
      items: [
        { t: "Des tarifs fixes et transparents", d: "Vous savez exactement ce que vous payez avant de commencer. Pas de facturation à l’heure ni de factures surprises." },
        { t: "Conçu, pas copié", d: "Chaque site est conçu pour votre entreprise, typographie, mise en page et détails compris." },
        { t: "Pensé pour convertir", d: "Des appels à l’action clairs, des pages rapides et des bases SEO pour que les clients vous trouvent et vous choisissent." },
        { t: "Une seule équipe responsable", d: "Stratégie, design et développement réunis, avec un interlocuteur unique." },
      ],
    },
    pricing: {
      eyebrow: "Tarifs",
      title: "Des formules simples. Des résultats clairs.",
      description: "Un prix unique avec tout le nécessaire pour la mise en ligne, réglé en totalité lors du paiement.",
      custom: "Besoin d’autre chose ? Ajoutez la rédaction, une boutique en ligne ou la livraison express en configurant votre site.",
    },
    process: { eyebrow: "Processus", title: "Du premier clic à la mise en ligne, en cinq étapes claires.", cta: "Comment ça marche" },
    faq: { eyebrow: "Questions", title: "Bon à savoir." },
  },

  work: {
    eyebrow: "Réalisations",
    title: "Chaque entreprise mérite son propre style.",
    lede:
      "Découvrez les sites d’exemple que nous avons conçus pour différents secteurs. Ouvrez un projet pour voir l’étude de cas complète et une version interactive du site.",
    filterLabel: "Filtrer les projets par catégorie",
    showing: plural({ one: "{count} projet affiché", other: "{count} projets affichés" }),
    ctaTitle: "Ça vous plaît ? Concevons le vôtre.",
    categories: {
      All: "Tous",
      Beauty: "Beauté",
      Restaurant: "Restaurants",
      "Professional Services": "Services professionnels",
      "E-Commerce": "E-commerce",
      "Local Business": "Commerce local",
    },
  },

  projects: {
    "aurelia-skin": {
      industry: "Beauté / E-commerce",
      summary: "Une boutique douce et éditoriale pour une gamme de soins à la fois clinique et délicate.",
      description:
        "Aurelia avait besoin d’une boutique aussi soignée que ses formules. Nous avons conçu une expérience d’achat éditoriale, avec une présentation sensorielle des produits, un diagnostic de peau guidé et un paiement optimisé pour les achats récurrents.",
      challenge: "Son ancien thème ressemblait à celui de toutes les autres marques de soins et cachait les meilleures ventes à trois clics.",
      approach:
        "Nous avons mis en avant un rituel unique, laissé de l’espace à chaque produit et construit le merchandising autour des ingrédients plutôt que des remises.",
      features: ["Boutique Shopify", "Diagnostic de peau", "Abonnements", "Avis clients", "Collecte d’e-mails"],
      highlights: [
        { value: "3 étapes", label: "Diagnostic de peau guidé" },
        { value: "1 geste", label: "Du produit au panier" },
        { value: "< 1,5 s", label: "Objectif de temps de chargement" },
      ],
    },
    "maison-noir": {
      industry: "Restaurant",
      summary: "Un site nocturne aux chandelles, avec les réservations au premier plan.",
      description:
        "Une salle intime de cuisine française méritait un site qui crée l’ambiance avant même l’arrivée des convives. Nous avons créé une expérience sombre et cinématographique, avec des réservations toujours visibles et une carte modifiable en quelques minutes.",
      challenge: "Les réservations se faisaient par téléphone et la carte était un PDF toujours périmé.",
      approach:
        "Un module de réservation en haut de page, une carte de saison modifiable et les demandes de privatisation envoyées directement à l’équipe événementielle.",
      features: ["Réservations", "Carte modifiable", "Demandes de privatisation", "Cartes cadeaux", "Google Maps"],
      highlights: [
        { value: "En une", label: "Emplacement du module de réservation" },
        { value: "Minutes", label: "Pour mettre à jour la carte de saison" },
        { value: "Sombre", label: "Palette cinématographique et nocturne" },
      ],
    },
    "form-studio": {
      industry: "Architecture d’intérieur",
      summary: "Un portfolio calme et architectural qui laisse parler les espaces.",
      description:
        "Le travail de Form Studio repose sur la proportion et la retenue, et le site aussi. Une grille modulaire, un index des projets et des études de cas portées par l’image, qui font de chaque commande un reportage de magazine.",
      challenge: "De superbes projets, mais une galerie encombrée qui donnait l’impression que tous les espaces se ressemblaient.",
      approach:
        "Nous avons créé une grille flexible et une liste de projets indexée, donnant à chaque projet son propre rythme d’images et de texte.",
      features: ["Index des projets", "Modèles d’études de cas", "Journal", "Formulaire de demande", "CMS"],
      highlights: [
        { value: "12", label: "Modèles de pages" },
        { value: "Modulaire", label: "Grille d’images" },
        { value: "Indexé", label: "Archive des projets" },
      ],
    },
    solace: {
      industry: "Bien-être",
      summary: "Une réservation douce et apaisante pour un studio de yoga et de respiration.",
      description:
        "Solace voulait un site qui donne l’impression d’entrer dans le studio. Des formes douces, une palette délicate et un planning des cours qui rend la réservation d’une première séance simple sur n’importe quel téléphone.",
      challenge: "La plupart des visiteurs arrivaient sur mobile et abandonnaient dans un planning externe peu pratique.",
      approach:
        "Un planning au rendu natif, une offre de découverte claire et des réservations intégrées directement au système de design.",
      features: ["Planning des cours", "Intégration des réservations", "Parcours offre de découverte", "Abonnements", "Newsletter"],
      highlights: [
        { value: "Mobile", label: "Approche de design prioritaire" },
        { value: "2 gestes", label: "Pour réserver un cours" },
        { value: "Intégré", label: "Parcours offre de découverte" },
      ],
    },
    "mason-and-co": {
      industry: "Services professionnels",
      summary: "Une présence assurée et digne de confiance pour un cabinet de conseil familial.",
      description:
        "Après 35 ans de recommandations, Mason & Co. avait besoin d’un site à la hauteur de sa réputation. Nous avons créé un design éditorial et mesuré, avec des domaines d’expertise clairs et une prise de rendez-vous sans effort.",
      challenge: "Un site daté qui ne reflétait pas des décennies d’expertise et ne générait presque aucun contact.",
      approach:
        "Miser sur la crédibilité — chiffres clés, vraies personnes, pages d’expertise en langage clair — et rendre la prise de rendez-vous accessible en un clic depuis partout.",
      features: ["Prise de rendez-vous", "Pages d’expertise", "Profils de l’équipe", "Blog d’analyses", "Statistiques"],
      highlights: [
        { value: "7", label: "Pages" },
        { value: "1 clic", label: "Pour prendre rendez-vous" },
        { value: "Éditorial", label: "Blog d’analyses" },
      ],
    },
  },

  caseStudy: {
    eyebrow: "{industry} · Projet d’exemple",
    industry: "Secteur",
    package: "Formule",
    typefaces: "Typographies",
    scope: "Périmètre",
    palette: "Palette",
    brief: "Le brief",
    approach: "Notre approche",
    next: "Projet suivant",
    ctaTitle: "Envie d’un site comme {name} ?",
    ctaBody: "Ce projet correspond à notre formule {package}. Configurez la vôtre en quelques minutes, nous nous occupons du reste.",
    previewLabel: "Aperçu du site web d’exemple {name}",
    phonePreviewLabel: "Le site web d’exemple {name} sur un téléphone",
  },

  demo: {
    notice: "Site d’exemple par Maison Web Studio",
    caseStudy: "Étude de cas",
    startYours: "Lancer le vôtre",
    toolbar: "Commandes du site d’exemple",
  },

  services: {
    page: {
      eyebrow: "Services",
      title: "Design et technologie, en équilibre.",
      lede:
        "D’un site de trois pages à une boutique en ligne complète, chaque projet reçoit le même soin : une stratégie réfléchie, un design raffiné et un développement rapide et fiable.",
    },
    list: [
      {
        title: "Conception de site web",
        description: "Des sites sur mesure, pensés d’abord pour le mobile, conçus autour de votre marque pour transformer les visiteurs en clients.",
        points: ["Système de design sur mesure", "Intégration responsive", "Conseils sur les textes et contenus"],
      },
      {
        title: "E-commerce",
        description: "De belles boutiques avec des fiches produits soignées, un paiement simple et les intégrations nécessaires pour vendre.",
        points: ["Catalogue produits", "Paiement sécurisé", "Configuration des stocks et de la livraison"],
      },
      {
        title: "Refonte de site",
        description: "Une reconstruction moderne du site devenu trop petit : nous gardons ce qui fonctionne, corrigeons le reste et préservons votre référencement.",
        points: ["Audit de contenu", "Migration sans perte de SEO", "Amélioration des performances"],
      },
      {
        title: "Pages d’atterrissage",
        description: "Des pages rapides et ciblées pour les lancements, campagnes et offres, construites autour d’une seule action claire.",
        points: ["Prêtes pour vos campagnes", "Adaptées aux tests A/B", "Statistiques intégrées"],
      },
      {
        title: "Stratégie web",
        description: "Positionnement, structure et messages, pour que chaque page ait un rôle et que chaque visiteur sache quoi faire ensuite.",
        points: ["Arborescence et parcours utilisateurs", "Cadre de messages", "Revue de conversion"],
      },
    ],
    addOns: {
      eyebrow: "Options",
      title: "Adaptez n’importe quelle formule.",
      lede: "Ajoutez exactement ce dont vous avez besoin en configurant votre site.",
      perPage: "/ page",
    },
  },

  process: {
    page: {
      eyebrow: "Processus",
      title: "Calme, clair et dans les délais.",
      lede:
        "Pas de réunions interminables ni de délais flous. Un processus simple, des étapes définies, un suivi partagé et une date de mise en ligne sur laquelle vous pouvez compter.",
    },
    steps: [
      {
        title: "Configurer et commander",
        duration: "10 minutes",
        description:
          "Choisissez une formule, ajoutez ce dont vous avez besoin et parlez-nous de votre entreprise. Envoyez votre logo, vos photos et tout ce qui vous inspire.",
      },
      {
        title: "Appel de lancement",
        duration: "Jour 1–2",
        description:
          "Un appel de 30 minutes pour s’aligner sur les objectifs, le public et le style. Nous partageons un tableau de projet simple avec votre calendrier.",
      },
      {
        title: "Design",
        duration: "Semaine 1–2",
        description:
          "Nous concevons d’abord votre page d’accueil, l’affinons ensemble, puis étendons le système à toutes les pages, sur ordinateur et mobile.",
      },
      {
        title: "Développement et ajustements",
        duration: "Semaine 2–3",
        description:
          "Votre site est développé, optimisé et testé sur différents appareils. Des cycles de révision sont inclus dans chaque formule.",
      },
      {
        title: "Mise en ligne",
        duration: "Jour J",
        description:
          "Nous connectons votre domaine, configurons le SSL, les statistiques et l’essentiel du SEO, et vous montrons comment mettre à jour votre site.",
      },
    ],
    extras: [
      { t: "Tableau de projet partagé", d: "Toutes les tâches, fichiers et validations au même endroit, sans fouiller dans vos e-mails." },
      { t: "Point hebdomadaire", d: "Un court compte rendu écrit chaque semaine, pour toujours savoir ce qui vient ensuite." },
      { t: "Après la mise en ligne", d: "Une présentation de votre site, ainsi que des forfaits de maintenance facultatifs pour les mises à jour et la tranquillité d’esprit." },
    ],
  },

  about: {
    eyebrow: "À propos",
    title: "Un studio créatif qui pense comme une entreprise technologique.",
    intro:
      "Maison Web Studio est né d’une idée simple : un excellent design ne devrait pas exiger un abonnement d’agence, et acheter un site web ne devrait pas être un pari.",
    p1:
      "Nous allions le savoir-faire d’un studio de design éditorial à la clarté d’un produit moderne. Formules fixes, tarifs transparents et processus défini : vous savez ce que vous obtenez, quand, et à quel prix, avant de commencer.",
    p2:
      "Nous travaillons avec des fondateurs, restaurants, studios, cabinets et marques soucieux de leur image. Notre rôle : que votre entreprise soit aussi belle en ligne que dans la vraie vie, et qu’il soit facile pour les bons clients de dire oui.",
    valuesEyebrow: "Nos valeurs",
    valuesTitle: "Discrètement exceptionnel.",
    values: [
      { t: "Retenue", d: "Nous retirons jusqu’à ce qu’il ne reste que l’essentiel. Un bon design est calme, clair et assuré." },
      { t: "Savoir-faire", d: "La typographie, les espacements et les animations sont réglés à la main. Ce sont les détails qui donnent une impression haut de gamme." },
      { t: "Clarté", d: "Un langage simple, des prix fixes et des délais honnêtes. Vous savez toujours où en sont les choses." },
      { t: "Partenariat", d: "Votre entreprise, vos objectifs. Nous concevons pour vos clients, pas pour des prix." },
    ],
    showcaseLabel: "Le site web d’exemple de Form Studio dans une fenêtre de navigateur",
  },

  pricing: {
    eyebrow: "Tarifs",
    title: "Un design haut de gamme, des prix honnêtes.",
    lede: "Trois formules, un prix unique. Chaque projet est réglé en totalité lors du paiement, et tous les paiements sont définitifs.",
    timeline: "Délai habituel : {timeline}",
    choose: "Choisir {name}",
    chooseShort: "Choisir",
    compareEyebrow: "Comparer",
    compareTitle: "Comparez les formules.",
    compareCaption: "Fonctionnalités incluses dans chaque formule",
    feature: "Fonctionnalité",
    included: "Inclus",
    notIncluded: "Non inclus",
    faqEyebrow: "FAQ",
    faqTitle: "Vos questions, nos réponses.",
    paymentNote: "Paiement intégral lors de la commande. Tous les paiements sont définitifs — voir notre {link}.",
    paymentLink: "Politique de paiement et de remboursement",
  },

  packages: {
    starter: {
      name: "Site Starter",
      short: "Starter",
      tagline: "Une présence soignée et professionnelle pour les entreprises nouvelles ou en croissance.",
      timeline: "7 à 10 jours",
      rushTimeline: "4 à 6 jours",
      features: [
        "Jusqu’à 3 pages",
        "Design sur mesure",
        "Adapté aux mobiles",
        "Formulaire de contact",
        "Liens vers les réseaux sociaux",
        "SEO de base",
        "Configuration SSL et sécurité",
        "Un cycle de révision",
        "Aide à la mise en ligne",
      ],
    },
    business: {
      name: "Site Business",
      short: "Business",
      tagline: "Tout ce dont une entreprise établie a besoin pour attirer et convertir.",
      timeline: "2 à 3 semaines",
      rushTimeline: "8 à 12 jours",
      features: [
        "Jusqu’à 7 pages",
        "Design sur mesure",
        "Adapté aux mobiles",
        "Formulaires de contact",
        "Galerie",
        "Google Maps",
        "Intégration des réseaux sociaux",
        "SEO",
        "Statistiques",
        "Intégration de réservation",
        "Deux cycles de révision",
        "Aide à la mise en ligne",
      ],
    },
    premium: {
      name: "Site Premium",
      short: "Premium",
      tagline: "Un site de qualité éditoriale, pensé dans les moindres détails, pour les marques qui mènent.",
      timeline: "3 à 4 semaines",
      rushTimeline: "12 à 16 jours",
      features: [
        "Jusqu’à 12 pages",
        "Design haut de gamme",
        "Sections avancées",
        "Animations",
        "Formulaires",
        "Galeries",
        "Réservations",
        "Intégration newsletter",
        "SEO",
        "Statistiques",
        "Mise en place d’un blog",
        "Trois cycles de révision",
        "Support prioritaire",
      ],
    },
  },

  compare: {
    labels: {
      pages: "Pages incluses",
      design: "Design",
      revisions: "Cycles de révision",
      timeline: "Délai habituel",
      mobile: "Adapté aux mobiles",
      forms: "Formulaires de contact",
      ssl: "Configuration SSL et sécurité",
      seo: "SEO",
      gallery: "Galerie",
      maps: "Google Maps",
      analytics: "Statistiques",
      booking: "Intégration de réservation",
      advanced: "Sections avancées et animations",
      newsletter: "Intégration newsletter",
      blog: "Mise en place d’un blog",
      priority: "Support prioritaire",
      launch: "Aide à la mise en ligne",
    },
    values: {
      upTo3: "Jusqu’à 3",
      upTo7: "Jusqu’à 7",
      upTo12: "Jusqu’à 12",
      custom: "Sur mesure",
      premium: "Haut de gamme",
      basic: "De base",
      standard: "Standard",
      one: "1",
      two: "2",
      three: "3",
    },
  },

  addOns: {
    "extra-pages": { name: "Pages supplémentaires", description: "Étendez votre site au-delà des pages incluses dans votre formule." },
    copywriting: { name: "Rédaction professionnelle", description: "Des textes clairs et convaincants pour chaque page, dans le ton de votre marque." },
    logo: { name: "Logo et rafraîchissement de marque", description: "Un logotype affiné, une palette de couleurs et une association typographique pour votre entreprise." },
    ecommerce: { name: "Boutique en ligne", description: "Catalogue, panier et paiement pour 25 produits maximum." },
    booking: { name: "Intégration de réservation", description: "Des rendez-vous en ligne connectés à votre agenda." },
    newsletter: { name: "Intégration newsletter", description: "Des formulaires d’inscription connectés à Mailchimp, Klaviyo ou ConvertKit." },
    blog: { name: "Mise en place d’un blog", description: "Un blog soigné, facile à mettre à jour, avec catégories." },
    "seo-plus": { name: "SEO avancé", description: "Recherche de mots-clés, données structurées et optimisation des pages." },
    "google-business": { name: "Fiche d’établissement Google", description: "Création et optimisation pour que les clients vous trouvent sur Maps." },
    "care-plan": { name: "Maintenance de 3 mois", description: "Mises à jour, sauvegardes, surveillance et petites modifications après la mise en ligne." },
    rush: { name: "Livraison express", description: "Passez en tête de file : mise en ligne environ deux fois plus rapide." },
  },
  extraPagesItem: plural({ one: "Pages supplémentaires ({count} page)", other: "Pages supplémentaires ({count} pages)" }),

  styles: {
    minimal: { name: "Minimaliste", description: "Calme, aéré et précis." },
    editorial: { name: "Éditorial", description: "Typographie et images de magazine." },
    warm: { name: "Chaleureux et naturel", description: "Tons doux, accueillant et humain." },
    bold: { name: "Audacieux et moderne", description: "Typographie affirmée, fort contraste." },
  },

  industries: {
    beauty: "Beauté et soins",
    hospitality: "Restauration et hôtellerie",
    wellness: "Bien-être et fitness",
    professional: "Services professionnels",
    interiors: "Architecture et intérieur",
    retail: "Commerce et e-commerce",
    health: "Santé et médical",
    realEstate: "Immobilier",
    creative: "Création et médias",
    other: "Autre",
  },

  pageNames: {
    home: "Accueil",
    about: "À propos",
    services: "Services",
    contact: "Contact",
    gallery: "Galerie",
    journal: "Journal",
    menu: "Carte",
    shop: "Boutique",
    booking: "Réservation",
    team: "Équipe",
    pricing: "Tarifs",
    faq: "FAQ",
    testimonials: "Témoignages",
    careers: "Carrières",
    locations: "Adresses",
    events: "Événements",
  },

  faq: [
    {
      q: "Combien de temps faut-il pour créer un site ?",
      a: "Les sites Starter sont généralement mis en ligne en 7 à 10 jours, les sites Business en 2 à 3 semaines et les sites Premium en 3 à 4 semaines. La livraison express est disponible en option. Les délais commencent dès réception de votre contenu.",
    },
    {
      q: "Que dois-je fournir ?",
      a: "Votre logo, les photos que vous souhaitez utiliser et les textes de vos pages. Vous les envoyez lors de votre commande, et vous ne pouvez pas payer sans eux. Pas de textes ? Ajoutez la rédaction professionnelle et nous les écrirons pour vous.",
    },
    {
      q: "Comment fonctionne le paiement ?",
      a: "Chaque projet est réglé en totalité lors du paiement via Stripe. Tous les paiements sont définitifs et non remboursables : vérifiez bien votre formule et vos options avant de payer.",
    },
    {
      q: "Le site m’appartient-il ?",
      a: "Oui. Une fois le projet entièrement payé, le site, le design et le contenu vous appartiennent. Nous configurons tout sur des comptes à votre nom.",
    },
    {
      q: "Et l’hébergement et mon nom de domaine ?",
      a: "Nous vous aidons à connecter un domaine que vous possédez (ou à en acheter un) et à mettre en place un hébergement fiable. L’hébergement est facturé directement par le prestataire, généralement entre 0 $ et 25 $ par mois selon votre site.",
    },
    {
      q: "Et si j’ai besoin de plus de pages plus tard ?",
      a: "Vous pouvez ajouter des pages à tout moment pour 75 $ chacune, ou passer à une formule supérieure avant le début du projet.",
    },
    {
      q: "Que se passe-t-il si le design ne me plaît pas ?",
      a: "Chaque formule inclut des cycles de révision, et nous partageons les maquettes tôt pour que vos retours orientent le travail. Vous verrez le design de votre page d’accueil avant que nous construisions quoi que ce soit d’autre.",
    },
  ],

  cta: {
    eyebrow: "Lancez votre projet",
    title: "Prêt pour un site qui travaille autant que vous ?",
    description: "Configurez votre site en une dizaine de minutes. Des prix clairs, une vraie équipe et une date de mise en ligne sur laquelle compter.",
  },

  configurator: {
    steps: {
      package: "Formule",
      configure: "Configuration",
      addons: "Options",
      details: "Votre projet",
      assets: "Fichiers",
      review: "Vérifier et payer",
    },
    progressLabel: "Progression de la commande",
    stepOf: "Étape {n} sur {total}",
    stepStatus: "Étape {n} sur {total} : {label}",
    back: "Retour",
    continue: "Continuer",
    uploading: "Envoi en cours…",
    pay: "Payer {amount} en toute sécurité",
    paySecurely: "Payer en toute sécurité",
    redirecting: "Redirection vers Stripe…",
    redirectingShort: "Redirection…",
    total: "Total",
    questions: "Des questions avant de commander ? Écrivez à {email}.",
    cancelledNotice:
      "Le paiement a été annulé : rien n’a été débité. Vos informations sont enregistrées dans cet onglet, vous pouvez reprendre ici.",
    previewNotice:
      "Ceci est un lien d’aperçu : les paiements sont désactivés. Sur le site réel, ce bouton ouvre le paiement sécurisé Stripe.",
    clearSaved: "Effacer mes informations enregistrées",
    clearedSaved: "Vos informations enregistrées ont été effacées.",
    errorSummary: plural({ one: "Corrigez {count} problème avant de continuer.", other: "Corrigez {count} problèmes avant de continuer." }),
    errors: {
      generic: "Un problème est survenu de notre côté. Veuillez réessayer.",
      network: "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
      timeout: "Cela prend plus de temps que prévu. Vérifiez votre connexion et réessayez.",
      rateLimited: "Trop de tentatives. Patientez une minute et réessayez.",
      unavailable: "Le paiement en ligne n’est pas disponible pour le moment. Écrivez-nous pour finaliser votre commande.",
      validation: "Certaines informations sont à vérifier.",
      checkoutFailed: "Impossible de lancer le paiement. Réessayez dans un instant.",
    },
    summary: {
      eyebrow: "Votre site",
      choosePackage: "Choisissez une formule pour voir votre récapitulatif.",
      timeline: "Délai estimé : {timeline}",
      totalPaid: "Total, payé en totalité",
      pages: "Pages ({count})",
      label: "Récapitulatif de commande",
    },
    package: {
      title: "Choisissez votre point de départ.",
      description:
        "Chaque formule comprend un design sur mesure, l’adaptation aux mobiles et l’aide à la mise en ligne. Vous pourrez ajouter des options aux étapes suivantes.",
      legend: "Formules",
      more: plural({ one: "+{count} autre", other: "+{count} autres" }),
      notSure: "Vous hésitez ?",
      compareLink: "Comparer les formules côte à côte",
    },
    configure: {
      title: "Façonnez votre site.",
      description: "Choisissez une direction artistique et les pages dont vous avez besoin. Nous affinerons tout ensemble lors de l’appel de lancement.",
      styleLegend: "Direction artistique",
      pagesLegend: "Pages",
      pagesCount: "{count} sur {limit} incluses",
      extraPages: "{count} en plus × {price}",
      remove: "Supprimer la page {page}",
      newPageLabel: "Nom de la nouvelle page",
      newPagePlaceholder: "Ajoutez une page, p. ex. « Carte »",
      add: "Ajouter",
      suggestions: "Pages suggérées",
      addSuggestion: "Ajouter {page}",
      colorLabel: "Couleurs ou notes de marque",
      colorPlaceholder: "p. ex. Neutres chauds, notre logo est vert foncé",
    },
    addons: {
      title: "Ajoutez ce dont vous avez besoin.",
      description: "Options facultatives pour votre {package}. Les éléments déjà inclus dans votre formule ne sont pas affichés.",
      legend: "Options facultatives",
      extraTitle: plural({ one: "Pages supplémentaires × {count}", other: "Pages supplémentaires × {count}" }),
      extraNote: "Ajoutées automatiquement d’après votre liste de pages ({price} chacune).",
      skip: "Vous pouvez passer cette étape : les options peuvent aussi être ajoutées plus tard.",
    },
    details: {
      title: "Parlez-nous de votre entreprise.",
      description: "Plus nous en savons, meilleur sera votre premier design. Cela prend environ trois minutes.",
      fullName: "Nom complet",
      email: "E-mail",
      emailHint: "Nous vous enverrons la confirmation à cette adresse.",
      phone: "Téléphone",
      businessName: "Nom de l’entreprise",
      industry: "Secteur",
      industryPlaceholder: "Sélectionnez un secteur",
      currentWebsite: "Site actuel",
      websitePlaceholder: "votreentreprise.com",
      goals: "Que doit accomplir votre nouveau site ?",
      goalsPlaceholder: "p. ex. Obtenir plus de réservations en ligne, paraître plus établi que la concurrence, vendre nos produits en ligne…",
      goalsHint: "Au moins 20 caractères.",
      audience: "Qui sont vos clients idéaux ?",
      inspiration: "Sites web que vous admirez",
      inspirationPlaceholder: "Liens et ce que vous aimez chez eux",
      hasDomain: "Possédez-vous un nom de domaine ?",
      domain: { yes: "Oui", no: "Non", unsure: "Je ne sais pas" },
      launchDate: "Date de mise en ligne souhaitée",
      honeypot: "Laissez ce champ vide",
    },
    assets: {
      title: "Partagez vos éléments de marque.",
      description:
        "Envoyez votre logo, vos photos, vos textes, menus ou brochures. Cette étape est obligatoire : vous devez envoyer au moins un fichier pour continuer.",
      dropHere: "Déposez vos fichiers ici, ou",
      browse: "Parcourir les fichiers",
      rules: "Images, PDF, documents, fichiers de design ou ZIP · 15 Mo maximum chacun · {max} fichiers maximum",
      inputLabel: "Envoyer des fichiers",
      listLabel: "Fichiers envoyés",
      uploaded: "{size} · Envoyé",
      uploadingFile: "Envoi de {name}",
      remove: "Supprimer {name}",
      dismiss: "Ignorer {name}",
      notesLabel: "Notes sur vos fichiers",
      notesPlaceholder: "p. ex. D’autres photos sont dans un dossier Google Drive — lien ici",
      errors: {
        limit: "Limite de {max} fichiers atteinte.",
        tooLarge: "Plus de 15 Mo.",
        type: "Ce type de fichier n’est pas pris en charge.",
        failed: "Échec de l’envoi. Veuillez réessayer.",
        network: "Erreur réseau — veuillez réessayer.",
        rateLimited: "Trop d’envois. Patientez une minute et réessayez.",
      },
    },
    review: {
      title: "Vérifiez votre commande.",
      description: "Vérifiez que tout est correct. Vous serez redirigé vers Stripe pour payer en toute sécurité.",
      sections: { website: "Site web", project: "Votre projet", assets: "Fichiers" },
      edit: "Modifier",
      editSection: "Modifier : {section}",
      rows: {
        package: "Formule",
        style: "Direction artistique",
        pages: "Pages",
        timeline: "Délai estimé",
        brandNotes: "Notes de marque",
        contact: "Contact",
        business: "Entreprise",
        goals: "Objectifs",
        currentWebsite: "Site actuel",
        files: "Fichiers",
      },
      filesUploaded: plural({ one: "{count} fichier envoyé", other: "{count} fichiers envoyés" }),
      agreementTitle: "Accord de paiement",
      englishBinding: "L’accord de paiement et les conditions ci-dessous sont présentés en anglais, qui fait foi.",
      readAgreement: "Lire l’accord de paiement complet",
      privacyNote: "Nous utilisons vos informations uniquement pour planifier et réaliser votre projet.",
      privacyLink: "Politique de confidentialité",
      secure: "Les paiements sont traités en toute sécurité par Stripe. Vous paierez {amount} en totalité.",
    },
  },

  validation: {
    packageRequired: "Choisissez une formule pour continuer.",
    styleRequired: "Choisissez une direction artistique.",
    pagesRequired: "Ajoutez au moins une page.",
    pageName: "Le nom d’une page ne peut pas être vide.",
    nameRequired: "Indiquez votre nom complet.",
    emailInvalid: "Saisissez une adresse e-mail valide, comme nom@exemple.com.",
    phoneInvalid: "Saisissez un numéro de téléphone valide, ou laissez le champ vide.",
    businessRequired: "Indiquez le nom de votre entreprise.",
    industryRequired: "Sélectionnez votre secteur.",
    urlInvalid: "Saisissez une adresse web valide, comme votreentreprise.com.",
    goalsTooShort: "Une ou deux phrases nous aident à préparer le projet — au moins 20 caractères.",
    tooLong: "C’est trop long. Merci de raccourcir.",
    filesRequired: "Envoyez votre contenu pour continuer : logo, photos ou textes.",
    agreementRequired: "Confirmez que vous comprenez que tous les paiements sont définitifs.",
    termsRequired: "Acceptez les Conditions générales pour continuer.",
    invalid: "Vérifiez ce champ.",
  },

  success: {
    eyebrow: "Commande {ref}",
    title: "Merci, {name}. Votre site est officiellement lancé.",
    emailSent: "Une confirmation sera envoyée à {email}. Voici la suite.",
    next: [
      { t: "E-mail de lancement", d: "Sous un jour ouvré, nous vous écrirons pour planifier un appel de lancement de 30 minutes." },
      { t: "Tableau de projet", d: "Vous recevrez un tableau partagé avec votre calendrier et tout ce dont nous avons encore besoin." },
      { t: "Premier design", d: "Le design de votre page d’accueil arrive dans votre boîte de réception, généralement sous une semaine." },
    ],
    summary: "Récapitulatif de commande",
    paid: "Payé en totalité",
    finalNote: "Tous les paiements sont définitifs et non remboursables.",
    pages: "Pages",
    assets: "Fichiers reçus",
    files: plural({ one: "{count} fichier", other: "{count} fichiers" }),
    explore: "Découvrir nos réalisations",
    confirming: "Confirmation de votre paiement…",
    notFoundTitle: "Nous n’avons pas trouvé cette commande.",
    notFoundBody: "Si vous venez de payer, consultez votre e-mail pour le reçu ou contactez-nous et nous réglerons cela rapidement.",
    processingTitle: "Votre paiement est en cours de traitement.",
    processingBody:
      "Certains moyens de paiement prennent un peu plus de temps. Nous vous enverrons la confirmation dès sa validation. Inutile de repasser commande.",
    failedTitle: "Votre paiement n’a pas abouti.",
    failedBody: "Rien n’a été débité. Vos informations sont enregistrées dans cet onglet, vous pouvez réessayer.",
    expiredTitle: "Cette session de paiement a expiré.",
    expiredBody: "Rien n’a été débité. Revenez à l’étape de vérification pour relancer le paiement.",
    returnToCheckout: "Revenir au paiement",
    contact: "Nous contacter",
    unavailableTitle: "Impossible de vérifier votre paiement pour le moment.",
    unavailableBody:
      "Si vous avez finalisé le paiement, il est pris en compte : vous recevrez un reçu de Stripe. Actualisez dans un instant ou contactez-nous.",
  },

  notFound: {
    eyebrow: "404",
    title: "Cette page a pris un autre chemin.",
    body: "La page que vous cherchez n’existe pas ou a été déplacée.",
    popular: "Pages populaires",
  },

  error: {
    title: "Un problème est survenu.",
    body: "Une erreur inattendue s’est produite sur cette page. Réessayez — si le problème persiste, écrivez-nous.",
    retry: "Réessayer",
  },

  legal: {
    draftNotice:
      "Version provisoire en cours de relecture : ce document n’a pas encore été approuvé par le dirigeant ni par un conseiller juridique et peut évoluer.",
    englishOnly: "Ce document est disponible en anglais uniquement. Aucune traduction relue par un professionnel n’est encore disponible.",
    lastUpdated: "Dernière mise à jour : {date}",
  },
};

export default fr;
