import { z } from "zod";

//#region src/constants/app.d.ts
declare const APP_NAME = "Read Frog";
//#endregion
//#region src/constants/auth.d.ts
declare const AUTH_BASE_PATH = "/api/identity";
declare const AUTH_COOKIE_PATTERNS: readonly ["better-auth.session_token"];
//#endregion
//#region src/types/languages.d.ts
declare const LANG_CODE_ISO6393_OPTIONS: readonly ["eng", "cmn", "cmn-Hant", "yue", "spa", "rus", "arb", "ben", "hin", "por", "ind", "jpn", "fra", "deu", "jav", "kor", "tel", "vie", "mar", "ita", "tam", "tur", "urd", "guj", "pol", "ukr", "kan", "mai", "mal", "pes", "mya", "swh", "sun", "ron", "pan", "bho", "amh", "hau", "fuv", "bos", "hrv", "nld", "srp", "tha", "ckb", "yor", "uzn", "zlm", "ibo", "npi", "ceb", "skr", "tgl", "hun", "azj", "sin", "koi", "ell", "ces", "mag", "run", "bel", "plt", "qug", "mad", "nya", "zyb", "pbu", "kin", "zul", "bul", "swe", "lin", "som", "hms", "hnj", "ilo", "kaz"];
declare const langCodeISO6393Schema: z.ZodEnum<{
  eng: "eng";
  cmn: "cmn";
  "cmn-Hant": "cmn-Hant";
  yue: "yue";
  spa: "spa";
  rus: "rus";
  arb: "arb";
  ben: "ben";
  hin: "hin";
  por: "por";
  ind: "ind";
  jpn: "jpn";
  fra: "fra";
  deu: "deu";
  jav: "jav";
  kor: "kor";
  tel: "tel";
  vie: "vie";
  mar: "mar";
  ita: "ita";
  tam: "tam";
  tur: "tur";
  urd: "urd";
  guj: "guj";
  pol: "pol";
  ukr: "ukr";
  kan: "kan";
  mai: "mai";
  mal: "mal";
  pes: "pes";
  mya: "mya";
  swh: "swh";
  sun: "sun";
  ron: "ron";
  pan: "pan";
  bho: "bho";
  amh: "amh";
  hau: "hau";
  fuv: "fuv";
  bos: "bos";
  hrv: "hrv";
  nld: "nld";
  srp: "srp";
  tha: "tha";
  ckb: "ckb";
  yor: "yor";
  uzn: "uzn";
  zlm: "zlm";
  ibo: "ibo";
  npi: "npi";
  ceb: "ceb";
  skr: "skr";
  tgl: "tgl";
  hun: "hun";
  azj: "azj";
  sin: "sin";
  koi: "koi";
  ell: "ell";
  ces: "ces";
  mag: "mag";
  run: "run";
  bel: "bel";
  plt: "plt";
  qug: "qug";
  mad: "mad";
  nya: "nya";
  zyb: "zyb";
  pbu: "pbu";
  kin: "kin";
  zul: "zul";
  bul: "bul";
  swe: "swe";
  lin: "lin";
  som: "som";
  hms: "hms";
  hnj: "hnj";
  ilo: "ilo";
  kaz: "kaz";
}>;
declare const langCodeISO6391Schema: z.ZodEnum<{
  en: "en";
  zh: "zh";
  "zh-TW": "zh-TW";
  es: "es";
  ru: "ru";
  ar: "ar";
  bn: "bn";
  hi: "hi";
  pt: "pt";
  id: "id";
  ja: "ja";
  fr: "fr";
  de: "de";
  jv: "jv";
  ko: "ko";
  te: "te";
  vi: "vi";
  mr: "mr";
  it: "it";
  ta: "ta";
  tr: "tr";
  ur: "ur";
  gu: "gu";
  pl: "pl";
  uk: "uk";
  kn: "kn";
  ml: "ml";
  fa: "fa";
  my: "my";
  sw: "sw";
  su: "su";
  ro: "ro";
  pa: "pa";
  am: "am";
  ha: "ha";
  ff: "ff";
  bs: "bs";
  hr: "hr";
  nl: "nl";
  sr: "sr";
  th: "th";
  ku: "ku";
  yo: "yo";
  uz: "uz";
  ms: "ms";
  ig: "ig";
  ne: "ne";
  tl: "tl";
  hu: "hu";
  az: "az";
  si: "si";
  el: "el";
  cs: "cs";
  ny: "ny";
  rw: "rw";
  zu: "zu";
  bg: "bg";
  sv: "sv";
  ln: "ln";
  so: "so";
  kk: "kk";
  be: "be";
}>;
type LangCodeISO6391 = z.infer<typeof langCodeISO6391Schema>;
type LangCodeISO6393 = z.infer<typeof langCodeISO6393Schema>;
declare const LANG_CODE_TO_EN_NAME: Record<LangCodeISO6393, string>;
declare const LANG_CODE_TO_LOCALE_NAME: Record<LangCodeISO6393, string>;
declare const ISO6393_TO_6391: Record<LangCodeISO6393, LangCodeISO6391 | undefined>;
declare const LOCALE_TO_ISO6393: Partial<Record<LangCodeISO6391, LangCodeISO6393>>;
declare const langLevel: z.ZodEnum<{
  beginner: "beginner";
  intermediate: "intermediate";
  advanced: "advanced";
}>;
type LangLevel = z.infer<typeof langLevel>;
declare const RTL_LANG_CODES: readonly LangCodeISO6393[];
//#endregion
//#region src/constants/dictionary.d.ts
/**
 * This file is used to assemble a system prompt according to different languages.
 */
interface DictionaryFieldLabels {
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  extendedVocabulary: string;
  synonyms: string;
  antonyms: string;
  root: string;
  grammarPoint: string;
  explanation: string;
  uniqueAttributes: string;
}
declare const LANG_DICTIONARY_LABELS: Record<LangCodeISO6393, DictionaryFieldLabels>;
//#endregion
//#region src/constants/url.d.ts
declare const CHROME_EXTENSION_ORIGIN = "chrome-extension://modkelfkcfjpgbfmnbnllalkiogfofhb";
declare const EDGE_EXTENSION_ORIGIN = "extension://cbcbomlgikfbdnoaohcjfledcoklcjbo";
declare const TRUSTED_ORIGINS: string[];
declare const WEBSITE_DEV_PORT = 8888;
declare const WEBSITE_DEV_URL = "http://localhost:8888";
declare const WEBSITE_PROD_URL = "https://www.readfrog.app";
declare const READFROG_DOMAIN = "readfrog.app";
declare const LOCALHOST_DOMAIN = "localhost";
declare const AUTH_DOMAINS: readonly ["readfrog.app", "localhost"];
//#endregion
//#region src/schemas/version.d.ts
/**
 * Semantic version regex pattern
 * Matches versions like: 1.0.0, 10.20.30
 * Does NOT match: v1.0.0, 1.0.0-alpha, 1.0, 1.-1.0
 */
declare const SEMANTIC_VERSION_REGEX: RegExp;
/**
 * Zod schema for semantic version validation
 * Validates semantic version strings according to SemVer conventions
 * Requires exactly 3 parts: major.minor.patch
 *
 * @example
 * semanticVersionSchema.parse('1.0.0') // ✓ valid
 * semanticVersionSchema.parse('10.20.30') // ✓ valid
 * semanticVersionSchema.parse('1.11') // ✗ throws error (must have 3 parts)
 * semanticVersionSchema.parse('v1.0.0') // ✗ throws error
 * semanticVersionSchema.parse('1.0.0-alpha') // ✗ throws error
 */
declare const semanticVersionSchema: z.ZodString;
/**
 * Type for semantic version string
 */
type SemanticVersion = z.infer<typeof semanticVersionSchema>;
/**
 * Version type classification
 */
type VersionType = 'major' | 'minor' | 'patch';
/**
 * Parse a semantic version string into its components
 * Validates the input using semanticVersionSchema before parsing
 *
 * @param version - The version string to parse (must be in format major.minor.patch)
 * @returns An object containing the major, minor, and patch numbers
 * @throws {z.ZodError} If the version string is invalid
 *
 * @example
 * parseSemanticVersion('1.2.3') // { major: 1, minor: 2, patch: 3 }
 * parseSemanticVersion('10.20.30') // { major: 10, minor: 20, patch: 30 }
 * parseSemanticVersion('1.0') // throws error - must have 3 parts
 * parseSemanticVersion('v1.0.0') // throws error - invalid format
 */
declare function parseSemanticVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
};
/**
 * Determine the version type (major, minor, or patch) based on semantic versioning rules
 * Validates the input using semanticVersionSchema before classification
 *
 * @param version - The version string to classify
 * @returns The version type classification
 * @throws {z.ZodError} If the version string is invalid
 *
 * @example
 * getVersionType('1.0.0') // 'major'
 * getVersionType('1.2.0') // 'minor'
 * getVersionType('1.2.3') // 'patch'
 * getVersionType('1.0') // throws error - must have 3 parts
 */
declare function getVersionType(version: string): VersionType;
//#endregion
export { APP_NAME, AUTH_BASE_PATH, AUTH_COOKIE_PATTERNS, AUTH_DOMAINS, CHROME_EXTENSION_ORIGIN, DictionaryFieldLabels, EDGE_EXTENSION_ORIGIN, ISO6393_TO_6391, LANG_CODE_ISO6393_OPTIONS, LANG_CODE_TO_EN_NAME, LANG_CODE_TO_LOCALE_NAME, LANG_DICTIONARY_LABELS, LOCALE_TO_ISO6393, LOCALHOST_DOMAIN, LangCodeISO6391, LangCodeISO6393, LangLevel, READFROG_DOMAIN, RTL_LANG_CODES, SEMANTIC_VERSION_REGEX, SemanticVersion, TRUSTED_ORIGINS, VersionType, WEBSITE_DEV_PORT, WEBSITE_DEV_URL, WEBSITE_PROD_URL, getVersionType, langCodeISO6391Schema, langCodeISO6393Schema, langLevel, parseSemanticVersion, semanticVersionSchema };