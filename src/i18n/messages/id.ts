import { plural } from "../format";
import type { Messages } from "./en";

// Indonesian — machine-assisted draft. Requires native-speaker review (docs/TRANSLATION_REVIEW.md).
const id: Messages = {
  meta: {
    siteName: "Maison Web Studio",
    home: {
      title: "Maison Web Studio — Situs web khusus untuk bisnis yang sedang berkembang",
      description:
        "Situs web modern yang berfokus pada konversi untuk usaha kecil. Harga tetap mulai $499, proses yang jelas, dan peluncuran hanya dalam 7–10 hari.",
    },
    work: {
      title: "Karya pilihan — Contoh situs web",
      description:
        "Lihat contoh situs web yang dirancang Maison Web Studio untuk bisnis kecantikan, restoran, kebugaran, desain interior, dan jasa profesional.",
    },
    services: {
      title: "Layanan — Desain situs web, e-commerce, dan desain ulang",
      description:
        "Desain situs web, toko online, desain ulang, landing page, dan strategi situs web, plus tambahan seperti penulisan konten, SEO, dan pengerjaan kilat.",
    },
    pricing: {
      title: "Harga — Paket situs web mulai $499",
      description:
        "Bandingkan paket Starter ($499), Business ($899), dan Premium ($1.499). Harga sekali bayar, dilunasi penuh saat checkout.",
    },
    process: {
      title: "Proses — Dari pesanan hingga peluncuran dalam lima langkah",
      description:
        "Cara Maison Web Studio membawa situs Anda dari pesanan hingga peluncuran: konfigurasi, panggilan awal, desain, pembangunan dan penyempurnaan, lalu peluncuran.",
    },
    about: {
      title: "Tentang studio",
      description:
        "Maison Web Studio memadukan keahlian studio desain editorial dengan kejelasan produk modern: paket tetap, harga transparan, dan proses yang terdefinisi.",
    },
    start: {
      title: "Mulai situs web Anda — Atur dan pesan",
      description:
        "Pilih paket, tambahkan layanan ekstra, bagikan detail proyek dan aset merek Anda, lalu bayar dengan aman melalui Stripe.",
    },
    project: { title: "{name} — Contoh situs web {industry}" },
    demo: { title: "{name} — Demo langsung" },
    success: { title: "Konfirmasi pesanan" },
    notFound: { title: "Halaman tidak ditemukan" },
    privacy: { title: "Kebijakan Privasi", description: "Cara Maison Web Studio mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda." },
    terms: { title: "Syarat & Ketentuan", description: "Ketentuan yang berlaku saat Anda menggunakan situs ini dan membeli proyek situs web dari Maison Web Studio." },
    cookies: { title: "Kebijakan Cookie", description: "Cookie dan penyimpanan browser yang digunakan situs ini, beserta alasannya." },
    payment: { title: "Kebijakan Pembayaran & Pengembalian Dana", description: "Pembayaran penuh saat checkout dan kebijakan pembayaran final kami." },
    accessibility: { title: "Pernyataan Aksesibilitas", description: "Komitmen kami terhadap situs yang aksesibel, keterbatasan yang diketahui, dan cara melaporkan hambatan." },
  },

  common: {
    skipToContent: "Langsung ke konten utama",
    startYourWebsite: "Mulai situs web Anda",
    startHint: "Sekitar 10 menit · Anda baru membayar di langkah terakhir",
    viewOurWork: "Lihat karya kami",
    viewProject: "Lihat proyek",
    openLiveDemo: "Buka demo langsung",
    allWork: "Semua karya",
    backToHome: "Kembali ke beranda",
    comparePackages: "Bandingkan paket",
    oneTime: "sekali bayar",
    mostChosen: "Paling banyak dipilih",
    optional: "(opsional)",
    sampleProject: "Proyek contoh",
    opensInNewTab: "(terbuka di tab baru)",
    loading: "Memuat…",
  },

  nav: {
    label: "Utama",
    work: "Karya",
    services: "Layanan",
    pricing: "Harga",
    process: "Proses",
    about: "Tentang",
    openMenu: "Buka menu",
    closeMenu: "Tutup menu",
    home: "Maison Web Studio — beranda",
  },

  language: { label: "Bahasa", button: "Bahasa: {name}", listLabel: "Pilih bahasa" },

  footer: {
    tagline: "Situs web yang indah untuk bisnis yang siap berkembang.",
    startLink: "Mulai situs web Anda",
    studio: "Studio",
    start: "Mulai",
    contact: "Kontak",
    legal: "Legal",
    nav: "Footer",
    links: {
      work: "Karya pilihan",
      services: "Layanan",
      process: "Proses",
      about: "Tentang",
      pricing: "Harga",
      compare: "Bandingkan paket",
      configure: "Atur situs web Anda",
      faq: "Tanya jawab",
      privacy: "Kebijakan Privasi",
      terms: "Syarat & Ketentuan",
      cookies: "Kebijakan Cookie",
      payment: "Pembayaran & pengembalian dana",
      accessibility: "Aksesibilitas",
    },
    hours: "Sen–Jum, 09.00–18.00 (waktu Timur AS)",
    location: "Jarak jauh · Seluruh dunia",
    rights: "© {year} Maison Web Studio. Hak cipta dilindungi undang-undang.",
    slogan: "Situs web profesional tanpa repotnya agensi.",
  },

  hero: {
    eyebrow: "Maison Web Studio — Kini menerima proyek baru",
    headline: "Situs web yang dirancang untuk memajukan bisnis Anda.",
    lede:
      "Maison Web Studio membuat situs web modern yang berfokus pada konversi untuk bisnis yang ingin tampil seprofesional di dunia online seperti di dunia nyata.",
    showcaseLabel: "Contoh situs web rancangan Maison Web Studio, ditampilkan di laptop dan ponsel",
    trust: [
      { k: "Mulai $499", v: "Harga jelas dan tetap — tanpa kejutan" },
      { k: "7–10 hari", v: "Waktu peluncuran umum untuk situs Starter" },
      { k: "Milik Anda", v: "Domain Anda, konten Anda, situs Anda" },
    ],
  },

  home: {
    industriesLabel: "Industri yang kami layani",
    industries: [
      "Merek perawatan kulit",
      "Restoran",
      "Desainer interior",
      "Studio kebugaran",
      "Firma hukum & akuntansi",
      "Butik",
      "Salon & spa",
      "Konsultan",
      "Properti",
      "Kafe",
    ],
    pauseAnimation: "Jeda animasi",
    playAnimation: "Putar animasi",
    work: {
      eyebrow: "Karya pilihan",
      title: "Situs dengan karakter.",
      description:
        "Pilihan contoh situs web untuk kecantikan, perhotelan, kebugaran, dan jasa profesional — masing-masing dirancang dari halaman kosong.",
    },
    services: { eyebrow: "Layanan", title: "Semua yang dibutuhkan situs Anda. Tidak lebih.", cta: "Layanan kami" },
    why: {
      eyebrow: "Mengapa Maison",
      title: "Situs web profesional tanpa repotnya agensi.",
      lede: "Keahlian studio desain dengan kejelasan produk yang bisa Anda beli secara online.",
      items: [
        { t: "Harga tetap dan transparan", d: "Ketahui persis apa yang Anda bayar sebelum mulai. Tanpa tagihan per jam, tanpa tagihan kejutan." },
        { t: "Dirancang, bukan template", d: "Setiap situs dirancang untuk bisnis Anda — termasuk tipografi, tata letak, dan detailnya." },
        { t: "Dibuat untuk konversi", d: "Ajakan bertindak yang jelas, halaman cepat, dan fondasi SEO agar pelanggan menemukan dan memilih Anda." },
        { t: "Satu tim yang bertanggung jawab", d: "Strategi, desain, dan pengembangan di satu tempat, dengan satu narahubung." },
      ],
    },
    pricing: {
      eyebrow: "Harga",
      title: "Paket sederhana. Hasil yang jelas.",
      description: "Harga sekali bayar dengan semua yang Anda perlukan untuk diluncurkan, dilunasi penuh saat checkout.",
      custom: "Butuh tambahan? Tambahkan penulisan konten, toko online, atau pengerjaan kilat saat mengatur situs Anda.",
    },
    process: { eyebrow: "Proses", title: "Dari klik pertama hingga peluncuran, dalam lima langkah jelas.", cta: "Cara kerjanya" },
    faq: { eyebrow: "Pertanyaan", title: "Perlu diketahui." },
  },

  work: {
    eyebrow: "Karya pilihan",
    title: "Setiap bisnis layak punya tampilannya sendiri.",
    lede:
      "Jelajahi contoh situs web yang kami rancang untuk berbagai industri. Buka proyek mana pun untuk melihat studi kasus lengkap dan versi interaktif situsnya.",
    filterLabel: "Saring proyek berdasarkan kategori",
    showing: plural({ other: "Menampilkan {count} proyek" }),
    ctaTitle: "Suka yang Anda lihat? Mari rancang milik Anda.",
    categories: {
      All: "Semua",
      Beauty: "Kecantikan",
      Restaurant: "Restoran",
      "Professional Services": "Jasa profesional",
      "E-Commerce": "E-commerce",
      "Local Business": "Bisnis lokal",
    },
  },

  projects: {
    "aurelia-skin": {
      industry: "Kecantikan / E-commerce",
      summary: "Toko online yang lembut dan editorial untuk lini perawatan kulit yang klinis namun lembut.",
      description:
        "Aurelia membutuhkan toko online yang sematang formulanya. Kami merancang pengalaman belanja editorial dengan tampilan produk yang terasa nyata, kuis kulit terpandu, dan checkout yang dioptimalkan untuk pembelian ulang.",
      challenge: "Tema lama mereka mirip merek perawatan kulit lainnya dan menyembunyikan produk terlaris tiga klik jauhnya.",
      approach:
        "Kami menonjolkan satu ritual, memberi ruang bagi setiap produk, dan menyusun promosi berdasarkan bahan, bukan diskon.",
      features: ["Toko Shopify", "Kuis kulit", "Langganan", "Ulasan", "Pengumpulan email"],
      highlights: [
        { value: "3 langkah", label: "Kuis kulit terpandu" },
        { value: "1 ketuk", label: "Dari produk ke keranjang" },
        { value: "< 1,5 dtk", label: "Target waktu muat" },
      ],
    },
    "maison-noir": {
      industry: "Restoran",
      summary: "Situs malam bernuansa cahaya lilin dengan reservasi di posisi utama.",
      description:
        "Ruang makan Prancis yang intim layak memiliki situs yang membangun suasana sebelum tamu datang. Kami membuat pengalaman gelap dan sinematik dengan alur reservasi yang selalu terlihat dan menu yang bisa diperbarui dalam hitungan menit.",
      challenge: "Reservasi dilakukan lewat telepon dan menunya berupa PDF yang selalu ketinggalan zaman.",
      approach:
        "Widget reservasi di bagian utama, menu musiman yang bisa diedit, dan permintaan acara privat yang langsung diteruskan ke tim acara.",
      features: ["Reservasi", "Menu yang bisa diedit", "Permintaan acara privat", "Voucher hadiah", "Google Maps"],
      highlights: [
        { value: "Utama", label: "Posisi widget reservasi" },
        { value: "Menit", label: "Untuk memperbarui menu musiman" },
        { value: "Gelap", label: "Palet sinematik bernuansa malam" },
      ],
    },
    "form-studio": {
      industry: "Desain interior",
      summary: "Portofolio yang tenang dan arsitektural, membiarkan ruang berbicara.",
      description:
        "Karya Form Studio berbicara tentang proporsi dan kesederhanaan, begitu pula situsnya. Grid modular, indeks proyek, dan studi kasus berbasis gambar yang menjadikan setiap proyek terasa seperti artikel majalah.",
      challenge: "Proyek yang indah, tetapi galerinya berantakan sehingga setiap ruang tampak sama.",
      approach:
        "Kami membangun sistem grid yang fleksibel dan daftar proyek berindeks, memberi setiap proyek irama gambar dan teksnya sendiri.",
      features: ["Indeks proyek", "Template studi kasus", "Jurnal", "Formulir pertanyaan", "CMS"],
      highlights: [
        { value: "12", label: "Template halaman" },
        { value: "Modular", label: "Sistem grid gambar" },
        { value: "Berindeks", label: "Arsip proyek" },
      ],
    },
    solace: {
      industry: "Kebugaran",
      summary: "Pengalaman pemesanan yang tenang dan lembut untuk studio yoga dan latihan pernapasan.",
      description:
        "Solace ingin situs yang terasa seperti memasuki studionya. Bentuk lembut, palet yang tenang, dan jadwal kelas yang membuat pemesanan kunjungan pertama mudah dari ponsel apa pun.",
      challenge: "Sebagian besar pengunjung datang dari ponsel dan berhenti di jadwal pihak ketiga yang merepotkan.",
      approach:
        "Jadwal yang terasa seperti aplikasi, penawaran perkenalan yang jelas, dan pemesanan yang terintegrasi langsung ke sistem desain.",
      features: ["Jadwal kelas", "Integrasi pemesanan", "Alur penawaran perkenalan", "Keanggotaan", "Buletin"],
      highlights: [
        { value: "Ponsel", label: "Pendekatan desain utama" },
        { value: "2 ketuk", label: "Untuk memesan kelas" },
        { value: "Terintegrasi", label: "Alur penawaran perkenalan" },
      ],
    },
    "mason-and-co": {
      industry: "Jasa profesional",
      summary: "Kehadiran yang meyakinkan dan tepercaya untuk firma konsultan lintas generasi.",
      description:
        "Setelah 35 tahun mengandalkan rekomendasi, Mason & Co. membutuhkan situs yang sesuai dengan reputasinya. Kami membuat desain editorial yang terukur dengan bidang layanan yang jelas dan pemesanan konsultasi yang mudah.",
      challenge: "Situs lama yang tidak mencerminkan keahlian puluhan tahun dan hampir tidak menghasilkan prospek.",
      approach:
        "Utamakan kredibilitas — bukti nyata, orang sungguhan, halaman layanan dengan bahasa sederhana — dan buat pemesanan konsultasi hanya sejauh satu klik dari mana saja.",
      features: ["Pemesanan konsultasi", "Halaman bidang layanan", "Profil tim", "Blog wawasan", "Analitik"],
      highlights: [
        { value: "7", label: "Halaman" },
        { value: "1 klik", label: "Untuk memesan konsultasi" },
        { value: "Editorial", label: "Blog wawasan" },
      ],
    },
  },

  caseStudy: {
    eyebrow: "{industry} · Proyek contoh",
    industry: "Industri",
    package: "Paket",
    typefaces: "Jenis huruf",
    scope: "Cakupan",
    palette: "Palet",
    brief: "Brief",
    approach: "Pendekatan kami",
    next: "Proyek berikutnya",
    ctaTitle: "Ingin situs seperti {name}?",
    ctaBody: "Proyek ini sesuai dengan paket {package} kami. Atur milik Anda dalam hitungan menit dan biarkan kami mengurus sisanya.",
    previewLabel: "Pratinjau contoh situs web {name}",
    phonePreviewLabel: "Contoh situs web {name} di ponsel",
  },

  demo: {
    notice: "Situs contoh oleh Maison Web Studio",
    caseStudy: "Studi kasus",
    startYours: "Mulai milik Anda",
    toolbar: "Kontrol situs contoh",
  },

  services: {
    page: {
      eyebrow: "Layanan",
      title: "Desain dan teknologi, seimbang.",
      lede:
        "Dari situs tiga halaman yang ringkas hingga toko online lengkap, setiap proyek mendapat perhatian yang sama: strategi yang matang, desain yang halus, dan pembangunan yang cepat dan andal.",
    },
    list: [
      {
        title: "Desain situs web",
        description: "Situs web khusus yang mengutamakan ponsel, dirancang sesuai merek Anda dan dibuat untuk mengubah pengunjung menjadi pelanggan.",
        points: ["Sistem desain khusus", "Pembangunan responsif", "Panduan teks & konten"],
      },
      {
        title: "E-commerce",
        description: "Toko online yang indah dengan halaman produk yang matang, checkout sederhana, dan integrasi yang Anda perlukan untuk berjualan.",
        points: ["Katalog produk", "Checkout aman", "Pengaturan stok & pengiriman"],
      },
      {
        title: "Desain ulang situs",
        description: "Pembangunan ulang modern untuk situs yang sudah tidak memadai — mempertahankan yang berhasil, memperbaiki yang tidak, dan menjaga SEO Anda.",
        points: ["Audit konten", "Migrasi aman untuk SEO", "Peningkatan performa"],
      },
      {
        title: "Landing page",
        description: "Halaman cepat dan terfokus untuk peluncuran, kampanye, dan penawaran — dirancang di sekitar satu tindakan yang jelas.",
        points: ["Siap kampanye", "Ramah uji A/B", "Analitik terpasang"],
      },
      {
        title: "Strategi situs web",
        description: "Positioning, struktur, dan pesan, agar setiap halaman punya fungsi dan setiap pengunjung tahu langkah berikutnya.",
        points: ["Peta situs & alur pengguna", "Kerangka pesan", "Tinjauan konversi"],
      },
    ],
    addOns: {
      eyebrow: "Tambahan",
      title: "Sesuaikan paket apa pun.",
      lede: "Tambahkan tepat apa yang Anda perlukan saat mengatur situs Anda.",
      perPage: "/ halaman",
    },
  },

  process: {
    page: {
      eyebrow: "Proses",
      title: "Tenang, jelas, dan tepat waktu.",
      lede:
        "Tanpa rapat berkepanjangan atau jadwal yang tidak jelas. Proses sederhana dengan langkah yang terdefinisi, kemajuan yang dibagikan, dan tanggal peluncuran yang bisa Anda rencanakan.",
    },
    steps: [
      {
        title: "Atur & pesan",
        duration: "10 menit",
        description:
          "Pilih paket, tambahkan yang Anda butuhkan, dan ceritakan tentang bisnis Anda. Unggah logo, foto, dan apa pun yang menginspirasi Anda.",
      },
      {
        title: "Panggilan awal",
        duration: "Hari 1–2",
        description:
          "Panggilan 30 menit untuk menyelaraskan tujuan, audiens, dan gaya. Kami akan membagikan papan proyek sederhana berisi jadwal Anda.",
      },
      {
        title: "Desain",
        duration: "Minggu 1–2",
        description:
          "Kami merancang beranda Anda terlebih dahulu, menyempurnakannya bersama, lalu menerapkan sistemnya ke setiap halaman — di desktop dan ponsel.",
      },
      {
        title: "Bangun & sempurnakan",
        duration: "Minggu 2–3",
        description:
          "Situs Anda dibangun, dioptimalkan, dan diuji di berbagai perangkat. Putaran revisi termasuk dalam setiap paket.",
      },
      {
        title: "Peluncuran",
        duration: "Hari peluncuran",
        description:
          "Kami menghubungkan domain Anda, mengatur SSL, analitik, dan dasar-dasar SEO, lalu memandu Anda cara memperbarui situs.",
      },
    ],
    extras: [
      { t: "Papan proyek bersama", d: "Lihat setiap tugas, berkas, dan persetujuan di satu tempat — tanpa menelusuri utas email." },
      { t: "Kabar mingguan", d: "Ringkasan tertulis singkat setiap minggu, agar Anda selalu tahu langkah berikutnya." },
      { t: "Setelah peluncuran", d: "Panduan menggunakan situs Anda, ditambah paket perawatan opsional untuk pembaruan dan ketenangan pikiran." },
    ],
  },

  about: {
    eyebrow: "Tentang",
    title: "Studio kreatif yang berpikir seperti perusahaan teknologi.",
    intro:
      "Maison Web Studio didirikan berdasarkan gagasan sederhana: desain yang hebat tidak seharusnya membutuhkan biaya langganan agensi, dan membeli situs web tidak seharusnya terasa seperti berjudi.",
    p1:
      "Kami memadukan keahlian studio desain editorial dengan kejelasan produk modern. Paket tetap, harga transparan, dan proses yang terdefinisi membuat Anda tahu apa yang Anda dapatkan, kapan, dan berapa biayanya — sebelum mulai.",
    p2:
      "Kami bekerja dengan pendiri usaha, restoran, studio, praktik profesional, dan merek yang peduli dengan citra mereka. Tugas kami adalah membuat bisnis Anda tampil sebaik di dunia nyata, dan memudahkan pelanggan yang tepat untuk berkata ya.",
    valuesEyebrow: "Nilai kami",
    valuesTitle: "Istimewa dengan tenang.",
    values: [
      { t: "Kesederhanaan", d: "Kami mengurangi hingga hanya yang penting tersisa. Desain yang baik itu tenang, jelas, dan percaya diri." },
      { t: "Keahlian", d: "Tipografi, jarak, dan gerak diatur dengan cermat. Detail itulah yang membuat situs terasa premium." },
      { t: "Kejelasan", d: "Bahasa sederhana, harga tetap, dan jadwal yang jujur. Anda selalu tahu posisi proyek Anda." },
      { t: "Kemitraan", d: "Bisnis Anda, tujuan Anda. Kami merancang untuk pelanggan Anda, bukan untuk penghargaan." },
    ],
    showcaseLabel: "Contoh situs web Form Studio di jendela browser",
  },

  pricing: {
    eyebrow: "Harga",
    title: "Desain premium, harga jujur.",
    lede: "Tiga paket, harga sekali bayar. Setiap proyek dilunasi penuh saat checkout, dan semua pembayaran bersifat final.",
    timeline: "Waktu umum: {timeline}",
    choose: "Pilih {name}",
    chooseShort: "Pilih",
    compareEyebrow: "Bandingkan",
    compareTitle: "Bandingkan paket.",
    compareCaption: "Fitur yang termasuk dalam setiap paket situs web",
    feature: "Fitur",
    included: "Termasuk",
    notIncluded: "Tidak termasuk",
    faqEyebrow: "Tanya jawab",
    faqTitle: "Pertanyaan, terjawab.",
    paymentNote: "Dilunasi penuh saat checkout. Semua pembayaran bersifat final — lihat {link} kami.",
    paymentLink: "Kebijakan Pembayaran & Pengembalian Dana",
  },

  packages: {
    starter: {
      name: "Situs Starter",
      short: "Starter",
      tagline: "Kehadiran profesional yang rapi untuk bisnis baru dan yang sedang berkembang.",
      timeline: "7–10 hari",
      rushTimeline: "4–6 hari",
      features: [
        "Hingga 3 halaman",
        "Desain khusus",
        "Responsif di ponsel",
        "Formulir kontak",
        "Tautan media sosial",
        "SEO dasar",
        "Pengaturan SSL / keamanan",
        "Satu putaran revisi",
        "Bantuan peluncuran",
      ],
    },
    business: {
      name: "Situs Business",
      short: "Business",
      tagline: "Semua yang dibutuhkan bisnis mapan untuk menarik dan mengonversi pelanggan.",
      timeline: "2–3 minggu",
      rushTimeline: "8–12 hari",
      features: [
        "Hingga 7 halaman",
        "Desain khusus",
        "Responsif di ponsel",
        "Formulir kontak",
        "Galeri",
        "Google Maps",
        "Integrasi media sosial",
        "SEO",
        "Analitik",
        "Integrasi pemesanan",
        "Dua putaran revisi",
        "Bantuan peluncuran",
      ],
    },
    premium: {
      name: "Situs Premium",
      short: "Premium",
      tagline: "Situs berkelas editorial yang dipikirkan matang untuk merek terdepan.",
      timeline: "3–4 minggu",
      rushTimeline: "12–16 hari",
      features: [
        "Hingga 12 halaman",
        "Desain premium",
        "Bagian lanjutan",
        "Animasi",
        "Formulir",
        "Galeri",
        "Pemesanan",
        "Integrasi buletin",
        "SEO",
        "Analitik",
        "Pengaturan blog",
        "Tiga putaran revisi",
        "Dukungan prioritas",
      ],
    },
  },

  compare: {
    labels: {
      pages: "Halaman termasuk",
      design: "Desain",
      revisions: "Putaran revisi",
      timeline: "Waktu umum",
      mobile: "Responsif di ponsel",
      forms: "Formulir kontak",
      ssl: "Pengaturan SSL / keamanan",
      seo: "SEO",
      gallery: "Galeri",
      maps: "Google Maps",
      analytics: "Analitik",
      booking: "Integrasi pemesanan",
      advanced: "Bagian lanjutan & animasi",
      newsletter: "Integrasi buletin",
      blog: "Pengaturan blog",
      priority: "Dukungan prioritas",
      launch: "Bantuan peluncuran",
    },
    values: {
      upTo3: "Hingga 3",
      upTo7: "Hingga 7",
      upTo12: "Hingga 12",
      custom: "Khusus",
      premium: "Premium",
      basic: "Dasar",
      standard: "Standar",
      one: "1",
      two: "2",
      three: "3",
    },
  },

  addOns: {
    "extra-pages": { name: "Halaman tambahan", description: "Perluas situs Anda melebihi halaman yang termasuk dalam paket." },
    copywriting: { name: "Penulisan konten profesional", description: "Teks yang jelas dan persuasif untuk setiap halaman, sesuai gaya merek Anda." },
    logo: { name: "Logo & penyegaran merek", description: "Logo yang disempurnakan, palet warna, dan pasangan huruf untuk bisnis Anda." },
    ecommerce: { name: "Toko online", description: "Katalog produk, keranjang, dan checkout untuk hingga 25 produk." },
    booking: { name: "Integrasi pemesanan", description: "Janji temu online yang terhubung ke kalender Anda." },
    newsletter: { name: "Integrasi buletin", description: "Formulir pendaftaran yang terhubung ke Mailchimp, Klaviyo, atau ConvertKit." },
    blog: { name: "Pengaturan blog", description: "Blog yang dirancang rapi, mudah diperbarui, dengan kategori." },
    "seo-plus": { name: "SEO lanjutan", description: "Riset kata kunci, data terstruktur, dan optimasi di halaman." },
    "google-business": { name: "Profil Bisnis Google", description: "Pengaturan dan optimasi agar pelanggan menemukan Anda di Maps." },
    "care-plan": { name: "Paket perawatan 3 bulan", description: "Pembaruan, cadangan, pemantauan, dan perubahan kecil setelah peluncuran." },
    rush: { name: "Pengerjaan kilat", description: "Masuk ke antrean terdepan — luncurkan dalam sekitar setengah waktu." },
  },
  extraPagesItem: plural({ other: "Halaman tambahan ({count} halaman)" }),

  styles: {
    minimal: { name: "Minimalis", description: "Tenang, lapang, dan presisi." },
    editorial: { name: "Editorial", description: "Tipografi dan gambar ala majalah." },
    warm: { name: "Hangat & organik", description: "Nada lembut, ramah, dan manusiawi." },
    bold: { name: "Berani & modern", description: "Tipografi tegas, kontras kuat." },
  },

  industries: {
    beauty: "Kecantikan & perawatan kulit",
    hospitality: "Restoran & perhotelan",
    wellness: "Kebugaran & kesehatan",
    professional: "Jasa profesional",
    interiors: "Interior & arsitektur",
    retail: "Ritel & e-commerce",
    health: "Kesehatan & medis",
    realEstate: "Properti",
    creative: "Kreatif & media",
    other: "Lainnya",
  },

  pageNames: {
    home: "Beranda",
    about: "Tentang",
    services: "Layanan",
    contact: "Kontak",
    gallery: "Galeri",
    journal: "Jurnal",
    menu: "Menu",
    shop: "Toko",
    booking: "Pemesanan",
    team: "Tim",
    pricing: "Harga",
    faq: "Tanya jawab",
    testimonials: "Testimoni",
    careers: "Karier",
    locations: "Lokasi",
    events: "Acara",
  },

  faq: [
    {
      q: "Berapa lama pembuatan situs web?",
      a: "Situs Starter biasanya diluncurkan dalam 7–10 hari, Business dalam 2–3 minggu, dan Premium dalam 3–4 minggu. Pengerjaan kilat tersedia sebagai tambahan. Jadwal dimulai setelah kami menerima konten Anda.",
    },
    {
      q: "Apa yang perlu saya sediakan?",
      a: "Logo Anda, foto yang ingin digunakan, dan teks untuk halaman Anda. Anda mengunggahnya saat memesan, dan tidak bisa checkout tanpanya. Tidak punya teks? Tambahkan penulisan konten profesional dan kami akan menuliskannya.",
    },
    {
      q: "Bagaimana cara pembayarannya?",
      a: "Setiap proyek dilunasi penuh saat checkout melalui Stripe. Semua pembayaran bersifat final dan tidak dapat dikembalikan, jadi periksa paket dan tambahan Anda sebelum membayar.",
    },
    {
      q: "Apakah situs web itu milik saya?",
      a: "Ya. Setelah proyek dilunasi, situs, desain, dan kontennya menjadi milik Anda. Kami menyiapkan semuanya di akun atas nama Anda.",
    },
    {
      q: "Bagaimana dengan hosting dan domain saya?",
      a: "Kami membantu menghubungkan domain milik Anda (atau membelinya) dan menyiapkan hosting yang andal. Hosting ditagih langsung oleh penyedia — biasanya $0–$25 per bulan tergantung situs Anda.",
    },
    {
      q: "Bagaimana jika nanti saya butuh lebih banyak halaman?",
      a: "Halaman tambahan bisa ditambahkan kapan saja seharga $75 per halaman, atau Anda bisa meningkatkan paket sebelum proyek dimulai.",
    },
    {
      q: "Bagaimana jika saya tidak puas dengan desainnya?",
      a: "Setiap paket mencakup putaran revisi, dan kami membagikan desain sejak awal agar masukan Anda membentuk hasilnya. Anda akan melihat desain beranda sebelum kami membangun hal lain.",
    },
  ],

  cta: {
    eyebrow: "Mulai proyek Anda",
    title: "Siap punya situs web yang bekerja sekeras Anda?",
    description: "Atur situs web Anda dalam sekitar sepuluh menit. Harga jelas, tim sungguhan, dan tanggal peluncuran yang bisa Anda rencanakan.",
  },

  configurator: {
    steps: {
      package: "Paket",
      configure: "Atur",
      addons: "Tambahan",
      details: "Proyek Anda",
      assets: "Aset",
      review: "Tinjau & bayar",
    },
    progressLabel: "Progres pesanan",
    stepOf: "Langkah {n} dari {total}",
    stepStatus: "Langkah {n} dari {total}: {label}",
    back: "Kembali",
    continue: "Lanjut",
    uploading: "Mengunggah…",
    pay: "Bayar {amount} dengan aman",
    paySecurely: "Bayar dengan aman",
    redirecting: "Mengalihkan ke Stripe…",
    redirectingShort: "Mengalihkan…",
    total: "Total",
    questions: "Ada pertanyaan sebelum memesan? Kirim email ke {email}.",
    cancelledNotice:
      "Pembayaran dibatalkan — tidak ada biaya yang ditagih. Data Anda tersimpan di tab browser ini, jadi Anda bisa melanjutkan dari sini.",
    previewNotice:
      "Ini adalah tautan pratinjau, jadi pembayaran dinonaktifkan. Di situs aslinya, tombol ini membuka checkout Stripe yang aman.",
    clearSaved: "Hapus data saya yang tersimpan",
    clearedSaved: "Data Anda yang tersimpan telah dihapus.",
    errorSummary: plural({ other: "Perbaiki {count} masalah sebelum melanjutkan." }),
    errors: {
      generic: "Terjadi kesalahan di pihak kami. Silakan coba lagi.",
      network: "Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.",
      timeout: "Prosesnya lebih lama dari perkiraan. Periksa koneksi Anda dan coba lagi.",
      rateLimited: "Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.",
      unavailable: "Pembayaran online sedang tidak tersedia. Kirim email kepada kami untuk menyelesaikan pesanan Anda.",
      validation: "Beberapa data perlu diperiksa.",
      checkoutFailed: "Checkout tidak dapat dimulai. Coba lagi sebentar lagi.",
    },
    summary: {
      eyebrow: "Situs web Anda",
      choosePackage: "Pilih paket untuk melihat ringkasan Anda.",
      timeline: "Perkiraan waktu: {timeline}",
      totalPaid: "Total, dibayar penuh",
      pages: "Halaman ({count})",
      label: "Ringkasan pesanan",
    },
    package: {
      title: "Pilih titik awal Anda.",
      description:
        "Setiap paket mencakup desain khusus, responsif di ponsel, dan bantuan peluncuran. Anda bisa menambahkan lebih banyak di langkah berikutnya.",
      legend: "Paket",
      more: plural({ other: "+{count} lainnya" }),
      notSure: "Masih ragu?",
      compareLink: "Bandingkan paket berdampingan",
    },
    configure: {
      title: "Bentuk situs web Anda.",
      description: "Pilih arah desain dan halaman yang Anda perlukan. Kami akan menyempurnakan semuanya bersama saat panggilan awal.",
      styleLegend: "Arah desain",
      pagesLegend: "Halaman",
      pagesCount: "{count} dari {limit} termasuk",
      extraPages: "{count} tambahan × {price}",
      remove: "Hapus halaman {page}",
      newPageLabel: "Nama halaman baru",
      newPagePlaceholder: "Tambahkan halaman, mis. “Menu”",
      add: "Tambah",
      suggestions: "Saran halaman",
      addSuggestion: "Tambah {page}",
      colorLabel: "Warna atau catatan merek",
      colorPlaceholder: "mis. Netral hangat, logo kami berwarna hijau tua",
    },
    addons: {
      title: "Tambahkan yang Anda butuhkan.",
      description: "Tambahan opsional untuk {package} Anda. Item yang sudah termasuk dalam paket tidak ditampilkan.",
      legend: "Tambahan opsional",
      extraTitle: plural({ other: "Halaman tambahan × {count}" }),
      extraNote: "Ditambahkan otomatis dari daftar halaman Anda ({price} per halaman).",
      skip: "Anda bisa melewati langkah ini — tambahan juga bisa ditambahkan nanti.",
    },
    details: {
      title: "Ceritakan tentang bisnis Anda.",
      description: "Semakin banyak yang kami ketahui, semakin baik desain pertama Anda. Ini memakan waktu sekitar tiga menit.",
      fullName: "Nama lengkap",
      email: "Email",
      emailHint: "Konfirmasi akan kami kirim ke sini.",
      phone: "Telepon",
      businessName: "Nama bisnis",
      industry: "Industri",
      industryPlaceholder: "Pilih industri",
      currentWebsite: "Situs web saat ini",
      websitePlaceholder: "bisnisanda.com",
      goals: "Apa yang harus dicapai situs web baru Anda?",
      goalsPlaceholder: "mis. Mendapat lebih banyak pemesanan online, tampil lebih mapan dari pesaing, menjual produk secara online…",
      goalsHint: "Minimal 20 karakter.",
      audience: "Siapa pelanggan ideal Anda?",
      inspiration: "Situs web yang Anda kagumi",
      inspirationPlaceholder: "Tautan dan apa yang Anda sukai darinya",
      hasDomain: "Apakah Anda memiliki domain?",
      domain: { yes: "Ya", no: "Tidak", unsure: "Belum tahu" },
      launchDate: "Tanggal peluncuran ideal",
      honeypot: "Biarkan kolom ini kosong",
    },
    assets: {
      title: "Bagikan aset merek Anda.",
      description:
        "Unggah logo, foto, teks, menu, atau brosur Anda. Langkah ini wajib: Anda perlu mengunggah minimal satu berkas untuk melanjutkan.",
      dropHere: "Seret berkas ke sini, atau",
      browse: "Pilih berkas",
      rules: "Gambar, PDF, dokumen, berkas desain, atau ZIP · maks. 15 MB per berkas · maks. {max} berkas",
      inputLabel: "Unggah berkas",
      listLabel: "Berkas yang diunggah",
      uploaded: "{size} · Terunggah",
      uploadingFile: "Mengunggah {name}",
      remove: "Hapus {name}",
      dismiss: "Tutup {name}",
      notesLabel: "Catatan tentang aset Anda",
      notesPlaceholder: "mis. Foto lainnya ada di folder Google Drive — tautan di sini",
      errors: {
        limit: "Batas {max} berkas tercapai.",
        tooLarge: "Lebih dari 15 MB.",
        type: "Jenis berkas ini tidak didukung.",
        failed: "Unggahan gagal. Silakan coba lagi.",
        network: "Kesalahan jaringan — silakan coba lagi.",
        rateLimited: "Terlalu banyak unggahan. Tunggu satu menit lalu coba lagi.",
      },
    },
    review: {
      title: "Tinjau pesanan Anda.",
      description: "Pastikan semuanya sudah benar. Anda akan diarahkan ke Stripe untuk menyelesaikan pembayaran dengan aman.",
      sections: { website: "Situs web", project: "Proyek Anda", assets: "Aset" },
      edit: "Ubah",
      editSection: "Ubah {section}",
      rows: {
        package: "Paket",
        style: "Arah desain",
        pages: "Halaman",
        timeline: "Perkiraan waktu",
        brandNotes: "Catatan merek",
        contact: "Kontak",
        business: "Bisnis",
        goals: "Tujuan",
        currentWebsite: "Situs web saat ini",
        files: "Berkas",
      },
      filesUploaded: plural({ other: "{count} berkas terunggah" }),
      agreementTitle: "Perjanjian pembayaran",
      englishBinding: "Perjanjian pembayaran dan ketentuan di bawah ini ditampilkan dalam bahasa Inggris, yang merupakan versi yang mengikat.",
      readAgreement: "Baca perjanjian pembayaran lengkap",
      privacyNote: "Kami menggunakan data Anda hanya untuk merencanakan dan mengerjakan proyek Anda.",
      privacyLink: "Kebijakan Privasi",
      secure: "Pembayaran diproses dengan aman oleh Stripe. Anda akan membayar {amount} secara penuh.",
    },
  },

  validation: {
    packageRequired: "Pilih paket untuk melanjutkan.",
    styleRequired: "Pilih arah desain.",
    pagesRequired: "Tambahkan minimal satu halaman.",
    pageName: "Nama halaman tidak boleh kosong.",
    nameRequired: "Masukkan nama lengkap Anda.",
    emailInvalid: "Masukkan alamat email yang valid, seperti nama@contoh.com.",
    phoneInvalid: "Masukkan nomor telepon yang valid, atau kosongkan.",
    businessRequired: "Masukkan nama bisnis Anda.",
    industryRequired: "Pilih industri Anda.",
    urlInvalid: "Masukkan alamat web yang valid, seperti bisnisanda.com.",
    goalsTooShort: "Satu atau dua kalimat membantu kami merencanakan — tulis minimal 20 karakter.",
    tooLong: "Terlalu panjang. Silakan persingkat.",
    filesRequired: "Unggah konten Anda untuk melanjutkan, seperti logo, foto, atau teks.",
    agreementRequired: "Konfirmasikan bahwa Anda memahami semua pembayaran bersifat final.",
    termsRequired: "Setujui Syarat & Ketentuan untuk melanjutkan.",
    invalid: "Periksa kolom ini.",
  },

  success: {
    eyebrow: "Pesanan {ref}",
    title: "Terima kasih, {name}. Situs web Anda resmi dikerjakan.",
    emailSent: "Konfirmasi akan dikirim ke {email}. Berikut langkah selanjutnya.",
    next: [
      { t: "Email pembukaan", d: "Dalam satu hari kerja kami akan mengirim email untuk menjadwalkan panggilan awal 30 menit." },
      { t: "Papan proyek", d: "Anda akan mendapat papan bersama berisi jadwal dan hal lain yang masih kami perlukan." },
      { t: "Desain pertama", d: "Desain beranda Anda tiba di kotak masuk — biasanya dalam seminggu." },
    ],
    summary: "Ringkasan pesanan",
    paid: "Dibayar penuh",
    finalNote: "Semua pembayaran bersifat final dan tidak dapat dikembalikan.",
    pages: "Halaman",
    assets: "Aset diterima",
    files: plural({ other: "{count} berkas" }),
    explore: "Jelajahi karya kami",
    confirming: "Mengonfirmasi pembayaran Anda…",
    notFoundTitle: "Kami tidak dapat menemukan pesanan itu.",
    notFoundBody: "Jika Anda baru saja membayar, periksa email Anda untuk tanda terima atau hubungi kami dan kami akan segera membantu.",
    processingTitle: "Pembayaran Anda sedang diproses.",
    processingBody:
      "Beberapa metode pembayaran membutuhkan waktu lebih lama untuk dikonfirmasi. Kami akan mengirim konfirmasi segera setelah berhasil. Tidak perlu memesan ulang.",
    failedTitle: "Pembayaran Anda tidak berhasil.",
    failedBody: "Tidak ada biaya yang ditagih. Data Anda tersimpan di tab browser ini, jadi Anda bisa mencoba lagi.",
    expiredTitle: "Sesi checkout ini telah kedaluwarsa.",
    expiredBody: "Tidak ada biaya yang ditagih. Kembali ke langkah tinjauan untuk memulai checkout baru.",
    returnToCheckout: "Kembali ke checkout",
    contact: "Hubungi kami",
    unavailableTitle: "Kami belum dapat memeriksa pembayaran Anda saat ini.",
    unavailableBody:
      "Jika Anda sudah menyelesaikan pembayaran, pembayaran Anda aman — Anda akan menerima tanda terima dari Stripe. Muat ulang sebentar lagi atau hubungi kami.",
  },

  notFound: {
    eyebrow: "404",
    title: "Halaman ini mengambil jalan lain.",
    body: "Halaman yang Anda cari tidak ada atau sudah dipindahkan.",
    popular: "Halaman populer",
  },

  error: {
    title: "Terjadi kesalahan.",
    body: "Terjadi kesalahan tak terduga di halaman ini. Silakan coba lagi — jika terus terjadi, kirim email kepada kami.",
    retry: "Coba lagi",
  },

  legal: {
    draftNotice:
      "Draf untuk ditinjau — dokumen ini belum disetujui oleh pemilik bisnis atau penasihat hukum dan dapat berubah.",
    englishOnly: "Dokumen ini hanya tersedia dalam bahasa Inggris. Terjemahan yang ditinjau secara profesional belum tersedia.",
    lastUpdated: "Terakhir diperbarui: {date}",
  },
};

export default id;
