/**
 * Built-in interface text for generated client sites (navigation, forms, errors, 404, footer).
 * Machine-assisted translations — flagged for native-speaker review in every project.
 */
export const SITE_LOCALES = {
  en: { tag: "en", dir: "ltr", name: "English" },
  zh: { tag: "zh-Hans", dir: "ltr", name: "简体中文" },
  es: { tag: "es", dir: "ltr", name: "Español" },
  hi: { tag: "hi", dir: "ltr", name: "हिन्दी" },
  ar: { tag: "ar", dir: "rtl", name: "العربية" },
  fr: { tag: "fr", dir: "ltr", name: "Français" },
  bn: { tag: "bn", dir: "ltr", name: "বাংলা" },
  pt: { tag: "pt-BR", dir: "ltr", name: "Português" },
  ru: { tag: "ru", dir: "ltr", name: "Русский" },
  id: { tag: "id", dir: "ltr", name: "Bahasa Indonesia" },
} as const;
export type SiteLocale = keyof typeof SITE_LOCALES;
export const isSiteLocale = (l: string): l is SiteLocale => l in SITE_LOCALES;

type UI = {
  skip: string; menu: string; closeMenu: string; nav: string; language: string; home: string;
  name: string; email: string; phone: string; message: string; date: string; time: string; service: string; details: string;
  optional: string; send: string; sending: string; sent: string; failed: string; notConfigured: string; tooMany: string;
  required: string; invalidEmail: string; tooLong: string; fixErrors: string;
  directions: string; hours: string; call: string; emailUs: string;
  privacy: string; terms: string; cookies: string; accessibility: string; legalEnglish: string; rights: string;
  notFoundTitle: string; notFoundBody: string; backHome: string; thanksTitle: string; thanksBody: string; errorTitle: string; errorBody: string;
};

export const UI_STRINGS: Record<SiteLocale, UI> = {
  en: {
    skip: "Skip to main content", menu: "Menu", closeMenu: "Close menu", nav: "Main", language: "Language", home: "Home",
    name: "Name", email: "Email", phone: "Phone", message: "Message", date: "Preferred date", time: "Preferred time", service: "Service", details: "Details",
    optional: "(optional)", send: "Send", sending: "Sending…", sent: "Thank you — your message has been sent. We'll be in touch soon.", failed: "Your message couldn't be sent. Please try again or contact us directly.", notConfigured: "This form isn't available right now. Please contact us by phone or email.", tooMany: "Too many attempts. Please wait a few minutes and try again.",
    required: "This field is required.", invalidEmail: "Enter a valid email address, like name@example.com.", tooLong: "This is too long.", fixErrors: "Please fix the highlighted fields.",
    directions: "Get directions", hours: "Opening hours", call: "Call", emailUs: "Email",
    privacy: "Privacy Policy", terms: "Terms & Conditions", cookies: "Cookie Policy", accessibility: "Accessibility", legalEnglish: "Legal pages are in English.", rights: "All rights reserved.",
    notFoundTitle: "Page not found", notFoundBody: "The page you're looking for doesn't exist or has moved.", backHome: "Back to the home page", thanksTitle: "Thank you", thanksBody: "Your message has been sent. We'll be in touch soon.", errorTitle: "Message not sent", errorBody: "Something went wrong. Please go back and try again, or contact us directly.",
  },
  es: {
    skip: "Saltar al contenido principal", menu: "Menú", closeMenu: "Cerrar menú", nav: "Principal", language: "Idioma", home: "Inicio",
    name: "Nombre", email: "Correo electrónico", phone: "Teléfono", message: "Mensaje", date: "Fecha preferida", time: "Hora preferida", service: "Servicio", details: "Detalles",
    optional: "(opcional)", send: "Enviar", sending: "Enviando…", sent: "Gracias: tu mensaje se ha enviado. Te responderemos pronto.", failed: "No se pudo enviar tu mensaje. Inténtalo de nuevo o contáctanos directamente.", notConfigured: "Este formulario no está disponible ahora. Contáctanos por teléfono o correo.", tooMany: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    required: "Este campo es obligatorio.", invalidEmail: "Escribe un correo válido, como nombre@ejemplo.com.", tooLong: "Es demasiado largo.", fixErrors: "Corrige los campos marcados.",
    directions: "Cómo llegar", hours: "Horario", call: "Llamar", emailUs: "Correo",
    privacy: "Política de privacidad", terms: "Términos y condiciones", cookies: "Política de cookies", accessibility: "Accesibilidad", legalEnglish: "Las páginas legales están en inglés.", rights: "Todos los derechos reservados.",
    notFoundTitle: "Página no encontrada", notFoundBody: "La página que buscas no existe o se ha movido.", backHome: "Volver al inicio", thanksTitle: "Gracias", thanksBody: "Tu mensaje se ha enviado. Te responderemos pronto.", errorTitle: "Mensaje no enviado", errorBody: "Algo salió mal. Vuelve e inténtalo de nuevo, o contáctanos directamente.",
  },
  fr: {
    skip: "Aller au contenu principal", menu: "Menu", closeMenu: "Fermer le menu", nav: "Principal", language: "Langue", home: "Accueil",
    name: "Nom", email: "E-mail", phone: "Téléphone", message: "Message", date: "Date souhaitée", time: "Heure souhaitée", service: "Prestation", details: "Détails",
    optional: "(facultatif)", send: "Envoyer", sending: "Envoi…", sent: "Merci, votre message a été envoyé. Nous vous répondrons bientôt.", failed: "Votre message n'a pas pu être envoyé. Réessayez ou contactez-nous directement.", notConfigured: "Ce formulaire n'est pas disponible pour le moment. Contactez-nous par téléphone ou e-mail.", tooMany: "Trop de tentatives. Patientez quelques minutes puis réessayez.",
    required: "Ce champ est obligatoire.", invalidEmail: "Saisissez une adresse e-mail valide, par ex. nom@exemple.com.", tooLong: "C'est trop long.", fixErrors: "Corrigez les champs signalés.",
    directions: "Itinéraire", hours: "Horaires", call: "Appeler", emailUs: "E-mail",
    privacy: "Politique de confidentialité", terms: "Conditions générales", cookies: "Politique relative aux cookies", accessibility: "Accessibilité", legalEnglish: "Les pages juridiques sont en anglais.", rights: "Tous droits réservés.",
    notFoundTitle: "Page introuvable", notFoundBody: "La page que vous cherchez n'existe pas ou a été déplacée.", backHome: "Retour à l'accueil", thanksTitle: "Merci", thanksBody: "Votre message a été envoyé. Nous vous répondrons bientôt.", errorTitle: "Message non envoyé", errorBody: "Une erreur s'est produite. Revenez en arrière et réessayez, ou contactez-nous directement.",
  },
  pt: {
    skip: "Ir para o conteúdo principal", menu: "Menu", closeMenu: "Fechar menu", nav: "Principal", language: "Idioma", home: "Início",
    name: "Nome", email: "E-mail", phone: "Telefone", message: "Mensagem", date: "Data preferida", time: "Horário preferido", service: "Serviço", details: "Detalhes",
    optional: "(opcional)", send: "Enviar", sending: "Enviando…", sent: "Obrigado! Sua mensagem foi enviada. Responderemos em breve.", failed: "Não foi possível enviar sua mensagem. Tente novamente ou fale conosco diretamente.", notConfigured: "Este formulário não está disponível agora. Fale conosco por telefone ou e-mail.", tooMany: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    required: "Este campo é obrigatório.", invalidEmail: "Informe um e-mail válido, como nome@exemplo.com.", tooLong: "Está muito longo.", fixErrors: "Corrija os campos destacados.",
    directions: "Como chegar", hours: "Horário de funcionamento", call: "Ligar", emailUs: "E-mail",
    privacy: "Política de Privacidade", terms: "Termos e Condições", cookies: "Política de Cookies", accessibility: "Acessibilidade", legalEnglish: "As páginas legais estão em inglês.", rights: "Todos os direitos reservados.",
    notFoundTitle: "Página não encontrada", notFoundBody: "A página que você procura não existe ou foi movida.", backHome: "Voltar ao início", thanksTitle: "Obrigado", thanksBody: "Sua mensagem foi enviada. Responderemos em breve.", errorTitle: "Mensagem não enviada", errorBody: "Algo deu errado. Volte e tente novamente, ou fale conosco diretamente.",
  },
  id: {
    skip: "Langsung ke konten utama", menu: "Menu", closeMenu: "Tutup menu", nav: "Utama", language: "Bahasa", home: "Beranda",
    name: "Nama", email: "Email", phone: "Telepon", message: "Pesan", date: "Tanggal pilihan", time: "Waktu pilihan", service: "Layanan", details: "Detail",
    optional: "(opsional)", send: "Kirim", sending: "Mengirim…", sent: "Terima kasih — pesan Anda telah terkirim. Kami akan segera menghubungi Anda.", failed: "Pesan Anda tidak dapat dikirim. Coba lagi atau hubungi kami langsung.", notConfigured: "Formulir ini belum tersedia. Silakan hubungi kami melalui telepon atau email.", tooMany: "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.",
    required: "Kolom ini wajib diisi.", invalidEmail: "Masukkan alamat email yang valid, mis. nama@contoh.com.", tooLong: "Terlalu panjang.", fixErrors: "Perbaiki kolom yang ditandai.",
    directions: "Petunjuk arah", hours: "Jam buka", call: "Telepon", emailUs: "Email",
    privacy: "Kebijakan Privasi", terms: "Syarat & Ketentuan", cookies: "Kebijakan Cookie", accessibility: "Aksesibilitas", legalEnglish: "Halaman hukum tersedia dalam bahasa Inggris.", rights: "Hak cipta dilindungi.",
    notFoundTitle: "Halaman tidak ditemukan", notFoundBody: "Halaman yang Anda cari tidak ada atau telah dipindahkan.", backHome: "Kembali ke beranda", thanksTitle: "Terima kasih", thanksBody: "Pesan Anda telah terkirim. Kami akan segera menghubungi Anda.", errorTitle: "Pesan tidak terkirim", errorBody: "Terjadi kesalahan. Kembali dan coba lagi, atau hubungi kami langsung.",
  },
  ru: {
    skip: "Перейти к основному содержанию", menu: "Меню", closeMenu: "Закрыть меню", nav: "Основное", language: "Язык", home: "Главная",
    name: "Имя", email: "Эл. почта", phone: "Телефон", message: "Сообщение", date: "Желаемая дата", time: "Желаемое время", service: "Услуга", details: "Подробности",
    optional: "(необязательно)", send: "Отправить", sending: "Отправка…", sent: "Спасибо! Сообщение отправлено. Мы скоро свяжемся с вами.", failed: "Не удалось отправить сообщение. Попробуйте ещё раз или свяжитесь с нами напрямую.", notConfigured: "Форма сейчас недоступна. Свяжитесь с нами по телефону или почте.", tooMany: "Слишком много попыток. Подождите несколько минут и попробуйте снова.",
    required: "Обязательное поле.", invalidEmail: "Введите корректный адрес, например name@example.com.", tooLong: "Слишком длинно.", fixErrors: "Исправьте отмеченные поля.",
    directions: "Как добраться", hours: "Часы работы", call: "Позвонить", emailUs: "Написать",
    privacy: "Политика конфиденциальности", terms: "Условия использования", cookies: "Политика в отношении cookie", accessibility: "Доступность", legalEnglish: "Юридические страницы — на английском языке.", rights: "Все права защищены.",
    notFoundTitle: "Страница не найдена", notFoundBody: "Страница не существует или была перемещена.", backHome: "На главную", thanksTitle: "Спасибо", thanksBody: "Сообщение отправлено. Мы скоро свяжемся с вами.", errorTitle: "Сообщение не отправлено", errorBody: "Что-то пошло не так. Вернитесь и попробуйте снова или свяжитесь с нами напрямую.",
  },
  zh: {
    skip: "跳到主要内容", menu: "菜单", closeMenu: "关闭菜单", nav: "主导航", language: "语言", home: "首页",
    name: "姓名", email: "电子邮箱", phone: "电话", message: "留言", date: "希望日期", time: "希望时间", service: "服务", details: "详细信息",
    optional: "（可选）", send: "发送", sending: "发送中…", sent: "谢谢！您的留言已发送，我们会尽快联系您。", failed: "留言发送失败，请重试或直接联系我们。", notConfigured: "此表单暂不可用，请通过电话或邮件联系我们。", tooMany: "尝试次数过多，请几分钟后再试。",
    required: "此项为必填项。", invalidEmail: "请输入有效的邮箱，例如 name@example.com。", tooLong: "内容过长。", fixErrors: "请修正标出的字段。",
    directions: "获取路线", hours: "营业时间", call: "致电", emailUs: "发邮件",
    privacy: "隐私政策", terms: "条款与条件", cookies: "Cookie 政策", accessibility: "无障碍声明", legalEnglish: "法律页面为英文版本。", rights: "保留所有权利。",
    notFoundTitle: "页面未找到", notFoundBody: "您要找的页面不存在或已移动。", backHome: "返回首页", thanksTitle: "谢谢", thanksBody: "您的留言已发送，我们会尽快联系您。", errorTitle: "留言未发送", errorBody: "出现问题，请返回重试或直接联系我们。",
  },
  hi: {
    skip: "मुख्य सामग्री पर जाएँ", menu: "मेनू", closeMenu: "मेनू बंद करें", nav: "मुख्य", language: "भाषा", home: "होम",
    name: "नाम", email: "ईमेल", phone: "फ़ोन", message: "संदेश", date: "पसंदीदा तारीख़", time: "पसंदीदा समय", service: "सेवा", details: "विवरण",
    optional: "(वैकल्पिक)", send: "भेजें", sending: "भेजा जा रहा है…", sent: "धन्यवाद — आपका संदेश भेज दिया गया है। हम जल्द ही संपर्क करेंगे।", failed: "आपका संदेश नहीं भेजा जा सका। फिर से कोशिश करें या सीधे हमसे संपर्क करें।", notConfigured: "यह फ़ॉर्म अभी उपलब्ध नहीं है। कृपया फ़ोन या ईमेल से संपर्क करें।", tooMany: "बहुत अधिक प्रयास। कुछ मिनट रुककर फिर कोशिश करें।",
    required: "यह फ़ील्ड ज़रूरी है।", invalidEmail: "मान्य ईमेल दर्ज करें, जैसे name@example.com।", tooLong: "यह बहुत लंबा है।", fixErrors: "कृपया चिह्नित फ़ील्ड ठीक करें।",
    directions: "रास्ता देखें", hours: "खुलने का समय", call: "कॉल करें", emailUs: "ईमेल करें",
    privacy: "गोपनीयता नीति", terms: "नियम और शर्तें", cookies: "कुकी नीति", accessibility: "सुलभता", legalEnglish: "कानूनी पेज अंग्रेज़ी में हैं।", rights: "सर्वाधिकार सुरक्षित।",
    notFoundTitle: "पेज नहीं मिला", notFoundBody: "आप जो पेज ढूँढ रहे हैं वह मौजूद नहीं है या हटा दिया गया है।", backHome: "होम पेज पर लौटें", thanksTitle: "धन्यवाद", thanksBody: "आपका संदेश भेज दिया गया है। हम जल्द ही संपर्क करेंगे।", errorTitle: "संदेश नहीं भेजा गया", errorBody: "कुछ गलत हो गया। वापस जाकर फिर कोशिश करें, या सीधे हमसे संपर्क करें।",
  },
  bn: {
    skip: "মূল বিষয়বস্তুতে যান", menu: "মেনু", closeMenu: "মেনু বন্ধ করুন", nav: "প্রধান", language: "ভাষা", home: "হোম",
    name: "নাম", email: "ইমেইল", phone: "ফোন", message: "বার্তা", date: "পছন্দের তারিখ", time: "পছন্দের সময়", service: "সেবা", details: "বিস্তারিত",
    optional: "(ঐচ্ছিক)", send: "পাঠান", sending: "পাঠানো হচ্ছে…", sent: "ধন্যবাদ — আপনার বার্তা পাঠানো হয়েছে। আমরা শিগগিরই যোগাযোগ করব।", failed: "আপনার বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন বা সরাসরি যোগাযোগ করুন।", notConfigured: "এই ফর্মটি এখন উপলব্ধ নয়। ফোন বা ইমেইলে যোগাযোগ করুন।", tooMany: "অনেকবার চেষ্টা করা হয়েছে। কয়েক মিনিট পর আবার চেষ্টা করুন।",
    required: "এই ঘরটি পূরণ করা আবশ্যক।", invalidEmail: "একটি সঠিক ইমেইল লিখুন, যেমন name@example.com।", tooLong: "এটি খুব দীর্ঘ।", fixErrors: "চিহ্নিত ঘরগুলো ঠিক করুন।",
    directions: "দিকনির্দেশনা", hours: "খোলার সময়", call: "ফোন করুন", emailUs: "ইমেইল করুন",
    privacy: "গোপনীয়তা নীতি", terms: "শর্তাবলি", cookies: "কুকি নীতি", accessibility: "অ্যাক্সেসিবিলিটি", legalEnglish: "আইনি পাতাগুলো ইংরেজিতে।", rights: "সর্বস্বত্ব সংরক্ষিত।",
    notFoundTitle: "পাতা পাওয়া যায়নি", notFoundBody: "আপনি যে পাতাটি খুঁজছেন তা নেই বা সরানো হয়েছে।", backHome: "হোম পাতায় ফিরুন", thanksTitle: "ধন্যবাদ", thanksBody: "আপনার বার্তা পাঠানো হয়েছে। আমরা শিগগিরই যোগাযোগ করব।", errorTitle: "বার্তা পাঠানো হয়নি", errorBody: "কিছু ভুল হয়েছে। ফিরে গিয়ে আবার চেষ্টা করুন, বা সরাসরি যোগাযোগ করুন।",
  },
  ar: {
    skip: "انتقل إلى المحتوى الرئيسي", menu: "القائمة", closeMenu: "إغلاق القائمة", nav: "الرئيسية", language: "اللغة", home: "الرئيسية",
    name: "الاسم", email: "البريد الإلكتروني", phone: "الهاتف", message: "الرسالة", date: "التاريخ المفضّل", time: "الوقت المفضّل", service: "الخدمة", details: "التفاصيل",
    optional: "(اختياري)", send: "إرسال", sending: "جارٍ الإرسال…", sent: "شكرًا لك — تم إرسال رسالتك وسنتواصل معك قريبًا.", failed: "تعذّر إرسال رسالتك. حاول مرة أخرى أو تواصل معنا مباشرة.", notConfigured: "هذا النموذج غير متاح حاليًا. تواصل معنا بالهاتف أو البريد الإلكتروني.", tooMany: "محاولات كثيرة جدًا. انتظر بضع دقائق ثم حاول مرة أخرى.",
    required: "هذا الحقل مطلوب.", invalidEmail: "أدخل بريدًا إلكترونيًا صالحًا، مثل name@example.com.", tooLong: "النص طويل جدًا.", fixErrors: "يُرجى تصحيح الحقول المحددة.",
    directions: "احصل على الاتجاهات", hours: "ساعات العمل", call: "اتصال", emailUs: "راسلنا",
    privacy: "سياسة الخصوصية", terms: "الشروط والأحكام", cookies: "سياسة ملفات تعريف الارتباط", accessibility: "إمكانية الوصول", legalEnglish: "الصفحات القانونية باللغة الإنجليزية.", rights: "جميع الحقوق محفوظة.",
    notFoundTitle: "الصفحة غير موجودة", notFoundBody: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.", backHome: "العودة إلى الصفحة الرئيسية", thanksTitle: "شكرًا لك", thanksBody: "تم إرسال رسالتك وسنتواصل معك قريبًا.", errorTitle: "لم تُرسل الرسالة", errorBody: "حدث خطأ ما. ارجع وحاول مرة أخرى، أو تواصل معنا مباشرة.",
  },
};
