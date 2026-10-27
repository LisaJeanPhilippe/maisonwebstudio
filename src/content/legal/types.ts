export type LegalBlock = string | { list: string[] };
export type LegalSection = { heading: string; body: LegalBlock[] };
export type LegalDocument = { intro: string; sections: LegalSection[] };
