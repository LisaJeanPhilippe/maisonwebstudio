import { plural } from "../format";
import type { Messages } from "./en";

// Portuguese (Brazil) — machine-assisted draft. Requires native-speaker review (docs/TRANSLATION_REVIEW.md).
const pt: Messages = {
  meta: {
    siteName: "Maison Web Studio",
    home: {
      title: "Maison Web Studio — Sites sob medida para empresas em crescimento",
      description:
        "Sites modernos e focados em conversão para pequenas empresas. Preços fixos a partir de US$ 499, um processo claro e lançamento em apenas 7 a 10 dias.",
    },
    work: {
      title: "Trabalhos selecionados — Sites de exemplo",
      description:
        "Conheça sites de exemplo criados pela Maison Web Studio para negócios de beleza, restaurantes, bem-estar, design de interiores e serviços profissionais.",
    },
    services: {
      title: "Serviços — Criação de sites, e-commerce e redesenho",
      description:
        "Criação de sites, lojas virtuais, redesenhos, landing pages e estratégia digital, além de extras como redação, SEO e entrega expressa.",
    },
    pricing: {
      title: "Preços — Pacotes de site a partir de US$ 499",
      description:
        "Compare os pacotes Starter (US$ 499), Business (US$ 899) e Premium (US$ 1.499). Preço único, pago integralmente na finalização da compra.",
    },
    process: {
      title: "Processo — Do pedido ao lançamento em cinco etapas",
      description:
        "Como a Maison Web Studio leva seu site do pedido ao lançamento: configuração, reunião inicial, design, desenvolvimento e ajustes, e lançamento.",
    },
    about: {
      title: "Sobre o estúdio",
      description:
        "A Maison Web Studio une o cuidado de um estúdio de design editorial à clareza de um produto moderno: pacotes fixos, preços transparentes e um processo definido.",
    },
    start: {
      title: "Comece seu site — Configure e faça seu pedido",
      description:
        "Escolha um pacote, adicione extras, compartilhe os detalhes do projeto e os materiais da sua marca e pague com segurança pelo Stripe.",
    },
    project: { title: "{name} — Site de exemplo de {industry}" },
    demo: { title: "{name} — Demonstração ao vivo" },
    success: { title: "Confirmação do pedido" },
    notFound: { title: "Página não encontrada" },
    privacy: { title: "Política de Privacidade", description: "Como a Maison Web Studio coleta, usa e protege suas informações pessoais." },
    terms: { title: "Termos e Condições", description: "Os termos que se aplicam ao uso deste site e à compra de um projeto de site da Maison Web Studio." },
    cookies: { title: "Política de Cookies", description: "Os cookies e o armazenamento do navegador que este site usa, e por quê." },
    payment: { title: "Política de Pagamento e Reembolso", description: "Pagamento integral na finalização da compra e nossa política de pagamentos definitivos." },
    accessibility: { title: "Declaração de Acessibilidade", description: "Nosso compromisso com um site acessível, limitações conhecidas e como relatar uma barreira." },
  },

  common: {
    skipToContent: "Pular para o conteúdo principal",
    startYourWebsite: "Comece seu site",
    startHint: "Cerca de 10 minutos · Você só paga na última etapa",
    viewOurWork: "Ver nossos trabalhos",
    viewProject: "Ver projeto",
    openLiveDemo: "Abrir demonstração",
    allWork: "Todos os trabalhos",
    backToHome: "Voltar ao início",
    comparePackages: "Comparar pacotes",
    oneTime: "pagamento único",
    mostChosen: "O mais escolhido",
    optional: "(opcional)",
    sampleProject: "Projeto de exemplo",
    opensInNewTab: "(abre em uma nova aba)",
    loading: "Carregando…",
  },

  nav: {
    label: "Principal",
    work: "Trabalhos",
    services: "Serviços",
    pricing: "Preços",
    process: "Processo",
    about: "Sobre",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
    home: "Maison Web Studio — início",
  },

  language: { label: "Idioma", button: "Idioma: {name}", listLabel: "Escolha um idioma" },

  footer: {
    tagline: "Sites bonitos para empresas prontas para crescer.",
    startLink: "Comece seu site",
    studio: "Estúdio",
    start: "Começar",
    contact: "Contato",
    legal: "Jurídico",
    nav: "Rodapé",
    links: {
      work: "Trabalhos selecionados",
      services: "Serviços",
      process: "Processo",
      about: "Sobre",
      pricing: "Preços",
      compare: "Comparar pacotes",
      configure: "Configure seu site",
      faq: "Perguntas frequentes",
      privacy: "Política de Privacidade",
      terms: "Termos e Condições",
      cookies: "Política de Cookies",
      payment: "Pagamento e reembolso",
      accessibility: "Acessibilidade",
    },
    hours: "Seg–sex, 9h–18h (horário do leste dos EUA)",
    location: "Remoto · Mundo todo",
    rights: "© {year} Maison Web Studio. Todos os direitos reservados.",
    slogan: "Sites profissionais sem a dor de cabeça de uma agência.",
  },

  hero: {
    eyebrow: "Maison Web Studio — Aceitando novos projetos",
    headline: "Sites criados para levar sua empresa adiante.",
    lede:
      "A Maison Web Studio cria sites modernos e focados em conversão para empresas que querem parecer tão profissionais na internet quanto são na vida real.",
    showcaseLabel: "Sites de exemplo criados pela Maison Web Studio, exibidos em um notebook e em um celular",
    trust: [
      { k: "A partir de US$ 499", v: "Preços claros e fixos, sem surpresas" },
      { k: "7 a 10 dias", v: "Prazo típico de um site Starter" },
      { k: "É seu", v: "Seu domínio, seu conteúdo, seu site" },
    ],
  },

  home: {
    industriesLabel: "Setores com que trabalhamos",
    industries: [
      "Marcas de skincare",
      "Restaurantes",
      "Designers de interiores",
      "Estúdios de bem-estar",
      "Escritórios de advocacia e contabilidade",
      "Boutiques",
      "Salões e spas",
      "Consultores",
      "Imobiliárias",
      "Cafés",
    ],
    pauseAnimation: "Pausar animação",
    playAnimation: "Retomar animação",
    work: {
      eyebrow: "Trabalhos selecionados",
      title: "Sites com personalidade.",
      description:
        "Uma seleção de sites de exemplo para beleza, hospitalidade, bem-estar e serviços profissionais — cada um criado do zero.",
    },
    services: { eyebrow: "Serviços", title: "Tudo de que seu site precisa. Nada além.", cta: "Nossos serviços" },
    why: {
      eyebrow: "Por que a Maison",
      title: "Sites profissionais sem a dor de cabeça de uma agência.",
      lede: "O cuidado de um estúdio de design com a clareza de um produto que você compra online.",
      items: [
        { t: "Preços fixos e transparentes", d: "Saiba exatamente quanto vai pagar antes de começar. Sem cobrança por hora, sem faturas surpresa." },
        { t: "Projetado, não um modelo", d: "Cada site é criado para o seu negócio — tipografia, layout e detalhes incluídos." },
        { t: "Feito para converter", d: "Chamadas para ação claras, páginas rápidas e base de SEO para que clientes encontrem e escolham você." },
        { t: "Uma equipe responsável", d: "Estratégia, design e desenvolvimento sob o mesmo teto, com um único ponto de contato." },
      ],
    },
    pricing: {
      eyebrow: "Preços",
      title: "Pacotes simples. Resultados claros.",
      description: "Preço único com tudo o que você precisa para lançar, pago integralmente na finalização da compra.",
      custom: "Precisa de algo a mais? Adicione redação, uma loja virtual ou entrega expressa ao configurar seu site.",
    },
    process: { eyebrow: "Processo", title: "Do primeiro clique ao lançamento, em cinco etapas claras.", cta: "Como funciona" },
    faq: { eyebrow: "Dúvidas", title: "Bom saber." },
  },

  work: {
    eyebrow: "Trabalhos selecionados",
    title: "Todo negócio merece um visual próprio.",
    lede:
      "Conheça os sites de exemplo que criamos para vários setores. Abra qualquer projeto para ver o estudo de caso completo e uma versão interativa do site.",
    filterLabel: "Filtrar projetos por categoria",
    showing: plural({ one: "Mostrando {count} projeto", other: "Mostrando {count} projetos" }),
    ctaTitle: "Gostou? Vamos criar o seu.",
    categories: {
      All: "Todos",
      Beauty: "Beleza",
      Restaurant: "Restaurantes",
      "Professional Services": "Serviços profissionais",
      "E-Commerce": "E-commerce",
      "Local Business": "Negócio local",
    },
  },

  projects: {
    "aurelia-skin": {
      industry: "Beleza / E-commerce",
      summary: "Uma loja suave e editorial para uma linha de skincare clínica e delicada.",
      description:
        "A Aurelia precisava de uma loja tão cuidadosa quanto suas fórmulas. Criamos uma experiência de compra editorial, com apresentação tátil dos produtos, um quiz de pele guiado e um checkout pensado para compras recorrentes.",
      challenge: "O tema anterior parecia o de qualquer outra marca de skincare e escondia os mais vendidos a três cliques de distância.",
      approach:
        "Começamos com um único ritual, demos espaço a cada produto e construímos a vitrine em torno dos ingredientes, e não de descontos.",
      features: ["Loja Shopify", "Quiz de pele", "Assinaturas", "Avaliações", "Captura de e-mails"],
      highlights: [
        { value: "3 passos", label: "Quiz de pele guiado" },
        { value: "1 toque", label: "Do produto à sacola" },
        { value: "< 1,5 s", label: "Meta de tempo de carregamento" },
      ],
    },
    "maison-noir": {
      industry: "Restaurante",
      summary: "Um site noturno à luz de velas, com as reservas em destaque.",
      description:
        "Um restaurante francês intimista merecia um site que criasse o clima antes mesmo da chegada dos clientes. Criamos uma experiência escura e cinematográfica, com reservas sempre visíveis e um cardápio atualizado em minutos.",
      challenge: "As reservas eram feitas por telefone e o cardápio era um PDF sempre desatualizado.",
      approach:
        "Um widget de reservas no topo, um cardápio sazonal editável e pedidos de eventos privados enviados direto para a equipe de eventos.",
      features: ["Reservas", "Cardápio editável", "Pedidos de eventos privados", "Vale-presentes", "Google Maps"],
      highlights: [
        { value: "Topo", label: "Posição do widget de reservas" },
        { value: "Minutos", label: "Para atualizar o cardápio sazonal" },
        { value: "Escura", label: "Paleta cinematográfica e noturna" },
      ],
    },
    "form-studio": {
      industry: "Design de interiores",
      summary: "Um portfólio sereno e arquitetônico que deixa os espaços falarem.",
      description:
        "O trabalho da Form Studio é sobre proporção e contenção — e o site também. Um grid modular, um índice de projetos e estudos de caso guiados por imagens, que transformam cada encomenda em uma matéria de revista.",
      challenge: "Projetos lindos, mas uma galeria poluída que fazia todos os espaços parecerem iguais.",
      approach:
        "Criamos um sistema de grid flexível e uma lista indexada de projetos, dando a cada um seu próprio ritmo de imagens e texto.",
      features: ["Índice de projetos", "Modelos de estudo de caso", "Blog", "Formulário de contato", "CMS"],
      highlights: [
        { value: "12", label: "Modelos de página" },
        { value: "Modular", label: "Grid de imagens" },
        { value: "Indexado", label: "Arquivo de projetos" },
      ],
    },
    solace: {
      industry: "Bem-estar",
      summary: "Uma experiência de agendamento calma e acolhedora para um estúdio de yoga e respiração.",
      description:
        "A Solace queria um site que parecesse entrar no estúdio. Formas suaves, uma paleta delicada e uma agenda de aulas que torna fácil marcar a primeira visita em qualquer celular.",
      challenge: "A maioria dos visitantes chegava pelo celular e desistia dentro de uma agenda externa complicada.",
      approach:
        "Uma agenda com cara de aplicativo, uma oferta de boas-vindas clara e agendamento integrado diretamente ao sistema de design.",
      features: ["Agenda de aulas", "Integração de agendamento", "Funil de oferta de boas-vindas", "Planos", "Newsletter"],
      highlights: [
        { value: "Celular", label: "Abordagem de design prioritária" },
        { value: "2 toques", label: "Para reservar uma aula" },
        { value: "Integrado", label: "Funil de oferta de boas-vindas" },
      ],
    },
    "mason-and-co": {
      industry: "Serviços profissionais",
      summary: "Uma presença confiante e confiável para uma consultoria com várias gerações.",
      description:
        "Depois de 35 anos de indicações, a Mason & Co. precisava de um site à altura da sua reputação. Criamos um design editorial e equilibrado, com áreas de atuação claras e agendamento de consultas sem atrito.",
      challenge: "Um site antiquado que não refletia décadas de experiência e quase não gerava contatos.",
      approach:
        "Começar pela credibilidade — números, pessoas reais e páginas de atuação em linguagem simples — e deixar o agendamento a um clique de qualquer lugar.",
      features: ["Agendamento de consultas", "Páginas de áreas de atuação", "Perfis da equipe", "Blog de artigos", "Análises"],
      highlights: [
        { value: "7", label: "Páginas" },
        { value: "1 clique", label: "Para agendar uma consulta" },
        { value: "Editorial", label: "Blog de artigos" },
      ],
    },
  },

  caseStudy: {
    eyebrow: "{industry} · Projeto de exemplo",
    industry: "Setor",
    package: "Pacote",
    typefaces: "Tipografias",
    scope: "Escopo",
    palette: "Paleta",
    brief: "O briefing",
    approach: "Nossa abordagem",
    next: "Próximo projeto",
    ctaTitle: "Quer um site como o da {name}?",
    ctaBody: "Este projeto se encaixa no nosso pacote {package}. Configure o seu em minutos e nós cuidamos do resto.",
    previewLabel: "Prévia do site de exemplo {name}",
    phonePreviewLabel: "O site de exemplo {name} em um celular",
  },

  demo: {
    notice: "Site de exemplo da Maison Web Studio",
    caseStudy: "Estudo de caso",
    startYours: "Comece o seu",
    toolbar: "Controles do site de exemplo",
  },

  services: {
    page: {
      eyebrow: "Serviços",
      title: "Design e tecnologia, em equilíbrio.",
      lede:
        "De um site enxuto de três páginas a uma loja virtual completa, todo projeto recebe o mesmo cuidado: estratégia bem pensada, design refinado e um desenvolvimento rápido e confiável.",
    },
    list: [
      {
        title: "Criação de sites",
        description: "Sites sob medida, pensados primeiro para o celular, criados em torno da sua marca para transformar visitantes em clientes.",
        points: ["Sistema de design próprio", "Desenvolvimento responsivo", "Orientação de textos e conteúdo"],
      },
      {
        title: "E-commerce",
        description: "Lojas bonitas, com páginas de produto caprichadas, checkout simples e as integrações de que você precisa para vender.",
        points: ["Catálogo de produtos", "Checkout seguro", "Configuração de estoque e frete"],
      },
      {
        title: "Redesenho de site",
        description: "Uma reconstrução moderna do site que ficou pequeno — mantendo o que funciona, corrigindo o que não funciona e preservando seu SEO.",
        points: ["Auditoria de conteúdo", "Migração segura para SEO", "Melhoria de desempenho"],
      },
      {
        title: "Landing pages",
        description: "Páginas rápidas e focadas para lançamentos, campanhas e ofertas, criadas em torno de uma única ação clara.",
        points: ["Prontas para campanhas", "Preparadas para testes A/B", "Análises integradas"],
      },
      {
        title: "Estratégia digital",
        description: "Posicionamento, estrutura e mensagens, para que cada página tenha uma função e cada visitante saiba o próximo passo.",
        points: ["Mapa do site e jornadas", "Estrutura de mensagens", "Revisão de conversão"],
      },
    ],
    addOns: {
      eyebrow: "Extras",
      title: "Ajuste qualquer pacote.",
      lede: "Adicione exatamente o que você precisa ao configurar seu site.",
      perPage: "/ página",
    },
  },

  process: {
    page: {
      eyebrow: "Processo",
      title: "Tranquilo, claro e no prazo.",
      lede:
        "Sem reuniões intermináveis nem prazos vagos. Um processo simples, com etapas definidas, progresso compartilhado e uma data de lançamento com que você pode contar.",
    },
    steps: [
      {
        title: "Configure e peça",
        duration: "10 minutos",
        description:
          "Escolha um pacote, adicione o que precisar e conte sobre o seu negócio. Envie seu logotipo, fotos e tudo o que inspira você.",
      },
      {
        title: "Reunião inicial",
        duration: "Dia 1–2",
        description:
          "Uma conversa objetiva de 30 minutos para alinhar objetivos, público e estilo. Compartilhamos um quadro do projeto simples com o seu cronograma.",
      },
      {
        title: "Design",
        duration: "Semana 1–2",
        description:
          "Criamos primeiro sua página inicial, refinamos juntos e depois levamos o sistema para todas as páginas — no computador e no celular.",
      },
      {
        title: "Desenvolvimento e ajustes",
        duration: "Semana 2–3",
        description:
          "Seu site é desenvolvido, otimizado e testado em vários dispositivos. Rodadas de revisão estão incluídas em todos os pacotes.",
      },
      {
        title: "Lançamento",
        duration: "Dia do lançamento",
        description:
          "Conectamos seu domínio, configuramos SSL, análises e o essencial de SEO, e mostramos como atualizar seu site.",
      },
    ],
    extras: [
      { t: "Quadro do projeto compartilhado", d: "Veja cada tarefa, arquivo e aprovação em um só lugar — sem procurar em conversas de e-mail." },
      { t: "Atualizações semanais", d: "Um breve resumo por escrito toda semana, para você sempre saber o que vem a seguir." },
      { t: "Depois do lançamento", d: "Uma apresentação do seu site, além de planos de manutenção opcionais para atualizações e tranquilidade." },
    ],
  },

  about: {
    eyebrow: "Sobre",
    title: "Um estúdio criativo que pensa como uma empresa de tecnologia.",
    intro:
      "A Maison Web Studio nasceu de uma ideia simples: um ótimo design não deveria exigir a mensalidade de uma agência, e comprar um site não deveria ser uma aposta.",
    p1:
      "Unimos o cuidado de um estúdio de design editorial à clareza de um produto moderno. Pacotes fixos, preços transparentes e um processo definido: você sabe o que vai receber, quando e quanto custa — antes de começar.",
    p2:
      "Trabalhamos com fundadores, restaurantes, estúdios, escritórios e marcas que se importam com a própria imagem. Nosso trabalho é fazer sua empresa parecer tão boa na internet quanto é na vida real, e facilitar que os clientes certos digam sim.",
    valuesEyebrow: "O que valorizamos",
    valuesTitle: "Discretamente excepcional.",
    values: [
      { t: "Contenção", d: "Tiramos até sobrar só o que importa. Bom design é calmo, claro e confiante." },
      { t: "Cuidado", d: "Tipografia, espaçamento e movimento são ajustados à mão. São os detalhes que fazem um site parecer premium." },
      { t: "Clareza", d: "Linguagem simples, preços fixos e prazos honestos. Você sempre sabe em que pé estão as coisas." },
      { t: "Parceria", d: "Seu negócio, seus objetivos. Projetamos para os seus clientes, não para prêmios." },
    ],
    showcaseLabel: "O site de exemplo da Form Studio em uma janela do navegador",
  },

  pricing: {
    eyebrow: "Preços",
    title: "Design premium, preço honesto.",
    lede: "Três pacotes, preço único. Todo projeto é pago integralmente na finalização da compra, e todos os pagamentos são definitivos.",
    timeline: "Prazo típico: {timeline}",
    choose: "Escolher {name}",
    chooseShort: "Escolher",
    compareEyebrow: "Comparar",
    compareTitle: "Compare os pacotes.",
    compareCaption: "Recursos incluídos em cada pacote de site",
    feature: "Recurso",
    included: "Incluído",
    notIncluded: "Não incluído",
    faqEyebrow: "Perguntas frequentes",
    faqTitle: "Dúvidas respondidas.",
    paymentNote: "Pagamento integral na finalização da compra. Todos os pagamentos são definitivos — veja nossa {link}.",
    paymentLink: "Política de Pagamento e Reembolso",
  },

  packages: {
    starter: {
      name: "Site Starter",
      short: "Starter",
      tagline: "Uma presença profissional e bem-acabada para negócios novos e em crescimento.",
      timeline: "7 a 10 dias",
      rushTimeline: "4 a 6 dias",
      features: [
        "Até 3 páginas",
        "Design sob medida",
        "Adaptado para celular",
        "Formulário de contato",
        "Links para redes sociais",
        "SEO básico",
        "Configuração de SSL e segurança",
        "Uma rodada de revisão",
        "Apoio no lançamento",
      ],
    },
    business: {
      name: "Site Business",
      short: "Business",
      tagline: "Tudo de que uma empresa estabelecida precisa para atrair e converter.",
      timeline: "2 a 3 semanas",
      rushTimeline: "8 a 12 dias",
      features: [
        "Até 7 páginas",
        "Design sob medida",
        "Adaptado para celular",
        "Formulários de contato",
        "Galeria",
        "Google Maps",
        "Integração com redes sociais",
        "SEO",
        "Análises",
        "Integração de agendamento",
        "Duas rodadas de revisão",
        "Apoio no lançamento",
      ],
    },
    premium: {
      name: "Site Premium",
      short: "Premium",
      tagline: "Um site de nível editorial, pensado em cada detalhe, para marcas que lideram.",
      timeline: "3 a 4 semanas",
      rushTimeline: "12 a 16 dias",
      features: [
        "Até 12 páginas",
        "Design premium",
        "Seções avançadas",
        "Animações",
        "Formulários",
        "Galerias",
        "Agendamento",
        "Integração de newsletter",
        "SEO",
        "Análises",
        "Configuração de blog",
        "Três rodadas de revisão",
        "Suporte prioritário",
      ],
    },
  },

  compare: {
    labels: {
      pages: "Páginas incluídas",
      design: "Design",
      revisions: "Rodadas de revisão",
      timeline: "Prazo típico",
      mobile: "Adaptado para celular",
      forms: "Formulários de contato",
      ssl: "Configuração de SSL e segurança",
      seo: "SEO",
      gallery: "Galeria",
      maps: "Google Maps",
      analytics: "Análises",
      booking: "Integração de agendamento",
      advanced: "Seções avançadas e animação",
      newsletter: "Integração de newsletter",
      blog: "Configuração de blog",
      priority: "Suporte prioritário",
      launch: "Apoio no lançamento",
    },
    values: {
      upTo3: "Até 3",
      upTo7: "Até 7",
      upTo12: "Até 12",
      custom: "Sob medida",
      premium: "Premium",
      basic: "Básico",
      standard: "Padrão",
      one: "1",
      two: "2",
      three: "3",
    },
  },

  addOns: {
    "extra-pages": { name: "Páginas adicionais", description: "Amplie seu site além das páginas incluídas no seu pacote." },
    copywriting: { name: "Redação profissional", description: "Textos claros e persuasivos para cada página, com a voz da sua marca." },
    logo: { name: "Logotipo e renovação da marca", description: "Um logotipo refinado, paleta de cores e combinação tipográfica para o seu negócio." },
    ecommerce: { name: "Loja virtual", description: "Catálogo, carrinho e checkout para até 25 produtos." },
    booking: { name: "Integração de agendamento", description: "Agendamentos online conectados à sua agenda." },
    newsletter: { name: "Integração de newsletter", description: "Formulários de inscrição conectados ao Mailchimp, Klaviyo ou ConvertKit." },
    blog: { name: "Configuração de blog", description: "Um blog bem desenhado, fácil de atualizar e com categorias." },
    "seo-plus": { name: "SEO avançado", description: "Pesquisa de palavras-chave, dados estruturados e otimização das páginas." },
    "google-business": { name: "Perfil da Empresa no Google", description: "Configuração e otimização para que clientes encontrem você no Maps." },
    "care-plan": { name: "Plano de manutenção de 3 meses", description: "Atualizações, backups, monitoramento e pequenos ajustes após o lançamento." },
    rush: { name: "Entrega expressa", description: "Vá para o início da fila — lance em cerca de metade do tempo." },
  },
  extraPagesItem: plural({ one: "Páginas adicionais ({count} página)", other: "Páginas adicionais ({count} páginas)" }),

  styles: {
    minimal: { name: "Minimalista", description: "Sereno, espaçoso e preciso." },
    editorial: { name: "Editorial", description: "Tipografia e imagens de revista." },
    warm: { name: "Acolhedor e orgânico", description: "Tons suaves, convidativo e humano." },
    bold: { name: "Ousado e moderno", description: "Tipografia marcante, contraste forte." },
  },

  industries: {
    beauty: "Beleza e skincare",
    hospitality: "Restaurantes e hospitalidade",
    wellness: "Bem-estar e fitness",
    professional: "Serviços profissionais",
    interiors: "Interiores e arquitetura",
    retail: "Varejo e e-commerce",
    health: "Saúde",
    realEstate: "Imobiliário",
    creative: "Criação e mídia",
    other: "Outro",
  },

  pageNames: {
    home: "Início",
    about: "Sobre",
    services: "Serviços",
    contact: "Contato",
    gallery: "Galeria",
    journal: "Blog",
    menu: "Cardápio",
    shop: "Loja",
    booking: "Agendamento",
    team: "Equipe",
    pricing: "Preços",
    faq: "Perguntas frequentes",
    testimonials: "Depoimentos",
    careers: "Carreiras",
    locations: "Unidades",
    events: "Eventos",
  },

  faq: [
    {
      q: "Quanto tempo leva para fazer um site?",
      a: "Sites Starter costumam ser lançados em 7 a 10 dias, Business em 2 a 3 semanas e Premium em 3 a 4 semanas. A entrega expressa está disponível como extra. Os prazos começam quando recebemos seu conteúdo.",
    },
    {
      q: "O que preciso fornecer?",
      a: "Seu logotipo, as fotos que quer usar e os textos das páginas. Você os envia ao fazer o pedido e não consegue finalizar a compra sem eles. Não tem textos? Adicione a redação profissional e nós escrevemos para você.",
    },
    {
      q: "Como funciona o pagamento?",
      a: "Todo projeto é pago integralmente na finalização da compra, pelo Stripe. Todos os pagamentos são definitivos e não reembolsáveis, então revise seu pacote e seus extras antes de pagar.",
    },
    {
      q: "O site é meu?",
      a: "Sim. Depois que o projeto é pago integralmente, o site, o design e o conteúdo são seus. Configuramos tudo em contas que pertencem a você.",
    },
    {
      q: "E a hospedagem e o meu domínio?",
      a: "Ajudamos você a conectar um domínio seu (ou a comprar um) e a configurar uma hospedagem confiável. A hospedagem é cobrada diretamente pelo provedor — normalmente entre US$ 0 e US$ 25 por mês, dependendo do site.",
    },
    {
      q: "E se eu precisar de mais páginas depois?",
      a: "É possível adicionar páginas a qualquer momento por US$ 75 cada, ou mudar de pacote antes do início do projeto.",
    },
    {
      q: "E se eu não gostar do design?",
      a: "Todos os pacotes incluem rodadas de revisão, e mostramos os designs cedo para que seu feedback oriente o trabalho. Você verá o design da página inicial antes de construirmos qualquer outra coisa.",
    },
  ],

  cta: {
    eyebrow: "Comece seu projeto",
    title: "Pronto para um site que trabalha tanto quanto você?",
    description: "Configure seu site em cerca de dez minutos. Preços claros, uma equipe de verdade e uma data de lançamento com que você pode contar.",
  },

  configurator: {
    steps: {
      package: "Pacote",
      configure: "Configurar",
      addons: "Extras",
      details: "Seu projeto",
      assets: "Arquivos",
      review: "Revisar e pagar",
    },
    progressLabel: "Progresso do pedido",
    stepOf: "Etapa {n} de {total}",
    stepStatus: "Etapa {n} de {total}: {label}",
    back: "Voltar",
    continue: "Continuar",
    uploading: "Enviando…",
    pay: "Pagar {amount} com segurança",
    paySecurely: "Pagar com segurança",
    redirecting: "Redirecionando para o Stripe…",
    redirectingShort: "Redirecionando…",
    total: "Total",
    questions: "Dúvidas antes de pedir? Escreva para {email}.",
    cancelledNotice:
      "O pagamento foi cancelado — nada foi cobrado. Seus dados estão salvos nesta aba do navegador, então você pode continuar daqui.",
    previewNotice:
      "Este é um link de prévia, então os pagamentos estão desativados. No site real, este botão abre o checkout seguro do Stripe.",
    clearSaved: "Apagar meus dados salvos",
    clearedSaved: "Seus dados salvos foram apagados.",
    errorSummary: plural({ one: "Corrija {count} problema antes de continuar.", other: "Corrija {count} problemas antes de continuar." }),
    errors: {
      generic: "Algo deu errado do nosso lado. Tente novamente.",
      network: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      timeout: "Está demorando mais do que o esperado. Verifique sua conexão e tente novamente.",
      rateLimited: "Muitas tentativas. Aguarde um minuto e tente novamente.",
      unavailable: "Os pagamentos online não estão disponíveis no momento. Envie um e-mail para concluir seu pedido.",
      validation: "Alguns dados precisam de atenção.",
      checkoutFailed: "Não foi possível iniciar o pagamento. Tente novamente em instantes.",
    },
    summary: {
      eyebrow: "Seu site",
      choosePackage: "Escolha um pacote para ver o resumo.",
      timeline: "Prazo estimado: {timeline}",
      totalPaid: "Total, pago integralmente",
      pages: "Páginas ({count})",
      label: "Resumo do pedido",
    },
    package: {
      title: "Escolha seu ponto de partida.",
      description:
        "Todos os pacotes incluem design sob medida, adaptação para celular e apoio no lançamento. Você pode adicionar mais nas próximas etapas.",
      legend: "Pacotes",
      more: plural({ one: "+{count} item", other: "+{count} itens" }),
      notSure: "Em dúvida?",
      compareLink: "Compare os pacotes lado a lado",
    },
    configure: {
      title: "Dê forma ao seu site.",
      description: "Escolha uma direção de design e as páginas de que precisa. Vamos ajustar tudo juntos na reunião inicial.",
      styleLegend: "Direção de design",
      pagesLegend: "Páginas",
      pagesCount: "{count} de {limit} incluídas",
      extraPages: "{count} a mais × {price}",
      remove: "Remover a página {page}",
      newPageLabel: "Nome da nova página",
      newPagePlaceholder: "Adicione uma página, ex.: “Cardápio”",
      add: "Adicionar",
      suggestions: "Páginas sugeridas",
      addSuggestion: "Adicionar {page}",
      colorLabel: "Cores ou observações da marca",
      colorPlaceholder: "ex.: Neutros quentes, nosso logotipo é verde-escuro",
    },
    addons: {
      title: "Adicione o que precisar.",
      description: "Extras opcionais para o seu {package}. Itens já incluídos no seu pacote não aparecem.",
      legend: "Extras opcionais",
      extraTitle: plural({ one: "Páginas adicionais × {count}", other: "Páginas adicionais × {count}" }),
      extraNote: "Adicionadas automaticamente a partir da sua lista de páginas ({price} cada).",
      skip: "Você pode pular esta etapa — extras também podem ser adicionados depois.",
    },
    details: {
      title: "Conte sobre o seu negócio.",
      description: "Quanto mais soubermos, melhor será o seu primeiro design. Leva cerca de três minutos.",
      fullName: "Nome completo",
      email: "E-mail",
      emailHint: "Enviaremos sua confirmação para este endereço.",
      phone: "Telefone",
      businessName: "Nome da empresa",
      industry: "Setor",
      industryPlaceholder: "Selecione um setor",
      currentWebsite: "Site atual",
      websitePlaceholder: "suaempresa.com",
      goals: "O que seu novo site deve alcançar?",
      goalsPlaceholder: "ex.: Receber mais agendamentos online, parecer mais estabelecido que a concorrência, vender nossos produtos online…",
      goalsHint: "Pelo menos 20 caracteres.",
      audience: "Quem são seus clientes ideais?",
      inspiration: "Sites que você admira",
      inspirationPlaceholder: "Links e o que você gosta neles",
      hasDomain: "Você tem um domínio?",
      domain: { yes: "Sim", no: "Não", unsure: "Não sei" },
      launchDate: "Data ideal de lançamento",
      honeypot: "Deixe este campo em branco",
    },
    assets: {
      title: "Compartilhe os materiais da sua marca.",
      description:
        "Envie seu logotipo, fotos, textos, cardápios ou folhetos. Esta etapa é obrigatória: você precisa enviar pelo menos um arquivo para continuar.",
      dropHere: "Arraste arquivos para cá, ou",
      browse: "Procurar arquivos",
      rules: "Imagens, PDFs, documentos, arquivos de design ou ZIP · até 15 MB cada · máximo de {max} arquivos",
      inputLabel: "Enviar arquivos",
      listLabel: "Arquivos enviados",
      uploaded: "{size} · Enviado",
      uploadingFile: "Enviando {name}",
      remove: "Remover {name}",
      dismiss: "Descartar {name}",
      notesLabel: "Observações sobre seus arquivos",
      notesPlaceholder: "ex.: Há mais fotos em uma pasta do Google Drive — link aqui",
      errors: {
        limit: "Limite de {max} arquivos atingido.",
        tooLarge: "Maior que 15 MB.",
        type: "Este tipo de arquivo não é aceito.",
        failed: "Falha no envio. Tente novamente.",
        network: "Erro de rede — tente novamente.",
        rateLimited: "Muitos envios. Aguarde um minuto e tente novamente.",
      },
    },
    review: {
      title: "Revise seu pedido.",
      description: "Confira se está tudo certo. Você será levado ao Stripe para concluir o pagamento com segurança.",
      sections: { website: "Site", project: "Seu projeto", assets: "Arquivos" },
      edit: "Editar",
      editSection: "Editar {section}",
      rows: {
        package: "Pacote",
        style: "Direção de design",
        pages: "Páginas",
        timeline: "Prazo estimado",
        brandNotes: "Observações da marca",
        contact: "Contato",
        business: "Empresa",
        goals: "Objetivos",
        currentWebsite: "Site atual",
        files: "Arquivos",
      },
      filesUploaded: plural({ one: "{count} arquivo enviado", other: "{count} arquivos enviados" }),
      agreementTitle: "Acordo de pagamento",
      englishBinding: "O acordo de pagamento e os termos abaixo são exibidos em inglês, que é a versão vinculante.",
      readAgreement: "Ler o acordo de pagamento completo",
      privacyNote: "Usamos seus dados apenas para planejar e entregar seu projeto.",
      privacyLink: "Política de Privacidade",
      secure: "Os pagamentos são processados com segurança pelo Stripe. Você pagará {amount} integralmente.",
    },
  },

  validation: {
    packageRequired: "Escolha um pacote para continuar.",
    styleRequired: "Escolha uma direção de design.",
    pagesRequired: "Adicione pelo menos uma página.",
    pageName: "O nome da página não pode ficar vazio.",
    nameRequired: "Informe seu nome completo.",
    emailInvalid: "Informe um e-mail válido, como nome@exemplo.com.",
    phoneInvalid: "Informe um telefone válido ou deixe em branco.",
    businessRequired: "Informe o nome da sua empresa.",
    industryRequired: "Selecione seu setor.",
    urlInvalid: "Informe um endereço válido, como suaempresa.com.",
    goalsTooShort: "Uma ou duas frases nos ajudam a planejar — escreva pelo menos 20 caracteres.",
    tooLong: "Está muito longo. Encurte, por favor.",
    filesRequired: "Envie seu conteúdo para continuar, como logotipo, fotos ou textos.",
    agreementRequired: "Confirme que você entende que todos os pagamentos são definitivos.",
    termsRequired: "Aceite os Termos e Condições para continuar.",
    invalid: "Verifique este campo.",
  },

  success: {
    eyebrow: "Pedido {ref}",
    title: "Obrigado, {name}. Seu site está oficialmente em andamento.",
    emailSent: "Uma confirmação será enviada para {email}. Veja o que acontece agora.",
    next: [
      { t: "E-mail de início", d: "Em até um dia útil, enviaremos um e-mail para agendar uma reunião inicial de 30 minutos." },
      { t: "Quadro do projeto", d: "Você receberá um quadro compartilhado com seu cronograma e tudo o que ainda precisarmos." },
      { t: "Primeiro design", d: "O design da sua página inicial chega ao seu e-mail — normalmente em uma semana." },
    ],
    summary: "Resumo do pedido",
    paid: "Pago integralmente",
    finalNote: "Todos os pagamentos são definitivos e não reembolsáveis.",
    pages: "Páginas",
    assets: "Arquivos recebidos",
    files: plural({ one: "{count} arquivo", other: "{count} arquivos" }),
    explore: "Conhecer nossos trabalhos",
    confirming: "Confirmando seu pagamento…",
    notFoundTitle: "Não encontramos esse pedido.",
    notFoundBody: "Se você acabou de pagar, confira seu e-mail para ver o recibo ou fale com a gente e resolvemos rapidinho.",
    processingTitle: "Seu pagamento está sendo processado.",
    processingBody:
      "Alguns meios de pagamento levam um pouco mais para confirmar. Enviaremos sua confirmação assim que for aprovado. Não é preciso fazer o pedido de novo.",
    failedTitle: "Seu pagamento não foi concluído.",
    failedBody: "Nada foi cobrado. Seus dados estão salvos nesta aba do navegador, então você pode tentar de novo.",
    expiredTitle: "Esta sessão de pagamento expirou.",
    expiredBody: "Nada foi cobrado. Volte à etapa de revisão para iniciar um novo pagamento.",
    returnToCheckout: "Voltar ao pagamento",
    contact: "Fale conosco",
    unavailableTitle: "Não foi possível verificar seu pagamento agora.",
    unavailableBody:
      "Se você concluiu o pagamento, está tudo certo — você receberá um recibo do Stripe. Atualize a página em instantes ou fale com a gente.",
  },

  notFound: {
    eyebrow: "404",
    title: "Esta página seguiu outro caminho.",
    body: "A página que você procura não existe ou mudou de endereço.",
    popular: "Páginas populares",
  },

  error: {
    title: "Algo deu errado.",
    body: "Ocorreu um erro inesperado nesta página. Tente novamente — se continuar acontecendo, envie um e-mail para nós.",
    retry: "Tentar novamente",
  },

  legal: {
    draftNotice:
      "Rascunho em revisão — este documento ainda não foi aprovado pelo responsável pela empresa nem por assessoria jurídica e pode mudar.",
    englishOnly: "Este documento está disponível somente em inglês. Ainda não há uma tradução revisada por profissionais.",
    lastUpdated: "Última atualização: {date}",
  },
};

export default pt;
