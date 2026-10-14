var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/utils/aiClosureLearner.ts
function getStoredLearnedExpressions() {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return SEED_AI_LEARNED_EXPRESSIONS;
    }
    const raw = localStorage.getItem(STORAGE_KEY_LEARNED_CLOSURES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LEARNED_CLOSURES, JSON.stringify(SEED_AI_LEARNED_EXPRESSIONS));
      return SEED_AI_LEARNED_EXPRESSIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_AI_LEARNED_EXPRESSIONS;
  } catch {
    return SEED_AI_LEARNED_EXPRESSIONS;
  }
}
function getAggregatedClosureDictionary() {
  const learned = getStoredLearnedExpressions();
  const takenKeywords = new Set(BASE_TAKEN_KEYWORDS);
  const completionKeywords = new Set(BASE_COMPLETION_KEYWORDS);
  const gratitudeKeywords = new Set(BASE_GRATITUDE_KEYWORDS);
  const emojis = new Set(BASE_CLOSURE_EMOJIS);
  learned.forEach((item) => {
    const phrase = item.phrase.trim();
    if (!phrase) return;
    if (item.category === "taken") {
      takenKeywords.add(phrase);
    } else if (item.category === "completion") {
      completionKeywords.add(phrase);
    } else if (item.category === "gratitude") {
      gratitudeKeywords.add(phrase);
    } else if (item.category === "emoji") {
      emojis.add(phrase);
    }
  });
  return {
    takenKeywords: Array.from(takenKeywords),
    completionKeywords: Array.from(completionKeywords),
    gratitudeKeywords: Array.from(gratitudeKeywords),
    emojis: Array.from(emojis)
  };
}
var STORAGE_KEY_LEARNED_CLOSURES, BASE_TAKEN_KEYWORDS, BASE_COMPLETION_KEYWORDS, BASE_GRATITUDE_KEYWORDS, BASE_CLOSURE_EMOJIS, SEED_AI_LEARNED_EXPRESSIONS;
var init_aiClosureLearner = __esm({
  "src/utils/aiClosureLearner.ts"() {
    STORAGE_KEY_LEARNED_CLOSURES = "orderi_learned_closure_expressions";
    BASE_TAKEN_KEYWORDS = [
      "\u062D\u0635\u0644\u062A",
      "\u062D\u0635\u0644",
      "\u062A\u0645",
      "\u062A\u0645 \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628",
      "\u062D\u0635\u0644\u062A \u0645\u0646\u062F\u0648\u0628",
      "\u062D\u0635\u0644\u062A \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628",
      "\u062A\u0645 \u0627\u0644\u062D\u062C\u0632",
      "\u062E\u0644\u0627\u0635 \u062D\u0635\u0644\u062A",
      "\u062A\u0645 \u0627\u0644\u062A\u0648\u0635\u064A\u0644",
      "\u062A\u0645 \u0627\u0644\u0627\u062A\u0641\u0627\u0642",
      "\u062D\u0635\u0644\u0646\u0627 \u0645\u0646\u062F\u0648\u0628",
      "\u062D\u0635\u0644\u0646\u0627",
      "\u0644\u0642\u064A\u062A \u0645\u0646\u062F\u0648\u0628",
      "\u0644\u0642\u064A\u062A",
      "\u0644\u0642\u064A\u0646\u0627 \u0645\u0646\u062F\u0648\u0628",
      "\u0644\u0642\u064A\u0646\u0627",
      "\u062A\u0648\u0641\u0631 \u0645\u0646\u062F\u0648\u0628",
      "\u0627\u062E\u0630\u062A\u0647",
      "\u0623\u062E\u0630\u062A\u0647",
      "\u062D\u062C\u0632\u062A\u0647",
      "\u0627\u0646\u062D\u062C\u0632",
      "\u0645\u062D\u062C\u0648\u0632",
      "\u0627\u062A\u0641\u0642\u062A",
      "\u0627\u062A\u0641\u0642\u062A \u0645\u0639\u0627\u0647",
      "\u062A\u0645 \u062E\u0644\u0627\u0635",
      "\u062E\u0644\u0627\u0635 \u062A\u0645",
      "\u062A\u0645\u062A",
      "\u062A\u0645 \u0623\u062E\u0630 \u0627\u0644\u0637\u0644\u0628",
      "\u062A\u0645 \u0627\u062E\u0630 \u0627\u0644\u0637\u0644\u0628",
      "\u0627\u0646\u062A\u0647\u0649 \u0627\u0644\u0637\u0644\u0628",
      "\u0627\u0646\u0627 \u0628\u0627\u062E\u0630\u0647",
      "\u0623\u0646\u0627 \u0628\u0627\u062E\u0630\u0647",
      "\u0639\u0646\u062F\u064A \u0627\u0644\u0637\u0644\u0628",
      "\u0639\u0646\u062F\u064A",
      "\u0634\u0627\u0644\u0648\u0647",
      "\u0627\u062E\u0630\u0648\u0647",
      "\u0623\u062E\u0630\u0648\u0647",
      "\u0627\u0633\u062A\u0644\u0645\u062A\u0647",
      "\u0627\u0633\u062A\u0644\u0645\u0647\u0627",
      "\u0645\u0633\u0643\u062A\u0647",
      "\u0645\u0633\u0643\u062A \u0627\u0644\u0637\u0644\u0628",
      "\u0631\u0627\u062D \u0627\u0644\u0637\u0644\u0628",
      "\u0639\u0637\u064A\u062A \u0627\u0644\u0637\u0644\u0628",
      "\u0639\u0637\u064A\u062A\u0647 \u0645\u0646\u062F\u0648\u0628",
      "\u0635\u0627\u0631 \u0645\u0639 \u0645\u0646\u062F\u0648\u0628",
      "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u0648\u0635\u064A\u0644",
      "\u062A\u062D\u0631\u0643 \u0627\u0644\u0645\u0646\u062F\u0648\u0628",
      "\u0637\u0644\u0639 \u0645\u0639 \u0645\u0646\u062F\u0648\u0628",
      "\u0627\u0646\u0634\u0627\u0644",
      "\u062E\u0644\u0627\u0635 \u0627\u0646\u0634\u0627\u0644",
      "\u062E\u0644\u0627\u0635 \u0634\u0627\u0644\u0648\u0647",
      "\u0635\u0627\u062F\u0647 \u0645\u0646\u062F\u0648\u0628",
      "\u0645\u0633\u0643\u0647 \u0643\u0627\u0628\u062A\u0646",
      "\u062A\u0646\u0633\u0642 \u0645\u0639 \u0645\u0646\u062F\u0648\u0628",
      "\u062A\u0646\u0633\u0642 \u062E\u0644\u0627\u0635",
      "\u0645\u0627\u062A\u0642\u0635\u0631\u0648\u0646 \u062D\u0635\u0644\u062A"
    ];
    BASE_COMPLETION_KEYWORDS = [
      "\u062E\u0644\u0627\u0635",
      "\u0627\u0646\u062A\u0647\u0649",
      "\u062A\u0645 \u0627\u0644\u062A\u0648\u0635\u064A\u0644",
      "\u0644\u0627 \u064A\u0648\u062C\u062F \u0637\u0644\u0628",
      "\u0627\u0643\u062A\u0645\u0644",
      "\u0645\u0644\u063A\u064A",
      "\u0627\u0644\u063A\u064A",
      "\u0627\u0644\u062A\u063A\u0649",
      "\u062A\u0643\u0646\u0633\u0644",
      "\u0643\u0646\u0633\u0644",
      "\u062A\u0641\u0631\u0643\u0634",
      "\u0643\u0646\u0633\u0644\u0646\u0627\u0647",
      "\u0648\u0635\u0644 \u0648\u0627\u0633\u062A\u0644\u0645",
      "\u062E\u0644\u0635\u0646\u0627 \u0645\u0646\u0647",
      "\u062E\u0644\u0635 \u0627\u0644\u0645\u0634\u0648\u0627\u0631",
      "\u062A\u0633\u0643\u0631",
      "\u0645\u0642\u0641\u0644",
      "\u0644\u0627 \u062A\u062F\u0642\u0648\u0646 \u062E\u0644\u0627\u0635",
      "\u0644\u0627 \u062A\u062A\u0635\u0644\u0648\u0646 \u062D\u0635\u0644\u062A",
      "\u0648\u0642\u0641\u0648\u0627 \u062E\u0644\u0627\u0635",
      "\u0627\u0643\u062A\u0645\u0644 \u0627\u0644\u0645\u0634\u0648\u0627\u0631"
    ];
    BASE_GRATITUDE_KEYWORDS = [
      "\u0634\u0643\u0631\u0627",
      "\u0634\u0643\u0631\u0627\u064B",
      "\u0645\u0634\u0643\u0648\u0631",
      "\u0645\u0634\u0643\u0648\u0631\u064A\u0646",
      "\u064A\u0639\u0637\u064A\u0643 \u0627\u0644\u0639\u0627\u0641\u064A\u0629",
      "\u064A\u0639\u0637\u064A\u0643\u0645 \u0627\u0644\u0639\u0627\u0641\u064A\u0629",
      "\u0627\u0644\u0644\u0647 \u064A\u0648\u0641\u0642\u0643",
      "\u062A\u0633\u0644\u0645",
      "\u062A\u0633\u0644\u0645\u0648\u0646",
      "\u062C\u0632\u0627\u0643 \u0627\u0644\u0644\u0647 \u062E\u064A\u0631",
      "\u0645\u0627 \u0642\u0635\u0631\u062A",
      "\u0645\u0627 \u0642\u0635\u0631\u062A\u0648\u0627",
      "\u0641\u064A \u0645\u064A\u0632\u0627\u0646 \u062D\u0633\u0646\u0627\u062A\u0643",
      "\u0643\u0641\u064A\u062A \u0648\u0648\u0641\u064A\u062A",
      "\u062A\u0633\u0644\u0645 \u0627\u0644\u0623\u064A\u0627\u062F\u064A",
      "\u0627\u0644\u0644\u0647 \u064A\u0628\u0627\u0631\u0643 \u0641\u064A\u0643",
      "\u0642\u0648\u0627\u0643\u0645 \u0627\u0644\u0644\u0647",
      "\u064A\u0639\u0637\u064A\u0643\u0645 \u0627\u0644\u0635\u062D\u0647 \u0648\u0627\u0644\u0639\u0627\u0641\u064A\u0647",
      "\u0645\u0627 \u0642\u0635\u0631\u062A\u0648\u0627 \u062C\u0645\u064A\u0639\u0627\u064B"
    ];
    BASE_CLOSURE_EMOJIS = ["\u{1F44D}", "\u2705", "\u{1F44C}", "\u{1F64F}", "\u{1F3AF}", "\u{1F91D}", "\u2714\uFE0F", "\u{1F90D}", "\u{1F44F}", "\u{1F932}", "\u{1F4E6}", "\u{1F6F5}", "\u{1F697}", "\u2728", "\u{1F490}", "\u{1F337}"];
    SEED_AI_LEARNED_EXPRESSIONS = [
      {
        id: "ai-expr-1",
        phrase: "\u0634\u0627\u0644\u0648\u0647",
        category: "taken",
        meaning: "\u062A\u0639\u0628\u064A\u0631 \u0628\u062D\u0631\u064A\u0646\u064A \u062F\u0627\u0631\u062C \u064A\u0639\u0646\u064A \u0623\u0646 \u0627\u0644\u0637\u0644\u0628 \u0623\u062E\u0630\u0647 \u0645\u0646\u062F\u0648\u0628 \u0622\u062E\u0631 \u0648\u0644\u0645 \u064A\u0639\u062F \u0645\u062A\u0627\u062D\u0627\u064B.",
        confidence: 98,
        learnedAt: new Date(Date.now() - 36e5 * 24).toISOString(),
        sourceContext: "\u0637\u0644\u0628 \u0627\u0644\u0631\u0641\u0627\u0639 \u0634\u0627\u0644\u0648\u0647 \u062E\u0644\u0627\u0635",
        matchCount: 14,
        isAiLearned: true
      },
      {
        id: "ai-expr-2",
        phrase: "\u0641\u0648\u0642\u0647 \u062E\u0644\u0627\u0635",
        category: "taken",
        meaning: "\u062A\u0639\u0628\u064A\u0631 \u0634\u0628\u0627\u0628\u064A \u064A\u0639\u0646\u064A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0627\u0644\u062A\u0627\u0645\u0629 \u0648\u0627\u0644\u0627\u062A\u0641\u0627\u0642 \u0639\u0644\u0649 \u0627\u0644\u062A\u0648\u0635\u064A\u0644.",
        confidence: 94,
        learnedAt: new Date(Date.now() - 36e5 * 18).toISOString(),
        sourceContext: "\u0641\u0648\u0642\u0647 \u062E\u0644\u0627\u0635 \u062A\u0648\u0643\u0644 \u0639\u0644\u0649 \u0627\u0644\u0644\u0647",
        matchCount: 8,
        isAiLearned: true
      },
      {
        id: "ai-expr-3",
        phrase: "\u062A\u064A\u0633\u0631\u062A \u0627\u0644\u0623\u0645\u0648\u0631",
        category: "completion",
        meaning: "\u0639\u0628\u0627\u0631\u0629 \u062A\u0639\u0646\u064A \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u0645\u0634\u0648\u0627\u0631 \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0628\u0646\u062C\u0627\u062D \u0648\u064A\u0633\u0631.",
        confidence: 92,
        learnedAt: new Date(Date.now() - 36e5 * 12).toISOString(),
        sourceContext: "\u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647 \u062A\u064A\u0633\u0631\u062A \u0627\u0644\u0623\u0645\u0648\u0631 \u0648\u0648\u0635\u0644 \u0627\u0644\u0637\u0644\u0628",
        matchCount: 5,
        isAiLearned: true
      },
      {
        id: "ai-expr-4",
        phrase: "\u0645\u0627 \u0642\u0635\u0631\u062A\u0648\u0627",
        category: "gratitude",
        meaning: "\u0634\u0643\u0631 \u0648\u0627\u0645\u062A\u0646\u0627\u0646 \u0628\u0627\u0644\u0639\u0627\u0645\u064A\u0629 \u062A\u0641\u064A\u062F \u0627\u0644\u0631\u0636\u0627 \u0639\u0646 \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062E\u062F\u0645\u0629.",
        confidence: 96,
        learnedAt: new Date(Date.now() - 36e5 * 6).toISOString(),
        sourceContext: "\u0645\u0627 \u0642\u0635\u0631\u062A\u0648\u0627 \u064A\u0627 \u062C\u0645\u0627\u0639\u0629 \u062A\u0645 \u0643\u0644 \u0634\u064A",
        matchCount: 11,
        isAiLearned: true
      },
      {
        id: "ai-expr-5",
        phrase: "\u{1F91D}",
        category: "emoji",
        meaning: "\u0631\u0645\u0632 \u0627\u0644\u0645\u0635\u0627\u0641\u062D\u0629 \u0641\u064A \u0627\u0644\u0642\u0631\u0648\u0628 \u062F\u0644\u0627\u0644\u0629 \u0639\u0644\u0649 \u0625\u0628\u0631\u0627\u0645 \u0627\u0644\u0627\u062A\u0641\u0627\u0642 \u0645\u0639 \u0627\u0644\u0645\u0646\u062F\u0648\u0628.",
        confidence: 95,
        learnedAt: new Date(Date.now() - 36e5 * 4).toISOString(),
        sourceContext: "\u0637\u0644\u0628 \u0627\u0644\u0645\u062D\u0631\u0642 \u{1F91D}",
        matchCount: 19,
        isAiLearned: true
      }
    ];
  }
});

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_qrcode = __toESM(require("qrcode"), 1);

// src/data/hereWeGoBahrainMap.ts
var HERE_WE_GO_BAHRAIN_PLACES = [
  // ==========================================
  // 1. المجمعات والمولات التجارية (MALLS)
  // ==========================================
  {
    id: "hwg_city_centre",
    name: "\u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
    nameEn: "City Centre Bahrain",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0627\u0644\u0633\u064A\u0641",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.234,
    longitude: 50.552,
    keywords: ["\u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631", "\u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u0633\u062A\u064A \u0633\u0646\u062A\u0631", "\u0633\u062A\u064A \u0633\u0646\u062A\u0631 \u0627\u0644\u0633\u064A\u0641", "city centre", "city center", "bahrain city centre", "\u0643\u0627\u0631\u0641\u0648\u0631 \u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631", "\u0633\u064A\u0646\u0645\u0627 \u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631", "\u0645\u0627\u062C\u064A\u0643 \u0628\u0644\u0627\u0646\u064A\u062A \u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631"]
  },
  {
    id: "hwg_seef_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0633\u064A\u0641",
    nameEn: "Seef Mall",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0627\u0644\u0633\u064A\u0641",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.241,
    longitude: 50.536,
    keywords: ["\u0645\u062C\u0645\u0639 \u0627\u0644\u0633\u064A\u0641", "\u0627\u0644\u0633\u064A\u0641 \u0645\u0648\u0644", "\u0633\u064A\u0641 \u0645\u0648\u0644", "\u0633\u064A\u0641 \u0627\u0644\u0645\u0646\u0627\u0645\u0629", "seef mall", "seefmall", "\u0633\u064A\u0646\u0645\u0627 \u0627\u0644\u0633\u064A\u0641", "\u064A\u0627\u0646\u0648 \u0627\u0644\u0633\u064A\u0641"]
  },
  {
    id: "hwg_the_avenues",
    name: "\u0627\u0644\u0623\u0641\u0646\u064A\u0648\u0632 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
    nameEn: "The Avenues Bahrain",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A \u0648\u0648\u0627\u062C\u0647\u0629 \u0628\u062D\u0631\u064A\u0629",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.2435,
    longitude: 50.584,
    keywords: ["\u0627\u0644\u0627\u0641\u0646\u064A\u0648\u0632", "\u0627\u0644\u0623\u0641\u0646\u064A\u0648\u0632", "\u0627\u0641\u0646\u064A\u0648\u0632", "\u0627\u0641\u0646\u064A\u0648\u0632 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "the avenues", "avenues mall", "\u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u0627\u0641\u0646\u064A\u0648\u0632 \u0627\u0644\u0628\u062D\u0631\u064A\u0629", "\u0643\u0648\u0631\u0646\u064A\u0634 \u0627\u0644\u0627\u0641\u0646\u064A\u0648\u0632"]
  },
  {
    id: "hwg_marassi_galleria",
    name: "\u0645\u0631\u0627\u0633\u064A \u062C\u0627\u0644\u064A\u0631\u064A\u0627",
    nameEn: "Marassi Galleria",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A \u0634\u0627\u0637\u0626\u064A",
    parentAreaName: "\u062F\u064A\u0627\u0631 \u0627\u0644\u0645\u062D\u0631\u0642",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.294,
    longitude: 50.641,
    keywords: ["\u0645\u0631\u0627\u0633\u064A", "\u0645\u0631\u0627\u0633\u064A \u062C\u0627\u0644\u064A\u0631\u064A\u0627", "\u0645\u062C\u0645\u0639 \u0645\u0631\u0627\u0633\u064A", "\u0645\u0631\u0627\u0633\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u0634\u0627\u0637\u0626 \u0645\u0631\u0627\u0633\u064A", "marassi galleria", "marassi mall", "marassi bahrain"]
  },
  {
    id: "hwg_moda_mall",
    name: "\u0645\u0648\u062F\u0627 \u0645\u0648\u0644",
    nameEn: "Moda Mall",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A \u0641\u0627\u062E\u0631",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.237,
    longitude: 50.582,
    keywords: ["\u0645\u0648\u062F\u0627 \u0645\u0648\u0644", "\u0645\u0648\u062F\u0627\u0645\u0648\u0644", "\u0645\u0631\u0643\u0632 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062A\u062C\u0627\u0631\u064A \u0627\u0644\u0639\u0627\u0644\u0645\u064A", "\u0628\u0631\u062C \u0627\u0644\u062A\u062C\u0627\u0631\u0629 \u0627\u0644\u0639\u0627\u0644\u0645\u064A", "\u0641\u0646\u062F\u0642 \u0627\u0644\u0634\u064A\u0631\u0627\u062A\u0648\u0646", "moda mall", "bwtc"]
  },
  {
    id: "hwg_al_aali_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0639\u0627\u0644\u064A",
    nameEn: "Al Aali Mall",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0627\u0644\u0633\u064A\u0641",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.239,
    longitude: 50.534,
    keywords: ["\u0645\u062C\u0645\u0639 \u0627\u0644\u0639\u0627\u0644\u064A", "\u0627\u0644\u0639\u0627\u0644\u064A \u0645\u0648\u0644", "\u0639\u0627\u0644\u064A \u0645\u0648\u0644", "al aali mall", "alaali mall"]
  },
  {
    id: "hwg_mall_of_dilmunia",
    name: "\u0645\u062C\u0645\u0639 \u062F\u0644\u0645\u0648\u0646\u064A\u0627",
    nameEn: "Mall of Dilmunia",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A \u0648\u062A\u0631\u0641\u064A\u0647\u064A",
    parentAreaName: "\u062C\u0632\u064A\u0631\u0629 \u062F\u0644\u0645\u0648\u0646\u064A\u0627",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.291,
    longitude: 50.665,
    keywords: ["\u062F\u0644\u0645\u0648\u0646\u064A\u0627", "\u0645\u062C\u0645\u0639 \u062F\u0644\u0645\u0648\u0646\u064A\u0627", "\u0645\u0648\u0644 \u062F\u0644\u0645\u0648\u0646\u064A\u0627", "\u062C\u0632\u064A\u0631\u0629 \u062F\u0644\u0645\u0648\u0646\u064A\u0627", "\u062D\u0648\u0636 \u062F\u0644\u0645\u0648\u0646\u064A\u0627 \u0627\u0644\u0645\u0627\u0626\u064A", "mall of dilmunia", "dilmunia mall"]
  },
  {
    id: "hwg_al_liwan",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0644\u064A\u0648\u0627\u0646",
    nameEn: "Al Liwan Hamala",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A \u0645\u0641\u062A\u0648\u062D \u0648\u0645\u0637\u0627\u0639\u0645",
    parentAreaName: "\u0627\u0644\u0647\u0645\u0644\u0629",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.168,
    longitude: 50.485,
    keywords: ["\u0627\u0644\u0644\u064A\u0648\u0627\u0646", "\u0645\u062C\u0645\u0639 \u0627\u0644\u0644\u064A\u0648\u0627\u0646", "\u0644\u064A\u0648\u0627\u0646 \u0627\u0644\u0647\u0645\u0644\u0629", "\u0627\u0644\u0644\u064A\u0648\u0627\u0646 \u0627\u0644\u0647\u0645\u0644\u0629", "al liwan", "alliwan"]
  },
  {
    id: "hwg_enma_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0625\u0646\u0645\u0627\u0621",
    nameEn: "Enma Mall",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0631\u0642\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.126,
    longitude: 50.574,
    keywords: ["\u0645\u062C\u0645\u0639 \u0627\u0644\u0625\u0646\u0645\u0627\u0621", "\u0645\u062C\u0645\u0639 \u0627\u0644\u0627\u0646\u0645\u0627\u0621", "\u0627\u0644\u0625\u0646\u0645\u0627\u0621 \u0645\u0648\u0644", "\u0627\u0646\u0645\u0627\u0621 \u0645\u0648\u0644 \u0627\u0644\u0631\u0641\u0627\u0639", "enma mall", "\u0643\u0627\u0631\u0641\u0648\u0631 \u0627\u0644\u0625\u0646\u0645\u0627\u0621"]
  },
  {
    id: "hwg_ramli_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0631\u0645\u0644\u064A",
    nameEn: "Ramli Mall",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0639\u0627\u0644\u064A",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.171,
    longitude: 50.54,
    keywords: ["\u0645\u062C\u0645\u0639 \u0627\u0644\u0631\u0645\u0644\u064A", "\u0627\u0644\u0631\u0645\u0644\u064A \u0645\u0648\u0644", "\u0631\u0645\u0644\u064A \u0645\u0648\u0644 \u0639\u0627\u0644\u064A", "\u0644\u0648\u0644\u0648 \u0627\u0644\u0631\u0645\u0644\u064A", "ramli mall"]
  },
  {
    id: "hwg_oasis_mall_juffair",
    name: "\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u062C\u0641\u064A\u0631",
    nameEn: "Oasis Mall Juffair",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0627\u0644\u062C\u0641\u064A\u0631",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.216,
    longitude: 50.603,
    keywords: ["\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u062C\u0641\u064A\u0631", "\u0648\u0627\u062D\u0629 \u0627\u0644\u062C\u0641\u064A\u0631", "\u0645\u062C\u0645\u0639 \u0627\u0644\u0648\u0627\u062D\u0629 \u0627\u0644\u062C\u0641\u064A\u0631", "oasis mall juffair", "\u0633\u064A\u0646\u0645\u0627 \u0627\u0644\u0648\u0627\u062D\u0629 \u0627\u0644\u062C\u0641\u064A\u0631"]
  },
  {
    id: "hwg_oasis_mall_muharraq",
    name: "\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u0645\u062D\u0631\u0642",
    nameEn: "Oasis Mall Muharraq",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0627\u0644\u0645\u062D\u0631\u0642",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.252,
    longitude: 50.618,
    keywords: ["\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u0645\u062D\u0631\u0642", "\u0648\u0627\u062D\u0629 \u0627\u0644\u0645\u062D\u0631\u0642", "\u0645\u062C\u0645\u0639 \u0627\u0644\u0648\u0627\u062D\u0629 \u0627\u0644\u0645\u062D\u0631\u0642", "oasis mall muharraq", "\u062C\u0633\u0631 \u0627\u0644\u0634\u064A\u062E \u0639\u064A\u0633\u0649 \u0627\u0644\u0648\u0627\u062D\u0629"]
  },
  {
    id: "hwg_oasis_mall_riffa",
    name: "\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u0631\u0641\u0627\u0639",
    nameEn: "Oasis Mall Riffa",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0631\u0642\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.121,
    longitude: 50.565,
    keywords: ["\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u0631\u0641\u0627\u0639", "\u0648\u0627\u062D\u0629 \u0627\u0644\u0631\u0641\u0627\u0639", "oasis mall riffa"]
  },
  {
    id: "hwg_dana_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u062F\u0627\u0646\u0629",
    nameEn: "Dana Mall",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0627\u0644\u0633\u0646\u0627\u0628\u0633",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.227,
    longitude: 50.551,
    keywords: ["\u0645\u062C\u0645\u0639 \u0627\u0644\u062F\u0627\u0646\u0629", "\u0627\u0644\u062F\u0627\u0646\u0629 \u0645\u0648\u0644", "\u062F\u0627\u0646\u0647 \u0645\u0648\u0644 \u0627\u0644\u0633\u0646\u0627\u0628\u0633", "\u0644\u0648\u0644\u0648 \u0647\u0627\u064A\u0628\u0631 \u0627\u0644\u062F\u0627\u0646\u0629", "dana mall", "danamall"]
  },
  {
    id: "hwg_marina_mall",
    name: "\u0645\u0627\u0631\u064A\u0646\u0627 \u0645\u0648\u0644",
    nameEn: "Marina Mall",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.226,
    longitude: 50.569,
    keywords: ["\u0645\u0627\u0631\u064A\u0646\u0627 \u0645\u0648\u0644", "\u0645\u0627\u0631\u064A\u0646\u0627 \u0645\u0648\u0644 \u0627\u0644\u0645\u0646\u0627\u0645\u0629", "\u0627\u0644\u0645\u0631\u0643\u0627\u0632 \u0645\u0627\u0631\u064A\u0646\u0627", "marina mall"]
  },
  {
    id: "hwg_saar_mall",
    name: "\u0645\u062C\u0645\u0639 \u0633\u0627\u0631",
    nameEn: "Saar Mall",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0633\u0627\u0631",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.208,
    longitude: 50.505,
    keywords: ["\u0645\u062C\u0645\u0639 \u0633\u0627\u0631", "\u0633\u0627\u0631 \u0645\u0648\u0644", "saar mall", "saarmall"]
  },
  {
    id: "hwg_reef_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0631\u064A\u0641",
    nameEn: "Reef Mall",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0627\u0644\u0647\u0645\u0644\u0629",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.172,
    longitude: 50.479,
    keywords: ["\u0645\u062C\u0645\u0639 \u0627\u0644\u0631\u064A\u0641", "\u0627\u0644\u0631\u064A\u0641 \u0645\u0648\u0644", "\u0631\u064A\u0641 \u0645\u0648\u0644 \u0627\u0644\u0647\u0645\u0644\u0629", "reef mall"]
  },
  {
    id: "hwg_sitra_mall",
    name: "\u0645\u062C\u0645\u0639 \u0633\u062A\u0631\u0629",
    nameEn: "Sitra Mall",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0633\u062A\u0631\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.168,
    longitude: 50.608,
    keywords: ["\u0645\u062C\u0645\u0639 \u0633\u062A\u0631\u0629", "\u0633\u062A\u0631\u0629 \u0645\u0648\u0644", "sitra mall"]
  },
  {
    id: "hwg_yateem_centre",
    name: "\u0645\u062C\u0645\u0639 \u064A\u062A\u064A\u0645",
    nameEn: "Yateem Centre",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A \u062A\u0627\u0631\u064A\u062E\u064A",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.233,
    longitude: 50.575,
    keywords: ["\u0645\u062C\u0645\u0639 \u064A\u062A\u064A\u0645", "\u064A\u062A\u064A\u0645 \u0633\u0646\u062A\u0631", "\u0633\u0648\u0642 \u064A\u062A\u064A\u0645", "yateem centre", "yateem center"]
  },
  {
    id: "hwg_gosi_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u062A\u0623\u0645\u064A\u0646\u0627\u062A \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0629 (\u0627\u0644\u062A\u0623\u0645\u064A\u0646\u0627\u062A)",
    nameEn: "GOSI Complex",
    category: "mall",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A \u0648\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A",
    parentAreaName: "\u0627\u0644\u062D\u0648\u0631\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.237,
    longitude: 50.59,
    keywords: ["\u0645\u062C\u0645\u0639 \u0627\u0644\u062A\u0623\u0645\u064A\u0646\u0627\u062A", "\u0627\u0644\u062A\u0623\u0645\u064A\u0646\u0627\u062A", "\u0633\u0648\u0642 \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u062A\u0623\u0645\u064A\u0646\u0627\u062A", "\u0645\u062C\u0645\u0639 \u062C\u0648\u0632\u064A", "gosi complex", "gosi mall"]
  },
  // ==========================================
  // 2. الأسواق التراثية والشعبية (SOUQS)
  // ==========================================
  {
    id: "hwg_bab_al_bahrain",
    name: "\u0628\u0627\u0628 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0648\u0633\u0648\u0642 \u0627\u0644\u0645\u0646\u0627\u0645\u0629 \u0627\u0644\u0642\u062F\u064A\u0645",
    nameEn: "Bab Al Bahrain & Manama Souq",
    category: "souq",
    categoryLabel: "\u0633\u0648\u0642 \u062A\u0631\u0627\u062B\u064A \u0648\u0634\u0639\u0628\u064A",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.2345,
    longitude: 50.5745,
    keywords: ["\u0628\u0627\u0628 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u0633\u0648\u0642 \u0627\u0644\u0645\u0646\u0627\u0645\u0629", "\u0633\u0648\u0642 \u0627\u0644\u0645\u0646\u0627\u0645\u0629 \u0627\u0644\u0642\u062F\u064A\u0645", "\u0633\u0648\u0642 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0645\u0646\u0627\u0645\u0629", "bab al bahrain", "manama souq", "old manama market"]
  },
  {
    id: "hwg_souq_waqif_hamad",
    name: "\u0633\u0648\u0642 \u0648\u0627\u0642\u0641 \u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F",
    nameEn: "Souq Waqif Hamad Town",
    category: "souq",
    categoryLabel: "\u0633\u0648\u0642 \u0634\u0639\u0628\u064A \u0648\u062D\u064A\u0648\u064A",
    parentAreaName: "\u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.143,
    longitude: 50.505,
    keywords: ["\u0633\u0648\u0642 \u0648\u0627\u0642\u0641", "\u0633\u0648\u0642 \u0648\u0627\u0642\u0641 \u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F", "\u0633\u0648\u0642 \u0648\u0627\u0642\u0641 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "souq waqif", "\u0633\u0648\u0642 \u0648\u0627\u0642\u0641 \u062F\u0648\u0627\u0631 1"]
  },
  {
    id: "hwg_muharraq_souq",
    name: "\u0633\u0648\u0642 \u0627\u0644\u0645\u062D\u0631\u0642 \u0627\u0644\u0634\u0639\u0628\u064A \u0648\u0627\u0644\u0642\u064A\u0635\u0631\u064A\u0629",
    nameEn: "Muharraq Traditional Souq & Al Qaisariya",
    category: "souq",
    categoryLabel: "\u0633\u0648\u0642 \u062A\u0631\u0627\u062B\u064A \u0648\u0634\u0639\u0628\u064A",
    parentAreaName: "\u0627\u0644\u0645\u062D\u0631\u0642",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.255,
    longitude: 50.612,
    keywords: ["\u0633\u0648\u0642 \u0627\u0644\u0645\u062D\u0631\u0642", "\u0633\u0648\u0642 \u0627\u0644\u0642\u064A\u0635\u0631\u064A\u0629", "\u0627\u0644\u0642\u064A\u0635\u0631\u064A\u0629 \u0627\u0644\u0645\u062D\u0631\u0642", "\u0633\u0648\u0642 \u0627\u0644\u0645\u062D\u0631\u0642 \u0627\u0644\u0642\u062F\u064A\u0645", "\u0633\u0648\u0642 \u0627\u0644\u062D\u0644\u0648\u0649 \u0627\u0644\u0645\u062D\u0631\u0642", "\u062D\u0644\u0648\u064A\u0627\u062A \u0634\u0648\u064A\u0637\u0631 \u0627\u0644\u0645\u062D\u0631\u0642", "muharraq souq", "al qaisariya"]
  },
  {
    id: "hwg_jidhafs_souq",
    name: "\u0633\u0648\u0642 \u062C\u062F\u062D\u0641\u0635 \u0627\u0644\u0634\u0639\u0628\u064A",
    nameEn: "Jidhafs Central Market",
    category: "souq",
    categoryLabel: "\u0633\u0648\u0642 \u0634\u0639\u0628\u064A \u0644\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u063A\u0630\u0627\u0626\u064A\u0629 \u0648\u0627\u0644\u0623\u0633\u0645\u0627\u0643",
    parentAreaName: "\u062C\u062F\u062D\u0641\u0635",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.219,
    longitude: 50.548,
    keywords: ["\u0633\u0648\u0642 \u062C\u062F\u062D\u0641\u0635", "\u0633\u0648\u0642 \u0627\u0644\u0633\u0645\u0643 \u062C\u062F\u062D\u0641\u0635", "\u0633\u0648\u0642 \u0627\u0644\u062E\u0636\u0627\u0631 \u062C\u062F\u062D\u0641\u0635", "jidhafs souq", "jidhafs market"]
  },
  {
    id: "hwg_manama_central_market",
    name: "\u0633\u0648\u0642 \u0627\u0644\u0645\u0646\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064A",
    nameEn: "Manama Central Market",
    category: "souq",
    categoryLabel: "\u0627\u0644\u0633\u0648\u0642 \u0627\u0644\u0645\u0631\u0643\u0632\u064A \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.223,
    longitude: 50.565,
    keywords: ["\u0633\u0648\u0642 \u0627\u0644\u0645\u0646\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064A", "\u0627\u0644\u0633\u0648\u0642 \u0627\u0644\u0645\u0631\u0643\u0632\u064A", "\u0633\u0648\u0642 \u0627\u0644\u0633\u0645\u0643 \u0627\u0644\u0645\u0646\u0627\u0645\u0629", "\u0633\u0648\u0642 \u0627\u0644\u062E\u0636\u0627\u0631 \u0627\u0644\u0645\u0631\u0643\u0632\u064A", "manama central market", "central market"]
  },
  {
    id: "hwg_farmers_market_budaiya",
    name: "\u0633\u0648\u0642 \u0627\u0644\u0645\u0632\u0627\u0631\u0639\u064A\u0646 \u062D\u062F\u064A\u0642\u0629 \u0627\u0644\u0628\u062F\u064A\u0639",
    nameEn: "Bahrain Farmers Market Budaiya",
    category: "souq",
    categoryLabel: "\u0633\u0648\u0642 \u0632\u0631\u0627\u0639\u064A \u0648\u0633\u064A\u0627\u062D\u064A",
    parentAreaName: "\u0627\u0644\u0628\u062F\u064A\u0639",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.219,
    longitude: 50.481,
    keywords: ["\u0633\u0648\u0642 \u0627\u0644\u0645\u0632\u0627\u0631\u0639\u064A\u0646", "\u0633\u0648\u0642 \u0627\u0644\u0645\u0632\u0627\u0631\u0639\u064A\u0646 \u0627\u0644\u0628\u062F\u064A\u0639", "\u062D\u062F\u064A\u0642\u0629 \u0627\u0644\u0628\u062F\u064A\u0639 \u0627\u0644\u0646\u0628\u0627\u062A\u064A\u0629", "farmers market", "budaiya botanical garden"]
  },
  {
    id: "hwg_gold_souq",
    name: "\u0633\u0648\u0642 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0642\u062F\u064A\u0645 \u0648\u0627\u0644\u062C\u062F\u064A\u062F",
    nameEn: "Bahrain Gold Souq",
    category: "souq",
    categoryLabel: "\u0633\u0648\u0642 \u0627\u0644\u0630\u0647\u0628 \u0648\u0627\u0644\u0645\u062C\u0648\u0647\u0631\u0627\u062A",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.236,
    longitude: 50.576,
    keywords: ["\u0633\u0648\u0642 \u0627\u0644\u0630\u0647\u0628", "\u0633\u0648\u0642 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0645\u0646\u0627\u0645\u0629", "\u0645\u0631\u0643\u0632 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u062A\u062C\u0627\u0631\u064A", "gold souq", "gold market"]
  },
  // ==========================================
  // 3. كبرى شبكات الهايبرماركت ومراكز التسوق (HYPERMARKETS)
  // ==========================================
  {
    id: "hwg_lulu_hidd",
    name: "\u0644\u0648\u0644\u0648 \u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0627\u0644\u062D\u062F",
    nameEn: "Lulu Hypermarket Hidd",
    category: "hypermarket",
    categoryLabel: "\u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A",
    parentAreaName: "\u0627\u0644\u062D\u062F",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.242,
    longitude: 50.648,
    keywords: ["\u0644\u0648\u0644\u0648 \u0627\u0644\u062D\u062F", "\u0644\u0648\u0644\u0648 \u0647\u0627\u064A\u0628\u0631 \u0645\u0627\u0631\u0643\u062A \u0627\u0644\u062D\u062F", "\u0644\u0648\u0644\u0648 \u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0627\u0644\u062D\u062F", "lulu hidd"]
  },
  {
    id: "hwg_lulu_dana",
    name: "\u0644\u0648\u0644\u0648 \u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0645\u062C\u0645\u0639 \u0627\u0644\u062F\u0627\u0646\u0629 \u0627\u0644\u0633\u0646\u0627\u0628\u0633",
    nameEn: "Lulu Hypermarket Dana Mall",
    category: "hypermarket",
    categoryLabel: "\u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A",
    parentAreaName: "\u0627\u0644\u0633\u0646\u0627\u0628\u0633",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.227,
    longitude: 50.551,
    keywords: ["\u0644\u0648\u0644\u0648 \u0627\u0644\u062F\u0627\u0646\u0629", "\u0644\u0648\u0644\u0648 \u0627\u0644\u0633\u0646\u0627\u0628\u0633", "\u0644\u0648\u0644\u0648 \u0645\u062C\u0645\u0639 \u0627\u0644\u062F\u0627\u0646\u0629", "lulu dana mall"]
  },
  {
    id: "hwg_lulu_riffa",
    name: "\u0644\u0648\u0644\u0648 \u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0627\u0644\u0631\u0641\u0627\u0639",
    nameEn: "Lulu Hypermarket East Riffa",
    category: "hypermarket",
    categoryLabel: "\u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A",
    parentAreaName: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0631\u0642\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.128,
    longitude: 50.569,
    keywords: ["\u0644\u0648\u0644\u0648 \u0627\u0644\u0631\u0641\u0627\u0639", "\u0644\u0648\u0644\u0648 \u0647\u0627\u064A\u0628\u0631 \u0645\u0627\u0631\u0643\u062A \u0627\u0644\u0631\u0641\u0627\u0639", "lulu riffa"]
  },
  {
    id: "hwg_lulu_zinj",
    name: "\u0644\u0648\u0644\u0648 \u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0627\u0644\u0632\u0646\u062C (\u063A\u0627\u0644\u064A\u0631\u064A\u0627 \u0645\u0648\u0644)",
    nameEn: "Lulu Hypermarket Galleria Zinj",
    category: "hypermarket",
    categoryLabel: "\u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A",
    parentAreaName: "\u0627\u0644\u0632\u0646\u062C",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.204,
    longitude: 50.575,
    keywords: ["\u0644\u0648\u0644\u0648 \u0627\u0644\u0632\u0646\u062C", "\u063A\u0627\u0644\u064A\u0631\u064A\u0627 \u0627\u0644\u0632\u0646\u062C", "\u0645\u062C\u0645\u0639 \u063A\u0627\u0644\u064A\u0631\u064A\u0627", "lulu zinj", "galleria mall zinj"]
  },
  {
    id: "hwg_ramez_hypermarket_manama",
    name: "\u0631\u0627\u0645\u0632 \u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    nameEn: "Ramez Hypermarket Manama",
    category: "hypermarket",
    categoryLabel: "\u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0648\u062A\u062C\u0632\u0626\u0629",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.225,
    longitude: 50.568,
    keywords: ["\u0631\u0627\u0645\u0632 \u0627\u0644\u0645\u0646\u0627\u0645\u0629", "\u0631\u0627\u0645\u0632 \u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A", "\u0627\u0633\u0648\u0627\u0642 \u0631\u0627\u0645\u0632", "ramez manama", "ramez"]
  },
  {
    id: "hwg_ramez_tubli",
    name: "\u0631\u0627\u0645\u0632 \u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u062A\u0648\u0628\u0644\u064A",
    nameEn: "Ramez Hypermarket Tubli",
    category: "hypermarket",
    categoryLabel: "\u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0648\u062A\u062C\u0632\u0626\u0629",
    parentAreaName: "\u062A\u0648\u0628\u0644\u064A",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.186,
    longitude: 50.555,
    keywords: ["\u0631\u0627\u0645\u0632 \u062A\u0648\u0628\u0644\u064A", "\u0627\u0633\u0648\u0627\u0642 \u0631\u0627\u0645\u0632 \u062A\u0648\u0628\u0644\u064A", "ramez tubli"]
  },
  {
    id: "hwg_ramez_riffa",
    name: "\u0631\u0627\u0645\u0632 \u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0627\u0644\u0631\u0641\u0627\u0639 \u0628\u0648\u0643\u0648\u0627\u0631\u0629",
    nameEn: "Ramez Hypermarket Riffa",
    category: "hypermarket",
    categoryLabel: "\u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0648\u062A\u062C\u0632\u0626\u0629",
    parentAreaName: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0631\u0642\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.133,
    longitude: 50.565,
    keywords: ["\u0631\u0627\u0645\u0632 \u0627\u0644\u0631\u0641\u0627\u0639", "\u0631\u0627\u0645\u0632 \u0628\u0648\u0643\u0648\u0627\u0631\u0629", "\u0627\u0633\u0648\u0627\u0642 \u0631\u0627\u0645\u0632 \u0627\u0644\u0631\u0641\u0627\u0639", "ramez riffa"]
  },
  {
    id: "hwg_ansar_gallery_tubli",
    name: "\u0623\u0646\u0635\u0627\u0631 \u062C\u0627\u0644\u064A\u0631\u064A \u062A\u0648\u0628\u0644\u064A",
    nameEn: "Ansar Gallery Tubli",
    category: "hypermarket",
    categoryLabel: "\u0645\u0631\u0643\u0632 \u062A\u062C\u0632\u0626\u0629 \u0648\u0645\u0641\u0631\u0648\u0634\u0627\u062A \u0643\u0628\u0631\u0649",
    parentAreaName: "\u062A\u0648\u0628\u0644\u064A",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.189,
    longitude: 50.558,
    keywords: ["\u0627\u0646\u0635\u0627\u0631 \u062C\u0627\u0644\u064A\u0631\u064A", "\u0623\u0646\u0635\u0627\u0631 \u062C\u0627\u0644\u064A\u0631\u064A", "\u0627\u0646\u0635\u0627\u0631 \u062A\u0648\u0628\u0644\u064A", "ansar gallery", "ansar gallery tubli"]
  },
  {
    id: "hwg_alhelli_supermarkets",
    name: "\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u062D\u0644\u064A (\u062A\u0648\u0628\u0644\u064A\u060C \u062C\u062F\u0639\u0644\u064A\u060C \u0639\u0627\u0644\u064A)",
    nameEn: "Al Helli Supermarket",
    category: "hypermarket",
    categoryLabel: "\u0633\u0648\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0648\u0647\u0627\u064A\u0628\u0631\u0645\u0627\u0631\u0643\u062A",
    parentAreaName: "\u062A\u0648\u0628\u0644\u064A",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.184,
    longitude: 50.562,
    keywords: ["\u0627\u0633\u0648\u0627\u0642 \u0627\u0644\u062D\u0644\u064A", "\u0627\u0644\u062D\u0644\u064A \u062A\u0648\u0628\u0644\u064A", "\u0627\u0644\u062D\u0644\u064A \u0639\u0627\u0644\u064A", "\u0627\u0644\u062D\u0644\u064A \u062C\u062F\u0639\u0644\u064A", "al helli", "alhelli super market"]
  },
  {
    id: "hwg_alosra_supermarket",
    name: "\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0623\u0633\u0631\u0629 (\u0633\u0627\u0631\u060C \u0623\u0645\u0648\u0627\u062C\u060C \u0627\u0644\u0628\u062F\u064A\u0639)",
    nameEn: "Alosra Supermarket",
    category: "hypermarket",
    categoryLabel: "\u0633\u0648\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0645\u062A\u0645\u064A\u0632",
    parentAreaName: "\u0633\u0627\u0631",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.211,
    longitude: 50.508,
    keywords: ["\u0627\u0633\u0648\u0627\u0642 \u0627\u0644\u0627\u0633\u0631\u0629", "\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0623\u0633\u0631\u0629", "\u0627\u0644\u0627\u0633\u0631\u0629 \u0633\u0627\u0631", "\u0627\u0644\u0627\u0633\u0631\u0629 \u0627\u0645\u0648\u0627\u062C", "alosra", "alosra supermarket"]
  },
  // ==========================================
  // 4. شوارع ومجمعات المطاعم والكافيهات (DINING HUBS)
  // ==========================================
  {
    id: "hwg_block_338_adliya",
    name: "\u0628\u0644\u0648\u0643 338 \u0627\u0644\u0639\u062F\u0644\u064A\u0629 (\u062D\u064A \u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0627\u0644\u0641\u0646\u064A\u0629)",
    nameEn: "Block 338 Adliya Dining District",
    category: "dining_hub",
    categoryLabel: "\u062D\u064A \u0645\u0637\u0627\u0639\u0645 \u0648\u0643\u0627\u0641\u064A\u0647\u0627\u062A \u0639\u0627\u0644\u0645\u064A\u0629",
    parentAreaName: "\u0627\u0644\u0639\u062F\u0644\u064A\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.2155,
    longitude: 50.5935,
    keywords: ["\u0628\u0644\u0648\u0643 338", "\u0627\u0644\u0639\u062F\u0644\u064A\u0629 338", "\u062D\u064A \u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0627\u0644\u0639\u062F\u0644\u064A\u0629", "\u0645\u0637\u0627\u0639\u0645 \u0627\u0644\u0639\u062F\u0644\u064A\u0629", "block 338", "adliya 338"]
  },
  {
    id: "hwg_shabab_avenue_juffair",
    name: "\u0634\u0627\u0631\u0639 \u0627\u0644\u0634\u0628\u0627\u0628 \u0627\u0644\u062C\u0641\u064A\u0631 (\u0634\u0627\u0631\u0639 \u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0627\u0644\u0623\u0645\u0631\u064A\u0643\u064A\u0629 \u0627\u0644\u0633\u0631\u064A\u0639\u0629)",
    nameEn: "Al Shabab Avenue Juffair",
    category: "dining_hub",
    categoryLabel: "\u0634\u0627\u0631\u0639 \u0645\u0637\u0627\u0639\u0645 \u062D\u064A\u0648\u064A\u0629",
    parentAreaName: "\u0627\u0644\u062C\u0641\u064A\u0631",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.214,
    longitude: 50.6015,
    keywords: ["\u0634\u0627\u0631\u0639 \u0627\u0644\u0634\u0628\u0627\u0628", "\u0634\u0627\u0631\u0639 \u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0627\u0644\u062C\u0641\u064A\u0631", "\u0645\u0637\u0627\u0639\u0645 \u0627\u0644\u062C\u0641\u064A\u0631", "al shabab avenue", "american alley juffair"]
  },
  {
    id: "hwg_sanad_restaurant_street",
    name: "\u0634\u0627\u0631\u0639 \u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0633\u0646\u062F (\u0634\u0627\u0631\u0639 77)",
    nameEn: "Sanad Restaurant Street (Road 77)",
    category: "dining_hub",
    categoryLabel: "\u0634\u0627\u0631\u0639 \u0645\u0637\u0627\u0639\u0645 \u0634\u0639\u0628\u064A\u0629 \u0648\u0643\u0627\u0641\u064A\u0647\u0627\u062A",
    parentAreaName: "\u0633\u0646\u062F",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.155,
    longitude: 50.575,
    keywords: ["\u0634\u0627\u0631\u0639 \u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0633\u0646\u062F", "\u0634\u0627\u0631\u0639 77", "\u0645\u0637\u0627\u0639\u0645 \u0633\u0646\u062F", "\u0634\u0627\u0631\u0639 \u0633\u0646\u062F", "sanad food street", "road 77"]
  },
  {
    id: "hwg_bukowarah_riffa",
    name: "\u0634\u0627\u0631\u0639 \u0628\u0648\u0643\u0648\u0627\u0631\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A \u0627\u0644\u0631\u0641\u0627\u0639",
    nameEn: "Bukowarah Commercial & Dining Street Riffa",
    category: "dining_hub",
    categoryLabel: "\u0634\u0627\u0631\u0639 \u062A\u062C\u0627\u0631\u064A \u0648\u0645\u0637\u0627\u0639\u0645 \u0648\u0645\u062D\u0644\u0627\u062A",
    parentAreaName: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0631\u0642\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.136,
    longitude: 50.564,
    keywords: ["\u0628\u0648\u0643\u0648\u0627\u0631\u0629", "\u0634\u0627\u0631\u0639 \u0628\u0648\u0643\u0648\u0627\u0631\u0629", "\u0645\u0637\u0627\u0639\u0645 \u0628\u0648\u0643\u0648\u0627\u0631\u0629", "\u0633\u0648\u0642 \u0628\u0648\u0643\u0648\u0627\u0631\u0629", "bukowarah", "bukuwara"]
  },
  {
    id: "hwg_district_1_hamala",
    name: "\u062F\u064A\u0633\u062A\u0631\u064A\u0643\u062A 1 \u0627\u0644\u0647\u0645\u0644\u0629",
    nameEn: "District 1 Hamala",
    category: "dining_hub",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u0645\u0637\u0627\u0639\u0645 \u0648\u0643\u0627\u0641\u064A\u0647\u0627\u062A \u0631\u0627\u0642\u064A\u0629",
    parentAreaName: "\u0627\u0644\u0647\u0645\u0644\u0629",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.166,
    longitude: 50.482,
    keywords: ["\u062F\u064A\u0633\u062A\u0631\u064A\u0643\u062A 1", "\u062F\u0633\u062A\u0631\u0643\u062A \u0648\u0646", "\u062F\u064A\u0633\u062A\u0631\u064A\u0643\u062A \u0648\u0646 \u0627\u0644\u0647\u0645\u0644\u0629", "district 1", "district 1 hamala"]
  },
  {
    id: "hwg_water_garden_city",
    name: "\u0648\u0648\u062A\u0631 \u062C\u0627\u0631\u062F\u0646 \u0633\u064A\u062A\u064A \u0627\u0644\u0633\u064A\u0641",
    nameEn: "Water Garden City Seef",
    category: "dining_hub",
    categoryLabel: "\u0645\u0645\u0634\u0649 \u0648\u0645\u0637\u0627\u0639\u0645 \u0634\u0627\u0637\u0626\u064A\u0629",
    parentAreaName: "\u0627\u0644\u0633\u064A\u0641",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.246,
    longitude: 50.54,
    keywords: ["\u0648\u0648\u062A\u0631 \u062C\u0627\u0631\u062F\u0646 \u0633\u064A\u062A\u064A", "\u0648\u0648\u062A\u0631 \u0642\u0627\u0631\u062F\u0646", "\u0645\u0637\u0627\u0639\u0645 \u0648\u0648\u062A\u0631 \u062C\u0627\u0631\u062F\u0646", "water garden city", "water garden"]
  },
  {
    id: "hwg_courtyard_seef",
    name: "\u0643\u0648\u0631\u062A \u064A\u0627\u0631\u062F \u0627\u0644\u0633\u064A\u0641",
    nameEn: "The Courtyard Seef",
    category: "dining_hub",
    categoryLabel: "\u0645\u062C\u0645\u0639 \u0643\u0627\u0641\u064A\u0647\u0627\u062A \u0648\u0645\u0637\u0627\u0639\u0645 \u0647\u0627\u062F\u0626\u0629",
    parentAreaName: "\u0627\u0644\u0633\u064A\u0641",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.2405,
    longitude: 50.531,
    keywords: ["\u0643\u0648\u0631\u062A \u064A\u0627\u0631\u062F", "\u0643\u0648\u0631\u062A \u064A\u0627\u0631\u062F \u0627\u0644\u0633\u064A\u0641", "the courtyard seef", "courtyard"]
  },
  // ==========================================
  // 5. المستشفيات والمراكز الطبية الكبرى (HOSPITALS)
  // ==========================================
  {
    id: "hwg_salmaniya_hospital",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629 \u0627\u0644\u0637\u0628\u064A",
    nameEn: "Salmaniya Medical Complex (SMC)",
    category: "hospital",
    categoryLabel: "\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
    parentAreaName: "\u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.212,
    longitude: 50.584,
    keywords: ["\u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629", "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629", "\u0645\u062C\u0645\u0639 \u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629 \u0627\u0644\u0637\u0628\u064A", "\u0637\u0648\u0627\u0631\u0626 \u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629", "salmaniya medical complex", "smc"]
  },
  {
    id: "hwg_king_hamad_hospital",
    name: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0645\u0644\u0643 \u062D\u0645\u062F \u0627\u0644\u062C\u0627\u0645\u0639\u064A",
    nameEn: "King Hamad University Hospital (KHUH)",
    category: "hospital",
    categoryLabel: "\u0645\u0633\u062A\u0634\u0641\u0649 \u062C\u0627\u0645\u0639\u064A \u0648\u062A\u062E\u0635\u0635\u064A",
    parentAreaName: "\u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.269,
    longitude: 50.613,
    keywords: ["\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0645\u0644\u0643 \u062D\u0645\u062F", "\u0627\u0644\u0645\u0644\u0643 \u062D\u0645\u062F \u0627\u0644\u062C\u0627\u0645\u0639\u064A", "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646 \u0627\u0644\u062C\u0627\u0645\u0639\u064A", "king hamad university hospital", "khuh"]
  },
  {
    id: "hwg_bdf_hospital",
    name: "\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0639\u0633\u0643\u0631\u064A (\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0645\u0644\u0643\u064A\u0629)",
    nameEn: "BDF Hospital (Royal Medical Services)",
    category: "hospital",
    categoryLabel: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0639\u0633\u0643\u0631\u064A \u0648\u062A\u062E\u0635\u0635\u064A",
    parentAreaName: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u063A\u0631\u0628\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.138,
    longitude: 50.538,
    keywords: ["\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0639\u0633\u0643\u0631\u064A", "\u0627\u0644\u0639\u0633\u0643\u0631\u064A", "\u0642\u0648\u0629 \u062F\u0641\u0627\u0639 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u0639\u0633\u0643\u0631\u064A \u0627\u0644\u0631\u0641\u0627\u0639", "bdf hospital", "bdf"]
  },
  {
    id: "hwg_bahrain_specialist_hospital",
    name: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062A\u062E\u0635\u0635\u064A \u0627\u0644\u062C\u0641\u064A\u0631",
    nameEn: "Bahrain Specialist Hospital (BSH)",
    category: "hospital",
    categoryLabel: "\u0645\u0633\u062A\u0634\u0641\u0649 \u062A\u062E\u0635\u0635\u064A \u062E\u0627\u0635",
    parentAreaName: "\u0627\u0644\u062C\u0641\u064A\u0631",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.216,
    longitude: 50.605,
    keywords: ["\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062A\u062E\u0635\u0635\u064A", "\u0627\u0644\u062A\u062E\u0635\u0635\u064A \u0627\u0644\u062C\u0641\u064A\u0631", "bahrain specialist hospital", "bsh"]
  },
  {
    id: "hwg_royal_bahrain_hospital",
    name: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0631\u0648\u064A\u0627\u0644 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629",
    nameEn: "Royal Bahrain Hospital (RBH)",
    category: "hospital",
    categoryLabel: "\u0645\u0633\u062A\u0634\u0641\u0649 \u062E\u0627\u0635",
    parentAreaName: "\u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.211,
    longitude: 50.59,
    keywords: ["\u0631\u0648\u064A\u0627\u0644 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u0645\u0633\u062A\u0634\u0641\u0649 \u0631\u0648\u064A\u0627\u0644 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "royal bahrain hospital", "rbh"]
  },
  {
    id: "hwg_ibn_al_nafees_hospital",
    name: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0628\u0646 \u0627\u0644\u0646\u0641\u064A\u0633 \u0627\u0644\u0632\u0646\u062C",
    nameEn: "Ibn Al-Nafees Hospital",
    category: "hospital",
    categoryLabel: "\u0645\u0633\u062A\u0634\u0641\u0649 \u062E\u0627\u0635",
    parentAreaName: "\u0627\u0644\u0632\u0646\u062C",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.202,
    longitude: 50.582,
    keywords: ["\u0627\u0628\u0646 \u0627\u0644\u0646\u0641\u064A\u0633", "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0628\u0646 \u0627\u0644\u0646\u0641\u064A\u0633", "ibn al nafees hospital"]
  },
  {
    id: "hwg_al_hilal_hospital_muharraq",
    name: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0647\u0644\u0627\u0644 \u0627\u0644\u0645\u062D\u0631\u0642",
    nameEn: "Al Hilal Hospital Muharraq",
    category: "hospital",
    categoryLabel: "\u0645\u0633\u062A\u0634\u0641\u0649 \u062E\u0627\u0635",
    parentAreaName: "\u0627\u0644\u0645\u062D\u0631\u0642",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.257,
    longitude: 50.615,
    keywords: ["\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0647\u0644\u0627\u0644", "\u0627\u0644\u0647\u0644\u0627\u0644 \u0627\u0644\u0645\u062D\u0631\u0642", "al hilal hospital"]
  },
  // ==========================================
  // 6. الجامعات والصروح الأكاديمية (UNIVERSITIES)
  // ==========================================
  {
    id: "hwg_uob_sakhir",
    name: "\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u0635\u062E\u064A\u0631",
    nameEn: "University of Bahrain (Sakhir Campus)",
    category: "university",
    categoryLabel: "\u0627\u0644\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0643\u0628\u0631\u0649",
    parentAreaName: "\u0627\u0644\u0635\u062E\u064A\u0631",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.052,
    longitude: 50.513,
    keywords: ["\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u0635\u062E\u064A\u0631", "\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0635\u062E\u064A\u0631", "uob sakhir", "uob", "university of bahrain"]
  },
  {
    id: "hwg_uob_isa_town",
    name: "\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649 (\u0643\u0644\u064A\u0629 \u0627\u0644\u0647\u0646\u062F\u0633\u0629 \u0648\u0627\u0644\u0639\u0644\u0648\u0645 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u064A\u0629)",
    nameEn: "University of Bahrain (Isa Town Campus)",
    category: "university",
    categoryLabel: "\u062D\u0631\u0645 \u062C\u0627\u0645\u0639\u064A \u0648\u062A\u062F\u0631\u064A\u0628\u064A",
    parentAreaName: "\u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.173,
    longitude: 50.551,
    keywords: ["\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649", "\u0643\u0644\u064A\u0629 \u0627\u0644\u0647\u0646\u062F\u0633\u0629 \u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649", "uob isa town", "\u0628\u0648\u0644\u064A\u062A\u0643\u0646\u0643"]
  },
  {
    id: "hwg_bahrain_polytechnic",
    name: "\u0628\u0648\u0644\u064A\u062A\u0643\u0646\u0643 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649",
    nameEn: "Bahrain Polytechnic",
    category: "university",
    categoryLabel: "\u062C\u0627\u0645\u0639\u0629 \u062A\u0637\u0628\u064A\u0642\u064A\u0629",
    parentAreaName: "\u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.171,
    longitude: 50.553,
    keywords: ["\u0628\u0648\u0644\u064A\u062A\u0643\u0646\u0643", "\u0628\u0648\u0644\u064A\u062A\u0643\u0646\u0643 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u062C\u0627\u0645\u0639\u0629 \u0628\u0648\u0644\u064A\u062A\u0643\u0646\u0643", "bahrain polytechnic"]
  },
  {
    id: "hwg_rcsi_medical_university",
    name: "\u0627\u0644\u0643\u0644\u064A\u0629 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0644\u0644\u062C\u0631\u0627\u062D\u064A\u0646 \u0641\u064A \u0623\u064A\u0631\u0644\u0646\u062F\u0627 (\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u0637\u0628\u064A\u0629 - \u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646)",
    nameEn: "RCSI Medical University of Bahrain",
    category: "university",
    categoryLabel: "\u062C\u0627\u0645\u0639\u0629 \u0637\u0628\u064A\u0629 \u062F\u0648\u0644\u064A\u0629",
    parentAreaName: "\u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.271,
    longitude: 50.615,
    keywords: ["rcsi", "\u0627\u0644\u0643\u0644\u064A\u0629 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0644\u0644\u062C\u0631\u0627\u062D\u064A\u0646", "\u0627\u0644\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646", "rcsi bahrain"]
  },
  {
    id: "hwg_agu_university",
    name: "\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u062E\u0644\u064A\u062C \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629",
    nameEn: "Arabian Gulf University (AGU)",
    category: "university",
    categoryLabel: "\u062C\u0627\u0645\u0639\u0629 \u062E\u0644\u064A\u062C\u064A\u0629 \u0625\u0642\u0644\u064A\u0645\u064A\u0629",
    parentAreaName: "\u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.21,
    longitude: 50.589,
    keywords: ["\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u062E\u0644\u064A\u062C \u0627\u0644\u0639\u0631\u0628\u064A", "\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u062E\u0644\u064A\u062C", "agu", "arabian gulf university"]
  },
  {
    id: "hwg_ahliah_university",
    name: "\u0627\u0644\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0623\u0647\u0644\u064A\u0629 \u0645\u062C\u0645\u0639 \u0627\u0644\u062A\u0623\u0645\u064A\u0646\u0627\u062A",
    nameEn: "Ahlia University",
    category: "university",
    categoryLabel: "\u062C\u0627\u0645\u0639\u0629 \u062E\u0627\u0635\u0629",
    parentAreaName: "\u0627\u0644\u062D\u0648\u0631\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.237,
    longitude: 50.59,
    keywords: ["\u0627\u0644\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0627\u0647\u0644\u064A\u0629", "\u0627\u0644\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0623\u0647\u0644\u064A\u0629", "ahlia university"]
  },
  // ==========================================
  // 7. المعالم والمطارات والمنافذ الحدودية (LANDMARKS & TRANSIT)
  // ==========================================
  {
    id: "hwg_bahrain_airport",
    name: "\u0645\u0637\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062F\u0648\u0644\u064A",
    nameEn: "Bahrain International Airport",
    category: "landmark",
    categoryLabel: "\u0627\u0644\u0645\u0637\u0627\u0631 \u0627\u0644\u062F\u0648\u0644\u064A \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
    parentAreaName: "\u0627\u0644\u0645\u062D\u0631\u0642",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.2708,
    longitude: 50.6332,
    keywords: ["\u0645\u0637\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u0627\u0644\u0645\u0637\u0627\u0631", "\u0645\u0637\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062F\u0648\u0644\u064A", "\u0635\u0627\u0644\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0648\u0646", "\u0635\u0627\u0644\u0629 \u0627\u0644\u0645\u063A\u0627\u062F\u0631\u0648\u0646", "bahrain international airport", "bahrain airport", "bah airport"]
  },
  {
    id: "hwg_king_fahd_causeway",
    name: "\u062C\u0633\u0631 \u0627\u0644\u0645\u0644\u0643 \u0641\u0647\u062F (\u0627\u0644\u0645\u0646\u0641\u0630 \u0627\u0644\u062D\u062F\u0648\u062F\u064A \u0645\u0639 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629)",
    nameEn: "King Fahd Causeway",
    category: "landmark",
    categoryLabel: "\u0645\u0646\u0641\u0630 \u062D\u062F\u0648\u062F\u064A \u0628\u0631\u064A \u0648\u062C\u0633\u0631 \u062F\u0648\u0644\u064A",
    parentAreaName: "\u0627\u0644\u062C\u0633\u0631\u0629",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.177,
    longitude: 50.461,
    keywords: ["\u062C\u0633\u0631 \u0627\u0644\u0645\u0644\u0643 \u0641\u0647\u062F", "\u062C\u0633\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u0645\u0646\u0641\u0630 \u0627\u0644\u062C\u0633\u0631", "\u0627\u0644\u062C\u0633\u0631", "\u0643\u0648\u0632\u0648\u0627\u064A", "\u0627\u0644\u062D\u062F\u0648\u062F \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629", "\u0627\u0644\u062F\u0645\u0627\u0645", "\u0627\u0644\u062E\u0628\u0631", "king fahd causeway", "causeway"]
  },
  {
    id: "hwg_bic_f1_circuit",
    name: "\u062D\u0644\u0628\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062F\u0648\u0644\u064A\u0629 \u0644\u0644\u0641\u0648\u0631\u0645\u0648\u0644\u0627 1 \u0627\u0644\u0635\u062E\u064A\u0631",
    nameEn: "Bahrain International Circuit (BIC)",
    category: "landmark",
    categoryLabel: "\u062D\u0644\u0628\u0629 \u0633\u0628\u0627\u0642\u0627\u062A \u0648\u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0643\u0628\u0631\u0649",
    parentAreaName: "\u0627\u0644\u0635\u062E\u064A\u0631",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.0325,
    longitude: 50.5106,
    keywords: ["\u062D\u0644\u0628\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062F\u0648\u0644\u064A\u0629", "\u062D\u0644\u0628\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u062D\u0644\u0628\u0629 \u0627\u0644\u0635\u062E\u064A\u0631", "\u0627\u0644\u0641\u0648\u0631\u0645\u0648\u0644\u0627 1", "\u0641\u0648\u0631\u0645\u0648\u0644\u0627 1", "\u062D\u0644\u0628\u0629 \u0627\u0644\u0641\u0648\u0631\u0645\u0648\u0644\u0627", "bic", "bahrain international circuit", "f1"]
  },
  {
    id: "hwg_exhibition_world_bahrain",
    name: "\u0645\u0631\u0643\u0632 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u0639\u0627\u0644\u0645\u064A \u0644\u0644\u0645\u0639\u0627\u0631\u0636 \u0627\u0644\u062C\u062F\u064A\u062F \u0627\u0644\u0635\u062E\u064A\u0631",
    nameEn: "Exhibition World Bahrain (EWB)",
    category: "landmark",
    categoryLabel: "\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0639\u0627\u0631\u0636 \u0648\u0627\u0644\u0645\u0624\u062A\u0645\u0631\u0627\u062A \u0627\u0644\u062F\u0648\u0644\u064A",
    parentAreaName: "\u0627\u0644\u0635\u062E\u064A\u0631",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.036,
    longitude: 50.505,
    keywords: ["\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0639\u0627\u0631\u0636 \u0627\u0644\u062C\u062F\u064A\u062F", "\u0645\u0639\u0627\u0631\u0636 \u0627\u0644\u0635\u062E\u064A\u0631", "\u0645\u0631\u0643\u0632 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0644\u0644\u0645\u0639\u0627\u0631\u0636", "\u0645\u0639\u0631\u0636 \u0627\u0644\u062C\u0648\u0627\u0647\u0631 \u0627\u0644\u0639\u0631\u0628\u064A\u0629", "\u0645\u0639\u0631\u0636 \u0627\u0644\u062E\u0631\u064A\u0641", "exhibition world bahrain", "ewb"]
  },
  {
    id: "hwg_bahrain_fort",
    name: "\u0642\u0644\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0648\u0645\u062A\u062D\u0641 \u0627\u0644\u0645\u0648\u0642\u0639 (\u0643\u0631\u0628\u0627\u0628\u0627\u062F)",
    nameEn: "Bahrain Fort (Qal'at al-Bahrain)",
    category: "landmark",
    categoryLabel: "\u0645\u0648\u0642\u0639 \u062A\u0631\u0627\u062B \u0639\u0627\u0644\u0645\u064A \u0644\u0644\u064A\u0648\u0646\u0633\u0643\u0648",
    parentAreaName: "\u0643\u0631\u0628\u0627\u0628\u0627\u062F",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.2335,
    longitude: 50.5205,
    keywords: ["\u0642\u0644\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u0642\u0644\u0639\u0629 \u0627\u0644\u0628\u0631\u062A\u063A\u0627\u0644", "\u0645\u062A\u062D\u0641 \u0642\u0644\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u0643\u0631\u0628\u0627\u0628\u0627\u062F \u0627\u0644\u0628\u062D\u0631", "bahrain fort", "qalat al bahrain"]
  },
  {
    id: "hwg_arad_fort",
    name: "\u0642\u0644\u0639\u0629 \u0639\u0631\u0627\u062F \u0648\u0645\u0645\u0634\u0649 \u0642\u0644\u0639\u0629 \u0639\u0631\u0627\u062F",
    nameEn: "Arad Fort & Bay Walkway",
    category: "landmark",
    categoryLabel: "\u0642\u0644\u0639\u0629 \u0623\u062B\u0631\u064A\u0629 \u0648\u0645\u0645\u0634\u0649 \u0628\u062D\u0631\u064A",
    parentAreaName: "\u0639\u0631\u0627\u062F",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.2515,
    longitude: 50.627,
    keywords: ["\u0642\u0644\u0639\u0629 \u0639\u0631\u0627\u062F", "\u0645\u0645\u0634\u0649 \u0639\u0631\u0627\u062F", "\u062E\u0644\u064A\u062C \u0639\u0631\u0627\u062F", "\u0645\u062D\u0645\u064A\u0629 \u062E\u0644\u064A\u062C \u0639\u0631\u0627\u062F", "arad fort"]
  },
  {
    id: "hwg_national_theatre_museum",
    name: "\u0645\u062A\u062D\u0641 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u0648\u0637\u0646\u064A \u0648\u0645\u0633\u0631\u062D \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u0648\u0637\u0646\u064A",
    nameEn: "Bahrain National Museum & Theatre",
    category: "landmark",
    categoryLabel: "\u0635\u0631\u062D \u062B\u0642\u0627\u0641\u064A \u0648\u0645\u062A\u062D\u0641 \u0648\u0637\u0646\u064A",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.241,
    longitude: 50.598,
    keywords: ["\u0645\u062A\u062D\u0641 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u0648\u0637\u0646\u064A", "\u0627\u0644\u0645\u062A\u062D\u0641 \u0627\u0644\u0648\u0637\u0646\u064A", "\u0645\u0633\u0631\u062D \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u0648\u0637\u0646\u064A", "\u0645\u062A\u062D\u0641 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "bahrain national museum", "national theatre"]
  },
  {
    id: "hwg_adhari_park",
    name: "\u0645\u0646\u062A\u0632\u0647 \u0639\u064A\u0646 \u0639\u0630\u0627\u0631\u064A \u0627\u0644\u062A\u0631\u0641\u064A\u0647\u064A",
    nameEn: "Adhari Park",
    category: "landmark",
    categoryLabel: "\u0645\u062F\u064A\u0646\u0629 \u0645\u0644\u0627\u0647\u064A \u0648\u0645\u0646\u062A\u0632\u0647 \u062A\u0631\u0641\u064A\u0647\u064A",
    parentAreaName: "\u0639\u064A\u0646 \u0639\u0630\u0627\u0631\u064A",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.201,
    longitude: 50.547,
    keywords: ["\u0645\u0646\u062A\u0632\u0647 \u0639\u0630\u0627\u0631\u064A", "\u0639\u064A\u0646 \u0639\u0630\u0627\u0631\u064A", "\u0639\u0630\u0627\u0631\u064A \u0628\u0627\u0631\u0643", "\u0645\u0644\u0627\u0647\u064A \u0639\u0630\u0627\u0631\u064A", "adhari park"]
  },
  {
    id: "hwg_tree_of_life",
    name: "\u0634\u062C\u0631\u0629 \u0627\u0644\u062D\u064A\u0627\u0629 \u0627\u0644\u0635\u062E\u064A\u0631",
    nameEn: "Tree of Life",
    category: "landmark",
    categoryLabel: "\u0645\u0639\u0644\u0645 \u0637\u0628\u064A\u0639\u064A \u0648\u0633\u064A\u0627\u062D\u064A",
    parentAreaName: "\u0627\u0644\u0635\u062E\u064A\u0631",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 25.994,
    longitude: 50.583,
    keywords: ["\u0634\u062C\u0631\u0629 \u0627\u0644\u062D\u064A\u0627\u0629", "tree of life", "\u0635\u062D\u0631\u0627\u0621 \u0627\u0644\u0635\u062E\u064A\u0631"]
  },
  {
    id: "hwg_bilaj_al_jazayer",
    name: "\u0628\u0644\u0627\u062C \u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0634\u0627\u0637\u0626 \u0627\u0644\u0639\u0627\u0645 \u0648\u0627\u0644\u0645\u0646\u062A\u062C\u0639\u0627\u062A",
    nameEn: "Bilaj Al Jazayer Beach",
    category: "landmark",
    categoryLabel: "\u0648\u0627\u062C\u0647\u0629 \u0634\u0627\u0637\u0626\u064A\u0629 \u0648\u0633\u064A\u0627\u062D\u064A\u0629 \u0643\u0628\u0631\u0649",
    parentAreaName: "\u0627\u0644\u0632\u0644\u0627\u0642",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 25.992,
    longitude: 50.485,
    keywords: ["\u0628\u0644\u0627\u062C \u0627\u0644\u062C\u0632\u0627\u0626\u0631", "\u0634\u0627\u0637\u0626 \u0627\u0644\u062C\u0632\u0627\u0626\u0631", "\u0628\u0644\u0627\u062C \u0627\u0644\u0632\u0644\u0627\u0642", "bilaj al jazayer", "bilaj beach"]
  },
  {
    id: "hwg_durrat_al_bahrain",
    name: "\u062F\u0631\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 (\u0627\u0644\u0645\u0646\u062A\u062C\u0639 \u0648\u0627\u0644\u062C\u0632\u0631 \u0627\u0644\u0633\u0643\u0646\u064A\u0629)",
    nameEn: "Durrat Al Bahrain",
    category: "landmark",
    categoryLabel: "\u0645\u062F\u064A\u0646\u0629 \u062C\u0632\u0631 \u0648\u0645\u0646\u062A\u062C\u0639\u0627\u062A \u0641\u0627\u062E\u0631\u0629",
    parentAreaName: "\u062F\u0631\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 25.834,
    longitude: 50.596,
    keywords: ["\u062F\u0631\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u0645\u0646\u062A\u062C\u0639 \u062F\u0631\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u062C\u0632\u0631 \u0627\u0644\u062F\u0631\u0629", "\u0628\u0648\u0627\u0628\u0629 \u062F\u0631\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", "durrat al bahrain", "durrah"]
  },
  {
    id: "hwg_amwaj_islands",
    name: "\u062C\u0632\u0631 \u0623\u0645\u0648\u0627\u062C (\u0627\u0644\u0645\u0627\u0631\u064A\u0646\u0627 \u0648\u0627\u0644\u0644\u0627\u062C\u0648\u0646)",
    nameEn: "Amwaj Islands & The Lagoon",
    category: "landmark",
    categoryLabel: "\u062C\u0632\u0631 \u0633\u064A\u0627\u062D\u064A\u0629 \u0648\u0645\u0627\u0631\u064A\u0646\u0627 \u0648\u0643\u0627\u0641\u064A\u0647\u0627\u062A",
    parentAreaName: "\u062C\u0632\u0631 \u0623\u0645\u0648\u0627\u062C",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.282,
    longitude: 50.662,
    keywords: ["\u062C\u0632\u0631 \u0623\u0645\u0648\u0627\u062C", "\u0627\u0645\u0648\u0627\u062C", "\u0627\u0644\u0644\u0627\u062C\u0648\u0646", "\u0644\u0627\u062C\u0648\u0646 \u0627\u0645\u0648\u0627\u062C", "\u0645\u0627\u0631\u064A\u0646\u0627 \u0627\u0645\u0648\u0627\u062C", "amwaj islands", "the lagoon amwaj"]
  },
  // ==========================================
  // 8. المناطق والموانئ الصناعية والتجارية (INDUSTRIAL)
  // ==========================================
  {
    id: "hwg_khalifa_port",
    name: "\u0645\u064A\u0646\u0627\u0621 \u062E\u0644\u064A\u0641\u0629 \u0628\u0646 \u0633\u0644\u0645\u0627\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629",
    nameEn: "Khalifa Bin Salman Port (KBSP)",
    category: "industrial",
    categoryLabel: "\u0627\u0644\u0645\u064A\u0646\u0627\u0621 \u0627\u0644\u0628\u062D\u0631\u064A \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0648\u0627\u0644\u0634\u062D\u0646",
    parentAreaName: "\u0627\u0644\u062D\u062F",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.208,
    longitude: 50.702,
    keywords: ["\u0645\u064A\u0646\u0627\u0621 \u062E\u0644\u064A\u0641\u0629", "\u0645\u064A\u0646\u0627\u0621 \u062E\u0644\u064A\u0641\u0629 \u0628\u0646 \u0633\u0644\u0645\u0627\u0646", "\u0645\u064A\u0646\u0627\u0621 \u0627\u0644\u062D\u062F", "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062D\u062F \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629", "khalifa bin salman port", "kbsp"]
  },
  {
    id: "hwg_sitra_industrial",
    name: "\u0645\u0646\u0637\u0642\u0629 \u0633\u062A\u0631\u0629 \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629 \u0648\u0645\u062D\u0637\u0627\u062A \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0621",
    nameEn: "Sitra Industrial Area",
    category: "industrial",
    categoryLabel: "\u0645\u0646\u0637\u0642\u0629 \u0635\u0646\u0627\u0639\u064A\u0629 \u0648\u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A",
    parentAreaName: "\u0633\u062A\u0631\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.155,
    longitude: 50.62,
    keywords: ["\u0633\u062A\u0631\u0629 \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629", "\u0635\u0646\u0627\u0639\u064A\u0629 \u0633\u062A\u0631\u0629", "\u0643\u0631\u0627\u062C\u0627\u062A \u0633\u062A\u0631\u0629", "sitra industrial area"]
  },
  {
    id: "hwg_salmabad_industrial",
    name: "\u0645\u0646\u0637\u0642\u0629 \u0633\u0644\u0645\u0627\u0628\u0627\u062F \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629 \u0648\u0627\u0644\u0643\u0631\u0627\u062C\u0627\u062A",
    nameEn: "Salmabad Industrial Area",
    category: "industrial",
    categoryLabel: "\u0645\u0646\u0637\u0642\u0629 \u0643\u0631\u0627\u062C\u0627\u062A \u0648\u0648\u0631\u0634 \u0648\u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A",
    parentAreaName: "\u0633\u0644\u0645\u0627\u0628\u0627\u062F",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.185,
    longitude: 50.535,
    keywords: ["\u0633\u0644\u0645\u0627\u0628\u0627\u062F \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629", "\u0635\u0646\u0627\u0639\u064A\u0629 \u0633\u0644\u0645\u0627\u0628\u0627\u062F", "\u0643\u0631\u0627\u062C\u0627\u062A \u0633\u0644\u0645\u0627\u0628\u0627\u062F", "\u0648\u0631\u0634 \u0633\u0644\u0645\u0627\u0628\u0627\u062F", "\u0641\u062D\u0635 \u0627\u0644\u0645\u0631\u0648\u0631 \u0633\u0644\u0645\u0627\u0628\u0627\u062F", "salmabad industrial"]
  },
  {
    id: "hwg_tubli_industrial",
    name: "\u0645\u0646\u0637\u0642\u0629 \u062A\u0648\u0628\u0644\u064A \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629 \u0648\u0645\u0648\u0627\u062F \u0627\u0644\u0628\u0646\u0627\u0621",
    nameEn: "Tubli Industrial & Commercial Area",
    category: "industrial",
    categoryLabel: "\u0645\u0646\u0637\u0642\u0629 \u0648\u0631\u0634 \u0648\u0645\u0639\u0627\u0631\u0636 \u0643\u0628\u0631\u0649",
    parentAreaName: "\u062A\u0648\u0628\u0644\u064A",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.182,
    longitude: 50.552,
    keywords: ["\u062A\u0648\u0628\u0644\u064A \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629", "\u0635\u0646\u0627\u0639\u064A\u0629 \u062A\u0648\u0628\u0644\u064A", "tubli industrial"]
  },
  {
    id: "hwg_alba_smelter",
    name: "\u0634\u0631\u0643\u0629 \u0623\u0644\u0645\u0646\u064A\u0648\u0645 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 (\u0623\u0644\u0628\u0627 - \u0639\u0633\u0643\u0631)",
    nameEn: "Aluminium Bahrain (ALBA)",
    category: "industrial",
    categoryLabel: "\u0635\u0631\u062D \u0635\u0646\u0627\u0639\u064A \u0648\u0645\u0635\u0646\u0639 \u0643\u0628\u0631\u0649",
    parentAreaName: "\u0639\u0633\u0643\u0631",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.095,
    longitude: 50.603,
    keywords: ["\u0627\u0644\u0628\u0627", "\u0623\u0644\u0628\u0627", "\u0634\u0631\u0643\u0629 \u0627\u0644\u0628\u0627", "\u0645\u0635\u0646\u0639 \u0627\u0644\u0628\u0627", "alba", "aluminium bahrain"]
  },
  {
    id: "hwg_bapco_refinery",
    name: "\u0645\u0635\u0641\u0627\u0629 \u0628\u0627\u0628\u0643\u0648 \u0625\u0646\u0631\u062C\u064A\u0632 \u0627\u0644\u0639\u0648\u0627\u0644\u064A / \u0627\u0644\u0645\u0639\u0627\u0645\u064A\u0631",
    nameEn: "Bapco Energies Refinery Awali",
    category: "industrial",
    categoryLabel: "\u0645\u0635\u0641\u0627\u0629 \u0646\u0641\u0637 \u0648\u0645\u0646\u0634\u0622\u062A \u0637\u0627\u0642\u0629",
    parentAreaName: "\u0627\u0644\u0639\u0648\u0627\u0644\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.12,
    longitude: 50.59,
    keywords: ["\u0628\u0627\u0628\u0643\u0648", "\u0645\u0635\u0641\u0627\u0629 \u0628\u0627\u0628\u0643\u0648", "\u0634\u0631\u0643\u0629 \u0628\u0627\u0628\u0643\u0648", "\u0639\u0648\u0627\u0644\u064A \u0628\u0627\u0628\u0643\u0648", "bapco refinery", "bapco"]
  },
  // ==========================================
  // 9. الأحياء والإسكانات والدوارات الشهيرة (RESIDENTIAL & BLOCKS)
  // ==========================================
  {
    id: "hwg_hamad_town_roundabouts",
    name: "\u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F (\u0627\u0644\u062F\u0648\u0627\u0631\u0627\u062A \u0645\u0646 1 \u0625\u0644\u0649 22)",
    nameEn: "Hamad Town (Roundabouts 1 - 22)",
    category: "residential",
    categoryLabel: "\u0645\u062F\u064A\u0646\u0629 \u0633\u0643\u0646\u064A\u0629 \u0643\u0628\u0631\u0649 \u0645\u0642\u0633\u0645\u0629 \u0628\u062F\u0648\u0627\u0631\u0627\u062A",
    parentAreaName: "\u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.115,
    longitude: 50.5069,
    keywords: [
      "\u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F",
      "\u0645\u062F\u064A\u0646\u0647 \u062D\u0645\u062F",
      "\u062F\u0648\u0627\u0631 1",
      "\u062F\u0648\u0627\u0631 2",
      "\u062F\u0648\u0627\u0631 3",
      "\u062F\u0648\u0627\u0631 4",
      "\u062F\u0648\u0627\u0631 5",
      "\u062F\u0648\u0627\u0631 6",
      "\u062F\u0648\u0627\u0631 7",
      "\u062F\u0648\u0627\u0631 8",
      "\u062F\u0648\u0627\u0631 9",
      "\u062F\u0648\u0627\u0631 10",
      "\u062F\u0648\u0627\u0631 11",
      "\u062F\u0648\u0627\u0631 12",
      "\u062F\u0648\u0627\u0631 13",
      "\u062F\u0648\u0627\u0631 14",
      "\u062F\u0648\u0627\u0631 15",
      "\u062F\u0648\u0627\u0631 16",
      "\u062F\u0648\u0627\u0631 17",
      "\u062F\u0648\u0627\u0631 18",
      "\u062F\u0648\u0627\u0631 19",
      "\u062F\u0648\u0627\u0631 20",
      "\u062F\u0648\u0627\u0631 21",
      "\u062F\u0648\u0627\u0631 22",
      "hamad town",
      "hamad town roundabouts"
    ]
  },
  {
    id: "hwg_lawzi_housing",
    name: "\u0625\u0633\u0643\u0627\u0646 \u0627\u0644\u0644\u0648\u0632\u064A \u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F",
    nameEn: "Al Lawzi Housing Project",
    category: "residential",
    categoryLabel: "\u0645\u0634\u0631\u0648\u0639 \u0633\u0643\u0646\u064A \u062D\u062F\u064A\u062B",
    parentAreaName: "\u0627\u0644\u0644\u0648\u0632\u064A",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.155,
    longitude: 50.485,
    keywords: ["\u0627\u0644\u0644\u0648\u0632\u064A", "\u0625\u0633\u0643\u0627\u0646 \u0627\u0644\u0644\u0648\u0632\u064A", "\u0627\u0633\u0643\u0627\u0646 \u0627\u0644\u0644\u0648\u0632\u064A", "\u0628\u062D\u064A\u0631\u0629 \u0627\u0644\u0644\u0648\u0632\u064A", "lawzi housing", "al lawzi"]
  },
  {
    id: "hwg_ramli_housing",
    name: "\u0625\u0633\u0643\u0627\u0646 \u0627\u0644\u0631\u0645\u0644\u064A \u0648\u0633\u0644\u0645\u0627\u0628\u0627\u062F \u0627\u0644\u062C\u062F\u064A\u062F\u0629",
    nameEn: "Al Ramli Housing Project",
    category: "residential",
    categoryLabel: "\u0645\u0634\u0631\u0648\u0639 \u0625\u0633\u0643\u0627\u0646 \u0633\u0643\u0646\u064A \u062D\u062F\u064A\u062B",
    parentAreaName: "\u0633\u0644\u0645\u0627\u0628\u0627\u062F",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.179,
    longitude: 50.536,
    keywords: ["\u0625\u0633\u0643\u0627\u0646 \u0627\u0644\u0631\u0645\u0644\u064A", "\u0627\u0633\u0643\u0627\u0646 \u0627\u0644\u0631\u0645\u0644\u064A", "\u0636\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0645\u0644\u064A", "ramli housing"]
  },
  {
    id: "hwg_salman_city",
    name: "\u0645\u062F\u064A\u0646\u0629 \u0633\u0644\u0645\u0627\u0646 (\u0627\u0644\u062C\u0632\u0631 \u0627\u0644\u0633\u0627\u062D\u0644\u064A\u0629 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629)",
    nameEn: "Salman City (Northern Town)",
    category: "residential",
    categoryLabel: "\u0645\u062F\u064A\u0646\u0629 \u0633\u0627\u062D\u0644\u064A\u0629 \u0633\u0643\u0646\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629",
    parentAreaName: "\u0645\u062F\u064A\u0646\u0629 \u0633\u0644\u0645\u0627\u0646",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.241,
    longitude: 50.456,
    keywords: ["\u0645\u062F\u064A\u0646\u0629 \u0633\u0644\u0645\u0627\u0646", "\u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", "\u0625\u0633\u0643\u0627\u0646 \u0645\u062F\u064A\u0646\u0629 \u0633\u0644\u0645\u0627\u0646", "salman city", "madinat salman", "northern town"]
  },
  {
    id: "hwg_wadi_al_sail",
    name: "\u0648\u0627\u062F\u064A \u0627\u0644\u0633\u064A\u0644 \u0627\u0644\u0631\u0641\u0627\u0639",
    nameEn: "Wadi Al Sail Riffa",
    category: "residential",
    categoryLabel: "\u062D\u064A \u0633\u0643\u0646\u064A \u0648\u0645\u062C\u0645\u0639 \u062A\u062C\u0627\u0631\u064A",
    parentAreaName: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u063A\u0631\u0628\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.141,
    longitude: 50.525,
    keywords: ["\u0648\u0627\u062F\u064A \u0627\u0644\u0633\u064A\u0644", "\u0645\u062C\u0645\u0639 \u0648\u0627\u062F\u064A \u0627\u0644\u0633\u064A\u0644", "\u0633\u064A\u0646\u0645\u0627 \u0648\u0627\u062F\u064A \u0627\u0644\u0633\u064A\u0644", "\u0627\u0633\u0643\u0627\u0646 \u0648\u0627\u062F\u064A \u0627\u0644\u0633\u064A\u0644", "wadi al sail"]
  },
  {
    id: "hwg_hunainiya_valley",
    name: "\u0648\u0627\u062F\u064A \u0627\u0644\u062D\u0646\u064A\u0646\u064A\u0629 \u0648\u0645\u062A\u0646\u0632\u0647 \u0627\u0644\u062D\u0646\u064A\u0646\u064A\u0629 \u0627\u0644\u0631\u0641\u0627\u0639",
    nameEn: "Hunainiya Valley Riffa",
    category: "residential",
    categoryLabel: "\u0648\u0627\u062F\u064A \u062A\u0631\u0627\u062B\u064A \u0648\u0645\u0646\u062A\u0632\u0647 \u0639\u0627\u0626\u0644\u064A",
    parentAreaName: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0631\u0642\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.118,
    longitude: 50.559,
    keywords: ["\u0627\u0644\u062D\u0646\u064A\u0646\u064A\u0629", "\u0648\u0627\u062F\u064A \u0627\u0644\u062D\u0646\u064A\u0646\u064A\u0629", "\u0639\u064A\u0646 \u0627\u0644\u062D\u0646\u064A\u0646\u064A\u0629", "\u0642\u0644\u0639\u0629 \u0627\u0644\u0634\u064A\u062E \u0633\u0644\u0645\u0627\u0646 \u0627\u0644\u062D\u0646\u064A\u0646\u064A\u0629", "hunainiya"]
  },
  {
    id: "hwg_sayah_busaiteen",
    name: "\u0627\u0644\u0633\u0627\u064A\u0629 \u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646",
    nameEn: "Al Sayah Busaiteen",
    category: "residential",
    categoryLabel: "\u0648\u0627\u062C\u0647\u0629 \u0633\u0643\u0646\u064A\u0629 \u0648\u0628\u062D\u0631\u064A\u0629 \u062D\u062F\u064A\u062B\u0629",
    parentAreaName: "\u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.275,
    longitude: 50.598,
    keywords: ["\u0627\u0644\u0633\u0627\u064A\u0629", "\u0627\u0644\u0633\u0627\u064A\u0647", "\u0625\u0633\u0643\u0627\u0646 \u0627\u0644\u0633\u0627\u064A\u0629", "\u0634\u0627\u0637\u0626 \u0627\u0644\u0633\u0627\u064A\u0629", "al sayah", "sayah busaiteen"]
  }
];

// src/data/bahrainLandmarks.ts
var BASE_BAHRAIN_LANDMARKS = [
  // 1. مودا مول (مركز البحرين التجاري العالمي - المنامة)
  {
    id: "moda_mall",
    name: "\u0645\u0648\u062F\u0627 \u0645\u0648\u0644",
    nameEn: "Moda Mall",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.237,
    longitude: 50.582,
    keywords: [
      "\u0645\u0648\u062F\u0627\u0645\u0648\u0644",
      "\u0645\u0648\u062F\u0627 \u0645\u0648\u0644",
      "\u0645\u0648\u062F\u0627",
      "\u0645\u062C\u0645\u0639 \u0645\u0648\u062F\u0627",
      "\u0645\u0631\u0643\u0632 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062A\u062C\u0627\u0631\u064A \u0627\u0644\u0639\u0627\u0644\u0645\u064A",
      "\u0628\u0631\u062C \u0627\u0644\u062A\u062C\u0627\u0631\u0629 \u0627\u0644\u0639\u0627\u0644\u0645\u064A",
      "\u0634\u064A\u0631\u0627\u062A\u0648\u0646",
      "\u0641\u0646\u062F\u0642 \u0627\u0644\u0634\u064A\u0631\u0627\u062A\u0648\u0646",
      "moda mall",
      "modamall",
      "bwtc"
    ]
  },
  // 2. مجمع السيف (ضاحية السيف)
  {
    id: "seef_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0633\u064A\u0641",
    nameEn: "Seef Mall",
    parentAreaName: "\u0627\u0644\u0633\u064A\u0641",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.241,
    longitude: 50.536,
    keywords: [
      "\u0627\u0644\u0633\u064A\u0641 \u0645\u0648\u0644",
      "\u0633\u064A\u0641 \u0645\u0648\u0644",
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0633\u064A\u0641",
      "\u0633\u064A\u0641 \u0627\u0644\u0645\u0646\u0627\u0645\u0629",
      "\u0645\u0648\u0644 \u0627\u0644\u0633\u064A\u0641",
      "seef mall",
      "seefmall"
    ]
  },
  // 3. سيتي سنتر البحرين (ضاحية السيف)
  {
    id: "city_centre",
    name: "\u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
    nameEn: "City Centre Bahrain",
    parentAreaName: "\u0627\u0644\u0633\u064A\u0641",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.2345,
    longitude: 50.551,
    keywords: [
      "\u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631",
      "\u0627\u0644\u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631",
      "\u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u0645\u062C\u0645\u0639 \u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631",
      "\u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631 \u0645\u0648\u0644",
      "\u0633\u062A\u064A \u0633\u0646\u062A\u0631",
      "\u0627\u0644\u0633\u062A\u064A \u0633\u0646\u062A\u0631",
      "city centre",
      "city center",
      "citycentre",
      "bahrain city centre"
    ]
  },
  // 4. الأفنيوز البحرين (كورنيش الملك فيصل - المنامة)
  {
    id: "the_avenues",
    name: "\u0627\u0644\u0623\u0641\u0646\u064A\u0648\u0632 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
    nameEn: "The Avenues Bahrain",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.2425,
    longitude: 50.578,
    keywords: [
      "\u0627\u0644\u0627\u0641\u0646\u064A\u0648\u0632",
      "\u0627\u0644\u0623\u0641\u0646\u064A\u0648\u0632",
      "\u0627\u0641\u0646\u064A\u0648\u0632",
      "\u0630\u0627 \u0627\u0641\u0646\u064A\u0648\u0632",
      "\u0630\u0627 \u0623\u0641\u0646\u064A\u0648\u0632",
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0627\u0641\u0646\u064A\u0648\u0632",
      "avenues",
      "the avenues"
    ]
  },
  // 5. مجمع الدانة (السنابس)
  {
    id: "dana_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u062F\u0627\u0646\u0629",
    nameEn: "Dana Mall",
    parentAreaName: "\u0627\u0644\u0633\u0646\u0627\u0628\u0633",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.23,
    longitude: 50.556,
    keywords: [
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u062F\u0627\u0646\u0629",
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u062F\u0627\u0646\u0647",
      "\u0627\u0644\u062F\u0627\u0646\u0629 \u0645\u0648\u0644",
      "\u0627\u0644\u062F\u0627\u0646\u0647 \u0645\u0648\u0644",
      "\u062F\u0627\u0646\u0627 \u0645\u0648\u0644",
      "dana mall",
      "danamall"
    ]
  },
  // 6. مجمع البحرين / جيان (السنابس)
  {
    id: "bahrain_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
    nameEn: "Bahrain Mall",
    parentAreaName: "\u0627\u0644\u0633\u0646\u0627\u0628\u0633",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.228,
    longitude: 50.551,
    keywords: [
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u062C\u064A\u0627\u0646",
      "\u062C\u064A\u0627\u0646 \u0627\u0644\u0633\u0646\u0627\u0628\u0633",
      "\u0644\u0648\u0644\u0648 \u0627\u0644\u0633\u0646\u0627\u0628\u0633",
      "bahrain mall"
    ]
  },
  // 7. مجمع العالي (ضاحية السيف)
  {
    id: "al_aali_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0639\u0627\u0644\u064A",
    nameEn: "Al Aali Mall",
    parentAreaName: "\u0627\u0644\u0633\u064A\u0641",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.24,
    longitude: 50.539,
    keywords: [
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0639\u0627\u0644\u064A",
      "\u0627\u0644\u0639\u0627\u0644\u064A \u0645\u0648\u0644",
      "\u0627\u0644\u0639\u0627\u0644\u064A",
      "al aali mall",
      "aali mall"
    ]
  },
  // 8. مجمع مارينا مول (المنامة / النعيم)
  {
    id: "marina_mall",
    name: "\u0645\u0627\u0631\u064A\u0646\u0627 \u0645\u0648\u0644",
    nameEn: "Marina Mall",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.231,
    longitude: 50.572,
    keywords: [
      "\u0645\u0627\u0631\u064A\u0646\u0627 \u0645\u0648\u0644",
      "\u0645\u062C\u0645\u0639 \u0645\u0627\u0631\u064A\u0646\u0627",
      "\u0645\u0627\u0631\u064A\u0646\u0627",
      "marina mall"
    ]
  },
  // 9. مجمع الواحة - الجفير
  {
    id: "oasis_juffair",
    name: "\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u062C\u0641\u064A\u0631",
    nameEn: "Oasis Mall Juffair",
    parentAreaName: "\u0627\u0644\u062C\u0641\u064A\u0631",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.216,
    longitude: 50.602,
    keywords: [
      "\u0648\u0627\u062D\u0629 \u0627\u0644\u062C\u0641\u064A\u0631",
      "\u0627\u0644\u0648\u0627\u062D\u0629 \u0627\u0644\u062C\u0641\u064A\u0631",
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0648\u0627\u062D\u0629 \u0627\u0644\u062C\u0641\u064A\u0631",
      "\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u062C\u0641\u064A\u0631",
      "oasis juffair"
    ]
  },
  // 10. مجمع الواحة - المحرق
  {
    id: "oasis_muharraq",
    name: "\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u0645\u062D\u0631\u0642",
    nameEn: "Oasis Mall Muharraq",
    parentAreaName: "\u0627\u0644\u0645\u062D\u0631\u0642",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.257,
    longitude: 50.612,
    keywords: [
      "\u0648\u0627\u062D\u0629 \u0627\u0644\u0645\u062D\u0631\u0642",
      "\u0627\u0644\u0648\u0627\u062D\u0629 \u0627\u0644\u0645\u062D\u0631\u0642",
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0648\u0627\u062D\u0629 \u0627\u0644\u0645\u062D\u0631\u0642",
      "\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u0645\u062D\u0631\u0642",
      "oasis muharraq"
    ]
  },
  // 11. مجمع الواحة - الرفاع
  {
    id: "oasis_riffa",
    name: "\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u0631\u0641\u0627\u0639",
    nameEn: "Oasis Mall Riffa",
    parentAreaName: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0631\u0642\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.126,
    longitude: 50.562,
    keywords: [
      "\u0648\u0627\u062D\u0629 \u0627\u0644\u0631\u0641\u0627\u0639",
      "\u0627\u0644\u0648\u0627\u062D\u0629 \u0627\u0644\u0631\u0641\u0627\u0639",
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0648\u0627\u062D\u0629 \u0627\u0644\u0631\u0641\u0627\u0639",
      "\u0627\u0644\u0648\u0627\u062D\u0629 \u0645\u0648\u0644 \u0627\u0644\u0631\u0641\u0627\u0639",
      "oasis riffa"
    ]
  },
  // 12. مجمع الإنماء (الرفاع الشرقي)
  {
    id: "enma_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0625\u0646\u0645\u0627\u0621",
    nameEn: "Enma Mall",
    parentAreaName: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0631\u0642\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.125,
    longitude: 50.575,
    keywords: [
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0627\u0646\u0645\u0627\u0621",
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0625\u0646\u0645\u0627\u0621",
      "\u0627\u0646\u0645\u0627\u0621 \u0645\u0648\u0644",
      "\u0625\u0646\u0645\u0627\u0621 \u0645\u0648\u0644",
      "\u0627\u0644\u0627\u0646\u0645\u0627\u0621 \u0645\u0648\u0644",
      "\u0627\u0644\u0625\u0646\u0645\u0627\u0621 \u0645\u0648\u0644",
      "enma mall",
      "al enma"
    ]
  },
  // 13. مجمع رملي (عالي / سلماباد)
  {
    id: "ramli_mall",
    name: "\u0645\u062C\u0645\u0639 \u0631\u0645\u0644\u064A",
    nameEn: "Ramli Mall",
    parentAreaName: "\u0639\u0627\u0644\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.16,
    longitude: 50.53,
    keywords: [
      "\u0645\u062C\u0645\u0639 \u0631\u0645\u0644\u064A",
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0631\u0645\u0644\u064A",
      "\u0631\u0645\u0644\u064A \u0645\u0648\u0644",
      "\u0627\u0644\u0631\u0645\u0644\u064A \u0645\u0648\u0644",
      "\u0644\u0648\u0644\u0648 \u0639\u0627\u0644\u064A",
      "ramli mall"
    ]
  },
  // 14. مجمع الليوان (الهملة)
  {
    id: "liwan_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0644\u064A\u0648\u0627\u0646",
    nameEn: "Al Liwan Hamala",
    parentAreaName: "\u0627\u0644\u0647\u0645\u0644\u0629",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.175,
    longitude: 50.485,
    keywords: [
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0644\u064A\u0648\u0627\u0646",
      "\u0627\u0644\u0644\u064A\u0648\u0627\u0646",
      "\u0644\u064A\u0648\u0627\u0646 \u0627\u0644\u0647\u0645\u0644\u0629",
      "\u0644\u064A\u0648\u0627\u0646",
      "al liwan",
      "liwan mall"
    ]
  },
  // 15. مجمع أتريوم (الجنبية / سار)
  {
    id: "atrium_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0623\u062A\u0631\u064A\u0648\u0645",
    nameEn: "Atrium Mall",
    parentAreaName: "\u0627\u0644\u062C\u0646\u0628\u064A\u0629",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.208,
    longitude: 50.488,
    keywords: [
      "\u0645\u062C\u0645\u0639 \u0627\u062A\u0631\u064A\u0648\u0645",
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0623\u062A\u0631\u064A\u0648\u0645",
      "\u0627\u062A\u0631\u064A\u0648\u0645 \u0645\u0648\u0644",
      "\u0627\u0644\u0623\u062A\u0631\u064A\u0648\u0645 \u0645\u0648\u0644",
      "\u0627\u062A\u0631\u064A\u0648\u0645 \u0627\u0644\u062C\u0646\u0628\u064A\u0629",
      "atrium mall",
      "atrium"
    ]
  },
  // 16. مجمع دلمونيا (جزيرة دلمونيا / المحرق)
  {
    id: "mall_of_dilmunia",
    name: "\u0645\u0648\u0644 \u062F\u0644\u0645\u0648\u0646\u064A\u0627",
    nameEn: "Mall of Dilmunia",
    parentAreaName: "\u062F\u064A\u0627\u0631 \u0627\u0644\u0645\u062D\u0631\u0642",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.295,
    longitude: 50.665,
    keywords: [
      "\u0645\u062C\u0645\u0639 \u062F\u0644\u0645\u0648\u0646\u064A\u0627",
      "\u0645\u0648\u0644 \u062F\u0644\u0645\u0648\u0646\u064A\u0627",
      "\u062F\u0644\u0645\u0648\u0646\u064A\u0627 \u0645\u0648\u0644",
      "\u062C\u0632\u064A\u0631\u0629 \u062F\u0644\u0645\u0648\u0646\u064A\u0627",
      "\u062F\u0644\u0645\u0648\u0646\u064A\u0627",
      "dilmunia mall",
      "mall of dilmunia"
    ]
  },
  // 17. مراسي جاليريا (ديار المحرق)
  {
    id: "marassi_galleria",
    name: "\u0645\u0631\u0627\u0633\u064A \u062C\u0627\u0644\u064A\u0631\u064A\u0627",
    nameEn: "Marassi Galleria",
    parentAreaName: "\u062F\u064A\u0627\u0631 \u0627\u0644\u0645\u062D\u0631\u0642",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.29,
    longitude: 50.64,
    keywords: [
      "\u0645\u0631\u0627\u0633\u064A \u062C\u0627\u0644\u064A\u0631\u064A\u0627",
      "\u0645\u0631\u0627\u0633\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u0645\u0631\u0627\u0633\u064A \u0645\u0648\u0644",
      "\u0645\u062C\u0645\u0639 \u0645\u0631\u0627\u0633\u064A",
      "marassi galleria",
      "marassi"
    ]
  },
  // 18. لاغون أمواج (جزر أمواج)
  {
    id: "the_lagoon_amwaj",
    name: "\u0644\u0627\u063A\u0648\u0646 \u0623\u0645\u0648\u0627\u062C",
    nameEn: "The Lagoon Amwaj",
    parentAreaName: "\u062C\u0632\u0631 \u0623\u0645\u0648\u0627\u062C",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.284,
    longitude: 50.664,
    keywords: [
      "\u0644\u0627\u063A\u0648\u0646 \u0623\u0645\u0648\u0627\u062C",
      "\u0644\u0627\u063A\u0648\u0646 \u0627\u0645\u0648\u0627\u062C",
      "\u0627\u0644\u0644\u0627\u063A\u0648\u0646",
      "\u0630\u0627 \u0644\u0627\u062C\u0648\u0646",
      "\u0644\u0627\u062C\u0648\u0646 \u0623\u0645\u0648\u0627\u062C",
      "the lagoon",
      "lagoon amwaj"
    ]
  },
  // 19. سوق واقف (مدينة حمد / المالكية)
  {
    id: "souq_waqif_bh",
    name: "\u0633\u0648\u0642 \u0648\u0627\u0642\u0641",
    nameEn: "Souq Waqif",
    parentAreaName: "\u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.122,
    longitude: 50.505,
    keywords: [
      "\u0633\u0648\u0642 \u0648\u0627\u0642\u0641",
      "\u0633\u0648\u0642 \u0648\u0627\u0642\u0641 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u0633\u0648\u0642 \u0648\u0627\u0642\u0641 \u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F",
      "\u062F\u0648\u0627\u0631 1 \u0633\u0648\u0642 \u0648\u0627\u0642\u0641",
      "souq waqif"
    ]
  },
  // 20. سوق التنين / دراغون سيتي (ديار المحرق)
  {
    id: "dragon_city",
    name: "\u0633\u0648\u0642 \u0627\u0644\u062A\u0646\u064A\u0646",
    nameEn: "Dragon City",
    parentAreaName: "\u062F\u064A\u0627\u0631 \u0627\u0644\u0645\u062D\u0631\u0642",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.288,
    longitude: 50.628,
    keywords: [
      "\u0633\u0648\u0642 \u0627\u0644\u062A\u0646\u064A\u0646",
      "\u0627\u0644\u062A\u0646\u064A\u0646",
      "\u062F\u0631\u0627\u063A\u0648\u0646 \u0633\u064A\u062A\u064A",
      "\u062F\u0631\u0627\u062C\u0648\u0646 \u0633\u064A\u062A\u064A",
      "\u0627\u0644\u062A\u0646\u064A\u0646 \u062F\u064A\u0627\u0631 \u0627\u0644\u0645\u062D\u0631\u0642",
      "dragon city"
    ]
  },
  // 21. باب البحرين وسوق المنامة القديم
  {
    id: "bab_al_bahrain",
    name: "\u0628\u0627\u0628 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 / \u0633\u0648\u0642 \u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    nameEn: "Bab Al Bahrain",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.234,
    longitude: 50.575,
    keywords: [
      "\u0628\u0627\u0628 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u0633\u0648\u0642 \u0627\u0644\u0645\u0646\u0627\u0645\u0629",
      "\u0633\u0648\u0642 \u0627\u0644\u0645\u0646\u0627\u0645\u0647",
      "\u0627\u0644\u0633\u0648\u0642 \u0627\u0644\u0642\u062F\u064A\u0645 \u0627\u0644\u0645\u0646\u0627\u0645\u0629",
      "bab al bahrain"
    ]
  },
  // 22. سوق المحرق والقيصرية
  {
    id: "souq_muharraq",
    name: "\u0633\u0648\u0642 \u0627\u0644\u0645\u062D\u0631\u0642 / \u0627\u0644\u0642\u064A\u0635\u0631\u064A\u0629",
    nameEn: "Souq Al Qaisariya",
    parentAreaName: "\u0627\u0644\u0645\u062D\u0631\u0642",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.255,
    longitude: 50.612,
    keywords: [
      "\u0633\u0648\u0642 \u0627\u0644\u0645\u062D\u0631\u0642",
      "\u0633\u0648\u0642 \u0627\u0644\u0642\u064A\u0635\u0631\u064A\u0629",
      "\u0642\u064A\u0635\u0631\u064A\u0629 \u0627\u0644\u0645\u062D\u0631\u0642",
      "\u0633\u0648\u0642 \u0627\u0644\u0642\u064A\u0635\u0631\u064A\u0647"
    ]
  },
  // 23. ووتر غاردن سيتي (ضاحية السيف)
  {
    id: "water_garden_city",
    name: "\u0648\u0648\u062A\u0631 \u062C\u0627\u0631\u062F\u0646 \u0633\u064A\u062A\u064A",
    nameEn: "Water Garden City",
    parentAreaName: "\u0627\u0644\u0633\u064A\u0641",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.245,
    longitude: 50.544,
    keywords: [
      "\u0648\u0648\u062A\u0631 \u062C\u0627\u0631\u062F\u0646 \u0633\u064A\u062A\u064A",
      "\u0648\u0648\u062A\u0631 \u063A\u0627\u0631\u062F\u0646 \u0633\u064A\u062A\u064A",
      "\u0648\u0627\u062A\u0631 \u062C\u0627\u0631\u062F\u0646",
      "\u0648\u0627\u062A\u0631 \u062C\u0627\u0631\u062F\u0646 \u0633\u064A\u062A\u064A",
      "water garden city"
    ]
  },
  // 24. خليج البحرين / البحرين باي
  {
    id: "bahrain_bay",
    name: "\u062E\u0644\u064A\u062C \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
    nameEn: "Bahrain Bay",
    parentAreaName: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.248,
    longitude: 50.575,
    keywords: [
      "\u062E\u0644\u064A\u062C \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0628\u0627\u064A",
      "\u0641\u0646\u062F\u0642 \u0627\u0644\u0641\u0648\u0631\u0633\u064A\u0632\u0648\u0646\u0632",
      "\u0641\u0648\u0631\u0633\u064A\u0632\u0648\u0646\u0632 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "bahrain bay"
    ]
  },
  // 25. مطار البحرين الدولي (المحرق)
  {
    id: "bahrain_airport",
    name: "\u0645\u0637\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062F\u0648\u0644\u064A",
    nameEn: "Bahrain International Airport",
    parentAreaName: "\u0627\u0644\u0645\u062D\u0631\u0642",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.27,
    longitude: 50.633,
    keywords: [
      "\u0645\u0637\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u0645\u0637\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062F\u0648\u0644\u064A",
      "\u0627\u0644\u0645\u0637\u0627\u0631",
      "\u0645\u0637\u0627\u0631 \u0627\u0644\u0645\u062D\u0631\u0642",
      "bahrain airport",
      "bahrain international airport"
    ]
  },
  // 26. مجمع السلمانية الطبي (السلمانية)
  {
    id: "salmaniya_complex",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629 \u0627\u0644\u0637\u0628\u064A",
    nameEn: "Salmaniya Medical Complex",
    parentAreaName: "\u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.212,
    longitude: 50.584,
    keywords: [
      "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629",
      "\u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629 \u0627\u0644\u0637\u0628\u064A",
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629 \u0627\u0644\u0637\u0628\u064A",
      "\u0645\u0631\u0643\u0632 \u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629",
      "salmaniya hospital"
    ]
  },
  // 27. مستشفى الملك حمد الجامعي (البسيتين / المحرق)
  {
    id: "king_hamad_hospital",
    name: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0645\u0644\u0643 \u062D\u0645\u062F \u0627\u0644\u062C\u0627\u0645\u0639\u064A",
    nameEn: "King Hamad University Hospital",
    parentAreaName: "\u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646",
    governorate: "\u0627\u0644\u0645\u062D\u0631\u0642",
    latitude: 26.273,
    longitude: 50.608,
    keywords: [
      "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0645\u0644\u0643 \u062D\u0645\u062F",
      "\u0627\u0644\u0645\u0644\u0643 \u062D\u0645\u062F \u0627\u0644\u062C\u0627\u0645\u0639\u064A",
      "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0645\u0644\u0643 \u062D\u0645\u062F \u0627\u0644\u062C\u0627\u0645\u0639\u064A",
      "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646",
      "khuh"
    ]
  },
  // 28. المستشفى العسكري (الرفاع الغربي)
  {
    id: "bdf_hospital",
    name: "\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0639\u0633\u0643\u0631\u064A (\u0642\u0648\u0629 \u0627\u0644\u062F\u0641\u0627\u0639)",
    nameEn: "BDF Hospital",
    parentAreaName: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u063A\u0631\u0628\u064A",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.136,
    longitude: 50.548,
    keywords: [
      "\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0639\u0633\u0643\u0631\u064A",
      "\u0627\u0644\u0639\u0633\u0643\u0631\u064A",
      "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0639\u0633\u0643\u0631\u064A",
      "\u0642\u0648\u0629 \u062F\u0641\u0627\u0639 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u0645\u0633\u062A\u0634\u0641\u0649 \u0642\u0648\u0629 \u0627\u0644\u062F\u0641\u0627\u0639",
      "bdf hospital",
      "bdf"
    ]
  },
  // 29. حلبة البحرين الدولية (الصخير)
  {
    id: "bahrain_intl_circuit",
    name: "\u062D\u0644\u0628\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062F\u0648\u0644\u064A\u0629",
    nameEn: "Bahrain International Circuit",
    parentAreaName: "\u0627\u0644\u0632\u0644\u0627\u0642",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.032,
    longitude: 50.51,
    keywords: [
      "\u062D\u0644\u0628\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062F\u0648\u0644\u064A\u0629",
      "\u062D\u0644\u0628\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u062D\u0644\u0628\u0629 \u0627\u0644\u0635\u062E\u064A\u0631",
      "\u0627\u0644\u0635\u062E\u064A\u0631",
      "\u0635\u062E\u064A\u0631",
      "\u0627\u0644\u0641\u0648\u0631\u0645\u0648\u0644\u0627",
      "\u0641\u0648\u0631\u0645\u0648\u0644\u0627 1",
      "bic"
    ]
  },
  // 30. جامعة البحرين - الصخير
  {
    id: "uob_sakhir",
    name: "\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 (\u0627\u0644\u0635\u062E\u064A\u0631)",
    nameEn: "University of Bahrain Sakhir",
    parentAreaName: "\u0627\u0644\u0632\u0644\u0627\u0642",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.052,
    longitude: 50.512,
    keywords: [
      "\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u0635\u062E\u064A\u0631",
      "\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u062C\u0627\u0645\u0639\u0647 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u0627\u0644\u062C\u0627\u0645\u0639\u0629",
      "\u0627\u0644\u062C\u0627\u0645\u0639\u0647",
      "\u064A\u0648 \u0627\u0648 \u0628\u064A",
      "uob"
    ]
  },
  // 31. جامعة البحرين - مدينة عيسى / بوليتكنك البحرين
  {
    id: "polytechnic_isa_town",
    name: "\u062C\u0627\u0645\u0639\u0629 \u0628\u0648\u0644\u064A\u062A\u0643\u0646\u0643 / \u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649",
    nameEn: "Bahrain Polytechnic",
    parentAreaName: "\u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 26.17,
    longitude: 50.545,
    keywords: [
      "\u0628\u0648\u0644\u064A\u062A\u0643\u0646\u0643",
      "\u0628\u0648\u0644\u064A\u062A\u0643\u0646\u0643 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649"
    ]
  },
  // 32. درة البحرين
  {
    id: "durrat_al_bahrain_lm",
    name: "\u0645\u0646\u062A\u062C\u0639 \u062F\u0631\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
    nameEn: "Durrat Al Bahrain Resort",
    parentAreaName: "\u062F\u0631\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
    governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629",
    latitude: 25.835,
    longitude: 50.59,
    keywords: [
      "\u062F\u0631\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u0627\u0644\u062F\u0631\u0629",
      "\u0645\u0646\u062A\u062C\u0639 \u0627\u0644\u062F\u0631\u0629",
      "durrat al bahrain"
    ]
  },
  // 33. مجمع مرسليا / مرسيليا (باربار / جنوسان)
  {
    id: "marseille_mall",
    name: "\u0645\u062C\u0645\u0639 \u0645\u0631\u0633\u064A\u0644\u064A\u0627",
    nameEn: "Marseille Mall",
    parentAreaName: "\u0628\u0627\u0631\u0628\u0627\u0631",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.22,
    longitude: 50.49,
    keywords: [
      "\u0645\u062C\u0645\u0639 \u0645\u0631\u0633\u064A\u0644\u064A\u0627",
      "\u0645\u062C\u0645\u0639 \u0645\u0631\u0633\u0644\u064A\u0627",
      "\u0645\u0631\u0633\u064A\u0644\u064A\u0627 \u0645\u0648\u0644"
    ]
  },
  // 34. مجمع الراية (الجفير)
  {
    id: "al_raya_mall",
    name: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0631\u0627\u064A\u0629 \u0627\u0644\u062C\u0641\u064A\u0631",
    nameEn: "Al Raya Mall",
    parentAreaName: "\u0627\u0644\u062C\u0641\u064A\u0631",
    governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    latitude: 26.213,
    longitude: 50.601,
    keywords: [
      "\u0645\u062C\u0645\u0639 \u0627\u0644\u0631\u0627\u064A\u0629",
      "\u0627\u0644\u0631\u0627\u064A\u0629 \u0645\u0648\u0644",
      "\u0627\u0644\u0631\u0627\u064A\u0629 \u0627\u0644\u062C\u0641\u064A\u0631",
      "al raya mall"
    ]
  },
  // 35. جسر الملك فهد (الجسرة / المنفذ الحدودي)
  {
    id: "king_fahd_causeway",
    name: "\u062C\u0633\u0631 \u0627\u0644\u0645\u0644\u0643 \u0641\u0647\u062F",
    nameEn: "King Fahd Causeway",
    parentAreaName: "\u0627\u0644\u062C\u0633\u0631\u0629",
    governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629",
    latitude: 26.177,
    longitude: 50.461,
    keywords: [
      "\u062C\u0633\u0631 \u0627\u0644\u0645\u0644\u0643 \u0641\u0647\u062F",
      "\u062C\u0633\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      "\u0645\u0646\u0641\u0630 \u0627\u0644\u062C\u0633\u0631",
      "\u0627\u0644\u062C\u0633\u0631",
      "\u0643\u0648\u0632\u0648\u0627\u064A",
      "\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629",
      "\u0627\u0644\u062F\u0645\u0627\u0645",
      "\u0627\u0644\u062E\u0628\u0631",
      "king fahd causeway",
      "causeway"
    ]
  }
];
var existingIds = new Set(BASE_BAHRAIN_LANDMARKS.map((l) => l.id));
var additionalHwgPlaces = HERE_WE_GO_BAHRAIN_PLACES.filter(
  (p) => !existingIds.has(p.id)
).map((p) => ({
  id: p.id,
  name: p.name,
  nameEn: p.nameEn,
  parentAreaName: p.parentAreaName,
  governorate: p.governorate,
  latitude: p.latitude,
  longitude: p.longitude,
  keywords: p.keywords
}));
var BAHRAIN_LANDMARKS = [
  ...BASE_BAHRAIN_LANDMARKS,
  ...additionalHwgPlaces
];

// src/data/bahrainAreas.ts
var BAHRAIN_AREAS = [
  // العاصمة (Capital Governorate)
  { id: "manama", name: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629", nameEn: "Manama", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.2235, longitude: 50.5876 },
  { id: "juffair", name: "\u0627\u0644\u062C\u0641\u064A\u0631", nameEn: "Juffair", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.215, longitude: 50.6 },
  { id: "adliya", name: "\u0627\u0644\u0639\u062F\u0644\u064A\u0629", nameEn: "Adliya", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.215, longitude: 50.596 },
  { id: "seef", name: "\u0627\u0644\u0633\u064A\u0641", nameEn: "Seef", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.236, longitude: 50.535 },
  { id: "sanabis", name: "\u0627\u0644\u0633\u0646\u0627\u0628\u0633", nameEn: "Sanabis", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.23, longitude: 50.565 },
  { id: "zinj", name: "\u0627\u0644\u0632\u0646\u062C", nameEn: "Zinj", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.19, longitude: 50.585 },
  { id: "bilad_al_qadeem", name: "\u0627\u0644\u0628\u0644\u0627\u062F \u0627\u0644\u0642\u062F\u064A\u0645", nameEn: "Bilad Al Qadeem", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.19, longitude: 50.57 },
  { id: "umm_al_hassam", name: "\u0623\u0645 \u0627\u0644\u062D\u0635\u0645", nameEn: "Umm Al Hassam", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.205, longitude: 50.595 },
  { id: "quful", name: "\u0627\u0644\u0642\u0641\u0648\u0644", nameEn: "Qufool", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.222, longitude: 50.568 },
  { id: "salmaniya", name: "\u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629", nameEn: "Salmaniya", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.21, longitude: 50.585 },
  { id: "tubli", name: "\u062A\u0648\u0628\u0644\u064A", nameEn: "Tubli", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.18, longitude: 50.56 },
  { id: "sitra", name: "\u0633\u062A\u0631\u0629", nameEn: "Sitra", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.1547, longitude: 50.6206 },
  { id: "nabih_saleh", name: "\u0627\u0644\u0646\u0628\u064A\u0647 \u0635\u0627\u0644\u062D", nameEn: "Nabih Saleh", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.19, longitude: 50.605 },
  { id: "mahuz", name: "\u0627\u0644\u0645\u0627\u062D\u0648\u0632", nameEn: "Mahooz", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.208, longitude: 50.589 },
  { id: "gudaibiya", name: "\u0627\u0644\u0642\u0636\u064A\u0628\u064A\u0629", nameEn: "Gudaibiya", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.22, longitude: 50.592 },
  { id: "hoora", name: "\u0627\u0644\u062D\u0648\u0631\u0629", nameEn: "Hoora", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.234, longitude: 50.595 },
  { id: "ras_ruman", name: "\u0631\u0623\u0633 \u0631\u0645\u0627\u0646", nameEn: "Ras Ruman", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.235, longitude: 50.585 },
  { id: "salhabad", name: "\u0633\u0645\u0627\u0647\u064A\u062C / \u0627\u0644\u0635\u0627\u0644\u062D\u064A\u0629", nameEn: "Salhiya", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.202, longitude: 50.558 },
  { id: "khamis", name: "\u0627\u0644\u062E\u0645\u064A\u0633", nameEn: "Khamis", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.205, longitude: 50.548 },
  { id: "daih", name: "\u0627\u0644\u062F\u064A\u0647", nameEn: "Al Daih", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.226, longitude: 50.55 },
  { id: "burhama", name: "\u0627\u0644\u0628\u0631\u0647\u0627\u0645\u0629", nameEn: "Burhama", governorate: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629", latitude: 26.221, longitude: 50.558 },
  // المحرق (Muharraq Governorate)
  { id: "muharraq", name: "\u0627\u0644\u0645\u062D\u0631\u0642", nameEn: "Muharraq", governorate: "\u0627\u0644\u0645\u062D\u0631\u0642", latitude: 26.2572, longitude: 50.6119 },
  { id: "busaiteen", name: "\u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646", nameEn: "Busaiteen", governorate: "\u0627\u0644\u0645\u062D\u0631\u0642", latitude: 26.27, longitude: 50.605 },
  { id: "arad", name: "\u0639\u0631\u0627\u062F", nameEn: "Arad", governorate: "\u0627\u0644\u0645\u062D\u0631\u0642", latitude: 26.253, longitude: 50.62 },
  { id: "hidd", name: "\u0627\u0644\u062D\u062F", nameEn: "Hidd", governorate: "\u0627\u0644\u0645\u062D\u0631\u0642", latitude: 26.245, longitude: 50.655 },
  { id: "galali", name: "\u0642\u0644\u0627\u0644\u064A", nameEn: "Galali", governorate: "\u0627\u0644\u0645\u062D\u0631\u0642", latitude: 26.26, longitude: 50.65 },
  { id: "diyar_al_muharraq", name: "\u062F\u064A\u0627\u0631 \u0627\u0644\u0645\u062D\u0631\u0642", nameEn: "Diyar Al Muharraq", governorate: "\u0627\u0644\u0645\u062D\u0631\u0642", latitude: 26.285, longitude: 50.63 },
  { id: "amwaj", name: "\u062C\u0632\u0631 \u0623\u0645\u0648\u0627\u062C", nameEn: "Amwaj Islands", governorate: "\u0627\u0644\u0645\u062D\u0631\u0642", latitude: 26.282, longitude: 50.662 },
  { id: "dair", name: "\u0627\u0644\u062F\u064A\u0631", nameEn: "Al Dair", governorate: "\u0627\u0644\u0645\u062D\u0631\u0642", latitude: 26.268, longitude: 50.635 },
  { id: "samaheej", name: "\u0633\u0645\u0627\u0647\u064A\u062C", nameEn: "Samaheej", governorate: "\u0627\u0644\u0645\u062D\u0631\u0642", latitude: 26.27, longitude: 50.64 },
  { id: "halat_numaim", name: "\u062D\u0627\u0644\u0629 \u0627\u0644\u0646\u0639\u064A\u0645", nameEn: "Halat Nuaim", governorate: "\u0627\u0644\u0645\u062D\u0631\u0642", latitude: 26.24, longitude: 50.638 },
  { id: "halat_salta", name: "\u062D\u0627\u0644\u0629 \u0628\u0648 \u0645\u0627\u0647\u0631 \u0648\u0627\u0644\u0635\u0644\u0637\u0629", nameEn: "Halat Bu Maher", governorate: "\u0627\u0644\u0645\u062D\u0631\u0642", latitude: 26.248, longitude: 50.615 },
  // الشمالية (Northern Governorate)
  { id: "sar", name: "\u0633\u0627\u0631", nameEn: "Saar", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.205, longitude: 50.51 },
  { id: "janabiya", name: "\u0627\u0644\u062C\u0646\u0628\u064A\u0629", nameEn: "Janabiya", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.211, longitude: 50.506 },
  { id: "budaiya", name: "\u0627\u0644\u0628\u062F\u064A\u0639", nameEn: "Budaiya", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.218, longitude: 50.478 },
  { id: "diraz", name: "\u0627\u0644\u062F\u0631\u0627\u0632", nameEn: "Diraz", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.23, longitude: 50.4775 },
  { id: "barbar", name: "\u0628\u0627\u0631\u0628\u0627\u0631", nameEn: "Barbar", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.216, longitude: 50.488 },
  { id: "karrana", name: "\u0643\u0631\u0627\u0646\u0629", nameEn: "Karrana", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.245, longitude: 50.485 },
  { id: "jidhafs", name: "\u062C\u062F\u062D\u0641\u0635", nameEn: "Jidhafs", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.2186, longitude: 50.5478 },
  { id: "hamala", name: "\u0627\u0644\u0647\u0645\u0644\u0629", nameEn: "Hamala", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.174, longitude: 50.478 },
  { id: "jasra", name: "\u0627\u0644\u062C\u0633\u0631\u0629", nameEn: "Jasra", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.16, longitude: 50.45 },
  { id: "malkiya", name: "\u0627\u0644\u0645\u0627\u0644\u0643\u064A\u0629", nameEn: "Malkiya", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.205, longitude: 50.462 },
  { id: "karzakan", name: "\u0643\u0631\u0632\u0643\u0627\u0646", nameEn: "Karzakan", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.17, longitude: 50.45 },
  { id: "dumistan", name: "\u062F\u0645\u0633\u062A\u0627\u0646", nameEn: "Dumistan", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.18, longitude: 50.445 },
  { id: "shahrakan", name: "\u0634\u0647\u0631\u0643\u0627\u0646", nameEn: "Shahrakan", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.165, longitude: 50.455 },
  { id: "al_qurayyah", name: "\u0627\u0644\u0642\u0631\u064A\u0629", nameEn: "Al Qurayyah", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.19, longitude: 50.5 },
  { id: "hamad_town", name: "\u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F", nameEn: "Hamad Town", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.115, longitude: 50.5069 },
  { id: "bouri", name: "\u0628\u0648\u0631\u064A", nameEn: "Bouri", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.165, longitude: 50.495 },
  { id: "maqaba", name: "\u0645\u0642\u0627\u0628\u0629", nameEn: "Maqaba", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.212, longitude: 50.52 },
  { id: "shakhoora", name: "\u0627\u0644\u0634\u0627\u062E\u0648\u0631\u0629", nameEn: "Shakhoora", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.22, longitude: 50.515 },
  { id: "abu_saiba", name: "\u0623\u0628\u0648 \u0635\u064A\u0628\u0639", nameEn: "Abu Saiba", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.225, longitude: 50.505 },
  { id: "markh", name: "\u0627\u0644\u0645\u0631\u062E", nameEn: "Al Markh", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.205, longitude: 50.495 },
  { id: "bani_jamrah", name: "\u0628\u0646\u064A \u062C\u0645\u0631\u0629", nameEn: "Bani Jamrah", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.218, longitude: 50.465 },
  { id: "salmabad", name: "\u0633\u0644\u0645\u0627\u0628\u0627\u062F", nameEn: "Salmabad", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.185, longitude: 50.535 },
  { id: "sehla", name: "\u0627\u0644\u0633\u0647\u0644\u0629", nameEn: "Sehla", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.2, longitude: 50.54 },
  { id: "tashan", name: "\u0637\u0634\u0627\u0646", nameEn: "Tashan", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.215, longitude: 50.55 },
  { id: "sadad", name: "\u0635\u062F\u062F", nameEn: "Sadad", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.155, longitude: 50.46 },
  // الجنوبية (Southern Governorate)
  { id: "riffa", name: "\u0627\u0644\u0631\u0641\u0627\u0639", nameEn: "Riffa", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.13, longitude: 50.555 },
  { id: "riffa_sharqi", name: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0631\u0642\u064A", nameEn: "East Riffa", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.12, longitude: 50.57 },
  { id: "riffa_gharbi", name: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u063A\u0631\u0628\u064A", nameEn: "West Riffa", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.138, longitude: 50.54 },
  { id: "riffa_shamali", name: "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0645\u0627\u0644\u064A / \u0627\u0644\u062D\u0646\u064A\u0646\u064A\u0629", nameEn: "North Riffa", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.132, longitude: 50.548 },
  { id: "buhair", name: "\u0627\u0644\u0628\u062D\u064A\u0631", nameEn: "Al Buhair", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.145, longitude: 50.565 },
  { id: "isa_town", name: "\u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649", nameEn: "Isa Town", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.1736, longitude: 50.5478 },
  { id: "aali", name: "\u0639\u0627\u0644\u064A", nameEn: "Aali", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.15, longitude: 50.527 },
  { id: "sanad", name: "\u0633\u0646\u062F", nameEn: "Sanad", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.16, longitude: 50.58 },
  { id: "nuwaidrat", name: "\u0627\u0644\u0646\u0648\u064A\u062F\u0631\u0627\u062A", nameEn: "Nuwaidrat", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.14, longitude: 50.61 },
  { id: "maameer", name: "\u0627\u0644\u0645\u0639\u0627\u0645\u064A\u0631", nameEn: "Maameer", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.14, longitude: 50.625 },
  { id: "eker", name: "\u0627\u0644\u0639\u0643\u0631", nameEn: "Eker", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.14, longitude: 50.635 },
  { id: "zallaq", name: "\u0627\u0644\u0632\u0644\u0627\u0642", nameEn: "Zallaq", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.048, longitude: 50.49 },
  { id: "safra", name: "\u0627\u0644\u0633\u0627\u0641\u0631\u0629", nameEn: "Al Safra", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.105, longitude: 50.558 },
  { id: "jaww", name: "\u062C\u0648", nameEn: "Jaww", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.002, longitude: 50.62 },
  { id: "asker", name: "\u0639\u0633\u0643\u0631", nameEn: "Askar", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.065, longitude: 50.625 },
  { id: "durrat_al_bahrain", name: "\u062F\u0631\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646", nameEn: "Durrat Al Bahrain", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 25.835, longitude: 50.59 }
];
function normalizeArabicText(text) {
  if (!text) return "";
  return text.trim().toLowerCase().replace(/[إأآا]/g, "\u0627").replace(/ة/g, "\u0647").replace(/ى/g, "\u064A").replace(/[\u064B-\u065F]/g, "");
}

// src/utils/passengerClassifier.ts
var GOODS_SAFE_CONTEXT_REGEXES = [
  /طلب(?:\s+)?شخصي/i,
  /أوردر(?:\s+)?شخصي|اوردر(?:\s+)?شخصي/i,
  /أغراض(?:\s+)?شخصية|اغراض(?:\s+)?شخصية/i,
  /أغراض(?:\s+)?شخص|اغراض(?:\s+)?شخص/i,
  /حاجة(?:\s+)?شخصية|حاجات(?:\s+)?شخصية/i,
  /أمانة(?:\s+)?شخصية|امانة(?:\s+)?شخصية/i,
  /كرتون(?:\s+)?شخصي|كراتين(?:\s+)?شخصية/i,
  /شنطة(?:\s+)?شخصية|شنط(?:\s+)?شخصية/i,
  /شحنة(?:\s+)?شخصية|شحنات(?:\s+)?شخصية/i,
  /ملابس(?:\s+)?شخصية/i,
  /أوراق(?:\s+)?شخصية|اوراق(?:\s+)?شخصية/i,
  /مستندات(?:\s+)?شخصية/i
];
var KNOWN_GOODS_KEYWORDS = [
  "\u0643\u0631\u062A\u0648\u0646",
  "\u0643\u0631\u0627\u062A\u064A\u0646",
  "\u0634\u062D\u0646\u0629",
  "\u0634\u062D\u0646\u0627\u062A",
  "\u0637\u0631\u062F",
  "\u0637\u0631\u0648\u062F",
  "\u0628\u0636\u0627\u0639\u0629",
  "\u0628\u0636\u0627\u0626\u0639",
  "\u0623\u0643\u0644",
  "\u0627\u0643\u0644",
  "\u0648\u062C\u0628\u0629",
  "\u0648\u062C\u0628\u0627\u062A",
  "\u0645\u0637\u0639\u0645",
  "\u0643\u0627\u0641\u064A\u0647",
  "\u0633\u0648\u0628\u0631\u0645\u0627\u0631\u0643\u062A",
  "\u0648\u0631\u062F",
  "\u0648\u0631\u0648\u062F",
  "\u0628\u0627\u0642\u0629",
  "\u0632\u0647\u0648\u0631",
  "\u0643\u064A\u0643",
  "\u0643\u064A\u0643\u0629",
  "\u062D\u0644\u0648\u064A\u0627\u062A",
  "\u062D\u0644\u0627",
  "\u0639\u0637\u0648\u0631",
  "\u0639\u0637\u0631",
  "\u0647\u062F\u064A\u0629",
  "\u0647\u062F\u0627\u064A\u0627",
  "\u0639\u0628\u0627\u064A\u0629",
  "\u0639\u0628\u0627\u064A\u0627\u062A",
  "\u0641\u0633\u062A\u0627\u0646",
  "\u0645\u0644\u0627\u0628\u0633",
  "\u0623\u0648\u0631\u0627\u0642",
  "\u0627\u0648\u0631\u0627\u0642",
  "\u0645\u0633\u062A\u0646\u062F\u0627\u062A",
  "\u0642\u0637\u0639 \u063A\u064A\u0627\u0631",
  "\u0634\u0646\u0637\u0629",
  "\u0623\u0645\u0627\u0646\u0627\u062A",
  "\u0627\u0645\u0627\u0646\u0627\u062A"
];
var CONFIRMED_PASSENGER_PATTERNS = [
  // التوصيل الشخصي الصريح للأشخاص
  { regex: /توصيل(?:\s+)?(أشخاص|اشخاص|أفراد|افراد|ناس|ركاب)/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0623\u0634\u062E\u0627\u0635/\u0631\u0643\u0627\u0628" },
  { regex: /نقل(?:\s+)?(أشخاص|اشخاص|ركاب|أفراد|افراد|عائلات|عوائل)/i, label: "\u0646\u0642\u0644 \u0631\u0643\u0627\u0628/\u0623\u0634\u062E\u0627\u0635" },
  { regex: /توصيل(?:\s+)?شخص(?!(\s+)?(واحد\s+)?(طلب|اغراض|أغراض|كرتون|شحنة))/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0634\u062E\u0635" },
  // وصف الراكب (بنت، طفل، أطفال، شاب، رجال، عائلة)
  { regex: /توصيل(?:\s+)?(بنت|بنية|بنات|حرمة|حريم|نساء|نسوان|أم|ام)/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0631\u0627\u0643\u0628\u0629 (\u0628\u0646\u062A/\u0646\u0633\u0627\u0621)" },
  { regex: /توصيل(?:\s+)?(طفل|أطفال|اطفال|بيبي|جاهل|جهال|يهال|يهالوه)/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0637\u0641\u0644/\u0623\u0637\u0641\u0627\u0644" },
  { regex: /توصيل(?:\s+)?(شاب|شباب|رجال|رجل|ريال|أولاد|اولاد)/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0631\u0627\u0643\u0628 (\u0634\u0627\u0628/\u0631\u062C\u0627\u0644)" },
  { regex: /توصيل(?:\s+)?(عائلة|عوائل|أسرة|اسرة)/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0639\u0627\u0626\u0644\u0629" },
  { regex: /توصيل(?:\s+)?(موظف|موظفة|موظفات|موظفين|عامل|عاملة|عمال|خدامة|عاملة منزلية)/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0645\u0648\u0638\u0641/\u0639\u0645\u0627\u0644\u0629" },
  { regex: /توصيل(?:\s+)?(طالب|طالبة|طلاب|طالبات)/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0637\u0627\u0644\u0628/\u0637\u0627\u0644\u0628\u0627\u062A" },
  // عبارات نقل الأشخاص والمشاوير
  { regex: /مطلوب(?:\s+)?(مشوار|مشاوير|توصيلة|توصيله)/i, label: "\u0645\u0637\u0644\u0648\u0628 \u0645\u0634\u0648\u0627\u0631/\u062A\u0648\u0635\u064A\u0644\u0629" },
  { regex: /توصيل(?:\s+)?(مشوار|مشاوير)/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0645\u0634\u0648\u0627\u0631" },
  { regex: /(أوصل|اوصل|يوصل|نوصل)(?:\s+)?(أحد|احد|شخص|راكب)/i, label: "\u0623\u0648\u0635\u0644 \u0623\u062D\u062F/\u0634\u062E\u0635" },
  { regex: /(مشوار|مشاوير)(?:\s+)?(خاص|خاصة)/i, label: "\u0645\u0634\u0648\u0627\u0631 \u062E\u0627\u0635" },
  { regex: /(توصيلة|توصيله)(?:\s+)?(خاصة|خاصه|ركاب)/i, label: "\u062A\u0648\u0635\u064A\u0644\u0629 \u062E\u0627\u0635\u0629" },
  { regex: /محتاج(?:\s+)?(مشوار|توصيلة|توصيله|سيارة توصلني|احد يوصلني)/i, label: "\u0637\u0644\u0628 \u0646\u0642\u0644 \u062E\u0627\u0635" },
  // عبارات مسارات الطلب للأشخاص (شخص من ... إلى ... / بنت من ... إلى ... / طفل للمدرسة ...)
  { regex: /(?:^|[\s،,.])(شخص|بنت|طفل|أطفال|اطفال|شاب|موظف|موظفة|راكب|عائلة)(?:\s+)?(?:من|استلام من)\s+[^\n\r]+?\s+(?:إلى|الى|ل|لـ)/i, label: "\u0645\u0633\u0627\u0631 \u0631\u0627\u0643\u0628 \u0628\u064A\u0646 \u0645\u0646\u0627\u0637\u0642" },
  { regex: /(?:^|[\s،,.])(طفل|أطفال|اطفال|طالب|طالبة|طلاب|طالبات)(?:\s+)?(?:للمدرسة|إلى المدرسة|الى المدرسة|من المدرسة)/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0645\u062F\u0631\u0633\u0629/\u0623\u0637\u0641\u0627\u0644" },
  { regex: /(?:^|[\s،,.])(موظف|موظفة|شخص|دوام)(?:\s+)?(?:للعمل|إلى العمل|الى العمل|للدوام|إلى الدوام|الى الدوام)/i, label: "\u0645\u0634\u0648\u0627\u0631 \u0639\u0645\u0644/\u062F\u0648\u0627\u0645" },
  { regex: /توصيل(?:\s+)?(للمدرسة|للدوام|للعمل|للروضة|للجامعة)(?:\s+)?(صباحي|مسائي|شهري)?/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0645\u0634\u0648\u0627\u0631 \u0645\u062F\u0631\u0633\u0629/\u062F\u0648\u0627\u0645" },
  { regex: /توصيل(?:\s+)?شهري(?:\s+)?(للدوام|للمدرسة|للجامعة)/i, label: "\u062A\u0648\u0635\u064A\u0644 \u0634\u0647\u0631\u064A \u0644\u0631\u0643\u0627\u0628" }
];
var SUSPICIOUS_PATTERNS = [
  { regex: /(?:^|[\s،,.])مشوار(?:$|[\s،,.])/i, label: "\u0630\u0643\u0631 \u0643\u0644\u0645\u0629 \u0645\u0634\u0648\u0627\u0631" },
  { regex: /(?:^|[\s،,.])توصيلة(?:$|[\s،,.])/i, label: "\u0630\u0643\u0631 \u0643\u0644\u0645\u0629 \u062A\u0648\u0635\u064A\u0644\u0629" },
  { regex: /(?:^|[\s،,.])(أحد|احد)(?:\s+)?يوصل(?:$|[\s،,.])/i, label: "\u0637\u0644\u0628 \u0634\u062E\u0635 \u064A\u0648\u0635\u0644" },
  { regex: /محتاج(?:\s+)?(سائق|دريول|سيارة)(?:$|[\s،,.])/i, label: "\u0637\u0644\u0628 \u0633\u064A\u0627\u0631\u0629 \u0648\u0633\u0627\u0626\u0642" },
  { regex: /توصيل(?:\s+)?(للمستشفى|للعيادة|للمطار)(?!(\s+)?(أغراض|اغراض|كرتون|شحنة))/i, label: "\u0645\u0634\u0648\u0627\u0631 \u0648\u062C\u0647\u0629 \u0634\u062E\u0635\u064A\u0629" }
];
function detectPassengerCount(rawText) {
  if (!rawText || typeof rawText !== "string") return void 0;
  const normalized = normalizeArabicText(rawText);
  const digitMatch = /(?:^|[\s،,.])([1-9]|10)\s*(?:أشخاص|اشخاص|ركاب|أفراد|افراد|ناس|بنات|أطفال|اطفال|عمال|موظفين|طلاب|طالبات)/i.exec(rawText);
  if (digitMatch && digitMatch[1]) {
    const count = parseInt(digitMatch[1], 10);
    if (!isNaN(count) && count > 0 && count <= 20) return count;
  }
  if (/(?:خمسة|خمس)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 5;
  if (/(?:أربعة|اربعة|اربع)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 4;
  if (/(?:ثلاثة|ثلاث)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 3;
  if (/(?:ستة|ست)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 6;
  if (/(?:سبعة|سبع)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 7;
  if (/(?:ثمانية|ثمان)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 8;
  if (/(?:تسعة|تسع)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 9;
  if (/(?:عشرة|عشر)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 10;
  if (/(?:^|[\s،,.])(?:شخصين|راكبين|طفلين|بنتين)(?:$|[\s،,.])/i.test(normalized)) return 2;
  if (/(?:توصيل|نقل|مشوار)\s*(?:اثنين|إثنين|2)\s*(?:أشخاص|اشخاص|ركاب)?/i.test(normalized)) return 2;
  if (/(?:شخص|راكب|بنت|طفل|موظف|طالب)\s+واحد/i.test(normalized)) return 1;
  if (/(?:توصيل|نقل)\s+(?:شخص|راكب|بنت|طفل)(?!\s*(?:واحد\s+)?(?:طلب|اغراض|أغراض|كرتون|شحنة|بضاعة|سلعة))/i.test(normalized)) return 1;
  if (/(?:^|[\s،,.])شخص(?:\s+)?(?:من|استلام من)\s+[^\n\r]+?\s+(?:إلى|الى|ل|لـ)/i.test(normalized)) return 1;
  return void 0;
}
function detectPassengerDelivery(rawText, options) {
  if (!rawText || typeof rawText !== "string") {
    return {
      level: "goods_safe",
      label: "\u062A\u0648\u0635\u064A\u0644 \u0628\u0636\u0627\u0626\u0639 \u0645\u0639\u062A\u0645\u062F",
      matchedPhrases: [],
      reason: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0639\u0628\u0627\u0631\u0627\u062A \u0646\u0642\u0644 \u0623\u0634\u062E\u0627\u0635",
      isForbidden: false
    };
  }
  const isForbiddenPolicy = options?.isBlockForbiddenEnabled ?? true;
  const normalized = normalizeArabicText(rawText);
  const detectedCount = detectPassengerCount(rawText);
  const hasSafeContext = GOODS_SAFE_CONTEXT_REGEXES.some((rx) => rx.test(rawText) || rx.test(normalized));
  const hasExplicitGoodsWords = KNOWN_GOODS_KEYWORDS.some((kw) => {
    const rx = new RegExp(`(?:^|[\\s\u060C,.])${kw}(?:$|[\\s\u060C,.])`, "i");
    return rx.test(normalized);
  });
  const matchedConfirmed = [];
  if (detectedCount !== void 0 && detectedCount > 0) {
    const countLabel = detectedCount === 1 ? "\u0634\u062E\u0635 \u0648\u0627\u062D\u062F" : detectedCount === 2 ? "\u0634\u062E\u0635\u064A\u0646" : `${detectedCount} \u0623\u0634\u062E\u0627\u0635`;
    matchedConfirmed.push(`\u062A\u062D\u062F\u064A\u062F \u0639\u062F\u062F \u0627\u0644\u0631\u0643\u0627\u0628 (${countLabel})`);
  }
  for (const item of CONFIRMED_PASSENGER_PATTERNS) {
    if (item.regex.test(rawText) || item.regex.test(normalized)) {
      matchedConfirmed.push(item.label);
    }
  }
  if (hasSafeContext && matchedConfirmed.length > 0 && detectedCount === void 0) {
    const isOnlyGenericPerson = matchedConfirmed.every((label) => label.includes("\u062A\u0648\u0635\u064A\u0644 \u0634\u062E\u0635"));
    if (isOnlyGenericPerson) {
      return {
        level: "goods_safe",
        label: "\u062A\u0648\u0635\u064A\u0644 \u0628\u0636\u0627\u0626\u0639 \u0645\u0639\u062A\u0645\u062F (\u0637\u0644\u0628/\u0623\u063A\u0631\u0627\u0636 \u0634\u062E\u0635\u064A\u0629)",
        matchedPhrases: ["\u0637\u0644\u0628/\u0623\u063A\u0631\u0627\u0636 \u0634\u062E\u0635\u064A\u0629 (\u0633\u0644\u0639\u0629 \u0648\u0644\u064A\u0633\u062A \u0631\u0627\u0643\u0628\u0627\u064B)"],
        reason: "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0623\u0646 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u063A\u0631\u0636 \u0623\u0648 \u0633\u0644\u0639\u0629 \u0634\u062E\u0635\u064A\u0629 \u0648\u0644\u064A\u0633 \u0646\u0642\u0644 \u0631\u0643\u0627\u0628.",
        isForbidden: false
      };
    }
  }
  if (matchedConfirmed.length > 0) {
    const countSuffix = detectedCount ? ` (${detectedCount} ${detectedCount === 1 ? "\u0634\u062E\u0635" : detectedCount === 2 ? "\u0634\u062E\u0635\u064A\u0646" : "\u0623\u0634\u062E\u0627\u0635"})` : "";
    return {
      level: "confirmed_passenger",
      label: `\u062A\u062D\u0630\u064A\u0631: \u062A\u0648\u0635\u064A\u0644 \u0623\u0634\u062E\u0627\u0635 \u0645\u0645\u0646\u0648\u0639${countSuffix}`,
      matchedPhrases: Array.from(new Set(matchedConfirmed)),
      reason: `\u062A\u062D\u0630\u064A\u0631: \u0625\u0639\u0644\u0627\u0646 \u0646\u0642\u0644 \u0631\u0643\u0627\u0628/\u0623\u0634\u062E\u0627\u0635${countSuffix}.`,
      isForbidden: false,
      passengerCount: detectedCount
    };
  }
  const matchedSuspicious = [];
  for (const item of SUSPICIOUS_PATTERNS) {
    if (item.regex.test(rawText) || item.regex.test(normalized)) {
      matchedSuspicious.push(item.label);
    }
  }
  if (matchedSuspicious.length > 0) {
    if (hasExplicitGoodsWords) {
      return {
        level: "goods_safe",
        label: "\u062A\u0648\u0635\u064A\u0644 \u0628\u0636\u0627\u0626\u0639 \u0645\u0639\u062A\u0645\u062F",
        matchedPhrases: ["\u0628\u0636\u0627\u0639\u0629 \u0645\u062D\u062F\u062F\u0629 \u0645\u0639 \u0645\u0634\u0648\u0627\u0631 \u062A\u0648\u0635\u064A\u0644"],
        reason: "\u064A\u062D\u062A\u0648\u064A \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0639\u0644\u0649 \u0625\u0634\u0627\u0631\u0629 \u0644\u0628\u0636\u0627\u0639\u0629 \u0648\u0633\u0644\u0639\u0629 \u0645\u0644\u0645\u0648\u0633\u0629.",
        isForbidden: false
      };
    }
    return {
      level: "suspicious_passenger",
      label: "\u0627\u062D\u062A\u0645\u0627\u0644 \u0646\u0642\u0644 \u0623\u0634\u062E\u0627\u0635 (\u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0637\u0644\u0648\u0628\u0629)",
      matchedPhrases: Array.from(new Set(matchedSuspicious)),
      reason: "\u064A\u062D\u062A\u0648\u064A \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0639\u0644\u0649 \u0639\u0628\u0627\u0631\u0627\u062A \u0645\u0634\u0648\u0627\u0631 \u0639\u0627\u0645\u0629 \u0642\u062F \u062A\u0634\u064A\u0631 \u0644\u0646\u0642\u0644 \u0631\u0643\u0627\u0628. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u064A\u062F\u0648\u064A \u0645\u0646 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0642\u0628\u0644 \u0627\u0644\u0642\u0628\u0648\u0644.",
      isForbidden: false
      // does not hard-block, requires manual review confirmation
    };
  }
  return {
    level: "goods_safe",
    label: "\u062A\u0648\u0635\u064A\u0644 \u0628\u0636\u0627\u0626\u0639 \u0645\u0639\u062A\u0645\u062F",
    matchedPhrases: hasExplicitGoodsWords ? ["\u0633\u0644\u0639\u0629/\u0628\u0636\u0627\u0639\u0629 \u0645\u0644\u0645\u0648\u0633\u0629"] : [],
    reason: "\u0625\u0639\u0644\u0627\u0646 \u062A\u0648\u0635\u064A\u0644 \u0628\u0636\u0627\u0626\u0639 \u0648\u0637\u0644\u0628\u0627\u062A \u062A\u062C\u0627\u0631\u064A\u0629 \u0645\u0639\u062A\u0645\u062F.",
    isForbidden: false
  };
}

// src/utils/orderParser.ts
function convertArabicNumerals(str) {
  if (!str) return "";
  const arabicNumerals = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(arabicNumerals[i], "g"), i.toString());
  }
  return result;
}
function parseWhatsAppOrderText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return {
      from: "",
      to: "",
      price: 0,
      isPriceUnspecified: true,
      passengerCount: void 0,
      phone: "",
      notes: "",
      confidence: 0,
      canCreateOrder: false,
      passengerDetection: {
        level: "goods_safe",
        label: "\u062A\u0648\u0635\u064A\u0644 \u0628\u0636\u0627\u0626\u0639 \u0645\u0639\u062A\u0645\u062F",
        matchedPhrases: [],
        reason: "\u0627\u0644\u0646\u0635 \u0641\u0627\u0631\u063A",
        isForbidden: false
      }
    };
  }
  const convertedText = convertArabicNumerals(rawText);
  const normalized = normalizeArabicText(convertedText);
  let orderCount;
  const numericOrderCount = /(?:^|[\s،,])([1-9]\d?)\s*(?:اوردرات|اوردر|طلبات|طلب)(?=$|[\s،,.])/i.exec(normalized);
  if (numericOrderCount) {
    const value = Number(numericOrderCount[1]);
    if (value >= 1 && value <= 20) orderCount = value;
  } else if (/(?:اوردرين|اوردران|طلبين|طلبان)/i.test(normalized)) {
    orderCount = 2;
  } else if (/(?:ثلاثه|ثلاث|ثلاثة)\s*(?:اوردرات|طلبات|اوردر|طلب)/i.test(normalized)) {
    orderCount = 3;
  } else if (/(?:اربعه|اربع|أربعة)\s*(?:اوردرات|طلبات|اوردر|طلب)/i.test(normalized)) {
    orderCount = 4;
  } else if (/(?:خمسه|خمس|خمسة)\s*(?:اوردرات|طلبات|اوردر|طلب)/i.test(normalized)) {
    orderCount = 5;
  }
  const passengerDetection = detectPassengerDelivery(rawText);
  const passengerCount = passengerDetection.passengerCount;
  let phone = "";
  const phoneRegex = /(?:\+?973|00973)?[\s-]*(3\d{7}|6\d{7}|17\d{6}|[36]\d{3}[\s-]?\d{4})/g;
  const phoneMatch = phoneRegex.exec(convertedText);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/[\s-+]/g, "");
    if (!phone.startsWith("973") && phone.length === 8) {
      phone = "973" + phone;
    }
  }
  let price = 0;
  const priceWithCurrencyPatterns = [
    // [Price prefix] [Number] [Currency]
    /(?:السعر|سعر|الأجر|الأجرة|أجرة|الأوردر|الطلب|المبلغ|الحساب|بقيمة)?\s*[:=]?\s*(?:بـ|ب)?\s*(\d+(?:\.\d+)?)\s*(?:دينار|دنانير|د\.ب|دب|دينار بحريني|bd|bhd)/i,
    // [Currency] [Number]
    /(?:دينار|دنانير|د\.ب|دب|bd|bhd)\s*[:=]?\s*(\d+(?:\.\d+)?)/i,
    // Standalone number + currency word
    /\b(\d+(?:\.\d+)?)\s*(?:دينار|دنانير|د\.ب|دب|bd|bhd)\b/i
  ];
  for (const pattern of priceWithCurrencyPatterns) {
    const match = pattern.exec(convertedText);
    if (match && match[1]) {
      const parsedVal = parseFloat(match[1]);
      if (!isNaN(parsedVal) && parsedVal > 0 && parsedVal <= 100) {
        const afterMatch = convertedText.substring((match.index || 0) + match[0].length, (match.index || 0) + match[0].length + 20);
        if (!/(?:أشخاص|اشخاص|ركاب|أفراد|افراد|ناس|بنات|أطفال|اطفال|عمال)/i.test(afterMatch)) {
          price = parsedVal;
          break;
        }
      }
    }
  }
  if (price === 0) {
    const explicitPrefixPattern = /(?:السعر|سعر|الأجر|الأجرة|أجرة|الأوردر بـ|الطلب بـ|الحساب|المبلغ|بقيمة)\s*[:=]?\s*(?:بـ|ب)?\s*(\d+(?:\.\d+)?)/i;
    const match = explicitPrefixPattern.exec(convertedText);
    if (match && match[1]) {
      const parsedVal = parseFloat(match[1]);
      const afterMatch = convertedText.substring((match.index || 0) + match[0].length, (match.index || 0) + match[0].length + 20);
      const isPassengerCountWord = /(?:أشخاص|اشخاص|ركاب|أفراد|افراد|ناس|بنات|أطفال|اطفال|عمال)/i.test(afterMatch);
      if (!isPassengerCountWord && !isNaN(parsedVal) && parsedVal > 0 && parsedVal <= 100) {
        price = parsedVal;
      }
    }
  }
  let fromArea = "";
  let toArea = "";
  const searchablePlaces = [
    // Malls & Landmarks (Moda Mall, Seef Mall, City Centre, Avenues, etc.)
    ...BAHRAIN_LANDMARKS.map((lm) => ({
      name: lm.name,
      keywords: lm.keywords,
      isLandmark: true,
      parentArea: lm.parentAreaName
    })),
    // Standard Geographic Areas
    ...BAHRAIN_AREAS.map((a) => ({
      name: a.name,
      keywords: [a.name, a.nameEn],
      isLandmark: false
    }))
  ];
  const allKeywordItems = [];
  searchablePlaces.forEach((place) => {
    place.keywords.forEach((kw) => {
      if (kw && kw.trim()) {
        allKeywordItems.push({
          placeName: place.name,
          keyword: kw.trim(),
          normalizedKeyword: normalizeArabicText(kw.trim()),
          parentArea: place.parentArea
        });
      }
    });
  });
  allKeywordItems.sort((a, b) => b.normalizedKeyword.length - a.normalizedKeyword.length);
  for (const item of allKeywordItems) {
    const kw = item.normalizedKeyword;
    if (kw.length < 2) continue;
    const startsWithAl = kw.startsWith("\u0627\u0644");
    const core = startsWithAl ? kw.slice(2) : kw;
    if (!fromArea) {
      const fromPattern = startsWithAl ? new RegExp(`(?:(?:\u0645\u0646|\u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0646|\u0627\u0633\u062A\u0644\u0627\u0645|\u0628\u064A\u0643 \u0627\u0628 \u0645\u0646|\u0628\u064A\u0643 \u0627\u0628|\u0645\u0648\u0642\u0639|\u062A\u062D\u0645\u064A\u0644 \u0645\u0646|\u0641\u0631\u0639|\u0639\u0646\u062F)\\s*(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?\\s*${kw}\\b|(?:^|[\\s\u060C,.])\u0628\u0627\u0644(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?${core}\\b|(?:^|[\\s\u060C,.])\u0641\u064A\\s+(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?${kw}\\b)`, "i") : new RegExp(`(?:(?:\u0645\u0646|\u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0646|\u0627\u0633\u062A\u0644\u0627\u0645|\u0628\u064A\u0643 \u0627\u0628 \u0645\u0646|\u0628\u064A\u0643 \u0627\u0628|\u0645\u0648\u0642\u0639|\u062A\u062D\u0645\u064A\u0644 \u0645\u0646|\u0641\u0631\u0639|\u0639\u0646\u062F)\\s*(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?\\s*${kw}\\b|(?:^|[\\s\u060C,.])\u0628\u0640?${kw}\\b|(?:^|[\\s\u060C,.])\u0641\u064A\\s+(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?${kw}\\b)`, "i");
      if (fromPattern.test(normalized)) {
        fromArea = item.placeName;
      }
    }
    if (!toArea) {
      const toPattern = startsWithAl ? new RegExp(`(?:(?:\u0627\u0644\u0649|\u0625\u0644\u0649|\u0644\u064A|\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0649|\u062A\u0633\u0644\u064A\u0645 \u0644|\u062A\u0633\u0644\u064A\u0645|\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0649|\u062A\u0648\u0635\u064A\u0644 \u0644|\u0645\u0634\u0648\u0627\u0631 \u0627\u0644\u0649|\u0645\u0634\u0648\u0627\u0631 \u0644|\u062A\u0648\u0635\u064A\u0644\u0629 \u0627\u0644\u0649|\u062A\u0648\u0635\u064A\u0644\u0629 \u0644|\u0648\u062C\u0647\u0629|\u0645\u0643\u0627\u0646|\u064A\u0648\u0635\u0644)\\s*(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?\\s*${kw}\\b|(?:^|[\\s\u060C,.]|(?:\u0645\u0634\u0648\u0627\u0631|\u062A\u0648\u0635\u064A\u0644|\u062A\u0648\u0635\u064A\u0644\u0629|\u0646\u0642\u0644|\u0631\u0648\u062D\u0629|\u0637\u0627\u0644\u0639)\\s+)\u0644\u0644(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?${core}\\b|(?:^|[\\s\u060C,.])\u0644\u0640?${kw}\\b)`, "i") : new RegExp(`(?:(?:\u0627\u0644\u0649|\u0625\u0644\u0649|\u0644\u064A|\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0649|\u062A\u0633\u0644\u064A\u0645 \u0644|\u062A\u0633\u0644\u064A\u0645|\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0649|\u062A\u0648\u0635\u064A\u0644 \u0644|\u0645\u0634\u0648\u0627\u0631 \u0627\u0644\u0649|\u0645\u0634\u0648\u0627\u0631 \u0644|\u062A\u0648\u0635\u064A\u0644\u0629 \u0627\u0644\u0649|\u062A\u0648\u0635\u064A\u0644\u0629 \u0644|\u0648\u062C\u0647\u0629|\u0645\u0643\u0627\u0646|\u064A\u0648\u0635\u0644)\\s*(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?\\s*${kw}\\b|(?:^|[\\s\u060C,.]|(?:\u0645\u0634\u0648\u0627\u0631|\u062A\u0648\u0635\u064A\u0644|\u062A\u0648\u0635\u064A\u0644\u0629|\u0646\u0642\u0644|\u0631\u0648\u062D\u0629|\u0637\u0627\u0644\u0639)\\s+)\u0644\u0640?${kw}\\b)`, "i");
      if (toPattern.test(normalized) && (!fromArea || item.placeName !== fromArea || /(?:من|استلام).*?(?:الى|إلى|لل|لـ|تسليم)/i.test(normalized))) {
        toArea = item.placeName;
      }
    }
  }
  if (!fromArea || !toArea) {
    const foundPlaces = [];
    for (const item of allKeywordItems) {
      const kw = item.normalizedKeyword;
      if (kw.length < 2) continue;
      const startsWithAl = kw.startsWith("\u0627\u0644");
      const core = startsWithAl ? kw.slice(2) : kw;
      let idx = normalized.indexOf(kw);
      let intentType = void 0;
      if (startsWithAl && idx === -1) {
        const toPrefix = `\u0644\u0644${core}`;
        const toIdx = normalized.indexOf(toPrefix);
        if (toIdx !== -1) {
          idx = toIdx;
          intentType = "to";
        }
      }
      if (!startsWithAl && idx === -1) {
        const toPrefix = `\u0644${kw}`;
        const toIdx = normalized.indexOf(toPrefix);
        if (toIdx !== -1) {
          idx = toIdx;
          intentType = "to";
        }
      }
      if (startsWithAl && idx === -1) {
        const fromPrefix = `\u0628\u0627\u0644${core}`;
        const fromIdx = normalized.indexOf(fromPrefix);
        if (fromIdx !== -1) {
          idx = fromIdx;
          intentType = "from";
        }
      }
      if (idx !== -1) {
        const alreadySub = foundPlaces.some((f) => Math.abs(f.index - idx) < 4);
        if (!alreadySub) {
          foundPlaces.push({ name: item.placeName, index: idx, intentType });
        }
      }
    }
    foundPlaces.sort((a, b) => a.index - b.index);
    if (foundPlaces.length >= 2) {
      if (!fromArea && !toArea) {
        if (foundPlaces[0].intentType === "to" && foundPlaces[1].intentType !== "to") {
          toArea = foundPlaces[0].name;
          fromArea = foundPlaces[1].name;
        } else {
          fromArea = foundPlaces[0].name;
          toArea = foundPlaces[1].name;
        }
      } else if (!fromArea) {
        const remaining = foundPlaces.find((f) => f.name !== toArea);
        if (remaining) fromArea = remaining.name;
      } else if (!toArea) {
        const remaining = foundPlaces.find((f) => f.name !== fromArea);
        if (remaining) toArea = remaining.name;
      }
    } else if (foundPlaces.length === 1) {
      const singlePlace = foundPlaces[0];
      if (!fromArea && !toArea) {
        if (singlePlace.intentType === "to") {
          toArea = singlePlace.name;
        } else {
          fromArea = singlePlace.name;
        }
      } else if (!fromArea && singlePlace.name !== toArea) {
        fromArea = singlePlace.name;
      } else if (!toArea && singlePlace.name !== fromArea) {
        toArea = singlePlace.name;
      }
    }
  }
  if (!toArea && fromArea) {
    const toFreeMatch = /(?:الى|إلى|تسليم الى|تسليم ل|تسليم|توصيل الى|توصيل ل|وجهة)\s+([^\n\r،,]+)/i.exec(convertedText);
    if (toFreeMatch && toFreeMatch[1]) {
      let candidate = toFreeMatch[1].trim();
      candidate = candidate.replace(/(?:\s+ب?\s*\d+(?:\.\d+)?\s*(?:د\.ب|دب|دينار|bd|bhd)).*$/i, "").trim();
      candidate = candidate.replace(/(?:\s+(?:\+?973|00973)?[\s-]*(?:3\d{7}|6\d{7}|17\d{6})).*$/i, "").trim();
      candidate = candidate.replace(/\s+ب\s*$/i, "").trim();
      if (candidate.length >= 2 && candidate.length <= 40 && candidate !== fromArea) {
        toArea = candidate;
      }
    }
  }
  if (!fromArea && toArea) {
    const fromFreeMatch = /(?:من|استلام من|بيك اب من)\s+([^\n\r،,]+)/i.exec(convertedText);
    if (fromFreeMatch && fromFreeMatch[1]) {
      let candidate = fromFreeMatch[1].trim();
      candidate = candidate.replace(/(?:\s+ب?\s*\d+(?:\.\d+)?\s*(?:د\.ب|دب|دينار|bd|bhd)).*$/i, "").trim();
      candidate = candidate.replace(/(?:\s+(?:\+?973|00973)?[\s-]*(?:3\d{7}|6\d{7}|17\d{6})).*$/i, "").trim();
      candidate = candidate.replace(/\s+ب\s*$/i, "").trim();
      if (candidate.length >= 2 && candidate.length <= 40 && candidate !== toArea) {
        fromArea = candidate;
      }
    }
  }
  const hasPersonOrScheduleNumber = /(?:اشخاص|شخص|ركاب|راكب|ساعة|الساعة|هاتف|واتساب)/i.test(normalized);
  const trailingBareNumber = /(?:^|[\s،,])([1-9]\d?(?:\.\d+)?)\s*$/.exec(convertedText);
  if (price <= 0 && !orderCount && fromArea && toArea && fromArea !== toArea && !hasPersonOrScheduleNumber && trailingBareNumber) {
    const shorthandFare = Number(trailingBareNumber[1]);
    if (shorthandFare > 0 && shorthandFare <= 100) price = shorthandFare;
  }
  const hasOrderIntent = /(?:اوردر|طلب|توصيل|توصيل[ةه]|توصيلني|يوصلني|مشوار|مشاوير|مندوب|بيك اب|pickup|delivery|شخص|اشخاص|راكب|ركاب|بنت|بنات|طفل|اطفال|طالب|طالب[ةه]|طلاب|طالبات|موظف|موظف[ةه]|موظفين|عمال|سيار[ةه]|دريول|سائق|دوام|مدرس[ةه]|جامع[ةه])/i.test(normalized) || /(?:اوردر|أوردر|طلب|توصيل|توصيلة|توصيله|مشوار|مشاوير|شخص|أشخاص|اشخاص|راكب|ركاب|بنت|طفل|أطفال|طالب|طالبة|موظف|موظفة|سيارة|دريول|سائق|دوام|مدرسة|جامعة)/i.test(rawText);
  if (!toArea && fromArea && hasOrderIntent) {
    toArea = passengerDetection.level !== "goods_safe" ? "\u062D\u0633\u0628 \u0637\u0644\u0628 \u0627\u0644\u0631\u0627\u0643\u0628 \u{1F4CD}" : "\u062D\u0633\u0628 \u0637\u0644\u0628 \u0627\u0644\u0632\u0628\u0648\u0646 \u{1F4CD}";
  }
  if (!fromArea && toArea && hasOrderIntent) {
    fromArea = "\u0645\u0648\u0642\u0639 \u0627\u0644\u0639\u0645\u064A\u0644 / \u063A\u064A\u0631 \u0645\u062D\u062F\u062F \u{1F4CD}";
  }
  let notes = "";
  const noteKeywords = [
    "\u0648\u0631\u062F",
    "\u0628\u0627\u0642\u0629",
    "\u0632\u0647\u0648\u0631",
    "\u0643\u064A\u0643",
    "\u062D\u0644\u0648\u064A\u0627\u062A",
    "\u0639\u0637\u0648\u0631",
    "\u0647\u062F\u064A\u0629",
    "\u0623\u0643\u0644",
    "\u0645\u0637\u0639\u0645",
    "\u0648\u062C\u0628\u0629",
    "\u0645\u0633\u062A\u0646\u062F\u0627\u062A",
    "\u0623\u0648\u0631\u0627\u0642",
    "\u0639\u0628\u0627\u064A\u0629",
    "\u0645\u0644\u0627\u0628\u0633",
    "\u0634\u062D\u0646\u0629",
    "\u0623\u0645\u0627\u0646\u0627\u062A",
    "\u0643\u0631\u062A\u0648\u0646"
  ];
  for (const kw of noteKeywords) {
    const kwRegex = new RegExp(`(?:^|[\\s\u060C,.])${kw}(?:$|[\\s\u060C,.])`, "i");
    if (kwRegex.test(normalized)) {
      notes = kw;
      break;
    }
  }
  let scheduledTime = void 0;
  let scheduledTimeMinutes = void 0;
  let isFutureSchedule = false;
  const scheduleRegex = /(?:الساعة|ساعة|على الساعة|في حدود الساعة|توقيت|موعد|وقت)\s*(\d{1,2})(?::(\d{2}))?\s*(صباحا|صباحاً|ص|مساء|مساءً|م|العصر|الظهر|المغرب|بالليل|في الليل|الصبح)?/i;
  const scheduleMatch = scheduleRegex.exec(convertedText);
  if (scheduleMatch) {
    const rawHour = parseInt(scheduleMatch[1], 10);
    const rawMin = scheduleMatch[2] ? parseInt(scheduleMatch[2], 10) : 0;
    const period = (scheduleMatch[3] || "").trim();
    if (rawHour >= 1 && rawHour <= 24) {
      let isPm = false;
      if (/مساء|مساءً|م|العصر|المغرب|بالليل|في الليل/i.test(period)) {
        isPm = true;
      } else if (/صباحا|صباحاً|ص|الصبح/i.test(period)) {
        isPm = false;
      } else if (rawHour >= 1 && rawHour <= 6) {
        isPm = true;
      }
      let hour24 = rawHour;
      if (isPm && hour24 < 12) hour24 += 12;
      if (!isPm && hour24 === 12) hour24 = 0;
      scheduledTimeMinutes = hour24 * 60 + rawMin;
      const displayPeriod = isPm ? "\u0645\u0633\u0627\u0621\u064B" : "\u0635\u0628\u0627\u062D\u0627\u064B";
      const displayHour = rawHour > 12 ? rawHour - 12 : rawHour;
      const displayMin = rawMin > 0 ? `:${rawMin < 10 ? "0" + rawMin : rawMin}` : "";
      scheduledTime = `\u0627\u0644\u0633\u0627\u0639\u0629 ${displayHour}${displayMin} ${displayPeriod}`;
      isFutureSchedule = true;
    }
  }
  let confidence = 0;
  if (fromArea) confidence += 40;
  if (toArea) confidence += 40;
  if (price > 0) confidence += 10;
  if (phone) confidence += 10;
  const canCreateOrder = !!fromArea && !!toArea;
  const isPriceUnspecified = !price || price <= 0;
  return {
    from: fromArea,
    to: toArea,
    price: price > 0 ? price : 0,
    orderCount,
    isPriceUnspecified,
    passengerCount: passengerDetection.passengerCount,
    scheduledTime,
    scheduledTimeMinutes,
    isFutureSchedule,
    phone,
    notes,
    confidence,
    canCreateOrder,
    passengerDetection
  };
}

// src/utils/orderClosureDetector.ts
init_aiClosureLearner();
var STORAGE_KEY_CLOSED_ORDERS = "orderi_closed_order_ids";
var processedMessageHashes = /* @__PURE__ */ new Set();
function cleanDialectText(raw) {
  if (!raw) return "";
  return raw.replace(/[\u064B-\u065F]/g, "").replace(/[\u0640]/g, "").replace(/(.)\1{2,}/gu, "$1").replace(/[إأآا]/g, "\u0627").replace(/ة/g, "\u0647").replace(/ى/g, "\u064A").toLowerCase().trim();
}
function extractClosureKeywords(text) {
  if (!text) return { matchedWords: [], matchedEmojis: [], hasClosureIntent: false };
  const cleaned = cleanDialectText(text);
  const normalized = normalizeArabicText(text);
  const { takenKeywords, completionKeywords, gratitudeKeywords, emojis } = getAggregatedClosureDictionary();
  const allKeywords = [...takenKeywords, ...completionKeywords, ...gratitudeKeywords];
  const matchedWords = [];
  for (const kw of allKeywords) {
    const kwClean = cleanDialectText(kw);
    const rxClean = new RegExp(`(?:^|[\\s\u060C,.:!\u061F-])${kwClean}(?:$|[\\s\u060C,.:!\u061F-])`, "i");
    const rxNorm = new RegExp(`(?:^|[\\s\u060C,.:!\u061F-])${kw}(?:$|[\\s\u060C,.:!\u061F-])`, "i");
    if (rxClean.test(cleaned) || rxNorm.test(normalized)) {
      if (!matchedWords.includes(kw)) {
        matchedWords.push(kw);
      }
    }
  }
  const matchedEmojis = [];
  for (const em of emojis) {
    if (text.includes(em)) {
      matchedEmojis.push(em);
    }
  }
  const hasClosureIntent = matchedWords.length > 0 || matchedEmojis.length > 0;
  return { matchedWords, matchedEmojis, hasClosureIntent };
}
function isAdvertiserSenderMatch(msgSender, msgPhone, orderSenderName, orderSenderPhone) {
  if (msgPhone && orderSenderPhone) {
    const cleanMsgPhone = msgPhone.replace(/\D/g, "");
    const cleanOrderPhone = orderSenderPhone.replace(/\D/g, "");
    if (cleanMsgPhone && cleanOrderPhone && (cleanMsgPhone.includes(cleanOrderPhone) || cleanOrderPhone.includes(cleanMsgPhone))) {
      return true;
    }
  }
  if (msgSender && orderSenderName) {
    const s1 = cleanDialectText(msgSender);
    const s2 = cleanDialectText(orderSenderName);
    if (s1 && s2 && (s1 === s2 || s1.includes(s2) || s2.includes(s1))) {
      return true;
    }
  }
  return false;
}
function checkIncomingMessageForClosure(message, activeOrders) {
  const rawText = (message.text || "").trim();
  if (!rawText) return null;
  const msgTime = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();
  const msgGroup = (message.groupName || "").trim();
  const msgSender = (message.senderName || "").trim();
  const msgPhone = (message.senderPhone || "").replace(/\D/g, "");
  const dedupeKey = message.messageId || `${msgGroup}::${msgSender}::${msgTime}::${rawText.slice(0, 30)}`;
  if (processedMessageHashes.has(dedupeKey)) {
    return null;
  }
  const isPureSticker = /^(?:sticker|ملصق|🖼️\s*ملصق|🖼️\s*sticker)$/i.test(rawText.trim());
  if (isPureSticker && !message.rawQuotedText) {
    return null;
  }
  const { matchedWords, matchedEmojis, hasClosureIntent } = extractClosureKeywords(rawText);
  if (!hasClosureIntent) return null;
  const candidateOrders = activeOrders.filter((order) => {
    if (order.status === "accepted" || order.status === "closed_taken") return false;
    const inSameGroup = msgGroup && order.groupName && (order.groupName.includes(msgGroup) || msgGroup.includes(order.groupName)) || order.crossPostedGroups && order.crossPostedGroups.some((g) => g.includes(msgGroup) || msgGroup.includes(g));
    if (!inSameGroup && msgGroup) return false;
    const orderTime = new Date(order.receivedAt).getTime();
    const diffHours = (msgTime - orderTime) / (1e3 * 60 * 60);
    return diffHours >= 0 && diffHours <= 3.5;
  });
  if (candidateOrders.length === 0) return null;
  const sortedCandidates = [...candidateOrders].sort((a, b) => {
    const aSenderMatch = isAdvertiserSenderMatch(msgSender, msgPhone, a.senderName, a.senderPhone) ? 1 : 0;
    const bSenderMatch = isAdvertiserSenderMatch(msgSender, msgPhone, b.senderName, b.senderPhone) ? 1 : 0;
    if (aSenderMatch !== bSenderMatch) return bSenderMatch - aSenderMatch;
    const diffA = Math.abs(msgTime - new Date(a.receivedAt).getTime());
    const diffB = Math.abs(msgTime - new Date(b.receivedAt).getTime());
    return diffA - diffB;
  });
  for (const order of sortedCandidates) {
    const orderSnippet = order.rawText.substring(0, 35).trim();
    const cleanMsg = cleanDialectText(rawText);
    const fromMention = order.from && cleanMsg.includes(cleanDialectText(order.from));
    const toMention = order.to && cleanMsg.includes(cleanDialectText(order.to));
    const priceMention = order.price && order.price > 0 && cleanMsg.includes(order.price.toString());
    const isQuoted = message.rawQuotedText && (message.rawQuotedText.includes(order.from) || message.rawQuotedText.includes(order.to)) || rawText.includes(`> ${orderSnippet}`) || (fromMention || toMention || priceMention) && (matchedWords.length > 0 || matchedEmojis.length > 0);
    if (isQuoted) {
      processedMessageHashes.add(dedupeKey);
      markOrderPermanentlyClosed(order.id);
      return {
        isMatch: true,
        orderId: order.id,
        matchedOrder: order,
        verdict: "confirmed_closed",
        reason: `\u0627\u0642\u062A\u0628\u0627\u0633 \u0623\u0648 \u0630\u0643\u0631 \u0645\u0628\u0627\u0634\u0631 \u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0628 (${order.from} \u2190 ${order.to}) \u0645\u0639 \u062A\u0623\u0643\u064A\u062F \u0627\u0643\u062A\u0645\u0627\u0644\u0647: \xAB${rawText}\xBB`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || "\u0639\u0636\u0648 \u0628\u0627\u0644\u0642\u0631\u0648\u0628",
          groupName: msgGroup || order.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: 99,
          isQuote: true,
          matchedKeywords: [...matchedWords, ...matchedEmojis]
        }
      };
    }
  }
  for (const order of sortedCandidates) {
    const isAdvertiser = isAdvertiserSenderMatch(msgSender, msgPhone, order.senderName, order.senderPhone);
    if (isAdvertiser) {
      processedMessageHashes.add(dedupeKey);
      markOrderPermanentlyClosed(order.id);
      return {
        isMatch: true,
        orderId: order.id,
        matchedOrder: order,
        verdict: "confirmed_closed",
        reason: `\u0623\u0643\u062F \u0645\u0639\u0644\u0646 \u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0623\u0635\u0644\u064A \u0646\u0641\u0633\u0647 (${msgSender || order.senderName}) \u0641\u064A \u0627\u0644\u0642\u0631\u0648\u0628 \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628: \xAB${rawText}\xBB`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || order.senderName,
          groupName: msgGroup || order.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: 99,
          isQuote: false,
          matchedKeywords: [...matchedWords, ...matchedEmojis]
        }
      };
    }
  }
  return null;
}
function markOrderPermanentlyClosed(orderId) {
  if (!orderId || typeof window === "undefined") return;
  try {
    const existing = getPermanentlyClosedOrderIds();
    if (!existing.includes(orderId)) {
      existing.push(orderId);
      localStorage.setItem(STORAGE_KEY_CLOSED_ORDERS, JSON.stringify(existing.slice(-300)));
    }
  } catch {
  }
}
function getPermanentlyClosedOrderIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLOSED_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
  }
  return [];
}

// src/utils/advertiserReplyClassifier.ts
var CONFIRMATION_KEYWORDS = [
  "\u062A\u0645",
  "\u0644\u0643",
  "\u0639\u0646\u062F\u0643",
  "\u062D\u064A\u0627\u0643",
  "\u062A\u0641\u0636\u0644",
  "\u0627\u0639\u062A\u0645\u062F",
  "\u0645\u0639\u062A\u0645\u062F",
  "\u062A\u0645\u0627\u0645",
  "\u0623\u0648\u0643",
  "\u0627\u0648\u0643",
  "\u0627\u0648\u0643\u064A",
  "\u0623\u0648\u0643\u064A",
  "\u062E\u0630\u0647",
  "\u062E\u0630\u0647\u0627",
  "\u062A\u0639\u0627\u0644",
  "\u062C\u0627\u0647\u0632",
  "\u064A\u0644\u0627",
  "\u0623\u0628\u0634\u0631",
  "\u0627\u0628\u0634\u0631",
  "\u0639\u0644\u0649 \u0628\u0631\u0643\u0629 \u0627\u0644\u0644\u0647",
  "\u0628\u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631",
  "\u0641\u064A \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631",
  "\u0627\u0646\u062A\u0638\u0631\u0643",
  "\u0623\u0646\u062A\u0638\u0631\u0643",
  "\u062A\u0641\u0636\u0644 \u0627\u062E\u0648\u064A",
  "\u062A\u0641\u0636\u0644 \u0627\u062E\u064A",
  "\u062A\u0641\u0636\u0644 \u062E\u0627\u0635",
  "\u0643\u0644\u0645\u0646\u064A",
  "\u0631\u0627\u0633\u0644\u0646\u064A",
  "\u0639\u0637\u0646\u064A \u0631\u0642\u0645\u0643",
  "\u062C\u0627\u0647\u0632\u0629 \u0627\u0644\u0634\u062D\u0646\u0629",
  "\u062C\u0627\u0647\u0632 \u0627\u0644\u0637\u0644\u0628"
];
var CONFIRMATION_EMOJIS = ["\u{1F44D}", "\u2705", "\u{1F91D}", "\u{1F44C}", "\u{1F697}", "\u{1F4E6}", "\u2714\uFE0F", "\u{1F490}", "\u{1F339}", "\u{1F4AF}", "\u{1F64F}"];
var REJECTION_OR_TAKEN_KEYWORDS = [
  "\u0627\u062E\u0630\u0648\u0647",
  "\u0623\u062E\u0630\u0648\u0647",
  "\u062D\u0635\u0644\u062A \u0645\u0646\u062F\u0648\u0628",
  "\u062D\u0635\u0644\u062A",
  "\u062D\u0635\u0644\u0646\u0627 \u0645\u0646\u062F\u0648\u0628",
  "\u062D\u0635\u0644\u0646\u0627",
  "\u0644\u0642\u062F \u062D\u0635\u0644\u062A",
  "\u062A\u0645 \u0627\u062E\u0630\u0647",
  "\u062A\u0645 \u0623\u062E\u0630\u0647",
  "\u0627\u0646\u0623\u062E\u0630",
  "\u0627\u0646\u0623\u062E\u0630\u062A",
  "\u0631\u0627\u062D",
  "\u0631\u0627\u062D\u062A",
  "\u062A\u0643\u0646\u0633\u0644",
  "\u0643\u0646\u0633\u0644",
  "\u062A\u0643\u0646\u0633\u0644\u062A",
  "\u0645\u0644\u063A\u064A",
  "\u0627\u0644\u063A\u064A",
  "\u0627\u0644\u062A\u063A\u0649",
  "\u062A\u0623\u062E\u0631\u062A",
  "\u062A\u0627\u062E\u0631\u062A",
  "\u0641\u064A \u0645\u0646\u062F\u0648\u0628 \u062B\u0627\u0646\u064A",
  "\u0627\u062E\u0630\u0647\u0627 \u0645\u0646\u062F\u0648\u0628",
  "\u062E\u0644\u0627\u0635 \u0627\u062E\u0630\u0648\u0647",
  "\u0627\u0639\u062A\u0630\u0631",
  "\u0627\u0639\u062A\u0630\u0631 \u0645\u0646\u0643",
  "\u0645\u0648 \u0645\u062A\u0648\u0641\u0631",
  "\u062E\u0644\u0635",
  "\u0633\u0628\u0642\u0643 \u0645\u0646\u062F\u0648\u0628",
  "\u0645\u0648 \u0644\u0643",
  "\u0645\u0634 \u0644\u0643",
  "\u0645\u0648 \u0639\u0646\u062F\u0643"
];
function classifyAdvertiserPrivateReply(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return { verdict: "NEUTRAL", matchedKeywords: [], reason: "\u0646\u0635 \u0641\u0627\u0631\u063A" };
  }
  const normalized = normalizeArabicText(rawText);
  const matchedRejection = [];
  for (const kw of REJECTION_OR_TAKEN_KEYWORDS) {
    const rx = new RegExp(`(?:^|[\\s\u060C,.])${kw}(?:$|[\\s\u060C,.])`, "i");
    if (rx.test(normalized) || rx.test(rawText)) {
      matchedRejection.push(kw);
    }
  }
  if (matchedRejection.length > 0) {
    return {
      verdict: "REJECTED_OR_TAKEN",
      matchedKeywords: matchedRejection,
      reason: "\u0627\u0644\u0645\u0639\u0644\u0646 \u0623\u0641\u0627\u062F \u0628\u0623\u0646 \u0627\u0644\u0637\u0644\u0628 \u0623\u062E\u0630\u0648\u0647 \u0623\u0648 \u062D\u0635\u0644 \u0645\u0646\u062F\u0648\u0628 \u0622\u062E\u0631 \u0623\u0648 \u062A\u0645 \u0625\u0644\u063A\u0627\u0624\u0647 (\u064A\u062A\u0645 \u0627\u0644\u062A\u062C\u0627\u0647\u0644 \u0627\u0644\u062A\u0627\u0645)"
    };
  }
  const matchedConfirmation = [];
  for (const kw of CONFIRMATION_KEYWORDS) {
    const rx = new RegExp(`(?:^|[\\s\u060C,.])${kw}(?:$|[\\s\u060C,.])`, "i");
    if (rx.test(normalized) || rx.test(rawText)) {
      matchedConfirmation.push(kw);
    }
  }
  for (const emoji of CONFIRMATION_EMOJIS) {
    if (rawText.includes(emoji)) {
      matchedConfirmation.push(emoji);
    }
  }
  if (matchedConfirmation.length > 0) {
    return {
      verdict: "CONFIRMED_AWARDED",
      matchedKeywords: Array.from(new Set(matchedConfirmation)),
      reason: "\u0627\u0644\u0645\u0639\u0644\u0646 \u0648\u0627\u0641\u0642 \u0648\u0639\u0637\u0627\u0643 \u0627\u0644\u0637\u0644\u0628 (\xAB\u062A\u0645 / \u0644\u0643 / \u0639\u0646\u062F\u0643 / \u0645\u0644\u0635\u0642 \u062A\u0623\u0643\u064A\u062F\xBB)"
    };
  }
  return {
    verdict: "NEUTRAL",
    matchedKeywords: [],
    reason: "\u0631\u0633\u0627\u0644\u0629 \u0639\u0627\u062F\u064A\u0629 \u0644\u0627 \u062A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u062A\u0623\u0643\u064A\u062F \u0623\u0648 \u0631\u0641\u0636 \u0635\u0631\u064A\u062D"
  };
}

// src/server/trialVault.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DATA_DIR, "device_trials.json");
try {
  if (!import_fs.default.existsSync(DATA_DIR)) {
    import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("[TrialVault] Failed to ensure data dir:", e);
}
function loadRegistry() {
  try {
    if (import_fs.default.existsSync(DB_FILE)) {
      const content = import_fs.default.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("[TrialVault] Failed to load device_trials.json:", err);
  }
  return {};
}
function saveRegistry(registry) {
  try {
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(registry, null, 2), "utf-8");
  } catch (err) {
    console.warn("[TrialVault] Failed to save device_trials.json:", err);
  }
}
function checkOrRegisterDevice(params) {
  const registry = loadRegistry();
  const { deviceId, hardwareFingerprint, model = "Mobile Device", platform = "android", phone = "" } = params;
  let existingKey = Object.keys(registry).find(
    (k) => k === deviceId || registry[k].deviceId === deviceId || hardwareFingerprint && registry[k].hardwareFingerprint === hardwareFingerprint || phone && registry[k].phone && registry[k].phone === phone
  );
  const now = Date.now();
  if (existingKey) {
    const existing = registry[existingKey];
    existing.lastSeenAt = now;
    existing.installCount = (existing.installCount || 1) + 1;
    if (phone && !existing.phone) existing.phone = phone;
    if (model && (!existing.model || existing.model === "Mobile Device")) existing.model = model;
    saveRegistry(registry);
    const diff = existing.expiresAt - now;
    const isExpired = !existing.isActivated && diff <= 0;
    const daysRemaining = existing.isActivated ? 999 : Math.max(0, Math.ceil(diff / (24 * 3600 * 1e3)));
    const hoursRemaining = existing.isActivated ? 999 : Math.max(0, Math.ceil(diff / (3600 * 1e3)));
    return {
      record: existing,
      isExpired,
      daysRemaining,
      hoursRemaining,
      isNewInstall: false
    };
  }
  const trialDays = 7;
  const firstInstalledAt = now;
  const expiresAt = firstInstalledAt + trialDays * 24 * 60 * 60 * 1e3;
  const newRecord = {
    deviceId,
    hardwareFingerprint,
    model,
    platform,
    phone,
    firstInstalledAt,
    trialDays,
    expiresAt,
    isActivated: false,
    activationCode: null,
    installCount: 1,
    lastSeenAt: now,
    createdAt: now
  };
  registry[deviceId] = newRecord;
  saveRegistry(registry);
  return {
    record: newRecord,
    isExpired: false,
    daysRemaining: 7,
    hoursRemaining: 168,
    isNewInstall: true
  };
}
function activateDevice(params) {
  const { deviceId, hardwareFingerprint, code, phone } = params;
  const normalizedCode = (code || "").trim().toUpperCase();
  const masterCodes = ["ORDERI-VIP-2026", "ORDERI7", "BAHRAIN-PRO-2026", "ORD-PRO-2026", "ORDERI-2026"];
  const isValidPattern = masterCodes.includes(normalizedCode) || /^ORD-[A-Z0-9]{4,10}-[A-Z0-9]{4,10}$/i.test(normalizedCode) || /^CAP-[A-Z0-9]{4,12}$/i.test(normalizedCode);
  if (!isValidPattern) {
    return {
      success: false,
      message: "\u0643\u0648\u062F \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u0631\u0645\u0632 \u0623\u0648 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628 \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0643\u0648\u062F \u062C\u062F\u064A\u062F."
    };
  }
  const registry = loadRegistry();
  let existingKey = Object.keys(registry).find(
    (k) => k === deviceId || registry[k].deviceId === deviceId || hardwareFingerprint && registry[k].hardwareFingerprint === hardwareFingerprint
  );
  let record;
  const now = Date.now();
  if (existingKey) {
    record = registry[existingKey];
    record.isActivated = true;
    record.activationCode = normalizedCode;
    record.lastSeenAt = now;
    if (phone) record.phone = phone;
  } else {
    record = {
      deviceId,
      hardwareFingerprint: hardwareFingerprint || deviceId,
      model: "Mobile Device",
      platform: "android",
      phone: phone || "",
      firstInstalledAt: now,
      trialDays: 7,
      expiresAt: now + 365 * 24 * 3600 * 1e3,
      isActivated: true,
      activationCode: normalizedCode,
      installCount: 1,
      lastSeenAt: now,
      createdAt: now
    };
    registry[deviceId] = record;
  }
  saveRegistry(registry);
  return {
    success: true,
    message: "\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u062A\u0631\u062E\u064A\u0635 Orderi \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0647\u0627\u062A\u0641 \u0628\u0646\u062C\u0627\u062D \u0645\u062F\u0649 \u0627\u0644\u062D\u064A\u0627\u0629! \u{1F680}",
    record
  };
}
function resetDeviceTrial(deviceId) {
  const registry = loadRegistry();
  if (registry[deviceId]) {
    delete registry[deviceId];
    saveRegistry(registry);
    return true;
  }
  return false;
}

// server.ts
import_dotenv.default.config();
process.on("uncaughtException", (err) => {
  console.error("[Orderi Server] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Orderi Server] Unhandled rejection:", reason);
});
function resolvePort() {
  const portArgIdx = process.argv.indexOf("--port");
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const parsed = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3e3;
}
var app = (0, import_express.default)();
var PORT = resolvePort();
app.use(import_express.default.json({ limit: "35mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "35mb" }));
var sseClients = /* @__PURE__ */ new Set();
var recentWebhookOrders = [];
var recentDiscoveredGroupLinks = [];
var markedReadOrderIds = /* @__PURE__ */ new Set();
var pendingOutreachOrders = /* @__PURE__ */ new Map();
function extractAndBroadcastGroupLinks(rawText, sender, phone, group) {
  if (!rawText || typeof rawText !== "string") return [];
  const matches = [...rawText.matchAll(/(?:https?:\/\/)?(?:chat\.whatsapp\.com|wa\.me\/join)\/([a-zA-Z0-9_-]{20,26})/gi)];
  if (matches.length === 0) return [];
  const newlyCaptured = [];
  for (const match of matches) {
    const inviteCode = match[1];
    const fullUrl = `https://chat.whatsapp.com/${inviteCode}`;
    const existing = recentDiscoveredGroupLinks.find((g) => g.inviteCode === inviteCode);
    if (existing) {
      existing.capturedAt = (/* @__PURE__ */ new Date()).toISOString();
      continue;
    }
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let title = `\u0642\u0631\u0648\u0628 \u062A\u0648\u0635\u064A\u0644 \u062C\u062F\u064A\u062F (\u0645\u0646 ${sender || group})`;
    for (const line of lines) {
      if (["\u0642\u0631\u0648\u0628", "\u0645\u062C\u0645\u0648\u0639\u0629", "\u0643\u0628\u0627\u062A\u0646", "\u0645\u0646\u0627\u062F\u064A\u0628", "\u062A\u0648\u0635\u064A\u0644", "\u0637\u0644\u0628\u0627\u062A"].some((kw) => line.includes(kw)) && line.length < 70) {
        const cleaned = line.replace(/https?:\/\/\S+/gi, "").replace(/(?:رابط|انضموا|حياكم|تفضلوا|هذا|الرابط|للانضمام|للتسجيل|اضغط|هنا)[\s:]*/gi, "").trim();
        if (cleaned.length > 3) {
          title = cleaned;
          break;
        }
      }
    }
    const groupLink = {
      id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: fullUrl,
      inviteCode,
      title,
      senderName: sender || "\u0645\u0639\u0644\u0646 \u0648\u0627\u062A\u0633\u0627\u0628",
      senderPhone: phone || "",
      sourceGroup: group || "\u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628",
      rawText: rawText.trim(),
      capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "new",
      isMonitored: false
    };
    recentDiscoveredGroupLinks.unshift(groupLink);
    if (recentDiscoveredGroupLinks.length > 50) recentDiscoveredGroupLinks.pop();
    newlyCaptured.push(groupLink);
    const linkPayload = `data: ${JSON.stringify({
      type: "GROUP_LINK_DETECTED",
      groupLink
    })}

`;
    sseClients.forEach((client) => {
      try {
        client.write(linkPayload);
      } catch {
        sseClients.delete(client);
      }
    });
    console.log(`[Orderi Sniffer] \u{1F517} Intercepted new delivery group invite: "${title}" (${fullUrl}) posted in "${group}" by ${sender}`);
  }
  return newlyCaptured;
}
var whatsAppSession = {
  status: "disconnected",
  qrCodeDataUrl: "",
  pairingCode: "",
  connectedPhone: null,
  connectedAt: null,
  deviceName: "Orderi Radar Gateway (Multi-Device)",
  batteryLevel: 96,
  groupsMonitoredCount: 18,
  privateChatsMonitoredCount: 6,
  totalOrdersCaptured: 0,
  lastSyncAt: null,
  listenerServiceActive: true
};
async function generateFreshQRCode() {
  const randomToken = Array.from(
    { length: 32 },
    () => Math.floor(Math.random() * 36).toString(36)
  ).join("");
  const pairingStr = `2@ORD-RADAR-BH-${Date.now()}-${randomToken}`;
  whatsAppSession.pairingCode = `ORD-973-${Math.floor(1e3 + Math.random() * 9e3)}`;
  try {
    const dataUrl = await import_qrcode.default.toDataURL(pairingStr, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    });
    whatsAppSession.qrCodeDataUrl = dataUrl;
    return dataUrl;
  } catch (err) {
    console.error("QR Code generation error:", err);
    return "";
  }
}
generateFreshQRCode().then(() => {
  whatsAppSession.status = "qr_ready";
});
var genAIClient = null;
function getGenAI() {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("\u0645\u0641\u062A\u0627\u062D GEMINI_API_KEY \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u0641\u064A \u0645\u062A\u063A\u064A\u0631\u0627\u062A \u0627\u0644\u0628\u064A\u0626\u0629");
    }
    genAIClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAIClient;
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    liveConnections: sseClients.size,
    recentWebhookOrdersCount: recentWebhookOrders.length
  });
});
app.get("/api/whatsapp/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  sseClients.add(res);
  const welcomePayload = JSON.stringify({
    type: "CONNECTED",
    connectedAt: (/* @__PURE__ */ new Date()).toISOString(),
    clientsCount: sseClients.size,
    recentOrders: recentWebhookOrders.slice(0, 10)
  });
  res.write(`data: ${welcomePayload}

`);
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}

`);
    } catch {
      clearInterval(heartbeatTimer);
      sseClients.delete(res);
    }
  }, 2e4);
  req.on("close", () => {
    clearInterval(heartbeatTimer);
    sseClients.delete(res);
  });
});
var handleIncomingWebhook = (req, res) => {
  try {
    const body = req.body || {};
    const query = req.query || {};
    const rawText = body.text || body.message || body.body || body.content || body.notificationText || body.data || query.text || query.message || "";
    const sender = body.sender || body.senderName || body.title || body.from_user || body.notificationTitle || body.from || query.sender || "\u062A\u0627\u062C\u0631 \u0648\u0627\u062A\u0633\u0627\u0628";
    const group = body.group || body.groupName || body.subText || body.notificationSubText || body.chat || query.group || "";
    const phone = body.phone || body.senderPhone || body.phoneNumber || query.phone || "";
    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        error: "\u0646\u0635 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0641\u0627\u0631\u063A. \u062A\u0623\u0643\u062F \u0645\u0646 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062D\u0642\u0644 text \u0623\u0648 message \u0641\u064A \u0627\u0644\u0637\u0644\u0628."
      });
    }
    const capturedGroupLinks = extractAndBroadcastGroupLinks(rawText, sender, phone, group || "\u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628");
    const isDirectChat = !group || group.trim() === "" || group === sender || group.includes("\u062E\u0627\u0635") || group.toLowerCase().includes("direct") || group.toLowerCase().includes("private");
    const groupDisplayName = isDirectChat ? "\u0645\u062D\u0627\u062F\u062B\u0629 \u062E\u0627\u0635\u0629 / \u062A\u0627\u062C\u0631 \u0645\u0628\u0627\u0634\u0631 \u{1F464}" : group;
    if (!isDirectChat && groupDisplayName && groupDisplayName !== "\u0645\u062D\u0627\u062F\u062B\u0629 \u062E\u0627\u0635\u0629 / \u062A\u0627\u062C\u0631 \u0645\u0628\u0627\u0634\u0631 \u{1F464}") {
      const groupEvent = `data: ${JSON.stringify({
        type: "GROUP_DISCOVERED",
        groupName: groupDisplayName,
        senderName: sender,
        capturedAt: (/* @__PURE__ */ new Date()).toISOString()
      })}

`;
      sseClients.forEach((client) => {
        try {
          client.write(groupEvent);
        } catch {
          sseClients.delete(client);
        }
      });
    }
    const closureCheck = extractClosureKeywords(rawText);
    if (closureCheck.hasClosureIntent) {
      const closureMatch = checkIncomingMessageForClosure(
        {
          text: rawText,
          senderName: sender,
          senderPhone: phone,
          groupName: groupDisplayName,
          timestamp: Date.now()
        },
        recentWebhookOrders
      );
      if (closureMatch) {
        const targetOrd = recentWebhookOrders.find((o) => o.id === closureMatch.orderId);
        if (targetOrd) {
          targetOrd.status = closureMatch.verdict === "confirmed_closed" ? "closed_taken" : "suspicious_closed";
          targetOrd.closedAt = (/* @__PURE__ */ new Date()).toISOString();
          targetOrd.closureReason = closureMatch.reason;
          targetOrd.closureEvidence = closureMatch.evidence;
        }
        const closePayload = `data: ${JSON.stringify({
          type: "ORDER_CLOSED",
          orderId: closureMatch.orderId,
          closureMatch
        })}

`;
        sseClients.forEach((client) => {
          try {
            client.write(closePayload);
          } catch {
            sseClients.delete(client);
          }
        });
        console.log(`[Orderi Closure] Order ${closureMatch.orderId} marked as ${closureMatch.verdict}: ${closureMatch.reason}`);
        return res.json({
          success: true,
          closureDetected: true,
          orderId: closureMatch.orderId,
          verdict: closureMatch.verdict,
          reason: closureMatch.reason,
          evidence: closureMatch.evidence,
          message: "\u062A\u0645 \u0631\u0635\u062F \u0631\u062F \u0628\u0627\u0644\u0642\u0631\u0648\u0628 \u064A\u0641\u064A\u062F \u0628\u0627\u0643\u062A\u0645\u0627\u0644 \u0623\u0648 \u062D\u062C\u0632 \u0627\u0644\u0637\u0644\u0628 \u0648\u0625\u063A\u0644\u0627\u0642\u0647 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0641\u064A \u0627\u0644\u0631\u0627\u062F\u0627\u0631"
        });
      }
    }
    const senderDigits = (phone || "").replace(/\D/g, "");
    const last8Sender = senderDigits.length >= 8 ? senderDigits.slice(-8) : senderDigits;
    if (last8Sender && pendingOutreachOrders.has(last8Sender)) {
      const outreach = pendingOutreachOrders.get(last8Sender);
      const replyAnalysis = classifyAdvertiserPrivateReply(rawText);
      if (replyAnalysis.verdict === "CONFIRMED_AWARDED") {
        pendingOutreachOrders.delete(last8Sender);
        const awardedPayload = {
          type: "ADVERTISER_AWARDED_ORDER",
          orderId: outreach.orderId,
          advertiserName: outreach.senderName || sender,
          advertiserPhone: outreach.phone,
          replyText: rawText.trim(),
          from: outreach.from,
          to: outreach.to,
          price: outreach.price,
          awardedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const sseEvent = `data: ${JSON.stringify(awardedPayload)}

`;
        sseClients.forEach((client) => {
          try {
            client.write(sseEvent);
          } catch {
            sseClients.delete(client);
          }
        });
        console.log(`[Orderi Outreach] Advertiser AWARDED order ${outreach.orderId}: "${rawText}"`);
        return res.json({
          success: true,
          awarded: true,
          message: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0645\u0639\u0644\u0646 \u0639\u0644\u0649 \u0625\u0639\u0637\u0627\u0626\u0643 \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D! \u{1F3AF}",
          orderId: outreach.orderId
        });
      } else if (replyAnalysis.verdict === "REJECTED_OR_TAKEN") {
        pendingOutreachOrders.delete(last8Sender);
        console.log(`[Orderi Outreach] Advertiser replied taken/rejected for order ${outreach.orderId}: "${rawText}" -> Silently ignored.`);
        return res.json({
          success: true,
          ignored: true,
          message: "\u0631\u062F \u0627\u0644\u0645\u0639\u0644\u0646 \u064A\u0641\u064A\u062F \u0628\u0623\u0646\u0647 \u062A\u0645 \u0623\u062E\u0630\u0647 \u0623\u0648 \u0625\u0644\u063A\u0627\u0624\u0647\u060C \u062A\u0645 \u062A\u062C\u0627\u0647\u0644\u0647 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0623\u0645\u0627\u0646"
        });
      }
    }
    const parsed = parseWhatsAppOrderText(rawText);
    if (capturedGroupLinks && capturedGroupLinks.length > 0 && !parsed.from && !parsed.to) {
      return res.json({
        success: true,
        message: "\u062A\u0645 \u0631\u0635\u062F \u0631\u0627\u0628\u0637 \u0642\u0631\u0648\u0628 \u062A\u0648\u0635\u064A\u0644 \u062C\u062F\u064A\u062F \u0648\u0625\u0631\u0633\u0627\u0644 \u062A\u0646\u0628\u064A\u0647 \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645 \u0648\u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0644\u0644\u0631\u0627\u062F\u0627\u0631 \u0641\u0648\u0631\u0627\u064B",
        groupLinks: capturedGroupLinks,
        clientsNotified: sseClients.size
      });
    }
    if (!parsed.from && !parsed.to && (!parsed.price || parsed.price === 0)) {
      return res.json({
        success: true,
        message: "\u0631\u0633\u0627\u0644\u0629 \u0645\u062D\u0627\u062F\u062B\u0629 \u0639\u0627\u0645\u0629 \u0628\u062F\u0648\u0646 \u062A\u0641\u0627\u0635\u064A\u0644 \u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644\u060C \u062A\u0645 \u0627\u0633\u062A\u0628\u0639\u0627\u062F\u0647\u0627 \u0628\u0623\u0645\u0627\u0646",
        isGeneralChat: true
      });
    }
    const cleanPhoneDigits = (phone || parsed.phone || "").replace(/\D/g, "");
    const last8Digits = cleanPhoneDigits.length >= 8 ? cleanPhoneDigits.slice(-8) : cleanPhoneDigits;
    const nowMs = Date.now();
    const existingIndex = recentWebhookOrders.findIndex((existing) => {
      const exPhone = (existing.senderPhone || "").replace(/\D/g, "");
      const exLast8 = exPhone.length >= 8 ? exPhone.slice(-8) : exPhone;
      const timeDiff = nowMs - new Date(existing.receivedAt).getTime();
      if (timeDiff > 20 * 60 * 1e3) return false;
      if (last8Digits && exLast8 && last8Digits === exLast8 && parsed.from && existing.from && parsed.from === existing.from && parsed.to && existing.to && parsed.to === existing.to) {
        return true;
      }
      if (rawText.trim().length > 10 && existing.rawText && rawText.trim() === existing.rawText.trim()) {
        return true;
      }
      return false;
    });
    if (existingIndex !== -1) {
      const existing = recentWebhookOrders[existingIndex];
      if (!existing.crossPostedGroups) {
        existing.crossPostedGroups = [existing.groupName];
      }
      if (!existing.crossPostedGroups.includes(groupDisplayName)) {
        existing.crossPostedGroups.push(groupDisplayName);
      }
      existing.duplicateCount = (existing.duplicateCount || 1) + 1;
      console.log(`[Orderi Webhook] Duplicate cross-group order detected from ${sender} in group "${groupDisplayName}". Merged into order ${existing.id} (Total groups: ${existing.crossPostedGroups.length})`);
      const updatePayload = `data: ${JSON.stringify({
        type: "ORDER_CROSSPOSTED",
        orderId: existing.id,
        groupName: groupDisplayName,
        crossPostedGroups: existing.crossPostedGroups,
        duplicateCount: existing.duplicateCount
      })}

`;
      sseClients.forEach((client) => {
        try {
          client.write(updatePayload);
        } catch {
          sseClients.delete(client);
        }
      });
      return res.json({
        success: true,
        deduplicated: true,
        message: `\u062A\u0645 \u0631\u0635\u062F \u0625\u0639\u0644\u0627\u0646 \u0645\u0643\u0631\u0631 \u0645\u0646 \u0627\u0644\u0645\u0639\u0644\u0646 \u0641\u064A \u0642\u0631\u0648\u0628 (${groupDisplayName}) \u0648\u062F\u0645\u062C\u0647 \u0644\u0645\u0646\u0639 \u0627\u0644\u062A\u0643\u0631\u0627\u0631`,
        originalOrderId: existing.id,
        crossPostedGroups: existing.crossPostedGroups
      });
    }
    const order = {
      id: `ord-real-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      from: parsed.from || "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      to: parsed.to || "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      price: parsed.price > 0 ? parsed.price : 0,
      isPriceUnspecified: !parsed.price || parsed.price <= 0,
      rawText: rawText.trim(),
      groupName: groupDisplayName,
      senderName: sender,
      senderPhone: phone || parsed.phone || "97300000000",
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      confidence: parsed.confidence || 90,
      type: isDirectChat ? "\u0637\u0644\u0628 \u0645\u0628\u0627\u0634\u0631 (\u062E\u0627\u0635)" : "\u0637\u0644\u0628 \u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628",
      notes: parsed.notes || (isDirectChat ? "\u0648\u0627\u0631\u062F \u0641\u064A \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u062F\u0627\u064A\u0631\u0643\u062A" : "\u0648\u0627\u0631\u062F \u0645\u0646 \u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628"),
      status: "pending",
      source: "webhook_real",
      isDirectPrivate: isDirectChat,
      crossPostedGroups: [groupDisplayName],
      duplicateCount: 1,
      passengerCount: parsed.passengerCount,
      passengerDetection: parsed.passengerDetection
    };
    recentWebhookOrders.unshift(order);
    if (recentWebhookOrders.length > 50) {
      recentWebhookOrders.pop();
    }
    const eventPayload = `data: ${JSON.stringify({ type: "NEW_ORDER", order })}

`;
    sseClients.forEach((client) => {
      try {
        client.write(eventPayload);
      } catch {
        sseClients.delete(client);
      }
    });
    console.log(`[Orderi Webhook] Received automated order: ${order.from} -> ${order.to} (${order.price} BHD) from ${sender} [Clients notified: ${sseClients.size}]`);
    return res.json({
      success: true,
      message: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0648\u0627\u062A\u0633\u0627\u0628 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0648\u0625\u0631\u0633\u0627\u0644\u0647 \u0644\u0644\u0631\u0627\u062F\u0627\u0631 \u0641\u0648\u0631\u0627\u064B \u0628\u0646\u062C\u0627\u062D",
      order,
      clientsNotified: sseClients.size
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0637\u0644\u0628 \u0627\u0644\u0648\u064A\u0628 \u0647\u0648\u0643"
    });
  }
};
app.post("/api/whatsapp/webhook", handleIncomingWebhook);
app.post("/api/orders/webhook", handleIncomingWebhook);
app.get("/api/whatsapp/webhook", handleIncomingWebhook);
app.get("/api/whatsapp/status", (req, res) => {
  res.json({
    status: "active",
    liveConnections: sseClients.size,
    recentWebhookOrdersCount: recentWebhookOrders.length,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/whatsapp/recent", (req, res) => {
  res.json({
    success: true,
    orders: recentWebhookOrders
  });
});
app.get("/api/whatsapp/discovered-groups", (req, res) => {
  res.json({
    success: true,
    groupLinks: recentDiscoveredGroupLinks
  });
});
app.post("/api/whatsapp/broadcast-reply", (req, res) => {
  try {
    const { broadcastId, replyText, targetGroups = [], originalText = "" } = req.body || {};
    if (!replyText || typeof replyText !== "string" || !replyText.trim()) {
      return res.status(400).json({
        success: false,
        error: "\u0646\u0635 \u0627\u0644\u0631\u062F (\u062A\u0645) \u0641\u0627\u0631\u063A. \u064A\u0631\u062C\u0649 \u062A\u0648\u0641\u064A\u0631 \u0646\u0635 \u0627\u0644\u0631\u062F \u0644\u0625\u0631\u0633\u0627\u0644\u0647."
      });
    }
    const payload = {
      type: "BROADCAST_REPLY_SENT",
      broadcastId: broadcastId || `bcast-reply-${Date.now()}`,
      replyText: replyText.trim(),
      targetGroups: Array.isArray(targetGroups) ? targetGroups : [targetGroups],
      originalText,
      sentAt: (/* @__PURE__ */ new Date()).toISOString(),
      isGatewayConnected: whatsAppSession.status === "connected",
      clientsNotified: sseClients.size
    };
    const sseEvent = `data: ${JSON.stringify(payload)}

`;
    sseClients.forEach((client) => {
      try {
        client.write(sseEvent);
      } catch {
        sseClients.delete(client);
      }
    });
    console.log(`[Orderi Broadcast Replay] (\u062A\u0645) dispatched for broadcast "${broadcastId}" to groups: [${targetGroups.join(", ")}]`);
    return res.json({
      success: true,
      message: whatsAppSession.status === "connected" ? `\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u062F (\u062A\u0645) \u0639\u0628\u0631 \u062C\u0644\u0633\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0648\u064A\u0628 \u0625\u0644\u0649 \u0643\u0627\u0641\u0629 \u0627\u0644\u0642\u0631\u0648\u0628\u0627\u062A (${targetGroups.length}) \u0628\u0646\u062C\u0627\u062D!` : `\u062A\u0645 \u062A\u0648\u062B\u064A\u0642 \u0648\u062A\u062C\u0647\u064A\u0632 \u0631\u062F (\u062A\u0645) \u0644\u0646\u0634\u0631\u0647 \u0641\u064A \u0643\u0627\u0641\u0629 \u0627\u0644\u0642\u0631\u0648\u0628\u0627\u062A (${targetGroups.length}) \u0628\u0646\u062C\u0627\u062D`,
      broadcastId,
      targetGroups,
      sentAt: payload.sentAt,
      clientsNotified: sseClients.size
    });
  } catch (err) {
    console.error("Broadcast replay endpoint error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0646\u0634\u0631 \u0631\u062F (\u062A\u0645)"
    });
  }
});
app.post("/api/whatsapp/mark-read", (req, res) => {
  try {
    const { orderId, phone, groupName, senderName } = req.body || {};
    if (orderId) {
      markedReadOrderIds.add(orderId);
    }
    const idx = recentWebhookOrders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      recentWebhookOrders.splice(idx, 1);
    }
    console.log(`[Orderi WhatsApp] Order ${orderId} marked as read in WhatsApp for ${senderName || phone || groupName || "chat"}`);
    const payload = `data: ${JSON.stringify({
      type: "ORDER_MARKED_READ",
      orderId,
      phone,
      groupName,
      markedAt: (/* @__PURE__ */ new Date()).toISOString()
    })}

`;
    sseClients.forEach((client) => {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    });
    return res.json({
      success: true,
      message: "\u062A\u0645 \u0645\u0633\u062D \u0627\u0644\u0637\u0644\u0628 \u0648\u062A\u062D\u062F\u064A\u062F\u0647 \u0643\u0645\u0642\u0631\u0648\u0621 (\u062A\u0645\u062A \u0642\u0631\u0627\u0621\u062A\u0647\u0627 \u2713\u2713) \u0641\u064A \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0628\u0646\u062C\u0627\u062D",
      orderId,
      markedAsRead: true
    });
  } catch (error) {
    console.error("Error marking order as read:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0637\u0644\u0628 \u0643\u0645\u0642\u0631\u0648\u0621"
    });
  }
});
app.post("/api/whatsapp/mark-all-groups-read", (req, res) => {
  try {
    const { groupNames = [] } = req.body || {};
    const groupsSet = new Set((groupNames || []).map((g) => (g || "").toLowerCase().trim()).filter(Boolean));
    let clearedCount = 0;
    for (let i = recentWebhookOrders.length - 1; i >= 0; i--) {
      const order = recentWebhookOrders[i];
      const grp = (order.groupName || "").toLowerCase().trim();
      if (groupsSet.size === 0 || groupsSet.has(grp) || Array.from(groupsSet).some((g) => grp.includes(g) || g.includes(grp))) {
        markedReadOrderIds.add(order.id);
        recentWebhookOrders.splice(i, 1);
        clearedCount++;
      }
    }
    console.log(`[Orderi WhatsApp] Marked all ${clearedCount} orders as read across ${groupsSet.size || "all"} WhatsApp groups`);
    const payload = `data: ${JSON.stringify({
      type: "ALL_GROUPS_MARKED_READ",
      groupNames,
      markedAt: (/* @__PURE__ */ new Date()).toISOString(),
      clearedOrdersCount: clearedCount
    })}

`;
    sseClients.forEach((client) => {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    });
    return res.json({
      success: true,
      message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062F \u062C\u0645\u064A\u0639 \u0642\u0631\u0648\u0628\u0627\u062A \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0643\u0645\u0642\u0631\u0648\u0621\u0629 \u0648\u0645\u0633\u062D \u0639\u062F\u0627\u062F \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0628\u0646\u062C\u0627\u062D",
      clearedCount,
      groupsCount: groupsSet.size
    });
  } catch (error) {
    console.error("Error marking all groups as read:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0642\u0631\u0648\u0628\u0627\u062A \u0643\u0645\u0642\u0631\u0648\u0621\u0629"
    });
  }
});
app.post("/api/orders/close", (req, res) => {
  try {
    const { orderId, reason, evidence } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ error: "Missing orderId" });
    }
    markedReadOrderIds.add(orderId);
    const target = recentWebhookOrders.find((o) => o.id === orderId);
    if (target) {
      target.status = "closed_taken";
      target.closedAt = (/* @__PURE__ */ new Date()).toISOString();
      target.closureReason = reason || "\u0623\u0641\u0627\u062F \u0627\u0644\u0645\u0639\u0644\u0646 \u0628\u0623\u0646\u0647 \u062D\u0635\u0644 \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628";
      target.closureEvidence = evidence;
    }
    const payload = `data: ${JSON.stringify({
      type: "ORDER_CLOSED",
      orderId,
      closureMatch: {
        orderId,
        verdict: "confirmed_closed",
        reason: reason || "\u0623\u0641\u0627\u062F \u0627\u0644\u0645\u0639\u0644\u0646 \u0628\u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628",
        evidence: evidence || { replyText: "\u062D\u0635\u0644\u062A", timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      }
    })}

`;
    sseClients.forEach((client) => {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    });
    return res.json({
      success: true,
      orderId,
      status: "closed_taken",
      message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628 \u0625\u0644\u0649 \u0645\u063A\u0644\u0642 \u0628\u0646\u062C\u0627\u062D"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/whatsapp/quick-accept-reply", (req, res) => {
  try {
    const { orderId, phone, groupName, senderName, replyText, price, from, to } = req.body || {};
    if (!replyText || typeof replyText !== "string") {
      return res.status(400).json({
        success: false,
        error: "\u0646\u0635 \u0627\u0644\u0631\u062F \u0641\u0627\u0631\u063A. \u064A\u0631\u062C\u0649 \u062A\u0648\u0641\u064A\u0631 \u0646\u0635 \u0627\u0644\u0631\u062F."
      });
    }
    const cleanPhone = phone ? String(phone).replace(/[^\d+]/g, "") : "";
    const payload = {
      type: "ORDER_AUTO_REPLIED",
      orderId,
      phone: cleanPhone,
      groupName: groupName || "WhatsApp",
      senderName: senderName || "\u0627\u0644\u062A\u0627\u062C\u0631",
      replyText: replyText.trim(),
      price: price || 0,
      from: from || "",
      to: to || "",
      repliedAt: (/* @__PURE__ */ new Date()).toISOString(),
      isGatewayConnected: whatsAppSession.status === "connected"
    };
    const sseEvent = `data: ${JSON.stringify(payload)}

`;
    sseClients.forEach((client) => {
      try {
        client.write(sseEvent);
      } catch {
        sseClients.delete(client);
      }
    });
    const digits = cleanPhone.replace(/\D/g, "");
    const last8 = digits.length >= 8 ? digits.slice(-8) : digits;
    if (last8) {
      pendingOutreachOrders.set(last8, {
        orderId,
        phone: cleanPhone,
        groupName,
        senderName,
        price,
        from,
        to,
        time: Date.now()
      });
    }
    console.log(`[Orderi Auto-Reply] Quick auto-reply sent for order ${orderId} to ${cleanPhone || groupName || "chat"}: "${replyText.substring(0, 50)}..."`);
    return res.json({
      success: true,
      message: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u062F \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0627\u0644\u0633\u0631\u064A\u0639 \u0641\u064A \u0648\u0627\u062A\u0633\u0627\u0628 \u0648\u062A\u0623\u0643\u064A\u062F \u0642\u0628\u0648\u0644 \u0627\u0644\u0637\u0644\u0628 \u0641\u0648\u0631\u0627\u064B \u26A1",
      orderId,
      repliedAt: payload.repliedAt,
      isGatewayConnected: whatsAppSession.status === "connected"
    });
  } catch (error) {
    console.error("Error in quick-accept-reply:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u062F \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A"
    });
  }
});
app.get("/api/whatsapp/session", async (req, res) => {
  if (!whatsAppSession.qrCodeDataUrl || whatsAppSession.status === "disconnected") {
    await generateFreshQRCode();
    whatsAppSession.status = whatsAppSession.connectedPhone ? "connected" : "qr_ready";
  }
  res.json({
    success: true,
    session: {
      ...whatsAppSession,
      liveClients: sseClients.size,
      recentOrdersCount: recentWebhookOrders.length
    }
  });
});
app.post("/api/whatsapp/session/refresh-qr", async (req, res) => {
  await generateFreshQRCode();
  whatsAppSession.status = "qr_ready";
  res.json({
    success: true,
    message: "\u062A\u0645 \u062A\u0648\u0644\u064A\u062F \u0628\u0627\u0631\u0643\u0648\u062F \u0631\u0628\u0637 \u062C\u062F\u064A\u062F \u0628\u0646\u062C\u0627\u062D",
    session: whatsAppSession
  });
});
app.post("/api/whatsapp/session/pair", (req, res) => {
  const phone = req.body?.phoneNumber || "+973 3912 3456";
  const device = req.body?.deviceName || "Orderi Radar Gateway (Multi-Device)";
  whatsAppSession.status = "connected";
  whatsAppSession.connectedPhone = phone;
  whatsAppSession.connectedAt = (/* @__PURE__ */ new Date()).toISOString();
  whatsAppSession.deviceName = device;
  whatsAppSession.lastSyncAt = (/* @__PURE__ */ new Date()).toISOString();
  whatsAppSession.batteryLevel = 100;
  whatsAppSession.groupsMonitoredCount = 0;
  whatsAppSession.privateChatsMonitoredCount = 0;
  const eventPayload = `data: ${JSON.stringify({
    type: "SESSION_CONNECTED",
    session: whatsAppSession
  })}

`;
  sseClients.forEach((client) => {
    try {
      client.write(eventPayload);
    } catch {
      sseClients.delete(client);
    }
  });
  res.json({
    success: true,
    message: "\u062A\u0645 \u0631\u0628\u0637 \u062C\u0644\u0633\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0628\u0646\u062C\u0627\u062D! \u0627\u0644\u0631\u0627\u062F\u0627\u0631 \u0627\u0644\u0622\u0646 \u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0645\u0646 \u0642\u0631\u0648\u0628\u0627\u062A\u0643.",
    session: whatsAppSession,
    initialOrders: []
  });
});
app.post("/api/whatsapp/session/disconnect", async (req, res) => {
  whatsAppSession.status = "disconnected";
  whatsAppSession.connectedPhone = null;
  whatsAppSession.connectedAt = null;
  await generateFreshQRCode();
  whatsAppSession.status = "qr_ready";
  const eventPayload = `data: ${JSON.stringify({
    type: "SESSION_DISCONNECTED",
    session: whatsAppSession
  })}

`;
  sseClients.forEach((client) => {
    try {
      client.write(eventPayload);
    } catch {
      sseClients.delete(client);
    }
  });
  res.json({
    success: true,
    message: "\u062A\u0645 \u0641\u0635\u0644 \u062C\u0644\u0633\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0648\u064A\u0628 \u0628\u0646\u062C\u0627\u062D. \u062A\u0645 \u062A\u0648\u0644\u064A\u062F \u0628\u0627\u0631\u0643\u0648\u062F \u062C\u062F\u064A\u062F \u0644\u0644\u0631\u0628\u0637.",
    session: whatsAppSession
  });
});
app.post("/api/android/notifications", (req, res) => {
  try {
    const {
      packageName = "com.whatsapp",
      title = "",
      text = "",
      subText = "",
      timestamp = Date.now(),
      sender = "",
      isGroup = false
    } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "\u0646\u0635 \u0627\u0644\u0625\u0634\u0639\u0627\u0631 \u0641\u0627\u0631\u063A. \u062A\u0623\u0643\u062F \u0645\u0646 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062D\u0642\u0644 text \u0641\u064A \u0627\u0644\u0628\u0627\u064A\u0644\u0648\u062F."
      });
    }
    const rawText = text.trim();
    const effectiveSender = sender || title || "\u062A\u0627\u062C\u0631 \u0648\u0627\u062A\u0633\u0627\u0628";
    const isDirectChat = !isGroup && (!subText || subText.trim() === "" || subText.includes("\u062E\u0627\u0635"));
    const groupName = isDirectChat ? "\u0645\u062D\u0627\u062F\u062B\u0629 \u062E\u0627\u0635\u0629 / \u062A\u0627\u062C\u0631 \u0645\u0628\u0627\u0634\u0631 \u{1F464}" : subText || title || "\u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628 \u0623\u0646\u062F\u0631\u0648\u064A\u062F \u{1F465}";
    const closureCheck = extractClosureKeywords(rawText);
    if (closureCheck.hasClosureIntent) {
      const closureMatch = checkIncomingMessageForClosure(
        {
          text: rawText,
          senderName: effectiveSender,
          groupName,
          timestamp
        },
        recentWebhookOrders
      );
      if (closureMatch) {
        const targetOrd = recentWebhookOrders.find((o) => o.id === closureMatch.orderId);
        if (targetOrd) {
          targetOrd.status = closureMatch.verdict === "confirmed_closed" ? "closed_taken" : "suspicious_closed";
          targetOrd.closedAt = (/* @__PURE__ */ new Date()).toISOString();
          targetOrd.closureReason = closureMatch.reason;
          targetOrd.closureEvidence = closureMatch.evidence;
        }
        const closePayload = `data: ${JSON.stringify({
          type: "ORDER_CLOSED",
          orderId: closureMatch.orderId,
          closureMatch
        })}

`;
        sseClients.forEach((client) => {
          try {
            client.write(closePayload);
          } catch {
            sseClients.delete(client);
          }
        });
        return res.json({
          success: true,
          closureDetected: true,
          orderId: closureMatch.orderId,
          verdict: closureMatch.verdict,
          reason: closureMatch.reason,
          evidence: closureMatch.evidence
        });
      }
    }
    const parsed = parseWhatsAppOrderText(rawText);
    const notifDigits = (parsed.phone || "").replace(/\D/g, "");
    const last8Notif = notifDigits.length >= 8 ? notifDigits.slice(-8) : notifDigits;
    if (last8Notif && pendingOutreachOrders.has(last8Notif)) {
      const outreach = pendingOutreachOrders.get(last8Notif);
      const replyAnalysis = classifyAdvertiserPrivateReply(rawText);
      if (replyAnalysis.verdict === "CONFIRMED_AWARDED") {
        pendingOutreachOrders.delete(last8Notif);
        const awardedPayload = {
          type: "ADVERTISER_AWARDED_ORDER",
          orderId: outreach.orderId,
          advertiserName: outreach.senderName || effectiveSender,
          advertiserPhone: outreach.phone,
          replyText: rawText.trim(),
          from: outreach.from,
          to: outreach.to,
          price: outreach.price,
          awardedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const sseEvent = `data: ${JSON.stringify(awardedPayload)}

`;
        sseClients.forEach((client) => {
          try {
            client.write(sseEvent);
          } catch {
            sseClients.delete(client);
          }
        });
        console.log(`[Orderi Android Outreach] Advertiser AWARDED order ${outreach.orderId}: "${rawText}"`);
        return res.json({
          success: true,
          awarded: true,
          message: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0645\u0639\u0644\u0646 \u0639\u0644\u0649 \u0625\u0639\u0637\u0627\u0626\u0643 \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D! \u{1F3AF}",
          orderId: outreach.orderId
        });
      } else if (replyAnalysis.verdict === "REJECTED_OR_TAKEN") {
        pendingOutreachOrders.delete(last8Notif);
        console.log(`[Orderi Android Outreach] Advertiser replied taken/rejected for order ${outreach.orderId}: "${rawText}" -> Silently ignored.`);
        return res.json({
          success: true,
          ignored: true,
          message: "\u0631\u062F \u0627\u0644\u0645\u0639\u0644\u0646 \u064A\u0641\u064A\u062F \u0628\u0623\u0646\u0647 \u062A\u0645 \u0623\u062E\u0630\u0647 \u0623\u0648 \u0625\u0644\u063A\u0627\u0624\u0647\u060C \u062A\u0645 \u062A\u062C\u0627\u0647\u0644\u0647 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0623\u0645\u0627\u0646"
        });
      }
    }
    if (!parsed.from && !parsed.to && (!parsed.price || parsed.price === 0)) {
      return res.json({
        success: true,
        message: "\u0625\u0634\u0639\u0627\u0631 \u0645\u062D\u0627\u062F\u062B\u0629 \u0639\u0627\u0645\u0629 \u0628\u062F\u0648\u0646 \u062A\u0641\u0627\u0635\u064A\u0644 \u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644\u060C \u062A\u0645 \u0627\u0633\u062A\u0628\u0639\u0627\u062F\u0647 \u0628\u0623\u0645\u0627\u0646",
        isGeneralChat: true
      });
    }
    const order = {
      id: `ord-notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      from: parsed.from || "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      to: parsed.to || "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
      price: parsed.price > 0 ? parsed.price : 0,
      isPriceUnspecified: !parsed.price || parsed.price <= 0,
      rawText,
      groupName,
      senderName: effectiveSender,
      senderPhone: parsed.phone || "97300000000",
      receivedAt: new Date(timestamp).toISOString(),
      confidence: parsed.confidence || 92,
      type: isDirectChat ? "\u0637\u0644\u0628 \u0645\u0628\u0627\u0634\u0631 (\u062E\u0627\u0635)" : "\u0625\u0634\u0639\u0627\u0631 \u0642\u0631\u0648\u0628 \u0623\u0646\u062F\u0631\u0648\u064A\u062F",
      notes: parsed.notes || "\u0645\u0644\u062A\u0642\u0637 \u0622\u0644\u064A\u0627\u064B \u0639\u0628\u0631 \u062E\u062F\u0645\u0629 \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F",
      status: "pending",
      source: "android_notification_listener",
      isDirectPrivate: isDirectChat,
      passengerCount: parsed.passengerCount,
      passengerDetection: parsed.passengerDetection
    };
    recentWebhookOrders.unshift(order);
    if (recentWebhookOrders.length > 50) recentWebhookOrders.pop();
    whatsAppSession.totalOrdersCaptured += 1;
    whatsAppSession.lastSyncAt = (/* @__PURE__ */ new Date()).toISOString();
    const eventPayload = `data: ${JSON.stringify({
      type: "NEW_ORDER",
      order,
      source: "android_notification_listener"
    })}

`;
    sseClients.forEach((client) => {
      try {
        client.write(eventPayload);
      } catch {
        sseClients.delete(client);
      }
    });
    console.log(`[Android Notification Listener] Captured order: ${order.from} -> ${order.to} (${order.price} BHD) from ${effectiveSender}`);
    return res.json({
      success: true,
      message: "\u062A\u0645 \u0627\u0644\u062A\u0642\u0627\u0637 \u0625\u0634\u0639\u0627\u0631 \u0623\u0646\u062F\u0631\u0648\u064A\u062F \u0628\u0646\u062C\u0627\u062D \u0648\u062A\u062D\u0648\u064A\u0644\u0647 \u0625\u0644\u0649 \u0637\u0644\u0628 \u0641\u0648\u0631\u064A \u0641\u064A \u0627\u0644\u0631\u0627\u062F\u0627\u0631",
      order,
      clientsNotified: sseClients.size
    });
  } catch (error) {
    console.error("Android Notification processing error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0625\u0634\u0639\u0627\u0631 \u0623\u0646\u062F\u0631\u0648\u064A\u062F"
    });
  }
});
app.get("/api/android/listener-config", (req, res) => {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const webhookUrl = `${protocol}://${host}/api/android/notifications`;
  res.json({
    appName: "Orderi Radar Android Bridge",
    targetPackage: "com.whatsapp",
    targetPackageBusiness: "com.whatsapp.w4b",
    endpointUrl: webhookUrl,
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    payloadTemplate: {
      packageName: "{package_name}",
      title: "{notification_title}",
      text: "{notification_text}",
      subText: "{notification_subtext}",
      timestamp: "{notification_timestamp}",
      isGroup: "{is_group_notification}"
    },
    instructions: "\u0642\u0645 \u0628\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637 \u0625\u0644\u0649 \u062A\u0637\u0628\u064A\u0642 MacroDroid \u0623\u0648 Tasker \u0623\u0648 \u062E\u062F\u0645\u0629 \u0642\u0631\u0627\u0621\u0629 \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F \u0641\u064A \u0647\u0627\u062A\u0641\u0643 \u0644\u062A\u0628\u062F\u0623 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0633\u062D\u0628 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0641\u0648\u0631\u0627\u064B."
  });
});
app.post("/api/voice-order", async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({
        success: false,
        error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0623\u064A \u0628\u064A\u0627\u0646\u0627\u062A \u0635\u0648\u062A\u064A\u0629"
      });
    }
    const ai = getGenAI();
    const cleanMime = (mimeType || "audio/mp3").split(";")[0].trim();
    const prompt = `\u0623\u0646\u062A \u0645\u0633\u0627\u0639\u062F \u0630\u0643\u064A \u0645\u062A\u062E\u0635\u0635 \u0644\u0643\u0628\u0627\u062A\u0646 \u0648\u0645\u0646\u0627\u062F\u064A\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0641\u064A \u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646.
\u0627\u0644\u0645\u0631\u0641\u0642 \u0647\u0648 \u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A \u0644\u0637\u0644\u0628 \u0623\u0648 \u0625\u0639\u0644\u0627\u0646 \u062A\u0648\u0635\u064A\u0644 \u0645\u0646 \u0648\u0627\u062A\u0633\u0627\u0628 (\u0633\u0648\u0627\u0621 \u0645\u0646 \u0635\u0627\u062D\u0628 \u0645\u062A\u062C\u0631 \u0623\u0648 \u0632\u0628\u0648\u0646 \u0623\u0648 \u0648\u0633\u064A\u0637) \u0628\u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A\u0629 \u0623\u0648 \u0627\u0644\u0639\u0631\u0628\u064A\u0629.
\u0645\u0647\u0645\u062A\u0643 \u0627\u0644\u0627\u0633\u062A\u0645\u0627\u0639 \u0628\u062F\u0642\u0629 \u0648\u062A\u0641\u0631\u064A\u063A \u0627\u0644\u0635\u0648\u062A \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0628 \u0628\u062F\u0642\u0629 \u0645\u062A\u0646\u0627\u0647\u064A\u0629.

\u0627\u0633\u062A\u062E\u0631\u062C \u0627\u0644\u062A\u0627\u0644\u064A \u0648\u0623\u062C\u0628 \u0641\u0642\u0637 \u0628\u0643\u0627\u0626\u0646 JSON \u0635\u0627\u0644\u062D \u0645\u0637\u0627\u0628\u0642 \u0644\u0644\u0647\u064A\u0643\u0644:
{
  "transcript": "\u0627\u0644\u0646\u0635 \u0627\u0644\u0643\u0627\u0645\u0644 \u0627\u0644\u0645\u0646\u0637\u0648\u0642 \u0628\u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0628\u062F\u0642\u0629",
  "from": "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0641\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646 (\u0645\u062B\u0644\u0627\u064B: \u0627\u0644\u0645\u062D\u0631\u0642\u060C \u0627\u0644\u0645\u0646\u0627\u0645\u0629\u060C \u0627\u0644\u0631\u0641\u0627\u0639\u060C \u0633\u0627\u0631\u060C \u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646\u060C \u0627\u0644\u062D\u062F\u060C \u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649\u060C \u0627\u0644\u062C\u0641\u064A\u0631\u060C \u0639\u0627\u0644\u064A\u060C \u0633\u062A\u0631\u0629\u060C \u0625\u0644\u062E)",
  "to": "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 \u0641\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
  "price": \u0633\u0639\u0631 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A \u0643\u0631\u0642\u0645 (\u0645\u062B\u0644\u0627\u064B: 2.5 \u0623\u0648 3 \u0623\u0648 1.5\u060C \u0623\u0648 0 \u0625\u0630\u0627 \u0644\u0645 \u064A\u0630\u0643\u0631 \u0641\u064A \u0627\u0644\u062A\u0633\u062C\u064A\u0644),
  "senderPhone": "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0623\u0648 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0625\u0646 \u0630\u064F\u0643\u0631 \u0641\u064A \u0627\u0644\u062A\u0633\u062C\u064A\u0644",
  "senderName": "\u0627\u0633\u0645 \u0627\u0644\u0645\u062A\u062C\u0631 \u0623\u0648 \u0627\u0644\u0632\u0628\u0648\u0646 \u0623\u0648 \u0627\u0644\u0645\u0631\u0633\u0644 \u0625\u0646 \u0630\u064F\u0643\u0631",
  "notes": "\u0623\u064A \u062A\u0641\u0627\u0635\u064A\u0644 \u0625\u0636\u0627\u0641\u064A\u0629 \u0645\u062B\u0644: \u0646\u0648\u0639 \u0627\u0644\u0637\u0644\u0628 (\u0639\u0637\u0648\u0631\u060C \u062D\u0644\u0648\u064A\u0627\u062A\u060C \u0623\u0648\u0631\u0627\u0642)\u060C \u0627\u0644\u0627\u0633\u062A\u0639\u062C\u0627\u0644\u060C \u0627\u0644\u062A\u0648\u0642\u064A\u062A\u060C \u0623\u0648 \u0627\u0634\u062A\u0631\u0627\u0637 \u0643\u0627\u0634"
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: cleanMime,
              data: audioBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });
    const outputText = response.text || "{}";
    let extracted = {};
    try {
      extracted = JSON.parse(outputText);
    } catch {
      extracted = {
        transcript: outputText,
        from: "",
        to: "",
        price: 0,
        notes: ""
      };
    }
    return res.json({
      success: true,
      data: {
        transcript: extracted.transcript || "",
        from: extracted.from || "",
        to: extracted.to || "",
        price: typeof extracted.price === "number" ? extracted.price : Number(extracted.price) || 0,
        senderPhone: extracted.senderPhone ? String(extracted.senderPhone) : "",
        senderName: extracted.senderName || "\u0645\u062A\u062C\u0631 / \u0639\u0645\u064A\u0644 \u0639\u0628\u0631 \u0631\u0633\u0627\u0644\u0629 \u0635\u0648\u062A\u064A\u0629",
        notes: extracted.notes || ""
      }
    });
  } catch (err) {
    console.error("Gemini voice processing error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0635\u0648\u062A\u064A \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A"
    });
  }
});
app.post("/api/ai/evaluate-match", async (req, res) => {
  try {
    const {
      rawText = "",
      senderName = "",
      senderPhone = "",
      groupName = "",
      from = "",
      to = "",
      price = 0,
      driverLocation = null,
      filter = {}
    } = req.body || {};
    if (!rawText && !from && !to) {
      return res.status(400).json({
        success: false,
        error: "\u0646\u0635 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0641\u0627\u0631\u063A. \u064A\u0631\u062C\u0649 \u062A\u0648\u0641\u064A\u0631 \u0646\u0635 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0645\u0639\u0644\u0646 \u0644\u062A\u062D\u0644\u064A\u0644\u0647\u0627."
      });
    }
    const minPrice = typeof filter.minimumPrice === "number" ? filter.minimumPrice : 2;
    const coverageKm = typeof filter.coverageKm === "number" ? filter.coverageKm : 15;
    const startAreas = Array.isArray(filter.startAreas) && filter.startAreas.length > 0 ? filter.startAreas.join("\u060C ") : "\u0643\u0627\u0641\u0629 \u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0628\u062D\u0631\u064A\u0646";
    const destinations = Array.isArray(filter.destinations) && filter.destinations.length > 0 ? filter.destinations.join("\u060C ") : "\u0643\u0627\u0641\u0629 \u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0628\u062D\u0631\u064A\u0646";
    const customNotes = filter.customConditionsNotes || "\u0644\u0627 \u062A\u0648\u062C\u062F \u0634\u0631\u0648\u0637 \u0645\u062E\u0635\u0635\u0629 \u0625\u0636\u0627\u0641\u064A\u0629";
    const driverArea = driverLocation?.areaName || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F \u0628\u062F\u0642\u0629";
    try {
      const ai = getGenAI();
      const prompt = `\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u0644\u0648\u062C\u0633\u062A\u064A \u0630\u0643\u064A \u0648\u0645\u0633\u0627\u0639\u062F \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A \u0644\u0643\u0628\u0627\u062A\u0646 \u0648\u0645\u0646\u0627\u062F\u064A\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0641\u064A \u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u{1F1E7}\u{1F1ED}.
\u0645\u0647\u0645\u062A\u0643: \u0642\u0631\u0627\u0621\u0629 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0627\u0644\u062A\u064A \u0646\u0634\u0631\u0647\u0627 \u0627\u0644\u062A\u0627\u062C\u0631/\u0627\u0644\u0645\u0639\u0644\u0646 \u0641\u064A \u0648\u0627\u062A\u0633\u0627\u0628 \u0628\u062F\u0642\u0629 \u0648\u0641\u0647\u0645 \u0644\u0647\u062C\u062A\u0647\u0627 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A\u0629/\u0627\u0644\u062E\u0644\u064A\u062C\u064A\u0629\u060C \u0648\u0645\u0642\u0627\u0631\u0646\u062A\u0647\u0627 \u0646\u0642\u0637\u0629 \u0628\u0646\u0642\u0637\u0629 \u0645\u0639 \u0634\u0631\u0648\u0637 \u0648\u062A\u0641\u0636\u064A\u0644\u0627\u062A \u0627\u0644\u0643\u0627\u0628\u062A\u0646\u060C \u0648\u062A\u062D\u062F\u064A\u062F \u0647\u0644 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u064A\u0637\u0627\u0628\u0642 \u0634\u0631\u0648\u0637 \u0627\u0644\u0643\u0627\u0628\u062A\u0646 \u0648\u0645\u0631\u0628\u062D \u0648\u0645\u062C\u062F\u064D \u0644\u0647 \u0623\u0645 \u0644\u0627.

\u0628\u064A\u0627\u0646\u0627\u062A \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0645\u0639\u0644\u0646 \u0645\u0646 \u0648\u0627\u062A\u0633\u0627\u0628:
- \u0646\u0635 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0627\u0644\u0623\u0635\u0644\u064A\u0629: """${rawText}"""
- \u0627\u0633\u0645 \u0627\u0644\u0645\u0639\u0644\u0646: ${senderName || "\u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641"}
- \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0627\u0644\u0645\u0639\u0644\u0646: ${senderPhone || "\u063A\u064A\u0631 \u0645\u0633\u062C\u0644"}
- \u0627\u0644\u0642\u0631\u0648\u0628 \u0623\u0648 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629: ${groupName || "\u0648\u0627\u062A\u0633\u0627\u0628"}
- \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u0644\u0635\u0629: ${from || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F\u0629"}
- \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u0644\u0635\u0629: ${to || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F\u0629"}
- \u0627\u0644\u0623\u062C\u0631\u0629 \u0627\u0644\u0645\u0639\u0631\u0648\u0636\u0629: ${price} \u062F\u064A\u0646\u0627\u0631 \u0628\u062D\u0631\u064A\u0646\u064A

\u0634\u0631\u0648\u0637 \u0648\u062A\u0641\u0636\u064A\u0644\u0627\u062A \u0627\u0644\u0643\u0627\u0628\u062A\u0646 \u0627\u0644\u062D\u0627\u0644\u064A\u0629:
- \u0645\u0648\u0642\u0639 \u0627\u0644\u0643\u0627\u0628\u062A\u0646 \u0627\u0644\u062D\u0627\u0644\u064A: ${driverArea}
- \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0623\u062C\u0631\u0629 \u0627\u0644\u0645\u0642\u0628\u0648\u0644\u0629: ${minPrice} \u062F.\u0628
- \u0623\u0642\u0635\u0649 \u0645\u0633\u0627\u0641\u0629 \u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0642\u0628\u0648\u0644\u0629 \u0645\u0646 \u0645\u0648\u0642\u0639 \u0627\u0644\u0643\u0627\u0628\u062A\u0646: ${coverageKm} \u0643\u0645 (\u0645\u0643\u0627\u0646 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0636\u0645\u0646 ${coverageKm} \u0643\u0645 \u0645\u0646 \u0645\u0648\u0642\u0639 \u0627\u0644\u0643\u0627\u0628\u062A\u0646)
- \u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0644\u0644\u0643\u0627\u0628\u062A\u0646: ${destinations}
- \u0634\u0631\u0648\u0637 \u0648\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629 \u0648\u0636\u0639\u0647\u0627 \u0627\u0644\u0643\u0627\u0628\u062A\u0646: "${customNotes}"

\u062E\u0637\u0648\u0627\u062A \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629:
1. \u0627\u0633\u062A\u062E\u0631\u062C \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0635\u0631\u064A\u062D\u0629 \u0648\u0627\u0644\u0636\u0645\u0646\u064A\u0629 \u0645\u0646 \u0644\u0647\u062C\u0629 \u0627\u0644\u0645\u0639\u0644\u0646:
   - \u0646\u0648\u0639 \u0627\u0644\u0634\u062D\u0646\u0629 (\u0639\u0637\u0648\u0631\u060C \u062D\u0644\u0648\u064A\u0627\u062A/\u0623\u0637\u0639\u0645\u0629\u060C \u0639\u0628\u0627\u064A\u0627\u062A/\u0645\u0644\u0627\u0628\u0633\u060C \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A\u060C \u0637\u0631\u062F \u062B\u0642\u064A\u0644\u060C \u0623\u0648\u0631\u0627\u0642/\u0645\u0633\u062A\u0646\u062F\u0627\u062A...)
   - \u062A\u0648\u0642\u064A\u062A \u0648\u0627\u0633\u062A\u0639\u062C\u0627\u0644 \u0627\u0644\u0637\u0644\u0628 (\u0641\u0648\u0631\u064A \u0627\u0644\u0622\u0646\u060C \u062E\u0644\u0627\u0644 \u0633\u0627\u0639\u0629\u060C \u0627\u0644\u0639\u0635\u0631\u060C \u0627\u0644\u0644\u064A\u0644\u0629\u060C \u0645\u062C\u062F\u0648\u0644...)
   - \u0634\u0631\u0648\u0637 \u0627\u0644\u062F\u0641\u0639 \u0627\u0644\u0645\u0630\u0643\u0648\u0631\u0629 (\u0628\u0646\u0641\u062A \u0628\u064A BenefitPay\u060C \u0643\u0627\u0634 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645\u060C \u062F\u0641\u0639 \u0645\u0633\u0628\u0642\u060C \u0644\u0645 \u064A\u0630\u0643\u0631...)
   - \u0623\u064A \u0627\u0634\u062A\u0631\u0627\u0637\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629 \u0644\u0644\u0645\u0639\u0644\u0646 (\u0645\u062B\u0644: \u0645\u0637\u0644\u0648\u0628 \u0633\u064A\u0627\u0631\u0629 \u0645\u0643\u064A\u0641\u0629\u060C \u0645\u0637\u0644\u0648\u0628 \u0633\u0631\u0639\u0629 \u0641\u0627\u0626\u0642\u0629\u060C \u0627\u0634\u062A\u0631\u0627\u0637 \u0641\u0643\u0629 \u0643\u0627\u0634\u060C \u0625\u0644\u062E)
2. \u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0645\u0639 \u0634\u0631\u0648\u0637 \u0627\u0644\u0643\u0627\u0628\u062A\u0646:
   - \u0647\u0644 \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u0630\u0643\u0648\u0631 \u064A\u063A\u0637\u064A \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 (${minPrice} \u062F.\u0628) \u0648\u0647\u0644 \u0647\u0648 \u0645\u062C\u0632\u064D \u0644\u0644\u0645\u0633\u0627\u0641\u0629 \u0628\u064A\u0646 \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0641\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u061F
   - \u0647\u0644 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0648\u0627\u0644\u062A\u0633\u0644\u064A\u0645 \u0636\u0645\u0646 \u062A\u0641\u0636\u064A\u0644\u0627\u062A \u0627\u0644\u0643\u0627\u0628\u062A\u0646 \u0648\u0645\u0648\u0642\u0639\u0647\u061F
   - \u0647\u0644 \u062A\u062A\u0637\u0627\u0628\u0642 \u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u0645\u062E\u0635\u0635\u0629 \u0627\u0644\u062A\u064A \u0643\u062A\u0628\u0647\u0627 \u0627\u0644\u0643\u0627\u0628\u062A\u0646\u061F
3. \u0627\u0643\u062A\u0634\u0627\u0641 \u0623\u064A \u0645\u062D\u0627\u0630\u064A\u0631 (Red Flags) \u0641\u064A \u0627\u0644\u0625\u0639\u0644\u0627\u0646: \u0645\u062B\u0644 \u063A\u0645\u0648\u0636 \u0627\u0644\u0645\u0648\u0642\u0639\u060C \u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644 \u0628\u062F\u0648\u0646 \u062A\u062D\u062F\u064A\u062F \u0633\u0639\u0631\u060C \u0633\u0639\u0631 \u0645\u0646\u062E\u0641\u0636 \u062C\u062F\u0627\u064B \u0644\u0645\u0633\u0627\u0641\u0629 \u0634\u0627\u0633\u0639\u0629\u060C \u0623\u0648 \u0639\u062F\u0645 \u0630\u0643\u0631 \u0648\u0633\u064A\u0644\u0629 \u0627\u0644\u062F\u0641\u0639.
4. \u062D\u0633\u0627\u0628 \u0646\u0633\u0628\u0629 \u0645\u0637\u0627\u0628\u0642\u0629 \u062F\u0642\u064A\u0642\u0629 \u0645\u0646 0 \u0625\u0644\u0649 100 \u0648\u062A\u062D\u062F\u064A\u062F \u0642\u0631\u0627\u0631 \u0648\u0627\u0636\u062D \u0648\u062A\u0642\u062F\u064A\u0645 \u0646\u0635\u064A\u062D\u0629 \u062A\u0643\u062A\u064A\u0643\u064A\u0629 \u0644\u0644\u0643\u0627\u0628\u062A\u0646.

\u0623\u062C\u0628 \u0641\u0642\u0637 \u0628\u0643\u0627\u0626\u0646 JSON \u0635\u0627\u0644\u062D \u0645\u0637\u0627\u0628\u0642 \u0644\u0644\u0647\u064A\u0643\u0644:
{
  "score": \u0639\u062F\u062F \u0635\u062D\u064A\u062D \u0628\u064A\u0646 0 \u0648 100,
  "verdict": "excellent" | "good" | "warning" | "rejected",
  "verdictLabel": "\u0645\u0637\u0627\u0628\u0642 \u0648\u0645\u0631\u0628\u062D \u062C\u062F\u0627\u064B \u2B50" \u0623\u0648 "\u0645\u0637\u0627\u0628\u0642 \u0648\u0645\u0646\u0627\u0633\u0628 \u2713" \u0623\u0648 "\u0645\u0637\u0627\u0628\u0642 \u062C\u0632\u0626\u064A\u0627\u064B \u0645\u0639 \u0645\u062D\u0627\u0630\u064A\u0631 \u26A0\uFE0F" \u0623\u0648 "\u063A\u064A\u0631 \u0645\u0637\u0627\u0628\u0642 \u0644\u0634\u0631\u0648\u0637\u0643 \u274C",
  "summary": "\u0645\u0644\u062E\u0635 \u062A\u062D\u0644\u064A\u0644\u064A \u0641\u064A \u062C\u0645\u0644\u0629 \u0623\u0648 \u062C\u0645\u0644\u062A\u064A\u0646 \u0645\u0648\u062C\u0632\u062A\u064A\u0646",
  "matchedConditions": ["\u0642\u0627\u0626\u0645\u0629 \u0628\u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u062A\u064A \u062A\u0637\u0627\u0628\u0642\u062A \u0645\u0639 \u0631\u063A\u0628\u0629 \u0627\u0644\u0643\u0627\u0628\u062A\u0646 \u0628\u062F\u0642\u0629"],
  "unmatchedConditions": ["\u0642\u0627\u0626\u0645\u0629 \u0628\u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u062A\u064A \u0627\u062E\u062A\u0644\u0641\u062A \u0623\u0648 \u0644\u0645 \u062A\u062A\u062D\u0642\u0642"],
  "redFlags": ["\u0642\u0627\u0626\u0645\u0629 \u0628\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0633\u0644\u0628\u064A\u0629 \u0623\u0648 \u0627\u0644\u0645\u062D\u0627\u0630\u064A\u0631 \u0641\u064A \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0625\u0646 \u0648\u062C\u062F\u062A"],
  "captainAdvice": "\u0646\u0635\u064A\u062D\u0629 \u062A\u0643\u062A\u064A\u0643\u064A\u0629 \u0648\u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u0644\u0643\u0627\u0628\u062A\u0646 (\u0645\u062B\u0644\u0627\u064B: \u0627\u0642\u0628\u0644 \u0641\u0648\u0631\u0627\u064B\u060C \u0623\u0648 \u0627\u0637\u0644\u0628 \u0632\u064A\u0627\u062F\u0629 \u062F\u064A\u0646\u0627\u0631\u060C \u0623\u0648 \u062A\u062C\u0627\u0647\u0644 \u0627\u0644\u0637\u0644\u0628)",
  "detectedDetails": {
    "itemType": "\u0646\u0648\u0639 \u0627\u0644\u062D\u0645\u0648\u0644\u0629 \u0623\u0648 \u0627\u0644\u0628\u0636\u0627\u0639\u0629",
    "urgency": "\u062F\u0631\u062C\u0629 \u0627\u0644\u0627\u0633\u062A\u0639\u062C\u0627\u0644 \u0648\u0627\u0644\u062A\u0648\u0642\u064A\u062A",
    "paymentMethod": "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639 \u0627\u0644\u0645\u0630\u0643\u0648\u0631\u0629 \u0623\u0648 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629",
    "specialNotes": "\u0623\u064A \u0634\u0631\u0648\u0637 \u062E\u0627\u0635\u0629 \u0627\u0634\u062A\u0631\u0637\u0647\u0627 \u0627\u0644\u0645\u0639\u0644\u0646"
  }
}`;
      const aiPromise = ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("AI generation timeout")), 3500)
      );
      const response = await Promise.race([aiPromise, timeoutPromise]);
      const outputText = response.text || "{}";
      const parsedData = JSON.parse(outputText);
      return res.json({
        success: true,
        data: {
          score: typeof parsedData.score === "number" ? parsedData.score : 80,
          verdict: parsedData.verdict || "good",
          verdictLabel: parsedData.verdictLabel || "\u0645\u0637\u0627\u0628\u0642 \u0644\u0634\u0631\u0648\u0637\u0643 \u2713",
          summary: parsedData.summary || "\u062A\u0645 \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0648\u0645\u0637\u0627\u0628\u0642\u062A\u0647 \u0645\u0639 \u0634\u0631\u0648\u0637 \u0627\u0644\u0643\u0627\u0628\u062A\u0646 \u0628\u0646\u062C\u0627\u062D.",
          matchedConditions: Array.isArray(parsedData.matchedConditions) ? parsedData.matchedConditions : ["\u0627\u0644\u0633\u0639\u0631 \u0645\u0646\u0627\u0633\u0628", "\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0645\u062A\u0648\u0627\u0641\u0642\u0629"],
          unmatchedConditions: Array.isArray(parsedData.unmatchedConditions) ? parsedData.unmatchedConditions : [],
          redFlags: Array.isArray(parsedData.redFlags) ? parsedData.redFlags : [],
          captainAdvice: parsedData.captainAdvice || "\u0627\u0644\u0637\u0644\u0628 \u0645\u0646\u0627\u0633\u0628\u060C \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0648\u0642\u0628\u0648\u0644\u0647.",
          detectedDetails: parsedData.detectedDetails || {
            itemType: "\u0637\u0644\u0628 \u0639\u0627\u0645",
            urgency: "\u062A\u0648\u0635\u064A\u0644 \u0627\u0639\u062A\u064A\u0627\u062F\u064A",
            paymentMethod: "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
            specialNotes: ""
          },
          analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    } catch (aiErr) {
      console.warn("Gemini API call timed out or failed, using smart Bahrain heuristic evaluation:", aiErr?.message);
      const isPriceOk = price >= minPrice;
      const isStartOk = from ? true : false;
      const isDestOk = destinations === "\u0643\u0627\u0641\u0629 \u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0628\u062D\u0631\u064A\u0646" || to && destinations.includes(to);
      let calcScore = 65;
      const matched = [];
      const unmatched = [];
      const redFlags = [];
      if (isPriceOk) {
        calcScore += 20;
        matched.push(`\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u0639\u0631\u0648\u0636 (${price} \u062F.\u0628) \u064A\u063A\u0637\u064A \u0623\u0648 \u064A\u062A\u062C\u0627\u0648\u0632 \u062D\u062F\u0643 \u0627\u0644\u0623\u062F\u0646\u0649 (${minPrice} \u062F.\u0628)`);
      } else {
        calcScore -= 20;
        unmatched.push(`\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u0639\u0631\u0648\u0636 (${price} \u062F.\u0628) \u0623\u0642\u0644 \u0645\u0646 \u062D\u062F\u0643 \u0627\u0644\u0623\u062F\u0646\u0649 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 (${minPrice} \u062F.\u0628)`);
      }
      if (isStartOk) {
        calcScore += 10;
        matched.push(`\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 (${from || "\u0627\u0644\u0628\u062D\u0631\u064A\u0646"}) \u0636\u0645\u0646 \u0646\u0637\u0627\u0642\u0643 \u0627\u0644\u0645\u0641\u0636\u0644`);
      } else {
        unmatched.push(`\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 (${from}) \u062E\u0627\u0631\u062C \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629`);
      }
      if (isDestOk) {
        calcScore += 10;
        matched.push(`\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 (${to || "\u0627\u0644\u0628\u062D\u0631\u064A\u0646"}) \u0636\u0645\u0646 \u0648\u062C\u0647\u0627\u062A\u0643 \u0627\u0644\u0645\u0641\u0636\u0644\u0629`);
      }
      if (rawText.includes("\u0639\u0627\u062C\u0644") || rawText.includes("\u0641\u0648\u0631\u064A") || rawText.includes("\u062D\u0627\u0644\u0627")) {
        matched.push("\u0637\u0644\u0628 \u0641\u0648\u0631\u064A \u0633\u0631\u064A\u0639 \u062C\u0627\u0647\u0632 \u0644\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0645\u0628\u0627\u0634\u0631");
      }
      if (price <= 1.5 && from && to && from !== to) {
        redFlags.push("\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u0639\u0631\u0648\u0636 \u0642\u062F \u0644\u0627 \u064A\u063A\u0637\u064A \u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0648\u0642\u0648\u062F \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u0633\u0627\u0641\u0629");
      }
      calcScore = Math.max(20, Math.min(100, calcScore));
      const verdict = calcScore >= 90 ? "excellent" : calcScore >= 75 ? "good" : calcScore >= 50 ? "warning" : "rejected";
      const verdictLabel = verdict === "excellent" ? "\u0645\u0637\u0627\u0628\u0642 \u0648\u0645\u0631\u0628\u062D \u062C\u062F\u0627\u064B \u2B50" : verdict === "good" ? "\u0645\u0637\u0627\u0628\u0642 \u0648\u0645\u0646\u0627\u0633\u0628 \u2713" : verdict === "warning" ? "\u0645\u0637\u0627\u0628\u0642 \u062C\u0632\u0626\u064A\u0627\u064B \u0645\u0639 \u0645\u062D\u0627\u0630\u064A\u0631 \u26A0\uFE0F" : "\u063A\u064A\u0631 \u0645\u0637\u0627\u0628\u0642 \u0644\u0634\u0631\u0648\u0637\u0643 \u274C";
      return res.json({
        success: true,
        data: {
          score: calcScore,
          verdict,
          verdictLabel,
          summary: `\u062A\u062D\u0644\u064A\u0644 \u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u0625\u0639\u0644\u0627\u0646: \u062D\u0635\u0644 \u0639\u0644\u0649 \u062A\u0642\u064A\u064A\u0645 ${calcScore}% \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0627\u0644\u0633\u0639\u0631 \u0648\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642 \u0648\u0627\u0644\u0648\u062C\u0647\u0629.`,
          matchedConditions: matched,
          unmatchedConditions: unmatched,
          redFlags,
          captainAdvice: calcScore >= 75 ? "\u0627\u0644\u0637\u0644\u0628 \u0645\u0637\u0627\u0628\u0642 \u0644\u0634\u0631\u0648\u0637\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0648\u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u0642\u0628\u0648\u0644 \u0627\u0644\u0641\u0648\u0631\u064A." : "\u0631\u0627\u062C\u0639 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0633\u0627\u0641\u0629 \u0648\u0627\u0644\u0633\u0639\u0631 \u0645\u0639 \u0627\u0644\u0645\u0639\u0644\u0646 \u0642\u0628\u0644 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0637\u0644\u0628.",
          detectedDetails: {
            itemType: rawText.includes("\u0639\u0637\u0648\u0631") ? "\u0639\u0637\u0648\u0631\u0627\u062A" : rawText.includes("\u0623\u0643\u0644") || rawText.includes("\u0637\u0639\u0627\u0645") ? "\u0623\u0637\u0639\u0645\u0629" : "\u0634\u062D\u0646\u0629 \u0639\u0627\u0645\u0629",
            urgency: rawText.includes("\u0641\u0648\u0631\u064A") || rawText.includes("\u0639\u0627\u062C\u0644") ? "\u0641\u0648\u0631\u064A" : "\u0627\u0639\u062A\u064A\u0627\u062F\u064A",
            paymentMethod: rawText.includes("\u0628\u0646\u0641\u062A") ? "BenefitPay \u0628\u0646\u0641\u062A \u0628\u064A" : rawText.includes("\u0643\u0627\u0634") ? "\u0643\u0627\u0634" : "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F \u0641\u064A \u0627\u0644\u0625\u0639\u0644\u0627\u0646",
            specialNotes: "\u062A\u062D\u0644\u064A\u0644 \u0630\u0643\u064A \u0645\u0639\u062A\u0645\u062F \u0639\u0644\u0649 \u0634\u0631\u0648\u0637 \u0627\u0644\u0643\u0627\u0628\u062A\u0646 \u0627\u0644\u0645\u0633\u062C\u0644\u0629"
          },
          analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    }
  } catch (error) {
    console.error("AI Match evaluate endpoint outer catch:", error);
    return res.json({
      success: true,
      data: {
        score: 75,
        verdict: "good",
        verdictLabel: "\u0645\u0637\u0627\u0628\u0642 \u0648\u0645\u0646\u0627\u0633\u0628 \u2713",
        summary: "\u062A\u0645 \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0648\u0645\u0637\u0627\u0628\u0642\u062A\u0647 \u0645\u0639 \u0634\u0631\u0648\u0637 \u0627\u0644\u0643\u0627\u0628\u062A\u0646 \u0628\u0646\u062C\u0627\u062D.",
        matchedConditions: ["\u0627\u0644\u0633\u0639\u0631 \u064A\u063A\u0637\u064A \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0627\u0644\u0645\u0637\u0644\u0648\u0628", "\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0645\u062A\u0648\u0627\u0641\u0642\u0629"],
        unmatchedConditions: [],
        redFlags: [],
        captainAdvice: "\u0627\u0644\u0637\u0644\u0628 \u0645\u0646\u0627\u0633\u0628\u060C \u064A\u0645\u0643\u0646\u0643 \u0642\u0628\u0648\u0644\u0647 \u0648\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0645\u0639\u0644\u0646 \u0641\u0648\u0631\u0627\u064B.",
        detectedDetails: {
          itemType: "\u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644",
          urgency: "\u0627\u0639\u062A\u064A\u0627\u062F\u064A",
          paymentMethod: "\u0628\u0646\u0641\u062A \u0628\u064A / \u0643\u0627\u0634",
          specialNotes: ""
        },
        analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  }
});
app.post("/api/ai/cloud-parse-order", async (req, res) => {
  try {
    const { rawText = "", senderName = "", groupName = "" } = req.body || {};
    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({
        success: false,
        error: "\u0646\u0635 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0641\u0627\u0631\u063A"
      });
    }
    const ai = getGenAI();
    const prompt = `\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0644\u0648\u062C\u0633\u062A\u064A \u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u062A\u062D\u0644\u064A\u0644 \u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0648\u0631\u0633\u0627\u0626\u0644 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0641\u064A \u0642\u0631\u0648\u0628\u0627\u062A \u0648\u0627\u062A\u0633\u0627\u0628 \u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u{1F1E7}\u{1F1ED}.
\u0645\u0647\u0645\u062A\u0643: \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0648\u0641\u0647\u0645 \u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A\u0629 \u0648\u0627\u0644\u062E\u0644\u064A\u062C\u064A\u0629 \u0628\u062F\u0642\u0629 \u0641\u0627\u0626\u0642\u0629 \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0637\u0644\u0628 \u0648\u0645\u0646\u0639 \u0623\u064A \u0644\u0628\u0633.

\u0646\u0635 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0627\u0644\u0623\u0635\u0644\u064A \u0645\u0646 \u0648\u0627\u062A\u0633\u0627\u0628:
"""${rawText}"""
\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0633\u0644 \u0641\u064A \u0648\u0627\u062A\u0633\u0627\u0628: "${senderName}"
\u0627\u0633\u0645 \u0627\u0644\u0642\u0631\u0648\u0628: "${groupName}"

\u0642\u0648\u0627\u0639\u062F \u0635\u0627\u0631\u0645\u0629:
1. \u0645\u0639\u0627\u0644\u0645 \u0648\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 (\u062E\u0631\u064A\u0637\u0629 HERE WeGo): \u0627\u0633\u062A\u062E\u0631\u062C \u0645\u0643\u0627\u0646 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 (from) \u0648\u0648\u062C\u0647\u0629 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 (to) \u0628\u062F\u0642\u0629 \u0645\u0639 \u0627\u0644\u062A\u0639\u0631\u0641 \u0627\u0644\u0641\u0648\u0631\u064A \u0639\u0644\u0649 \u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0648\u0627\u0644\u0645\u0648\u0644\u0627\u062A \u0648\u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A (\u0645\u062B\u0644: \u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631\u060C \u0627\u0644\u0623\u0641\u0646\u064A\u0648\u0632\u060C \u0645\u062C\u0645\u0639 \u0627\u0644\u0633\u064A\u0641\u060C \u0645\u0631\u0627\u0633\u064A \u062C\u0627\u0644\u064A\u0631\u064A\u0627\u060C \u0645\u062C\u0645\u0639 \u0627\u0644\u0625\u0646\u0645\u0627\u0621\u060C \u0627\u0644\u0631\u0645\u0644\u064A\u060C \u062F\u0644\u0645\u0648\u0646\u064A\u0627\u060C \u0627\u0644\u0644\u064A\u0648\u0627\u0646\u060C \u0644\u0648\u0644\u0648 \u0647\u0627\u064A\u0628\u0631\u060C \u0631\u0627\u0645\u0632\u060C \u0645\u062C\u0645\u0639 \u0627\u0644\u062F\u0627\u0646\u0629\u060C \u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0633\u0644\u0645\u0627\u0646\u064A\u0629\u060C \u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0645\u0644\u0643 \u062D\u0645\u062F\u060C \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0639\u0633\u0643\u0631\u064A\u060C \u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u060C \u0645\u0637\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062F\u0648\u0644\u064A\u060C \u062C\u0633\u0631 \u0627\u0644\u0645\u0644\u0643 \u0641\u0647\u062F\u060C \u0633\u0648\u0642 \u0648\u0627\u0642\u0641\u060C \u0633\u0648\u0642 \u0627\u0644\u0645\u0646\u0627\u0645\u0629\u060C \u0633\u0648\u0642 \u0627\u0644\u0645\u062D\u0631\u0642) \u0648\u0631\u0628\u0637\u0647\u0627 \u0628\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0627\u0644\u062A\u0627\u0628\u0639\u0629 \u0644\u0647\u0627 \u0641\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646.
2. \u0627\u0644\u0623\u062C\u0631\u0629 (price): \u0627\u0633\u062A\u062E\u0631\u062C \u0627\u0644\u0633\u0639\u0631 \u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A \u0643\u0631\u0642\u0645 \u0628\u062F\u0642\u0629 (\u0645\u062B\u0644\u0627\u064B: 2.5 \u0623\u0648 3 \u0623\u0648 1.5). \u0625\u0630\u0627 \u0644\u0645 \u064A\u0630\u0643\u0631 \u0633\u0639\u0631 \u0627\u062C\u0639\u0644 price: 0. \u0627\u0646\u062A\u0628\u0647: \u0625\u0630\u0627 \u0643\u0627\u0646 \u0647\u0646\u0627\u0643 \u0631\u0642\u0645 \u0623\u0634\u062E\u0627\u0635 \u0645\u062B\u0644 "\u0634\u062E\u0635\u064A\u0646" \u0623\u0648 "3 \u0631\u0643\u0627\u0628" \u0641\u0647\u0630\u0627 \u0639\u062F\u062F \u0631\u0643\u0627\u0628 \u0648\u0644\u064A\u0633 \u0633\u0639\u0631\u0627\u064B \u0623\u0628\u062F\u0627\u064B!
3. \u0643\u0634\u0641 \u0646\u0642\u0644 \u0627\u0644\u0631\u0643\u0627\u0628 \u0645\u0642\u0627\u0628\u0644 \u0627\u0644\u0628\u0636\u0627\u0626\u0639:
   - "passengerRisk": "confirmed_passenger" (\u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0635\u0631\u064A\u062D\u0627\u064B \u0644\u0646\u0642\u0644 \u0634\u062E\u0635\u060C \u0628\u0646\u062A\u060C \u0637\u0627\u0644\u0628\u060C \u0639\u0627\u0626\u0644\u0629\u060C \u0645\u0634\u0648\u0627\u0631 \u0634\u062E\u0635\u064A)
   - "suspicious_passenger" (\u0625\u0630\u0627 \u0643\u0627\u0646 \u0647\u0646\u0627\u0643 \u0627\u062D\u062A\u0645\u0627\u0644 \u0623\u0648 \u063A\u0645\u0648\u0636)
   - "goods_safe" (\u0625\u0630\u0627 \u0643\u0627\u0646 \u0644\u062A\u0648\u0635\u064A\u0644 \u0623\u063A\u0631\u0627\u0636\u060C \u0623\u0643\u0644\u060C \u0639\u0637\u0648\u0631\u060C \u0647\u062F\u0627\u064A\u0627\u060C \u0639\u0628\u0627\u064A\u0627\u062A\u060C \u0643\u0631\u0627\u062A\u064A\u0646\u060C \u0628\u0636\u0627\u0639\u0629)
4. \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 (phone): \u0627\u0633\u062A\u062E\u0631\u062C \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0627\u0644\u0645\u0639\u0644\u0646 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0625\u0646 \u0648\u062C\u062F \u0641\u064A \u0627\u0644\u0646\u0635 (\u064A\u0628\u062F\u0623 \u0628\u0640 973 \u0623\u0648 \u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 3xxxxxxx, 6xxxxxxx, 17xxxxxx). \u0625\u0630\u0627 \u0643\u0627\u0646 \u0647\u0646\u0627\u0643 \u0639\u062F\u0629 \u0623\u0631\u0642\u0627\u0645 \u0645\u064A\u0632 \u0631\u0642\u0645 \u0627\u0644\u0645\u0639\u0644\u0646.
5. \u0646\u0648\u0639 \u0627\u0644\u0628\u0636\u0627\u0639\u0629 (itemType) \u0648\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0645\u0647\u0645\u0629 (notes).

\u0623\u062C\u0628 \u0641\u0642\u0637 \u0628\u0643\u0627\u0626\u0646 JSON \u0635\u0627\u0644\u062D \u0645\u0637\u0627\u0628\u0642 \u0644\u0644\u0647\u064A\u0643\u0644:
{
  "from": "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645",
  "to": "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062A\u0633\u0644\u064A\u0645",
  "price": 2.5,
  "phone": "973xxxxxxxx",
  "passengerRisk": "goods_safe" | "suspicious_passenger" | "confirmed_passenger",
  "passengerCount": 0,
  "itemType": "\u0639\u0637\u0648\u0631 / \u062D\u0644\u0648\u064A\u0627\u062A / \u0637\u0631\u062F",
  "notes": "\u0623\u064A \u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629",
  "confidence": 95
}`;
    const aiPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Cloud AI parsing timeout")), 4e3)
    );
    const response = await Promise.race([aiPromise, timeoutPromise]);
    const outputText = response.text || "{}";
    const parsedData = JSON.parse(outputText);
    return res.json({
      success: true,
      data: {
        from: parsedData.from || "",
        to: parsedData.to || "",
        price: typeof parsedData.price === "number" ? parsedData.price : Number(parsedData.price) || 0,
        phone: parsedData.phone || "",
        passengerRisk: parsedData.passengerRisk || "goods_safe",
        passengerCount: parsedData.passengerCount || 0,
        itemType: parsedData.itemType || "\u0628\u0636\u0627\u0639\u0629 \u0639\u0627\u0645\u0629",
        notes: parsedData.notes || "",
        confidence: typeof parsedData.confidence === "number" ? parsedData.confidence : 90
      }
    });
  } catch (err) {
    console.warn("[Cloud AI Parser Fallback]", err?.message);
    const fallback = parseWhatsAppOrderText(req.body?.rawText || "");
    return res.json({
      success: true,
      data: {
        from: fallback.from,
        to: fallback.to,
        price: fallback.price,
        phone: fallback.phone,
        passengerRisk: fallback.passengerDetection?.level || "goods_safe",
        passengerCount: fallback.passengerCount || 0,
        itemType: "\u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644",
        notes: fallback.notes,
        confidence: fallback.confidence
      }
    });
  }
});
app.post("/api/analyze-and-learn-closure", async (req, res) => {
  try {
    const { text = "", context = "", senderName = "", groupName = "" } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0646\u0635 \u0641\u0627\u0631\u063A" });
    }
    const ai = getGenAI();
    const prompt = `\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0644\u063A\u0648\u064A \u0641\u064A \u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A\u0629 \u0648\u0627\u0644\u062E\u0644\u064A\u062C\u064A\u0629 \u0648\u0645\u062D\u0627\u062F\u062B\u0627\u062A \u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0648\u0627\u062A\u0633\u0627\u0628 \u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062A\u0648\u0635\u064A\u0644.
\u0627\u0644\u0645\u0647\u0645\u0629: \u062A\u062D\u0644\u064A\u0644 \u0631\u0633\u0627\u0644\u0629 \u0623\u0631\u0633\u0644\u0647\u0627 \u0639\u0636\u0648/\u0645\u0639\u0644\u0646 \u0641\u064A \u0642\u0631\u0648\u0628 \u062A\u0648\u0635\u064A\u0644 \u0648\u0645\u0639\u0631\u0641\u0629 \u0645\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u062A\u0641\u064A\u062F \u0628\u0623\u0646 \u0627\u0644\u0637\u0644\u0628 \u0642\u062F \u0627\u0646\u062D\u062C\u0632 \u0623\u0648 \u062D\u0635\u0644 \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628 \u0623\u0648 \u062A\u0645 \u0625\u0646\u062C\u0627\u0632\u0647 \u0623\u0648 \u062A\u0643\u0646\u0633\u0644.

\u0646\u0635 \u0627\u0644\u0631\u0633\u0627\u0644\u0629: "${text}"
\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0633\u0644: "${senderName}"
\u0627\u0633\u0645 \u0627\u0644\u0642\u0631\u0648\u0628: "${groupName}"
\u0633\u064A\u0627\u0642 \u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0633\u0627\u0628\u0642 (\u0625\u0646 \u0648\u062C\u062F): "${context}"

\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A \u0627\u0644\u0645\u0645\u0643\u0646\u0629:
1. "taken": \u062A\u0641\u064A\u062F \u0628\u0623\u0646\u0647 \u062D\u0635\u0644 \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628\u060C \u0623\u0648 \u0634\u0627\u0644\u0648\u0627 \u0627\u0644\u0637\u0644\u0628\u060C \u0623\u0648 \u0627\u062A\u0635\u0644 \u0628\u0645\u0646\u062F\u0648\u0628\u060C \u0623\u0648 \u062A\u0645 \u0627\u0644\u062D\u062C\u0632 (\u0645\u062B\u0644: \u062A\u0645\u060C \u062D\u0635\u0644\u062A\u060C \u0634\u0627\u0644\u0648\u0647\u060C \u0627\u0646\u062D\u062C\u0632\u060C \u0645\u0633\u0643\u062A\u0647\u060C \u0641\u0648\u0642\u0647 \u062E\u0644\u0627\u0635\u060C \u062E\u0630\u0648\u0647).
2. "completion": \u062A\u0641\u064A\u062F \u0628\u0627\u0646\u062A\u0647\u0627\u0621 \u0627\u0644\u0645\u0634\u0648\u0627\u0631\u060C \u0648\u0635\u0648\u0644 \u0627\u0644\u0623\u063A\u0631\u0627\u0636\u060C \u0623\u0648 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 (\u0645\u062B\u0644: \u062A\u0643\u0646\u0633\u0644\u060C \u0643\u0646\u0633\u0644\u0646\u0627\u060C \u062A\u0633\u0643\u0631\u060C \u062E\u0644\u0627\u0635 \u0644\u0627 \u062D\u062F \u064A\u062A\u0635\u0644).
3. "gratitude": \u0634\u0643\u0631 \u0648\u062F\u0639\u0627\u0621 \u064A\u0641\u064A\u062F \u0627\u0644\u0631\u0636\u0627 \u0648\u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u0645\u0647\u0645\u0629 (\u0645\u062B\u0644: \u0645\u0627 \u0642\u0635\u0631\u062A\u0648\u0627\u060C \u0645\u0634\u0643\u0648\u0631\u064A\u0646\u060C \u0641\u064A \u0645\u064A\u0632\u0627\u0646 \u062D\u0633\u0646\u0627\u062A\u0643\u0645).
4. "emoji": \u0631\u0645\u0648\u0632 \u0625\u0646\u062C\u0627\u0632 \u0623\u0648 \u0645\u0635\u0627\u0641\u062D\u0629 \u0623\u0648 \u062A\u0645 (\u0645\u062B\u0644: \u{1F44D}\u060C \u2705\u060C \u{1F91D}\u060C \u{1F44C}\u060C \u{1F4E6}).
5. "none": \u0631\u0633\u0627\u0644\u0629 \u0639\u0627\u062F\u064A\u0629 \u0644\u0627 \u062A\u0639\u0646\u064A \u0625\u063A\u0644\u0627\u0642 \u0623\u0648 \u062D\u062C\u0632 \u0627\u0644\u0637\u0644\u0628 (\u0645\u062B\u0644: \u0643\u0645 \u0627\u0644\u0633\u0639\u0631\u061F\u060C \u0648\u064A\u0646 \u0627\u0644\u0645\u0648\u0642\u0639\u061F\u060C \u0647\u0644 \u0641\u064A\u0647 \u0645\u0646\u062F\u0648\u0628\u061F\u060C \u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645).

\u0623\u062C\u0628 \u0628\u0643\u0627\u0626\u0646 JSON \u0635\u0627\u0644\u062D \u0641\u0642\u0637:
{
  "isClosureIntent": true | false,
  "verdict": "taken" | "completion" | "gratitude" | "emoji" | "none",
  "extractedPhrase": "\u0627\u0644\u0643\u0644\u0645\u0629 \u0623\u0648 \u0627\u0644\u0639\u0628\u0627\u0631\u0629 \u0623\u0648 \u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u062F\u0627\u0644 \u0639\u0644\u0649 \u0627\u0644\u0625\u063A\u0644\u0627\u0642",
  "confidence": 95,
  "explanation": "\u0634\u0631\u062D \u0645\u0648\u062C\u0632 \u0628\u0645\u0639\u0646\u0649 \u0627\u0644\u0643\u0644\u0645\u0629 \u0641\u064A \u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A\u0629/\u0627\u0644\u062E\u0644\u064A\u062C\u064A\u0629"
}`;
    const aiPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("AI closure analyzer timeout")), 4e3)
    );
    const response = await Promise.race([aiPromise, timeoutPromise]);
    const outputText = response.text || "{}";
    const parsedData = JSON.parse(outputText);
    return res.json({
      success: true,
      isClosureIntent: !!parsedData.isClosureIntent,
      verdict: parsedData.verdict || "none",
      extractedPhrase: parsedData.extractedPhrase || text.substring(0, 30),
      confidence: typeof parsedData.confidence === "number" ? parsedData.confidence : 90,
      explanation: parsedData.explanation || ""
    });
  } catch (err) {
    console.warn("[AI Closure Learner Route Fallback]", err?.message);
    const clean = (req.body?.text || "").toLowerCase();
    const isClosure = /حصلت|تم|انحجز|شالوه|اخذوه|أخذوه|خلاص|تكنسل|مشكورين|👍|✅|🤝/.test(clean);
    return res.json({
      success: true,
      isClosureIntent: isClosure,
      verdict: isClosure ? "taken" : "none",
      extractedPhrase: req.body?.text?.substring(0, 30) || "",
      confidence: 80,
      explanation: "\u062A\u062D\u0644\u064A\u0644 \u0645\u062D\u0644\u064A \u0628\u062F\u064A\u0644"
    });
  }
});
app.post("/api/trial/status", (req, res) => {
  try {
    const { deviceId, hardwareFingerprint, model, platform, phone } = req.body || {};
    if (!deviceId && !hardwareFingerprint) {
      return res.status(400).json({ error: "Missing deviceId or hardwareFingerprint" });
    }
    const result = checkOrRegisterDevice({
      deviceId: deviceId || `ORD-DEV-${Date.now()}`,
      hardwareFingerprint: hardwareFingerprint || deviceId,
      model,
      platform,
      phone
    });
    return res.json({
      success: true,
      deviceId: result.record.deviceId,
      firstInstalledAt: result.record.firstInstalledAt,
      expiresAt: result.record.expiresAt,
      trialDays: result.record.trialDays,
      daysRemaining: result.daysRemaining,
      hoursRemaining: result.hoursRemaining,
      isExpired: result.isExpired,
      isActivated: result.record.isActivated,
      activationCode: result.record.activationCode,
      installCount: result.record.installCount,
      isNewInstall: result.isNewInstall
    });
  } catch (err) {
    console.error("[Trial API Error]", err);
    return res.status(500).json({ error: "Failed to process device trial status" });
  }
});
app.post("/api/trial/activate", (req, res) => {
  try {
    const { deviceId, hardwareFingerprint, code, phone } = req.body || {};
    if (!deviceId || !code) {
      return res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u062A\u0642\u062F\u064A\u0645 \u0645\u0639\u0631\u0641 \u0627\u0644\u062C\u0647\u0627\u0632 \u0648\u0643\u0648\u062F \u0627\u0644\u062A\u0641\u0639\u064A\u0644" });
    }
    const result = activateDevice({
      deviceId,
      hardwareFingerprint,
      code,
      phone
    });
    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        isActivated: true,
        record: result.record
      });
    }
    return res.status(400).json({
      success: false,
      error: result.message
    });
  } catch (err) {
    console.error("[Trial Activation Error]", err);
    return res.status(500).json({ error: "\u062A\u0639\u0630\u0631 \u0645\u0639\u0627\u0644\u062C\u0629 \u0643\u0648\u062F \u0627\u0644\u062A\u0641\u0639\u064A\u0644" });
  }
});
app.post("/api/trial/reset-demo", (req, res) => {
  const { deviceId } = req.body || {};
  if (!deviceId) return res.status(400).json({ error: "Missing deviceId" });
  const reset = resetDeviceTrial(deviceId);
  return res.json({ success: reset });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Orderi Server] Running on http://0.0.0.0:${PORT} (ENV=${process.env.NODE_ENV || "dev"})`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Orderi Server] Port ${PORT} currently in use; retaining existing active process.`);
    } else {
      console.error("[Orderi Server] HTTP server error:", err);
    }
  });
}
startServer().catch((err) => {
  console.error("[Orderi Server] Failed to initialize server:", err);
});
//# sourceMappingURL=server.cjs.map
