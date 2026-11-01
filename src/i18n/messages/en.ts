import { plural } from "../format";

/**
 * English dictionary — the source of truth. Every other locale is typed as
 * `Messages`, so a missing or misspelled key fails `tsc`.
 * Placeholders use {name}; plurals use plural({ one, other, ... }).
 */
const en = {
  meta: {
    siteName: "Maison Web Studio",
    home: {
      title: "Maison Web Studio — Custom websites for growing businesses",
      description:
        "Modern, conversion-focused websites for small businesses. Fixed pricing from $499, a clear process, and launch in as little as 7–10 days.",
    },
    work: {
      title: "Selected work — Sample websites",
      description:
        "Explore sample websites designed by Maison Web Studio for beauty, restaurant, wellness, interior design and professional service businesses.",
    },
    services: {
      title: "Services — Website design, e-commerce and redesigns",
      description:
        "Website design, online stores, redesigns, landing pages and website strategy, plus add-ons like copywriting, SEO and rush delivery.",
    },
    pricing: {
      title: "Pricing — Website packages from $499",
      description:
        "Compare the Starter ($499), Business ($899) and Premium ($1,499) website packages. One-time pricing, paid in full at checkout.",
    },
    process: {
      title: "Process — From order to launch in five steps",
      description:
        "How Maison Web Studio takes your website from order to launch: configure, kickoff call, design, build and refine, and launch.",
    },
    about: {
      title: "About the studio",
      description:
        "Maison Web Studio pairs the craft of an editorial design studio with the clarity of a modern product: fixed packages, transparent pricing, a defined process.",
    },
    start: {
      title: "Start your website — Configure and order",
      description:
        "Choose a package, pick add-ons, share your project details and brand assets, and check out securely with Stripe.",
    },
    project: {
      title: "{name} — {industry} sample website",
    },
    demo: { title: "{name} — Live demo" },
    success: { title: "Order confirmation" },
    notFound: { title: "Page not found" },
    privacy: { title: "Privacy Policy", description: "How Maison Web Studio collects, uses and protects your personal information." },
    terms: { title: "Terms & Conditions", description: "The terms that apply when you use this website and purchase a website project from Maison Web Studio." },
    cookies: { title: "Cookie Policy", description: "The cookies and browser storage this website uses, and why." },
    payment: { title: "Payment & Refund Policy", description: "Payment in full at checkout and our final-payment policy." },
    accessibility: { title: "Accessibility Statement", description: "Our commitment to an accessible website, known limitations and how to report a barrier." },
  },

  common: {
    skipToContent: "Skip to main content",
    startYourWebsite: "Start Your Website",
    startHint: "About 10 minutes · You pay only at the last step",
    viewOurWork: "View Our Work",
    viewProject: "View project",
    openLiveDemo: "Open live demo",
    allWork: "All work",
    backToHome: "Back to home",
    comparePackages: "Compare packages",
    oneTime: "one-time",
    mostChosen: "Most chosen",
    optional: "(optional)",
    sampleProject: "Sample project",
    opensInNewTab: "(opens in a new tab)",
    loading: "Loading…",
  },

  nav: {
    label: "Main",
    work: "Work",
    services: "Services",
    pricing: "Pricing",
    process: "Process",
    about: "About",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    home: "Maison Web Studio — home",
  },

  language: {
    label: "Language",
    button: "Language: {name}",
    listLabel: "Choose a language",
  },

  footer: {
    tagline: "Beautiful websites built for businesses ready to grow.",
    startLink: "Start your website",
    studio: "Studio",
    start: "Start",
    contact: "Contact",
    legal: "Legal",
    nav: "Footer",
    links: {
      work: "Selected work",
      services: "Services",
      process: "Process",
      about: "About",
      pricing: "Pricing",
      compare: "Compare packages",
      configure: "Configure your website",
      faq: "FAQ",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      cookies: "Cookie Policy",
      payment: "Payment & Refund Policy",
      accessibility: "Accessibility",
    },
    hours: "Mon–Fri, 9am–6pm ET",
    location: "Remote · Worldwide",
    rights: "© {year} Maison Web Studio. All rights reserved.",
    slogan: "Professional websites without the agency headache.",
  },

  hero: {
    eyebrow: "Maison Web Studio — Now booking new projects",
    headline: "Websites designed to move your business forward.",
    lede:
      "Maison Web Studio creates modern, conversion-focused websites for businesses that want to look as professional online as they do in real life.",
    showcaseLabel: "Sample websites designed by Maison Web Studio, shown on a laptop and a phone",
    trust: [
      { k: "From $499", v: "Clear, fixed pricing — no surprises" },
      { k: "7–10 days", v: "Typical launch for a Starter site" },
      { k: "You own it", v: "Your domain, your content, your site" },
    ],
  },

  home: {
    industriesLabel: "Industries we work with",
    industries: [
      "Skincare brands",
      "Restaurants",
      "Interior designers",
      "Wellness studios",
      "Law & accounting firms",
      "Boutiques",
      "Salons & spas",
      "Consultants",
      "Real estate",
      "Cafés",
    ],
    pauseAnimation: "Pause animation",
    playAnimation: "Play animation",
    work: {
      eyebrow: "Selected Work",
      title: "Sites with a point of view.",
      description:
        "A selection of sample websites across beauty, hospitality, wellness and professional services — each designed from a blank page.",
    },
    services: { eyebrow: "Services", title: "Everything your website needs. Nothing it doesn’t.", cta: "Our services" },
    why: {
      eyebrow: "Why Maison",
      title: "Professional websites without the agency headache.",
      lede: "The craft of a design studio with the clarity of a product you can buy online.",
      items: [
        { t: "Fixed, transparent pricing", d: "Know exactly what you’re paying before you start. No hourly billing, no surprise invoices." },
        { t: "Designed, not templated", d: "Every site is designed for your business — typography, layout and details included." },
        { t: "Built to convert", d: "Clear calls to action, fast pages and SEO foundations that help customers find and choose you." },
        { t: "One accountable team", d: "Strategy, design and development under one roof, with a single point of contact." },
      ],
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Simple packages. Clear outcomes.",
      description: "One-time pricing with everything you need to launch, paid in full at checkout.",
      custom: "Need something extra? Add copywriting, an online store or rush delivery when you configure your website.",
    },
    process: { eyebrow: "Process", title: "From first click to launch, in five clear steps.", cta: "How it works" },
    faq: { eyebrow: "Questions", title: "Good to know." },
  },

  work: {
    eyebrow: "Selected Work",
    title: "Every business deserves its own look.",
    lede:
      "Explore sample websites we’ve designed across industries. Open any project to see the full case study and a live, interactive version of the site.",
    filterLabel: "Filter projects by category",
    showing: plural({ one: "Showing {count} project", other: "Showing {count} projects" }),
    ctaTitle: "Like what you see? Let’s design yours.",
    categories: {
      All: "All",
      Beauty: "Beauty",
      Restaurant: "Restaurant",
      "Professional Services": "Professional Services",
      "E-Commerce": "E-Commerce",
      "Local Business": "Local Business",
    },
  },

  projects: {
    "aurelia-skin": {
      industry: "Beauty / E-Commerce",
      summary: "A soft, editorial storefront for a clinical-meets-gentle skincare line.",
      description:
        "Aurelia needed a storefront that felt as considered as its formulas. We designed an editorial shopping experience with tactile product presentation, a guided skin quiz, and a checkout tuned for repeat purchases.",
      challenge: "Their previous theme looked like every other skincare brand and buried the bestsellers three clicks deep.",
      approach:
        "We led with a single ritual, gave every product room to breathe, and wrote merchandising around ingredients rather than discounts.",
      features: ["Shopify storefront", "Skin quiz", "Subscriptions", "Reviews", "Email capture"],
      highlights: [
        { value: "3-step", label: "Guided skin quiz" },
        { value: "1 tap", label: "From product to bag" },
        { value: "< 1.5s", label: "Load-time target" },
      ],
    },
    "maison-noir": {
      industry: "Restaurant",
      summary: "A candlelit, after-dark site with reservations front and center.",
      description:
        "An intimate French dining room deserved a site that set the mood before guests walked in. We built a dark, cinematic experience with an always-visible reservation flow and a menu that updates in minutes.",
      challenge: "Reservations were handled by phone and a PDF menu that was always out of date.",
      approach:
        "A reservation widget in the hero, an editable seasonal menu, and private dining inquiries routed straight to the events team.",
      features: ["Reservations", "Editable menu", "Private dining inquiries", "Gift cards", "Google Maps"],
      highlights: [
        { value: "Hero", label: "Reservation widget placement" },
        { value: "Minutes", label: "To update the seasonal menu" },
        { value: "Dark", label: "Cinematic, after-hours palette" },
      ],
    },
    "form-studio": {
      industry: "Interior Design",
      summary: "A quiet, architectural portfolio that lets the spaces do the talking.",
      description:
        "Form Studio’s work is about proportion and restraint, so the site is too. A modular grid, a project index, and image-led case studies that make each commission feel like a magazine feature.",
      challenge: "Beautiful projects, but a cluttered gallery that made every space look the same.",
      approach:
        "We built a flexible grid system and an indexed project list, giving each project its own rhythm of imagery and text.",
      features: ["Project index", "Case study templates", "Journal", "Inquiry form", "CMS"],
      highlights: [
        { value: "12", label: "Page templates" },
        { value: "Modular", label: "Image grid system" },
        { value: "Indexed", label: "Project archive" },
      ],
    },
    solace: {
      industry: "Wellness",
      summary: "A calm, rounded booking experience for a yoga and breathwork studio.",
      description:
        "Solace wanted a site that felt like walking into the studio. Soft forms, a gentle palette, and a class schedule that makes booking a first visit effortless on any phone.",
      challenge: "Most visitors arrived on mobile and dropped off inside a clunky third-party schedule.",
      approach:
        "A native-feeling schedule, a clear intro offer, and booking integrated directly into the design system.",
      features: ["Class schedule", "Booking integration", "Intro offer funnel", "Memberships", "Newsletter"],
      highlights: [
        { value: "Mobile", label: "First design approach" },
        { value: "2 taps", label: "To reserve a class" },
        { value: "Built-in", label: "Intro offer funnel" },
      ],
    },
    "mason-and-co": {
      industry: "Professional Services",
      summary: "A confident, trustworthy presence for a multi-generational advisory firm.",
      description:
        "After 35 years of referrals, Mason & Co. needed a site that matched their reputation. We created a measured, editorial design with clear practice areas and a frictionless consultation booking.",
      challenge: "An outdated site that undersold decades of expertise and generated almost no leads.",
      approach:
        "Lead with credibility — proof points, real people, plain-spoken practice pages — and make booking a consultation one click from anywhere.",
      features: ["Consultation booking", "Practice area pages", "Team profiles", "Insights blog", "Analytics"],
      highlights: [
        { value: "7", label: "Pages" },
        { value: "1 click", label: "To book a consultation" },
        { value: "Editorial", label: "Insights blog" },
      ],
    },
  },

  caseStudy: {
    eyebrow: "{industry} · Sample project",
    industry: "Industry",
    package: "Package",
    typefaces: "Typefaces",
    scope: "Scope",
    palette: "Palette",
    brief: "The brief",
    approach: "Our approach",
    next: "Next project",
    ctaTitle: "Want a site like {name}?",
    ctaBody: "This project fits our {package} package. Configure yours in minutes and we’ll take it from there.",
    previewLabel: "Preview of the {name} sample website",
    phonePreviewLabel: "The {name} sample website on a phone",
  },

  demo: {
    notice: "Sample site by Maison Web Studio",
    caseStudy: "Case study",
    startYours: "Start yours",
    toolbar: "Sample site controls",
  },

  services: {
    page: {
      eyebrow: "Services",
      title: "Design and technology, in balance.",
      lede:
        "From a focused three-page site to a full online store, every project gets the same care: thoughtful strategy, refined design and a fast, reliable build.",
    },
    list: [
      {
        title: "Website Design",
        description: "Custom, mobile-first websites designed around your brand and built to turn visitors into customers.",
        points: ["Custom design system", "Responsive build", "Copy & content guidance"],
      },
      {
        title: "E-Commerce",
        description:
          "Beautiful storefronts with considered product pages, simple checkout and the integrations you need to sell.",
        points: ["Product catalog", "Secure checkout", "Inventory & shipping setup"],
      },
      {
        title: "Website Redesign",
        description:
          "A modern rebuild of the site you’ve outgrown — keeping what works, fixing what doesn’t, and preserving your SEO.",
        points: ["Content audit", "SEO-safe migration", "Performance upgrade"],
      },
      {
        title: "Landing Pages",
        description: "Focused, fast pages for launches, campaigns and offers — designed around a single, clear action.",
        points: ["Campaign-ready", "A/B friendly", "Analytics wired in"],
      },
      {
        title: "Website Strategy",
        description:
          "Positioning, structure and messaging, so every page has a job and every visitor knows what to do next.",
        points: ["Sitemap & user journeys", "Messaging framework", "Conversion review"],
      },
    ],
    addOns: {
      eyebrow: "Add-ons",
      title: "Tailor any package.",
      lede: "Add exactly what you need when you configure your site.",
      perPage: "/ page",
    },
  },

  process: {
    page: {
      eyebrow: "Process",
      title: "Calm, clear and on schedule.",
      lede:
        "No endless meetings or vague timelines. A simple process with defined steps, shared progress and a launch date you can plan around.",
    },
    steps: [
      {
        title: "Configure & order",
        duration: "10 minutes",
        description:
          "Choose a package, add what you need and tell us about your business. Upload your logo, photos and anything that inspires you.",
      },
      {
        title: "Kickoff call",
        duration: "Day 1–2",
        description:
          "A focused 30-minute call to align on goals, audience and style. We’ll share a simple project board with your timeline.",
      },
      {
        title: "Design",
        duration: "Week 1–2",
        description:
          "We design your homepage first, refine it together, then extend the system across every page — on desktop and mobile.",
      },
      {
        title: "Build & refine",
        duration: "Week 2–3",
        description:
          "Your site is built, optimized and tested across devices. Revision rounds are included in every package.",
      },
      {
        title: "Launch",
        duration: "Launch day",
        description:
          "We connect your domain, set up SSL, analytics and SEO essentials, and walk you through updating your site.",
      },
    ],
    extras: [
      { t: "Shared project board", d: "See every task, file and approval in one place — no digging through email threads." },
      { t: "Weekly updates", d: "A short written update every week, so you always know what’s next." },
      { t: "After launch", d: "A walkthrough of your site, plus optional care plans for updates and peace of mind." },
    ],
  },

  about: {
    eyebrow: "About",
    title: "A creative studio that thinks like a technology company.",
    intro:
      "Maison Web Studio was founded on a simple idea: great design shouldn’t require an agency retainer, and buying a website shouldn’t feel like a gamble.",
    p1:
      "We pair the craft of an editorial design studio with the clarity of a modern product. Fixed packages, transparent pricing and a defined process mean you know what you’re getting, when you’re getting it, and what it costs — before you begin.",
    p2:
      "We work with founders, restaurants, studios, practices and brands who care how they’re seen. Our job is to make your business look as good online as it is in real life, and to make it easy for the right customers to say yes.",
    valuesEyebrow: "What we value",
    valuesTitle: "Quietly exceptional.",
    values: [
      { t: "Restraint", d: "We remove until only what matters is left. Good design is calm, clear and confident." },
      { t: "Craft", d: "Typography, spacing and motion are tuned by hand. Details are what make a site feel premium." },
      { t: "Clarity", d: "Plain language, fixed prices and honest timelines. You’ll always know where things stand." },
      { t: "Partnership", d: "Your business, your goals. We design for your customers, not for awards." },
    ],
    showcaseLabel: "The Form Studio sample website in a browser window",
  },

  pricing: {
    eyebrow: "Pricing",
    title: "Premium design, honest pricing.",
    lede: "Three packages, one-time pricing. Every project is paid in full at checkout, and all payments are final.",
    timeline: "Typical timeline: {timeline}",
    choose: "Choose {name}",
    chooseShort: "Choose",
    compareEyebrow: "Compare",
    compareTitle: "Compare packages.",
    compareCaption: "Features included in each website package",
    feature: "Feature",
    included: "Included",
    notIncluded: "Not included",
    faqEyebrow: "FAQ",
    faqTitle: "Questions, answered.",
    paymentNote: "Paid in full at checkout. All payments are final — see our {link}.",
    paymentLink: "Payment & Refund Policy",
  },

  packages: {
    starter: {
      name: "Starter Website",
      short: "Starter",
      tagline: "A polished, professional presence for new and growing businesses.",
      timeline: "7–10 days",
      rushTimeline: "4–6 days",
      features: [
        "Up to 3 pages",
        "Custom design",
        "Mobile responsiveness",
        "Contact form",
        "Social links",
        "Basic SEO",
        "SSL / security setup",
        "One revision round",
        "Launch assistance",
      ],
    },
    business: {
      name: "Business Website",
      short: "Business",
      tagline: "Everything an established business needs to attract and convert.",
      timeline: "2–3 weeks",
      rushTimeline: "8–12 days",
      features: [
        "Up to 7 pages",
        "Custom design",
        "Mobile responsiveness",
        "Contact forms",
        "Gallery",
        "Google Maps",
        "Social integrations",
        "SEO",
        "Analytics",
        "Booking integration",
        "Two revision rounds",
        "Launch assistance",
      ],
    },
    premium: {
      name: "Premium Website",
      short: "Premium",
      tagline: "A fully considered, editorial-grade site for brands that lead.",
      timeline: "3–4 weeks",
      rushTimeline: "12–16 days",
      features: [
        "Up to 12 pages",
        "Premium design",
        "Advanced sections",
        "Animations",
        "Forms",
        "Galleries",
        "Booking",
        "Newsletter integration",
        "SEO",
        "Analytics",
        "Blog setup",
        "Three revision rounds",
        "Priority support",
      ],
    },
  },

  compare: {
    labels: {
      pages: "Pages included",
      design: "Design",
      revisions: "Revision rounds",
      timeline: "Typical timeline",
      mobile: "Mobile responsiveness",
      forms: "Contact forms",
      ssl: "SSL / security setup",
      seo: "SEO",
      gallery: "Gallery",
      maps: "Google Maps",
      analytics: "Analytics",
      booking: "Booking integration",
      advanced: "Advanced sections & animation",
      newsletter: "Newsletter integration",
      blog: "Blog setup",
      priority: "Priority support",
      launch: "Launch assistance",
    },
    values: {
      upTo3: "Up to 3",
      upTo7: "Up to 7",
      upTo12: "Up to 12",
      custom: "Custom",
      premium: "Premium",
      basic: "Basic",
      standard: "Standard",
      one: "1",
      two: "2",
      three: "3",
    },
  },

  addOns: {
    "extra-pages": { name: "Additional pages", description: "Extend your site beyond the pages included in your package." },
    copywriting: { name: "Professional copywriting", description: "Clear, persuasive copy for every page, written in your brand voice." },
    logo: { name: "Logo & brand refresh", description: "A refined wordmark, color palette and type pairing for your business." },
    ecommerce: { name: "Online store", description: "Product catalog, cart and checkout for up to 25 products." },
    booking: { name: "Booking integration", description: "Online appointments connected to your calendar." },
    newsletter: { name: "Newsletter integration", description: "Signup forms connected to Mailchimp, Klaviyo or ConvertKit." },
    blog: { name: "Blog setup", description: "A designed, easy-to-update blog with categories." },
    "seo-plus": { name: "Advanced SEO", description: "Keyword research, structured data and on-page optimization." },
    "google-business": { name: "Google Business Profile", description: "Setup and optimization so customers find you on Maps." },
    "care-plan": { name: "3-month care plan", description: "Updates, backups, monitoring and small edits after launch." },
    rush: { name: "Rush delivery", description: "Move to the front of the queue — launch in roughly half the time." },
  },
  extraPagesItem: plural({ one: "Additional pages ({count} page)", other: "Additional pages ({count} pages)" }),

  styles: {
    minimal: { name: "Minimal", description: "Quiet, spacious and precise." },
    editorial: { name: "Editorial", description: "Magazine-like type and imagery." },
    warm: { name: "Warm & organic", description: "Soft tones, inviting and human." },
    bold: { name: "Bold & modern", description: "Confident type, strong contrast." },
  },

  industries: {
    beauty: "Beauty & skincare",
    hospitality: "Restaurant & hospitality",
    wellness: "Wellness & fitness",
    professional: "Professional services",
    interiors: "Interior & architecture",
    retail: "Retail & e-commerce",
    health: "Health & medical",
    realEstate: "Real estate",
    creative: "Creative & media",
    other: "Other",
  },

  pageNames: {
    home: "Home",
    about: "About",
    services: "Services",
    contact: "Contact",
    gallery: "Gallery",
    journal: "Journal",
    menu: "Menu",
    shop: "Shop",
    booking: "Booking",
    team: "Team",
    pricing: "Pricing",
    faq: "FAQ",
    testimonials: "Testimonials",
    careers: "Careers",
    locations: "Locations",
    events: "Events",
  },

  faq: [
    {
      q: "How long does a website take?",
      a: "Starter sites typically launch in 7–10 days, Business sites in 2–3 weeks, and Premium sites in 3–4 weeks. Rush delivery is available as an add-on. Timelines begin once we receive your content.",
    },
    {
      q: "What do I need to provide?",
      a: "Your logo, any photos you’d like to use, and the text for your pages. You upload them while placing your order, and you can’t check out without them. Don’t have copy? Add professional copywriting and we’ll write it for you.",
    },
    {
      q: "How does payment work?",
      a: "Every project is paid in full at checkout through Stripe. All payments are final and non-refundable, so please review your package and add-ons before you pay.",
    },
    {
      q: "Do I own my website?",
      a: "Yes. Once your project is paid in full, the site, design and content are yours. We’ll set everything up in accounts you own.",
    },
    {
      q: "What about hosting and my domain?",
      a: "We’ll help you connect a domain you own (or purchase one) and set up reliable hosting. Hosting is billed by the provider directly — typically $0–$25 per month depending on your site.",
    },
    {
      q: "What if I need more pages later?",
      a: "Additional pages can be added at any time for $75 each, or you can upgrade your package before your project begins.",
    },
    {
      q: "What happens if I’m not happy with the design?",
      a: "Every package includes revision rounds, and we share designs early so feedback shapes the work. You’ll see your homepage design before we build anything else.",
    },
  ],

  cta: {
    eyebrow: "Start your project",
    title: "Ready for a website that works as hard as you do?",
    description:
      "Configure your website in about ten minutes. Clear pricing, a real team, and a launch date you can plan around.",
  },

  configurator: {
    steps: {
      package: "Package",
      configure: "Configure",
      addons: "Add-ons",
      details: "Your project",
      brief: "Your brief",
      assets: "Assets",
      review: "Review & pay",
    },
    progressLabel: "Order progress",
    stepOf: "Step {n} of {total}",
    stepStatus: "Step {n} of {total}: {label}",
    back: "Back",
    continue: "Continue",
    uploading: "Uploading…",
    pay: "Pay {amount} securely",
    paySecurely: "Pay securely",
    redirecting: "Redirecting to Stripe…",
    redirectingShort: "Redirecting…",
    total: "Total",
    questions: "Questions before you order? Email {email}.",
    cancelledNotice:
      "Payment was cancelled — nothing was charged. Your details are saved in this browser tab, so you can pick up right here.",
    previewNotice:
      "This is a preview link, so payments are turned off. On the live site this button opens secure Stripe Checkout.",
    clearSaved: "Clear my saved details",
    clearedSaved: "Your saved details were cleared.",
    errorSummary: plural({ one: "Please fix {count} problem before continuing.", other: "Please fix {count} problems before continuing." }),
    errors: {
      generic: "Something went wrong on our side. Please try again.",
      network: "We couldn’t reach the server. Check your connection and try again.",
      timeout: "This is taking longer than expected. Check your connection and try again.",
      rateLimited: "Too many attempts. Please wait a minute and try again.",
      unavailable: "Online payments are not available right now. Please email us to complete your order.",
      validation: "Some details need attention.",
      checkoutFailed: "We couldn’t start checkout. Please try again in a moment.",
    },
    summary: {
      eyebrow: "Your website",
      choosePackage: "Choose a package to see your summary.",
      timeline: "Estimated timeline: {timeline}",
      totalPaid: "Total, paid in full",
      pages: "Pages ({count})",
      label: "Order summary",
    },
    package: {
      title: "Choose your starting point.",
      description:
        "Every package includes custom design, mobile responsiveness and launch assistance. You can add more in the next steps.",
      legend: "Packages",
      more: plural({ one: "+{count} more", other: "+{count} more" }),
      notSure: "Not sure?",
      compareLink: "Compare packages side by side",
    },
    configure: {
      title: "Shape your website.",
      description:
        "Choose a design direction and the pages you need. We’ll refine everything together on your kickoff call.",
      styleLegend: "Design direction",
      pagesLegend: "Pages",
      pagesCount: "{count} of {limit} included",
      extraPages: "{count} extra × {price}",
      remove: "Remove the {page} page",
      newPageLabel: "New page name",
      newPagePlaceholder: "Add a page, e.g. “Menu”",
      add: "Add",
      suggestions: "Suggested pages",
      addSuggestion: "Add {page}",
      colorLabel: "Colors or brand notes",
      colorPlaceholder: "e.g. Warm neutrals, our logo is deep green",
    },
    addons: {
      title: "Add what you need.",
      description: "Optional extras for your {package}. Items already included in your package aren’t shown.",
      legend: "Optional add-ons",
      extraTitle: plural({ one: "Additional pages × {count}", other: "Additional pages × {count}" }),
      extraNote: "Added automatically from your page list ({price} each).",
      skip: "You can skip this step — add-ons can also be added later.",
    },
    details: {
      title: "Tell us about your business.",
      description: "The more we know, the better your first design will be. This takes about three minutes.",
      fullName: "Full name",
      email: "Email",
      emailHint: "We’ll send your confirmation here.",
      phone: "Phone",
      businessName: "Business name",
      industry: "Industry",
      industryPlaceholder: "Select an industry",
      currentWebsite: "Current website",
      websitePlaceholder: "yourbusiness.com",
      goals: "What should your new website achieve?",
      goalsPlaceholder:
        "e.g. Get more online bookings, look more established than competitors, sell our products online…",
      goalsHint: "At least 20 characters.",
      audience: "Who are your ideal customers?",
      inspiration: "Websites you admire",
      inspirationPlaceholder: "Links and what you like about them",
      hasDomain: "Do you own a domain?",
      domain: { yes: "Yes", no: "No", unsure: "Not sure" },
      launchDate: "Ideal launch date",
      honeypot: "Leave this field empty",
    },
    assets: {
      title: "Share your brand assets.",
      description:
        "Upload your logo, photos, text, menus or brochures. This step is required: you need to upload at least one file to continue.",
      dropHere: "Drag files here, or",
      browse: "Browse files",
      rules: "Images, PDFs, documents, design files or ZIPs · up to 15 MB each · max {max} files",
      inputLabel: "Upload files",
      listLabel: "Uploaded files",
      contentTitle: "Your content",
      contentHelp: "Your logo, photos, text and documents. At least one file is required.",
      inspirationTitle: "Inspiration",
      inspirationHelp: "Upload screenshots, websites, mood boards, color palettes, layouts, branding examples, or other images that represent how you would like your website to look.",
      inspirationRules: "JPG, PNG, WebP, GIF or PDF · up to 15 MB each · maximum {max} files",
      inspirationInputLabel: "Upload inspiration",
      inspirationListLabel: "Inspiration files",
      browseInspiration: "Add inspiration",
      uploaded: "{size} · Uploaded",
      uploadingFile: "Uploading {name}",
      remove: "Remove {name}",
      dismiss: "Dismiss {name}",
      notesLabel: "Notes about your assets",
      notesPlaceholder: "e.g. More photos are in a Google Drive folder — link here",
      errors: {
        limit: "Limit of {max} files reached.",
        tooLarge: "Larger than 15 MB.",
        type: "This file type isn’t supported.",
        failed: "Upload failed. Please try again.",
        network: "Network error — please try again.",
        rateLimited: "Too many uploads. Please wait a minute and try again.",
      },
    },
    review: {
      title: "Review your order.",
      description: "Check everything looks right. You’ll be taken to Stripe to complete payment securely.",
      sections: { website: "Website", project: "Your project", assets: "Assets" },
      edit: "Edit",
      editSection: "Edit {section}",
      rows: {
        package: "Package",
        style: "Design direction",
        pages: "Pages",
        timeline: "Estimated timeline",
        brandNotes: "Brand notes",
        contact: "Contact",
        business: "Business",
        goals: "Goals",
        currentWebsite: "Current website",
        files: "Files",
      },
      filesUploaded: plural({ one: "{count} file uploaded", other: "{count} files uploaded" }),
      agreementTitle: "Payment agreement",
      englishBinding:
        "The payment agreement and terms below are shown in English, which is the binding version.",
      readAgreement: "Read the full payment agreement",
      privacyNote: "We use your details only to plan and deliver your project.",
      privacyLink: "Privacy Policy",
      secure: "Payments are processed securely by Stripe. You’ll pay {amount} in full.",
    },
  },

  brief: {
    "title": "Tell us about your website.",
    "description": "This becomes the brief we build your website from. Fill in what you can — more detail means a closer first version.",
    "businessLegend": "Your business",
    "businessDescription": "Describe your business",
    "businessDescriptionHint": "What you offer and what makes you different. At least 20 characters.",
    "location": "City and state",
    "locationPlaceholder": "e.g. Austin, TX",
    "social": "Social media links",
    "socialPlaceholder": "Instagram, Facebook, TikTok…",
    "goalsLegend": "Goals",
    "primaryCta": "The main thing visitors should do",
    "ctaPlaceholder": "Choose one",
    "cta": {
      "book": "Book an appointment",
      "quote": "Request a quote",
      "order": "Order online",
      "shop": "Shop products",
      "consult": "Schedule a consultation",
      "contact": "Contact you",
      "call": "Call you",
      "visit": "Visit in person"
    },
    "desiredActions": "Anything else visitors should be able to do",
    "designLegend": "Design",
    "personality": "Brand personality",
    "personalityPlaceholder": "e.g. warm, calm, luxurious, playful",
    "colorsAvoid": "Colors to avoid",
    "fonts": "Preferred fonts",
    "dislikes": "Designs or websites you don't like",
    "designNotes": "Anything else about the design",
    "featuresLegend": "Features you need",
    "features": {
      "contactForm": "Contact form",
      "booking": "Online booking",
      "payments": "Online payments",
      "deposits": "Deposits",
      "ecommerce": "Online store",
      "catalog": "Product catalog",
      "menu": "Restaurant menu",
      "ordering": "Online ordering",
      "newsletter": "Newsletter sign-up",
      "maps": "Map and directions",
      "social": "Social media links",
      "accounts": "Customer accounts"
    },
    "featuresOther": "Other features",
    "toolLinks": "Links to tools you already use",
    "toolLinksHint": "For example your booking page, online store or ordering link — we'll connect your website to them.",
    "contentLegend": "Your content",
    "contentHint": "Paste what you have, or upload documents in the next step. Leave anything blank and we'll draft it for you to approve.",
    "aboutText": "About your business",
    "servicesText": "Services",
    "productsText": "Products",
    "pricingText": "Prices",
    "testimonialsText": "Customer reviews",
    "testimonialsHint": "Only real reviews from your customers — we never invent testimonials.",
    "faqText": "Frequently asked questions",
    "contactInfo": "Contact details to show",
    "contactInfoPlaceholder": "Address, opening hours, phone…",
    "languagesLegend": "Website languages",
    "languagesHint": "Translations are machine-assisted; have a native speaker check them before launch."
  },

  validation: {
    packageRequired: "Choose a package to continue.",
    styleRequired: "Pick a design direction.",
    pagesRequired: "Add at least one page.",
    pageName: "Page names can’t be empty.",
    nameRequired: "Please enter your full name.",
    emailInvalid: "Enter a valid email address, like name@example.com.",
    phoneInvalid: "Enter a valid phone number, or leave it empty.",
    businessRequired: "Tell us your business name.",
    industryRequired: "Select your industry.",
    urlInvalid: "Enter a valid web address, like yourbusiness.com.",
    goalsTooShort: "A sentence or two helps us plan — please write at least 20 characters.",
    tooLong: "This is too long. Please shorten it.",
    filesRequired: "Upload your content to continue, such as your logo, photos or text.",
    locationRequired: "Enter your city and state.",
    descriptionTooShort: "Describe your business in at least 20 characters.",
    ctaRequired: "Choose the main action you want visitors to take.",
    agreementRequired: "Please confirm you understand that all payments are final.",
    termsRequired: "Please accept the Terms & Conditions to continue.",
    invalid: "Please check this field.",
  },

  success: {
    eyebrow: "Order {ref}",
    title: "Thank you, {name}. Your website is officially underway.",
    emailSent: "A confirmation will be sent to {email}. Here’s what happens next.",
    next: [
      { t: "Kickoff email", d: "Within one business day we’ll email you to schedule a 30-minute kickoff call." },
      { t: "Project board", d: "You’ll get a shared board with your timeline and anything else we need from you." },
      { t: "First design", d: "Your homepage design arrives in your inbox — usually within a week." },
    ],
    summary: "Order summary",
    paid: "Paid in full",
    finalNote: "All payments are final and non-refundable.",
    pages: "Pages",
    assets: "Assets received",
    files: plural({ one: "{count} file", other: "{count} files" }),
    explore: "Explore our work",
    confirming: "Confirming your payment…",
    notFoundTitle: "We couldn’t find that order.",
    notFoundBody:
      "If you’ve just paid, check your email for a receipt or get in touch and we’ll sort it out right away.",
    processingTitle: "Your payment is processing.",
    processingBody:
      "Some payment methods take a little longer to confirm. We’ll email your confirmation as soon as it clears. No need to place the order again.",
    failedTitle: "Your payment didn’t go through.",
    failedBody: "Nothing was charged. Your details are saved in this browser tab, so you can try again.",
    expiredTitle: "This checkout session has expired.",
    expiredBody: "Nothing was charged. Return to the review step to start a new checkout.",
    returnToCheckout: "Return to checkout",
    contact: "Contact us",
    unavailableTitle: "We couldn’t check your payment right now.",
    unavailableBody:
      "If you completed payment, it’s safe — you’ll receive a receipt from Stripe. Please refresh in a moment or contact us.",
  },

  notFound: {
    eyebrow: "404",
    title: "This page took a different path.",
    body: "The page you’re looking for doesn’t exist or has moved.",
    popular: "Popular pages",
  },

  error: {
    title: "Something went wrong.",
    body: "An unexpected error occurred on this page. Please try again — if it keeps happening, email us.",
    retry: "Try again",
  },

  legal: {
    draftNotice:
      "Draft for review — this document has not yet been approved by the business owner or legal counsel and may change.",
    englishOnly:
      "This document is available in English only. A professionally reviewed translation is not yet available.",
    lastUpdated: "Last updated: {date}",
  },
};

export type Messages = typeof en;
export default en;
