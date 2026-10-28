# Accessibility testing

Target: WCAG 2.2 Level AA. Automated checks catch only part of the issues; the manual checklist below must be completed by a person before launch and after significant UI changes. Do not describe the site as "ADA compliant" or "fully conformant" unless an independent audit supports it.

## Automated (in `npm test`)

- axe-core (WCAG 2.0/2.1/2.2 A & AA tags) on every page, 404 and legal page in English, Arabic, Chinese and Hindi, at 1440px and 390px; on every configurator step including error states; and on the open mobile menu.
- Horizontal overflow at 320, 390, 768, 1024, 1440, 1920px in all 10 languages (320px ≈ 1280px at 400% zoom — WCAG 1.4.10).
- Text-spacing overrides (WCAG 1.4.12).
- Keyboard: skip link, language menu (Enter/Escape/focus return), configurator focus management and error summary.
- One `h1` per page; `lang` and `dir` per locale.
- Lighthouse (manual run) accessibility 100 on tested pages.

## Manual checklist (person required)

Screen readers: NVDA + Firefox or Chrome (Windows), VoiceOver + Safari (macOS and iOS), TalkBack + Chrome (Android).

- [ ] Complete an order with keyboard only (Tab/Shift+Tab/Space/Enter/arrows): focus always visible, never trapped, logical order; drag-and-drop upload has a working "Browse files" alternative.
- [ ] Complete an order with each screen reader: step changes announced, every field's label/hint/error read, error summary links move focus, upload progress and results announced, payment agreement read in English with correct pronunciation.
- [ ] Mobile menu: focus moves in, background inert, Escape closes, focus returns to the button.
- [ ] Arabic with a screen reader: reading order right-to-left, numbers and Latin brand names pronounced sensibly.
- [ ] 200% browser zoom and 400% zoom at 1280px wide: no loss of content or function.
- [ ] Windows High Contrast / forced colors: focus rings, radios/checkboxes, buttons visible.
- [ ] `prefers-reduced-motion`: no parallax or entrance motion; marquee paused/hidden.
- [ ] Industries marquee pause button works and is reachable.
- [ ] Touch targets ≥ 24×24 CSS px (WCAG 2.5.8) on phones.
- [ ] Content reading level and link text make sense out of context.
- [ ] Sample demo sites (`/demo/*`): note their known limits in the Accessibility Statement.
- [ ] Stripe Checkout page: Stripe's responsibility, but check that the hand-off and return are announced.

Record date, tester, assistive technology/browser versions and findings. Update the Accessibility Statement (`src/content/legal/accessibility.ts`) with the review date and any known issues.
