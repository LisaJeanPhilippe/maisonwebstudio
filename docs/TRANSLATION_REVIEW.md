# Translation review

## Status

| Language | Code | UI dictionary | Review |
| --- | --- | --- | --- |
| English | `en` | Source | — |
| Chinese (Simplified) | `zh` (`zh-Hans`) | `src/i18n/messages/zh.ts` | **Needs native-speaker review** |
| Spanish | `es` | `es.ts` | **Needs native-speaker review** |
| Hindi | `hi` | `hi.ts` | **Needs native-speaker review** |
| Arabic (RTL) | `ar` | `ar.ts` | **Needs native-speaker review** (also check RTL layout and plural forms) |
| French | `fr` | `fr.ts` | **Needs native-speaker review** |
| Bengali | `bn` | `bn.ts` | **Needs native-speaker review** |
| Portuguese (Brazil) | `pt` (`pt-BR`) | `pt.ts` | **Needs native-speaker review** |
| Russian | `ru` | `ru.ts` | **Needs native-speaker review** |
| Indonesian | `id` | `id.ts` | **Needs native-speaker review** |

All non-English UI text is a machine-assisted draft. It is complete (the `tests/unit/i18n.spec.ts` test fails if any key or `{placeholder}` is missing), but it has not been checked by native speakers.

## English-only by design (do not machine-translate)

These are contractual or legal and are shown in English with a notice, marked `lang="en"`:

- Privacy Policy, Terms & Conditions, Cookie Policy, Payment & Refund Policy, Accessibility Statement (`src/content/legal/`)
- Payment-agreement points and checkbox text on the review step (`src/i18n/legal-en.ts`)
- Stripe's "submit" message on the checkout page and the order-confirmation email (`src/lib/server/email.ts`)

Only add translations of these after (1) the English text is approved by an attorney and (2) a professional legal translator has translated it. Decide with your attorney which language version prevails, and keep the "English is binding" notice accurate.

## Reviewer instructions

1. Review in context: run the site and open every page in the language, including the configurator steps, errors (submit empty forms) and the 404 page.
2. Check tone (friendly, premium, plain), terminology consistency (package names stay "Starter / Business / Premium"), number/date/currency formats, and plural forms (Arabic: zero/one/two/few/many/other; Russian: one/few/many/other).
3. Keep `{placeholders}` exactly as they are.
4. Run `npm run test:unit` after edits, then update this table with the reviewer's name and date.
