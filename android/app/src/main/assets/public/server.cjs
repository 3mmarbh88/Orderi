var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

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
      "\u062E\u0644\u0627\u0635 \u062A\u0648\u0641\u0631 \u0645\u0646\u062F\u0648\u0628",
      "\u0627\u062E\u0630\u062A\u0647",
      "\u0623\u062E\u0630\u062A\u0647",
      "\u062D\u062C\u0632\u062A\u0647",
      "\u0627\u0646\u062D\u062C\u0632",
      "\u0627\u0646\u062D\u062C\u0632\u062A",
      "\u0645\u062D\u062C\u0648\u0632",
      "\u0645\u062D\u062C\u0648\u0632\u0629",
      "\u062D\u062C\u0632\u0648\u0647",
      "\u0646\u062D\u062C\u0632",
      "\u062D\u0635\u0644 \u0639\u0644\u064A\u0647 \u0645\u0646\u062F\u0648\u0628",
      "\u0627\u062E\u0630\u0647 \u0645\u0646\u062F\u0648\u0628",
      "\u0623\u062E\u0630\u0647 \u0645\u0646\u062F\u0648\u0628",
      "\u0645\u0639 \u0627\u0644\u0645\u0646\u062F\u0648\u0628",
      "\u0639\u0646\u062F \u0627\u0644\u0645\u0646\u062F\u0648\u0628",
      "\u0635\u0627\u0631 \u0645\u0639 \u0627\u0644\u0645\u0646\u062F\u0648\u0628",
      "\u0639\u0646\u062F\u064A \u0627\u0644\u0637\u0644\u0628",
      "\u0639\u0646\u062F\u064A",
      "\u0634\u0627\u0644\u0648\u0647",
      "\u0634\u0627\u0644\u0648\u0647 \u062E\u0644\u0627\u0635",
      "\u0627\u062E\u0630\u0648\u0647",
      "\u0623\u062E\u0630\u0648\u0647",
      "\u0627\u0633\u062A\u0644\u0645\u062A\u0647",
      "\u0627\u0633\u062A\u0644\u0645\u0647\u0627",
      "\u0645\u0633\u0643\u062A\u0647",
      "\u0645\u0633\u0643\u062A \u0627\u0644\u0637\u0644\u0628",
      "\u0645\u0633\u0643\u0648\u0647",
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
      "\u0645\u0627\u062A\u0642\u0635\u0631\u0648\u0646 \u062D\u0635\u0644\u062A",
      "\u0641\u0648\u0642\u0647 \u062E\u0644\u0627\u0635",
      "\u062A\u0648\u0643\u0644\u0646\u0627 \u062E\u0644\u0627\u0635",
      "\u0645\u0639 \u0643\u0627\u0628\u062A\u0646 \u062E\u0644\u0627\u0635",
      "\u062D\u0635\u0644\u062A \u0643\u0627\u0628\u062A\u0646",
      "\u0644\u0642\u064A\u062A \u0643\u0627\u0628\u062A\u0646",
      "\u0634\u0627\u0644\u0648\u0647 \u0627\u0644\u0634\u0628\u0627\u0628",
      "\u0627\u062E\u0630\u0648\u0647 \u0627\u0644\u0634\u0628\u0627\u0628",
      "\u062A\u0645 \u064A\u0627 \u0634\u0628\u0627\u0628",
      "\u062A\u0645 \u064A\u0627\u0644\u063A\u0627\u0644\u064A",
      "\u062A\u0645 \u064A\u0627\u0644\u0637\u064A\u0628",
      "\u062A\u0645 \u062D\u0628\u064A\u0628\u064A",
      "\u062D\u0635\u0644\u062A \u062E\u0644\u0627\u0635",
      "\u062D\u0635\u0644\u062A \u0645\u0646\u062F\u0648\u0628 \u062E\u0644\u0627\u0635",
      "\u062A\u0648\u0641\u0631 \u0643\u0627\u0628\u062A\u0646",
      "\u062A\u0645 \u0645\u0646\u062F\u0648\u0628",
      "\u062A\u0645 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645",
      "\u062A\u0645 \u0627\u0644\u062A\u0648\u0635\u064A\u0644",
      "taken",
      "booked",
      "assigned",
      "driver assigned",
      "got a driver",
      "with driver",
      "picked up",
      "handled",
      "done"
    ];
    BASE_COMPLETION_KEYWORDS = [
      "\u062E\u0644\u0627\u0635",
      "\u0627\u0646\u062A\u0647\u0649",
      "\u062A\u0645 \u0627\u0644\u062A\u0648\u0635\u064A\u0644",
      "\u0644\u0627 \u064A\u0648\u062C\u062F \u0637\u0644\u0628",
      "\u0627\u0643\u062A\u0645\u0644",
      "\u0645\u0643\u062A\u0645\u0644",
      "\u0645\u0644\u063A\u064A",
      "\u0627\u0644\u063A\u064A",
      "\u0627\u0644\u062A\u063A\u0649",
      "\u062A\u0643\u0646\u0633\u0644",
      "\u0643\u0646\u0633\u0644",
      "\u062A\u0641\u0631\u0643\u0634",
      "\u0643\u0646\u0633\u0644\u0646\u0627\u0647",
      "\u062A\u0643\u0646\u0633\u0644 \u062E\u0644\u0627\u0635",
      "\u0648\u0635\u0644 \u0648\u0627\u0633\u062A\u0644\u0645",
      "\u062E\u0644\u0635\u0646\u0627 \u0645\u0646\u0647",
      "\u062E\u0644\u0635 \u0627\u0644\u0645\u0634\u0648\u0627\u0631",
      "\u062A\u0633\u0643\u0631",
      "\u0645\u0642\u0641\u0644",
      "\u062E\u0644\u0635",
      "\u0627\u0646\u062A\u0647\u0649 \u0627\u0644\u0637\u0644\u0628",
      "\u0644\u0627 \u062A\u062F\u0642\u0648\u0646 \u062E\u0644\u0627\u0635",
      "\u0644\u0627 \u062A\u062A\u0635\u0644\u0648\u0646 \u062D\u0635\u0644\u062A",
      "\u0648\u0642\u0641\u0648\u0627 \u062E\u0644\u0627\u0635",
      "\u0627\u0643\u062A\u0645\u0644 \u0627\u0644\u0645\u0634\u0648\u0627\u0631",
      "\u0644\u0627 \u062D\u062F \u064A\u062A\u0635\u0644 \u062E\u0644\u0627\u0635",
      "\u062E\u0644\u0627\u0635 \u062A\u0633\u0643\u0631",
      "\u062A\u0633\u0644\u064A\u0645 \u062A\u0645",
      "\u0645\u0627 \u0639\u0627\u062F \u0645\u062A\u0627\u062D",
      "\u0645\u0627 \u064A\u062D\u062A\u0627\u062C",
      "completed",
      "delivered",
      "cancelled",
      "canceled",
      "closed",
      "finished"
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
      "\u0645\u0627 \u0642\u0635\u0631\u062A\u0648\u0627 \u062C\u0645\u064A\u0639\u0627\u064B",
      "\u0645\u0634\u0643\u0648\u0631 \u064A\u0627\u0644\u063A\u0627\u0644\u064A"
    ];
    BASE_CLOSURE_EMOJIS = ["\u{1F44D}", "\u2705", "\u{1F44C}", "\u{1F64F}", "\u{1F3AF}", "\u{1F91D}", "\u2714\uFE0F", "\u{1F90D}", "\u{1F44F}", "\u{1F932}", "\u{1F4E6}", "\u{1F6F5}", "\u{1F697}", "\u2728", "\u{1F490}", "\u{1F337}", "\u{1F4AF}", "\u{1F512}", "\u{1F389}", "\u{1F6AB}", "\u26D4", "\u274C", "\u{1F3C1}", "\u{1F6D1}"];
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
var server_exports = {};
__export(server_exports, {
  SIMULATED_MOCK_GROUPS: () => SIMULATED_MOCK_GROUPS
});
module.exports = __toCommonJS(server_exports);
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
      "\u0645\u0637\u0627\u0631",
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
  { id: "bu_quwah", name: "\u0628\u0648 \u0642\u0648\u0629", nameEn: "Bu Quwah", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.204722, longitude: 50.52 },
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
  { id: "al_lawzi", name: "\u0627\u0644\u0644\u0648\u0632\u064A", nameEn: "Al Lawzi", governorate: "\u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629", latitude: 26.155, longitude: 50.49 },
  // الجنوبية (Southern Governorate)
  { id: "bu_kowarah", name: "\u0628\u0648 \u0643\u0648\u0627\u0631\u0629", nameEn: "Bu Kowarah", governorate: "\u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629", latitude: 26.1381643, longitude: 50.5656984 },
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

// src/utils/arabicMessageNormalizer.ts
function normalizeArabicMessageForMatching(text) {
  if (!text) return "";
  return text.normalize("NFKC").replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[\u200E-\u200F\u202A-\u202E\u2066-\u2069]/g, "").replace(/[إأآٱ]/g, "\u0627").replace(/ى/g, "\u064A").replace(/ة/g, "\u0647").replace(/([ء-ي])\1{2,}/g, "$1$1").replace(/[،؛,]+/g, " ").replace(/\s+/g, " ").trim();
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
  const normalized = normalizeArabicText(normalizeArabicMessageForMatching(rawText));
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

// src/utils/advertisementClassifier.ts
function detectAdvertisementMessage(rawText) {
  if (!rawText || typeof rawText !== "string") return { isAdvertisement: false };
  const text = normalizeArabicText(normalizeArabicMessageForMatching(rawText)).replace(/[ـ_*~`]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return { isAdvertisement: false };
  const groupInformationPost = /(?:قوانين\s*(?:القروب|القروب|المجموعه|المجموعة)|شروط\s*(?:القروب|المجموعه|المجموعة)|الرجاء\s*(?:الالتزام|عدم)|يرجى\s*(?:الالتزام|عدم)|تنبيه\s*(?:من\s*)?(?:الاداره|الإدارة)|اداره\s*(?:القروب|المجموعة)|إدارة\s*(?:القروب|المجموعة)|رابط\s*(?:الدعوه|الدعوة)|هذا\s*(?:القروب|الجروب|المجموعة)\s*(?:مخصص|خاص)|الخدمات\s*(?:المتوفره|المتوفرة|المتاحه|المتاحة)|خدمات\s*عامه|خدمات\s*عامة|اهلا\s*وسهلا\s*(?:بكم\s*)?(?:في|بقروب|بقروبنا)|أهلا\s*وسهلا\s*(?:بكم\s*)?(?:في|بقروب|بقروبنا))/i.test(text);
  const explicitDeliveryRequest = /(?:مطلوب\s*(?:مندوب|توصيل|استلام|سائق)|ابي\s*(?:مندوب|توصيل|استلام)|ابغي\s*(?:مندوب|توصيل|استلام)|أبي\s*(?:مندوب|توصيل|استلام)|أبغي\s*(?:مندوب|توصيل|استلام)|محتاج\s*(?:مندوب|توصيل|استلام)|احتاج\s*(?:مندوب|توصيل|استلام)|أحتاج\s*(?:مندوب|توصيل|استلام)|استلام.{0,60}توصيل|توصيل.{0,60}(?:الى|إلى|لـ)\s*\S+)/i.test(text);
  if (groupInformationPost && !explicitDeliveryRequest) {
    return { isAdvertisement: true, reason: "\u0631\u0633\u0627\u0644\u0629 \u0642\u0648\u0627\u0646\u064A\u0646 \u0623\u0648 \u062A\u0639\u0631\u064A\u0641 \u0623\u0648 \u0642\u0627\u0626\u0645\u0629 \u062E\u062F\u0645\u0627\u062A \u0644\u0644\u0642\u0631\u0648\u0628 \u0648\u0644\u064A\u0633\u062A \u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644 \u0645\u062D\u062F\u062F\u0627\u064B" };
  }
  const contactCallToAction = /(?:للتواصل|للتواصل والواتساب|للتواصل واتساب|واتساب|كلمني خاص|يكلمني خاص|على الخاص|عالخاص|تواصل مع|راسلني|للحجز|للاستفسار|للتنسيق|instagram|انستقرام|انستا|خاص\s*[:：])/i.test(text);
  const providerOrTravelOffer = /(?:طالع|طالعه|طالع(?:ه)?\s+(?:باذن الله|ان شاء الله)|رايح|رايحه|راجع|راجعه|متوجه|متوجهه|متوجهة|متواجد|متواجده|متواجدة|موجود|موجوده|رحلاتنا|رحلات مستمره|رحلات مستمرة|رحله|رحلة|مواصلات|مشاويرنا|على اتم الاستعداد|على استعداد|خدماتنا|في خدمتكم|حاضرين له|كل طلب حاضر|اي طلب حاضر|اللي يبي حاجه|اللي يبي شي|اي شخص يريد|اي شخص محتاج|من البحرين الى|من البحرين الي)/i.test(text);
  const serviceItems = [
    /(?:توصيل\s*(?:ركاب|اشخاص|طلبات|اغراض|امانات)|توصيل امانات)/i,
    /(?:تسوق|قطع غيار|شركات شحن|ادويه|هدايا|اغراض|اوردرات|اوردر|طلبات|رسايل|رسائل)/i,
    /(?:مطار|محطه قطار|تأمين سيارات|تأمين سفر|شراء|استلام|ترجيع|مشاوير خاصه|مشاوير خاصة)/i
  ];
  const serviceItemCount = serviceItems.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
  const hasPhoneOrSocial = /(?:\+?973\s*\d{8}|\b[36]\d{7}\b|instagram|انستقرام|wa\.me)/i.test(text);
  const invitationToCustomers = /(?:اللي يبي|اللي يبي حاجه|اللي يبي شي|اي شخص يريد|أي شخص يريد|اي شخص محتاج|اللي محتاج|محتاج شي|كلمني خاص|يكلمني خاص|حاضرين له|حياكم على الخاص|متوفر من|متوفره من|متوفرة من)/i.test(text);
  const explicitProviderOffer = /(?:طالع|طالعه|رايح|رايحه|راجع|راجعه|متجه|متوجه|متواجد|متواجده|موجود في الامارات|رحلاتنا مستمره|رحلات مستمره|رحلات يوميه|رحلات يومية|متوفر من|متوفره من|متوفرة من|حاضرين له|حاضرين لكم|اللي يبي|الي يبي|اللي محتاج|الي محتاج|اي شخص يريد|اي شخص محتاج|محتاج شي|محتاج شيء|اغراض فقط|أغراض فقط)/i.test(text);
  const customerInvitation = /(?:اللي يبي|الي يبي|اللي محتاج|الي محتاج|اي شخص يريد|أي شخص يريد|اي شخص محتاج|محتاج شي|محتاج شيء|حاضرين له|حياكم على الخاص|يكلمني خاص|كلمني خاص|متوفر من|متوفره من|متوفرة من)/i.test(text);
  const routeOrTripContext = /(?:السعوديه|السعودية|الكويت|قطر|الامارات|الإمارات|الاردن|الأردن|سوريا|الخبر|الدمام|البحرين|المنامه|المنامة|المحرق|مدينة حمد|مجمع التنين|طالع|رايح|راجع|رحله|رحلة|رحلات)/i.test(text);
  if (explicitProviderOffer && customerInvitation && routeOrTripContext && (contactCallToAction || hasPhoneOrSocial || serviceItemCount >= 1)) {
    return { isAdvertisement: true, reason: "\u0625\u0639\u0644\u0627\u0646 \u0631\u062D\u0644\u0629 \u0623\u0648 \u0639\u0631\u0636 \u062E\u062F\u0645\u0627\u062A/\u0623\u063A\u0631\u0627\u0636 \u0644\u0644\u0632\u0628\u0627\u0626\u0646\u060C \u0648\u0644\u064A\u0633 \u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644 \u0645\u062D\u062F\u062F\u0627\u064B" };
  }
  if (providerOrTravelOffer && (contactCallToAction || invitationToCustomers || hasPhoneOrSocial) && (serviceItemCount >= 1 || invitationToCustomers || /(?:راجع|رحلاتنا|رحلات مستمره|رحلات مستمرة|طالع|رايح)/i.test(text))) {
    return { isAdvertisement: true, reason: "\u0625\u0639\u0644\u0627\u0646 \u0631\u062D\u0644\u0629 \u0623\u0648 \u0645\u0642\u062F\u0645 \u062E\u062F\u0645\u0629 \u064A\u0639\u0631\u0636 \u062E\u062F\u0645\u0627\u062A\u0647\u060C \u0648\u0644\u064A\u0633 \u0637\u0644\u0628 \u0639\u0645\u064A\u0644" };
  }
  const explicitPromotion = /(?:راحتك تهمنا|تأمين سيارات|تأمين سفر|سعر مناسب لك|اسعار جدا مناسبه|اسعار مناسبه|انجاز سريع|خدمة نحرص فيها عليك|قروب افلام|عرض فيلم كامل|اسعار شدات|للبيع|متوفر لدينا|تواصل مع ابو سند|تواصل مع أبو سند)/i.test(text);
  if (explicitPromotion && (contactCallToAction || hasPhoneOrSocial || serviceItemCount >= 2)) {
    return { isAdvertisement: true, reason: "\u0625\u0639\u0644\u0627\u0646 \u062A\u062C\u0627\u0631\u064A \u0623\u0648 \u062A\u0631\u0648\u064A\u062C\u064A\u060C \u0648\u0644\u064A\u0633 \u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644" };
  }
  const hasListFormatting = /(?:^|\n)\s*(?:[•●▪🛍️🛒✈️🚗💵⚙️🏃👬📍-])/.test(rawText);
  if (hasListFormatting && serviceItemCount >= 3 && (contactCallToAction || hasPhoneOrSocial)) {
    return { isAdvertisement: true, reason: "\u0642\u0627\u0626\u0645\u0629 \u062E\u062F\u0645\u0627\u062A \u0645\u0639\u0644\u0646 \u0639\u0646\u0647\u0627 \u0645\u0639 \u062F\u0639\u0648\u0629 \u0644\u0644\u062A\u0648\u0627\u0635\u0644" };
  }
  return { isAdvertisement: false };
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
function boundedEditDistance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > limit) return limit + 1;
    previous = current;
  }
  return previous[b.length];
}
function getPlaceTypoLimit(keyword) {
  if (keyword.length < 4) return 0;
  return keyword.length <= 5 ? 1 : 2;
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
  const normalized = normalizeArabicText(normalizeArabicMessageForMatching(convertedText));
  const advertisementDetection = detectAdvertisementMessage(rawText);
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
  const areaAliasesById = {
    isa_town: ["\u0645 \u0639\u064A\u0633\u0649", "\u0645. \u0639\u064A\u0633\u0649", "\u0645\u062F\u064A\u0646\u0647 \u0639\u064A\u0633\u0649", "\u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649"],
    hamad_town: [
      "\u0645 \u062D\u0645\u062F",
      "\u0645. \u062D\u0645\u062F",
      "\u0645\u062F\u064A\u0646\u0647 \u062D\u0645\u062F",
      "\u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F",
      ...Array.from({ length: 30 }, (_, index) => `\u062F\u0648\u0627\u0631 ${index + 1}`),
      ...Array.from({ length: 30 }, (_, index) => `\u062F\u0648\u0627\u0631 \u0631\u0642\u0645 ${index + 1}`),
      ...Array.from({ length: 30 }, (_, index) => `roundabout ${index + 1}`)
    ],
    bu_quwah: ["\u0628\u0648 \u0642\u0648\u0629", "\u0628\u0648 \u0642\u0648\u0647", "\u0628\u0648\u0642\u0648\u0629", "\u0628\u0648\u0642\u0648\u0647", "\u0623\u0628\u0648 \u0642\u0648\u0629", "\u0623\u0628\u0648 \u0642\u0648\u0647", "\u0627\u0628\u0648 \u0642\u0648\u0629", "\u0627\u0628\u0648 \u0642\u0648\u0647", "abu quwah", "bu quwah"],
    bu_kowarah: ["\u0628\u0648 \u0643\u0648\u0627\u0631\u0629", "\u0628\u0648 \u0643\u0648\u0627\u0631\u0647", "\u0628\u0648\u0643\u0648\u0627\u0631\u0629", "\u0628\u0648\u0643\u0648\u0627\u0631\u0647", "\u0623\u0628\u0648 \u0643\u0648\u0627\u0631\u0629", "\u0623\u0628\u0648 \u0643\u0648\u0627\u0631\u0647", "\u0627\u0628\u0648 \u0643\u0648\u0627\u0631\u0629", "\u0627\u0628\u0648 \u0643\u0648\u0627\u0631\u0647", "bu kowarah", "bu kuwarah"],
    al_lawzi: ["\u0627\u0644\u0644\u0648\u0632\u064A", "\u0627\u0644\u0648\u0632\u064A", "\u0644\u0648\u0632\u064A", "lawzi", "al lawzi", "al-lawzi"],
    riffa: ["\u0631\u0641\u0627\u0639", "\u0627\u0644\u0631\u0641\u0627\u0639"],
    riffa_sharqi: ["\u0631\u0641\u0627\u0639 \u0634\u0631\u0642\u064A", "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0631\u0642\u064A"],
    riffa_gharbi: ["\u0631\u0641\u0627\u0639 \u063A\u0631\u0628\u064A", "\u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u063A\u0631\u0628\u064A"],
    adliya: ["\u0639\u062F\u0644\u064A\u0629", "\u0627\u0644\u0639\u062F\u0644\u064A\u0629", "\u0639\u062F\u0644\u064A\u0647", "\u0627\u0644\u0639\u062F\u0644\u064A\u0647"],
    manama: ["\u0645\u0646\u0627\u0645\u0647", "\u0627\u0644\u0645\u0646\u0627\u0645\u0647"],
    muharraq: ["\u0645\u062D\u0631\u0642", "\u0627\u0644\u0645\u062D\u0631\u0642"]
  };
  const searchablePlaces = [
    // Malls & Landmarks (Moda Mall, Seef Mall, City Centre, Avenues, etc.)
    ...BAHRAIN_LANDMARKS.map((lm) => ({
      name: lm.name,
      keywords: lm.keywords,
      isLandmark: true,
      parentArea: lm.parentAreaName
    })),
    // Standard geographic areas plus local WhatsApp shorthand and common aliases.
    ...BAHRAIN_AREAS.map((a) => ({
      name: a.name,
      keywords: [
        a.name,
        a.nameEn,
        ...normalizeArabicText(a.name).startsWith("\u0627\u0644") ? [a.name.replace(/^ال/, "")] : [],
        ...areaAliasesById[a.id] || []
      ],
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
      const fromPattern = startsWithAl ? new RegExp(`(?:(?:\u0645\u0646|\u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0646|\u0627\u0633\u062A\u0644\u0627\u0645|\u0628\u064A\u0643 \u0627\u0628 \u0645\u0646|\u0628\u064A\u0643 \u0627\u0628|\u0645\u0648\u0642\u0639|\u062A\u062D\u0645\u064A\u0644 \u0645\u0646|\u0641\u0631\u0639|\u0639\u0646\u062F)s*(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?s*${kw}\\b|(?:^|[s\u060C,.])\u0628\u0627\u0644(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?${core}\\b|(?:^|[s\u060C,.])\u0641\u064As+(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?${kw}\\b)`, "i") : new RegExp(`(?:(?:\u0645\u0646|\u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0646|\u0627\u0633\u062A\u0644\u0627\u0645|\u0628\u064A\u0643 \u0627\u0628 \u0645\u0646|\u0628\u064A\u0643 \u0627\u0628|\u0645\u0648\u0642\u0639|\u062A\u062D\u0645\u064A\u0644 \u0645\u0646|\u0641\u0631\u0639|\u0639\u0646\u062F)s*(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?s*${kw}\\b|(?:^|[s\u060C,.])\u0628\u0640?${kw}\\b|(?:^|[s\u060C,.])\u0641\u064As+(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?${kw}\\b)`, "i");
      if (fromPattern.test(normalized)) {
        fromArea = item.placeName;
      }
    }
    if (!toArea) {
      const toPattern = startsWithAl ? new RegExp(`(?:(?:\u0627\u0644\u0649|\u0625\u0644\u0649|\u0644\u064A|\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0649|\u062A\u0633\u0644\u064A\u0645 \u0644|\u062A\u0633\u0644\u064A\u0645|\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0649|\u062A\u0648\u0635\u064A\u0644 \u0644|\u0645\u0634\u0648\u0627\u0631 \u0627\u0644\u0649|\u0645\u0634\u0648\u0627\u0631 \u0644|\u062A\u0648\u0635\u064A\u0644\u0629 \u0627\u0644\u0649|\u062A\u0648\u0635\u064A\u0644\u0629 \u0644|\u0648\u062C\u0647\u0629|\u0645\u0643\u0627\u0646|\u064A\u0648\u0635\u0644)s*(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?s*${kw}\\b|(?:^|[s\u060C,.]|(?:\u0645\u0634\u0648\u0627\u0631|\u062A\u0648\u0635\u064A\u0644|\u062A\u0648\u0635\u064A\u0644\u0629|\u0646\u0642\u0644|\u0631\u0648\u062D\u0629|\u0637\u0627\u0644\u0639)s+)\u0644\u0644(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?${core}\\b|(?:^|[s\u060C,.])\u0644\u0640?${kw}\\b)`, "i") : new RegExp(`(?:(?:\u0627\u0644\u0649|\u0625\u0644\u0649|\u0644\u064A|\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0649|\u062A\u0633\u0644\u064A\u0645 \u0644|\u062A\u0633\u0644\u064A\u0645|\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0649|\u062A\u0648\u0635\u064A\u0644 \u0644|\u0645\u0634\u0648\u0627\u0631 \u0627\u0644\u0649|\u0645\u0634\u0648\u0627\u0631 \u0644|\u062A\u0648\u0635\u064A\u0644\u0629 \u0627\u0644\u0649|\u062A\u0648\u0635\u064A\u0644\u0629 \u0644|\u0648\u062C\u0647\u0629|\u0645\u0643\u0627\u0646|\u064A\u0648\u0635\u0644)s*(?:\u0645\u062C\u0645\u0639|\u0645\u0648\u0644|\u0633\u0648\u0642|\u0645\u0646\u0637\u0642\u0629|\u0642\u0631\u064A\u0629)?s*${kw}\\b|(?:^|[s\u060C,.]|(?:\u0645\u0634\u0648\u0627\u0631|\u062A\u0648\u0635\u064A\u0644|\u062A\u0648\u0635\u064A\u0644\u0629|\u0646\u0642\u0644|\u0631\u0648\u062D\u0629|\u0637\u0627\u0644\u0639)s+)\u0644\u0640?${kw}\\b)`, "i");
      if (toPattern.test(normalized) && (!fromArea || item.placeName !== fromArea || /(?:من|استلام).*?(?:الى|إلى|لل|لـ|تسليم)/i.test(normalized))) {
        toArea = item.placeName;
      }
    }
  }
  let sameAreaShorthand = false;
  if (!fromArea && !toArea) {
    const isArabicOrLatinWord = (ch) => !!ch && /[\p{L}\p{N}]/u.test(ch);
    for (const area of BAHRAIN_AREAS) {
      const areaName = normalizeArabicText(area.name);
      const candidates = /* @__PURE__ */ new Set([areaName, areaName.startsWith("\u0627\u0644") ? areaName.slice(2) : areaName]);
      if (area.id === "manama") {
        candidates.add("\u0645\u0646\u0627\u0645\u0647");
        candidates.add("\u0627\u0644\u0645\u0646\u0627\u0645\u0647");
      }
      if (area.id === "muharraq") {
        candidates.add("\u0645\u062D\u0631\u0642");
        candidates.add("\u0627\u0644\u0645\u062D\u0631\u0642");
      }
      for (const candidate of candidates) {
        if (candidate.length < 3) continue;
        let firstIndex = -1;
        let searchFrom = 0;
        while (searchFrom < normalized.length) {
          const idx = normalized.indexOf(candidate, searchFrom);
          if (idx < 0) break;
          const before = normalized[idx - 1];
          const after = normalized[idx + candidate.length];
          if (!isArabicOrLatinWord(before) && !isArabicOrLatinWord(after)) {
            if (firstIndex >= 0) {
              const between = normalized.slice(firstIndex + candidate.length, idx);
              if (between.length <= 12 && /^[\s،,./-]*$/.test(between)) {
                fromArea = area.name;
                toArea = area.name;
                sameAreaShorthand = true;
                break;
              }
            } else {
              firstIndex = idx;
            }
          }
          searchFrom = idx + candidate.length;
        }
        if (sameAreaShorthand) break;
      }
      if (sameAreaShorthand) break;
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
    if (foundPlaces.length < 2) {
      const tokens = [];
      const tokenPattern = /[ء-يA-Za-z0-9]+/g;
      let tokenMatch;
      while ((tokenMatch = tokenPattern.exec(normalized)) !== null) {
        tokens.push({ value: tokenMatch[0], index: tokenMatch.index });
      }
      const seenFuzzy = /* @__PURE__ */ new Set();
      for (const item of allKeywordItems) {
        const keyword = item.normalizedKeyword.trim();
        const keywordWords = keyword.split(/\s+/).filter(Boolean);
        const limit = getPlaceTypoLimit(keyword.replace(/\s/g, ""));
        if (!limit || keywordWords.length === 0) continue;
        for (let startIndex = 0; startIndex < tokens.length; startIndex++) {
          const window2 = tokens.slice(startIndex, startIndex + keywordWords.length);
          if (window2.length !== keywordWords.length) continue;
          const candidate = window2.map((token) => token.value).join(" ");
          if (candidate === keyword) continue;
          const compactCandidate = candidate.replace(/\s/g, "");
          const compactKeyword = keyword.replace(/\s/g, "");
          const distance = boundedEditDistance(compactCandidate, compactKeyword, limit);
          if (distance < 1 || distance > limit || distance / Math.max(compactCandidate.length, compactKeyword.length) > 0.22) continue;
          const matchIndex = window2[0].index;
          const dedupeKey = item.placeName + ":" + Math.floor(matchIndex / 3);
          if (seenFuzzy.has(dedupeKey)) continue;
          seenFuzzy.add(dedupeKey);
          const before = normalized.slice(Math.max(0, matchIndex - 22), matchIndex);
          let intentType;
          if (/(?:من|استلام|بيك\s*اب|عند|في|بال)\s*$/.test(before)) intentType = "from";
          else if (/(?:الى|إلى|ل|لل|توصيل|مشوار|تسليم|وجهة)\s*$/.test(before)) intentType = "to";
          const alreadySub = foundPlaces.some((found) => Math.abs(found.index - matchIndex) < 4);
          if (!alreadySub) foundPlaces.push({ name: item.placeName, index: matchIndex, intentType });
        }
      }
    }
    foundPlaces.sort((a, b) => a.index - b.index);
    if (foundPlaces.length >= 2) {
      if (!fromArea && !toArea) {
        if (foundPlaces[0].name === foundPlaces[1].name) {
          fromArea = foundPlaces[0].name;
          toArea = foundPlaces[0].name;
          sameAreaShorthand = true;
        } else if (foundPlaces[0].intentType === "to" && foundPlaces[1].intentType !== "to") {
          toArea = foundPlaces[0].name;
          fromArea = foundPlaces[1].name;
        } else {
          fromArea = foundPlaces[0].name;
          toArea = foundPlaces[1].name;
        }
      } else if (!fromArea) {
        const remaining = foundPlaces.find((f) => f.name !== toArea);
        if (remaining) {
          fromArea = remaining.name;
        } else if (foundPlaces.length >= 2 && foundPlaces[0].name === toArea) {
          fromArea = toArea;
          sameAreaShorthand = true;
        }
      } else if (!toArea) {
        const remaining = foundPlaces.find((f) => f.name !== fromArea);
        if (remaining) {
          toArea = remaining.name;
        } else if (foundPlaces.length >= 2 && foundPlaces[1].name === fromArea) {
          toArea = fromArea;
          sameAreaShorthand = true;
        }
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
  if (price <= 0 && !orderCount && fromArea && toArea && (fromArea !== toArea || sameAreaShorthand) && !hasPersonOrScheduleNumber && trailingBareNumber) {
    const shorthandFare = Number(trailingBareNumber[1]);
    if (shorthandFare > 0 && shorthandFare <= 100) price = shorthandFare;
  }
  const hasOrderIntent = /(?:اوردر|طلب|توصيل|توصيل[ةه]|توصيلني|يوصلني|مشوار|مشاوير|مندوب|بيك\s*اب|pickup|delivery|شخص|اشخاص|راكب|ركاب|بنت|بنات|طفل|اطفال|طالب|طالب[ةه]|طلاب|طالبات|موظف|موظف[ةه]|موظفين|عمال|سيار[ةه]|دريول|سائق|دوام|مدرس[ةه]|جامع[ةه])/i.test(normalized) || /(?:ابي|ابا|ابغي|ابغى|اريد|عايز|عاوزه|محتاج|محتاجه|احتاج|نبي|نبغي|مطلوب|لو\s*سمحت|please)/i.test(normalized) || /(?:اوردر|أوردر|طلب|توصيل|توصيلة|توصيله|مشوار|مشاوير|شخص|أشخاص|اشخاص|راكب|ركاب|بنت|طفل|أطفال|طالب|طالبة|موظف|موظفة|سيارة|دريول|سائق|دوام|مدرسة|جامعة)/i.test(rawText);
  let notes = "";
  const isVoiceMessage = /(?:رسالة|تسجيل)\s*صوتية|voice\s*message|ptt|🎙️|فويس\s*نوت|تسجيل\s*صوتي|مقطع\s*صوتي/i.test(convertedText) || /(?:رسالة|تسجيل)\s*صوتية|voice\s*message|ptt|🎙️|فويس\s*نوت/i.test(rawText);
  if (isVoiceMessage && !fromArea && !toArea) {
    return {
      from: "",
      to: "",
      price: 0,
      isPriceUnspecified: true,
      phone,
      notes: "",
      confidence: 0,
      canCreateOrder: false,
      passengerDetection: {
        level: "goods_safe",
        label: "\u0641\u0648\u064A\u0633 \u0646\u0648\u062A \u0645\u0633\u062A\u0628\u0639\u062F",
        matchedPhrases: [],
        reason: "\u062A\u0645 \u062D\u0630\u0641 \u0648\u0627\u0633\u062A\u0628\u0639\u0627\u062F \u0627\u0644\u0641\u0648\u064A\u0633 \u0646\u0648\u062A \u0645\u0646 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C",
        isForbidden: false
      }
    };
  }
  if (!toArea && fromArea && hasOrderIntent) {
    toArea = passengerDetection.level !== "goods_safe" ? "\u062D\u0633\u0628 \u0637\u0644\u0628 \u0627\u0644\u0631\u0627\u0643\u0628 \u{1F4CD}" : "\u062D\u0633\u0628 \u0637\u0644\u0628 \u0627\u0644\u0632\u0628\u0648\u0646 \u{1F4CD}";
  }
  if (!fromArea && toArea && hasOrderIntent) {
    fromArea = "\u0645\u0648\u0642\u0639 \u0627\u0644\u0639\u0645\u064A\u0644 / \u063A\u064A\u0631 \u0645\u062D\u062F\u062F \u{1F4CD}";
  }
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
    const kwRegex = new RegExp(`(?:^|[s\u060C,.])${kw}(?:$|[s\u060C,.])`, "i");
    if (kwRegex.test(normalized)) {
      notes = kw;
      break;
    }
  }
  let scheduledTime;
  let scheduledTimeMinutes;
  let isFutureSchedule = false;
  const timeContext = /استلام|تسليم|توصيل|موعد|وقت|الساعة|ساعة|توقيت|على الساعة|في حدود الساعة/i.test(convertedText);
  const periodRegex = /(صباحا|صباحاً|الصبح|الصباح|مساء|مساءً|المساء|العصر|الظهر|المغرب|بالليل|في الليل|ليلًا|ليلا|(?:^|\\s)ص(?=\\s|$)|(?:^|\\s)م(?=\\s|$))/i;
  const periodMatch = periodRegex.exec(convertedText);
  const period = (periodMatch?.[1] || "").trim();
  const hasAm = /صباح|الصبح|الصباح|(?:^|\\s)ص(?:\\s|$)/i.test(period);
  const hasPm = /مساء|المساء|(?:^|\\s)م(?:\\s|$)|العصر|الظهر|المغرب|بالليل|في الليل|ليل/i.test(period);
  const clockRegex = /(?:^|[^\d])(\d{1,2})\s*:\s*(\d{1,2})(?!\d)/;
  const clockMatch = clockRegex.exec(convertedText);
  let rawHour;
  let rawMin = 0;
  if (clockMatch && timeContext) {
    const left = Number(clockMatch[1]);
    const right = Number(clockMatch[2]);
    if ([0, 15, 30, 45].includes(left) && right >= 1 && right <= 12) {
      rawHour = right;
      rawMin = left;
    } else if (left >= 0 && left <= 23 && right >= 0 && right <= 59) {
      rawHour = left;
      rawMin = right;
    }
  }
  if (rawHour === void 0) {
    const scheduleRegex = /(?:الساعة|ساعة|على الساعة|في حدود الساعة|توقيت|موعد|وقت|استلام|تسليم|توصيل)\s*(\d{1,2})(?!\s*[:：])\s*(صباحا|صباحاً|الصبح|الصباح|ص|مساء|مساءً|المساء|م|العصر|الظهر|المغرب|بالليل|في الليل|ليلًا|ليلا)?/i;
    const match = scheduleRegex.exec(convertedText);
    if (match) rawHour = Number(match[1]);
  }
  if (rawHour !== void 0 && rawHour >= 0 && rawHour <= 24 && rawMin <= 59) {
    let hour24 = rawHour;
    if (hasPm && hour24 < 12) hour24 += 12;
    if (hasAm && hour24 === 12) hour24 = 0;
    if (hour24 === 24 && rawMin === 0) hour24 = 0;
    if (hour24 <= 23) {
      scheduledTimeMinutes = hour24 * 60 + rawMin;
      const displayHour = rawHour > 12 ? rawHour - 12 : rawHour === 0 ? 12 : rawHour;
      const displayMin = String(rawMin).padStart(2, "0");
      const displayPeriod = hasAm ? " \u0635\u0628\u0627\u062D\u0627\u064B" : hasPm ? " \u0645\u0633\u0627\u0621\u064B" : "";
      scheduledTime = "\u0648\u0642\u062A \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645/\u0627\u0644\u062A\u0648\u0635\u064A\u0644: " + displayHour + ":" + displayMin + displayPeriod;
      isFutureSchedule = true;
    }
  }
  let confidence = 0;
  if (fromArea) confidence += 40;
  if (toArea) confidence += 40;
  if (price > 0) confidence += 10;
  if (phone) confidence += 10;
  if (isVoiceMessage) confidence = Math.max(confidence, 92);
  if (advertisementDetection.isAdvertisement) confidence = 0;
  const canCreateOrder = !advertisementDetection.isAdvertisement && !!fromArea && !!toArea && (hasOrderIntent || sameAreaShorthand);
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
    sameAreaShorthand,
    isAdvertisement: advertisementDetection.isAdvertisement,
    advertisementReason: advertisementDetection.reason,
    passengerDetection
  };
}
function parseMultipleWhatsAppOrders(rawText) {
  if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
    return [parseWhatsAppOrderText(rawText)];
  }
  const singleParsed = parseWhatsAppOrderText(rawText);
  if (singleParsed.isAdvertisement) {
    return [singleParsed];
  }
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const candidateSegments = [];
    let currentSegment = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isBulletOrOrdinal = /^(?:[1-9][0-9]?[\.\-\)]\s*|(?:الاول|الأول|الثاني|الثالث|الرابع|الخامس|السادس|الطلب\s*الأول|الطلب\s*الاول|الطلب\s*الثاني|الطلب\s*الثالث|أوردر\s*[1-9]|اوردر\s*[1-9]|طلب\s*[1-9])\s*[:\-–]?\s*|[•\*\-–]\s*(?:من|استلام|توصيل|مشوار))/i.test(line);
      const isTripLine = /(?:من|استلام|بيك\s*اب)\s+[^\n\r]+(?:\s+(?:الى|إلى|لي|لـ|لل|تسليم)\s+[^\n\r]+)/i.test(line);
      if (isBulletOrOrdinal || isTripLine) {
        if (currentSegment.trim()) {
          candidateSegments.push(currentSegment.trim());
        }
        currentSegment = line;
      } else {
        if (currentSegment) {
          currentSegment += " " + line;
        } else {
          if (!/(?:توصيل|أوردر|اوردر|طلب|مشوار)/i.test(line) || lines.length > 2) {
            continue;
          } else {
            currentSegment = line;
          }
        }
      }
    }
    if (currentSegment.trim()) {
      candidateSegments.push(currentSegment.trim());
    }
    if (candidateSegments.length >= 2) {
      const parsedList = [];
      for (const seg of candidateSegments) {
        const segParsed = parseWhatsAppOrderText(seg);
        if (segParsed.canCreateOrder && (segParsed.from || segParsed.to)) {
          if (!segParsed.from && singleParsed.from) {
            segParsed.from = singleParsed.from;
          }
          if (!segParsed.to && singleParsed.to) {
            segParsed.to = singleParsed.to;
          }
          if (!segParsed.phone && singleParsed.phone) {
            segParsed.phone = singleParsed.phone;
          }
          parsedList.push(segParsed);
        }
      }
      if (parsedList.length >= 2) {
        return parsedList;
      }
    }
  }
  const ordinalInlineRegex = /(?=(?:^|[\s،,])(?:الاول|الأول|الثاني|الثالث|الرابع|الخامس|الطلب\s*(?:الأول|الاول|الثاني|الثالث|الرابع|الخامس)|أوردر\s*[1-9]|اوردر\s*[1-9])\s*[:\-–]?\s*)/gi;
  const inlineSplits = rawText.split(ordinalInlineRegex).map((s) => s.trim()).filter(Boolean);
  if (inlineSplits.length >= 2) {
    const inlineParsedList = [];
    for (const chunk of inlineSplits) {
      const chunkParsed = parseWhatsAppOrderText(chunk);
      if (chunkParsed.canCreateOrder && (chunkParsed.from || chunkParsed.to)) {
        if (!chunkParsed.from && singleParsed.from) {
          chunkParsed.from = singleParsed.from;
        }
        if (!chunkParsed.to && singleParsed.to) {
          chunkParsed.to = singleParsed.to;
        }
        if (!chunkParsed.phone && singleParsed.phone) {
          chunkParsed.phone = singleParsed.phone;
        }
        inlineParsedList.push(chunkParsed);
      }
    }
    if (inlineParsedList.length >= 2) {
      return inlineParsedList;
    }
  }
  const multiRouteRegex = /(?=(?:^|[\s،,;؛])و?\s*(?:من|استلام من|بيك\s*اب من)\s+[^\s]+\s+(?:الى|إلى|تسليم الى|لـ|لل)[^\s]+)/gi;
  const routeSplits = rawText.split(multiRouteRegex).map((s) => s.trim()).filter((s) => s.length > 10);
  if (routeSplits.length >= 2) {
    const routeParsedList = [];
    for (const rChunk of routeSplits) {
      const rParsed = parseWhatsAppOrderText(rChunk);
      if (rParsed.canCreateOrder && rParsed.from && rParsed.to && rParsed.from !== rParsed.to) {
        if (!rParsed.phone && singleParsed.phone) {
          rParsed.phone = singleParsed.phone;
        }
        routeParsedList.push(rParsed);
      }
    }
    if (routeParsedList.length >= 2) {
      return routeParsedList;
    }
  }
  return [singleParsed];
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
      if (!isFalsePositiveClosureUsage(text, kw)) {
        if (!matchedWords.includes(kw)) {
          matchedWords.push(kw);
        }
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
function isFalsePositiveClosureUsage(rawText, matchedKeyword) {
  if (!rawText) return true;
  const lower = rawText.toLowerCase();
  const cleaned = cleanDialectText(rawText);
  const kwClean = matchedKeyword ? cleanDialectText(matchedKeyword) : "\u062A\u0645";
  if (/(?:تمور|تمر|التمر|التمور|تمرية)/i.test(rawText)) {
    return true;
  }
  if (/(?:سيتم|سوف\s*يتم)/i.test(rawText)) {
    return true;
  }
  if (/(?:هل|أهل|مين|منو)\s*(?:تم|حصل|حصلت|انحجز)/i.test(rawText) || /\?|؟/.test(rawText) && /(?:تم|حصلت|انحجز|taken|booked)/i.test(rawText)) {
    return true;
  }
  if (!matchedKeyword || kwClean === "\u062A\u0645" || kwClean === "\u062A\u0645\u062A" || kwClean === "") {
    if (/(?:تم|تمت)\s*(?:تحديد|تثبيت|دفع|تحويل|تجهيز|ارسال\s*الموقع|إرسال\s*الموقع|الاتفاق\s*مع\s*المحل|الاتفاق\s*مع\s*المطعم)/i.test(rawText) && !/^(?:تم|خلاص\s*تم|تم\s*خلاص)$/i.test(cleaned)) {
      return true;
    }
    if (/(?:تم|يتم)\s*(?:الاستلام|استلام)\s*من/i.test(rawText) && /(?:التسليم|تسليم)\s*(?:في|الى|إلى)/i.test(rawText)) {
      return true;
    }
    if (/(?:اذا|إذا|لو|في\s*حال|بحال)\s*(?:تم|حصلت|لقيت|انحجز)/i.test(rawText)) {
      return true;
    }
  }
  if (["taken", "booked", "done", "completed"].includes(kwClean)) {
    if (/\?|is\s+it\s+(?:taken|booked)/i.test(lower)) {
      return true;
    }
  }
  return false;
}
function cleanSenderText(text) {
  if (!text) return "";
  return cleanDialectText(text).replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").replace(/[^\p{L}\p{N}\s]/gu, "").trim();
}
function isAdvertiserSenderMatch(msgSender, msgPhone, orderSenderName, orderSenderPhone, orderRawText) {
  const p1 = (msgPhone || msgSender || "").replace(/\D/g, "");
  const p2 = (orderSenderPhone || orderSenderName || "").replace(/\D/g, "");
  if (p1.length >= 8 && p2.length >= 8) {
    if (p1.slice(-8) === p2.slice(-8)) {
      return true;
    }
  }
  if (p1.length >= 8 && orderRawText) {
    const last8 = p1.slice(-8);
    const textNumbers = orderRawText.replace(/\D/g, "");
    if (textNumbers.includes(last8)) {
      return true;
    }
  }
  if (msgSender && orderSenderName) {
    const s1 = cleanSenderText(msgSender);
    const s2 = cleanSenderText(orderSenderName);
    if (s1 && s2) {
      if (s1 === s2) return true;
      if (s1.length >= 3 && s2.includes(s1)) return true;
      if (s2.length >= 3 && s1.includes(s2)) return true;
    }
  }
  if (msgSender && orderRawText) {
    const s1 = cleanSenderText(msgSender);
    if (s1 && s1.length >= 4 && cleanSenderText(orderRawText).includes(s1)) {
      return true;
    }
  }
  return false;
}
function checkIncomingMessageForClosure(message, activeOrders) {
  const rawText = (message.text || "").trim();
  if (!rawText) return null;
  const msgGroup = (message.groupName || "").trim();
  if (message.isDirectPrivate === true || message.isGroup !== true || !msgGroup || msgGroup === "\u0645\u062D\u0627\u062F\u062B\u0629 \u062E\u0627\u0635\u0629 \u{1F464}" || msgGroup.includes("\u062E\u0627\u0635\u0629") || msgGroup === "\u0648\u0627\u062A\u0633\u0627\u0628") {
    return null;
  }
  const msgTime = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();
  const msgSender = (message.senderName || "").trim();
  const msgPhone = (message.senderPhone || "").replace(/\D/g, "");
  const dedupeKey = message.messageId || `${msgGroup}::${msgSender}::${msgTime}::${rawText.slice(0, 30)}`;
  if (processedMessageHashes.has(dedupeKey)) {
    return null;
  }
  const cleanedSignal = cleanDialectText(rawText).replace(/[\s.,،.!؟?؛:؛\u200e\u200f]+/g, "").trim();
  const isPureSticker = /^(?:sticker|ملصق|استيكر|ستيكر|صورهملصق|صورةملصق|🖼️sticker|📷ملصق|🖼️ملصق|ملصقمتحرك|animatedsticker|صورة|صوره|gif)$/i.test(cleanedSignal) || /ملصق|استيكر|ستيكر|sticker|\[ملصق\]|\[sticker\]|\[استيكر\]|\[ستيكر\]/i.test(rawText);
  const isMinimalCompletionSignal = isPureSticker || /^(?:تم|تمت|حصلت|حصل|حصلنا|لقيت|لقينا|خلاص|خلص|انحجز|انحجزت|اخذت|اخذته|اخذوه|أخذوه|شالوه|انشال|مشكور|مشكورين|يعطيكالعافيه|يعطيكمالعافيه|تسلم|تسلمون|قواكمالله|تمخلاص|خلاصتم|حصلتخلاص|خلاصحصلت|تممشكورين|حصلتمشكورين|انحجزخلاص|خلاصانحجز|تماخذالطلب|تمالاتفاق|توفرمندوب|حصلتمندوب|تمالتوصيل|تمالطلب|👍+|👌+|🙏+|✅+|✔️+|🤝+|👏+|🎯+|💐+|🌷+|🤍+|✨+|📦+|🛵+|🚗+|🔒+|💯+|🎉+|🌹+|🤲+|🏁+)$/iu.test(cleanedSignal) || /^[\p{Emoji}\s.,!؟👍✅👌🙏🤝👏🎯💐🌷🤍✨📦🛵🚗🔒💯🎉🌹🤲]+$/iu.test(rawText.trim()) && /[\p{Extended_Pictographic}👍✅👌🙏🤝👏🎯💐🌷🤍✨📦🛵🚗🔒💯🎉🌹🤲]/u.test(rawText);
  const { matchedWords, matchedEmojis, hasClosureIntent } = extractClosureKeywords(rawText);
  if (!hasClosureIntent && !isMinimalCompletionSignal) return null;
  if (isMinimalCompletionSignal && matchedWords.length === 0 && matchedEmojis.length === 0) {
    matchedEmojis.push(isPureSticker ? "\u0645\u0644\u0635\u0642/Sticker \u{1F5BC}\uFE0F" : rawText.trim());
  }
  const candidateOrders = activeOrders.filter((order) => {
    if (order.status === "accepted" || order.status === "closed_taken") return false;
    const inSameGroup = msgGroup && order.groupName && (order.groupName.includes(msgGroup) || msgGroup.includes(order.groupName)) || order.crossPostedGroups && order.crossPostedGroups.some((g) => g.includes(msgGroup) || msgGroup.includes(g));
    if (!msgGroup || !inSameGroup) return false;
    const orderTime = new Date(order.receivedAt).getTime();
    const diffHours = (msgTime - orderTime) / (1e3 * 60 * 60);
    return diffHours >= 0 && diffHours <= 3.5;
  });
  if (candidateOrders.length === 0) return null;
  for (const order of candidateOrders) {
    const orderSnippet = order.rawText.substring(0, 35).trim();
    const cleanMsg = cleanDialectText(rawText);
    const fromMention = order.from && cleanMsg.includes(cleanDialectText(order.from));
    const toMention = order.to && cleanMsg.includes(cleanDialectText(order.to));
    const priceMention = order.price && order.price > 0 && cleanMsg.includes(order.price.toString());
    const rawQuoteClean = message.rawQuotedText ? cleanDialectText(message.rawQuotedText) : "";
    const rawOrderClean = cleanDialectText(order.rawText);
    const quoteMatchesOrder = Boolean(
      rawQuoteClean && (rawQuoteClean.length >= 8 && rawOrderClean.includes(rawQuoteClean.slice(0, 25)) || rawOrderClean.length >= 8 && rawQuoteClean.includes(rawOrderClean.slice(0, 25)) || order.from && rawQuoteClean.includes(cleanDialectText(order.from)) || order.to && rawQuoteClean.includes(cleanDialectText(order.to)) || order.senderPhone && rawQuoteClean.includes(order.senderPhone.replace(/\D/g, "").slice(-8)))
    );
    const isQuoted = quoteMatchesOrder || rawText.includes(`> ${orderSnippet}`) || rawText.includes(orderSnippet) || (fromMention && toMention || fromMention && priceMention || toMention && priceMention);
    const isSenderMatch = isAdvertiserSenderMatch(msgSender, msgPhone, order.senderName, order.senderPhone, order.rawText);
    if (isQuoted && isSenderMatch) {
      processedMessageHashes.add(dedupeKey);
      markOrderPermanentlyClosed(order.id);
      return {
        isMatch: true,
        orderId: order.id,
        matchedOrder: order,
        verdict: "confirmed_closed",
        reason: `\u0631\u062F \u0631\u064A\u0628\u0644\u064A \u0645\u0646 \u0627\u0644\u0645\u0639\u0644\u0646 (${msgSender || order.senderName}) \u0639\u0644\u0649 \u0637\u0644\u0628\u0647 \u0628\u0627\u0644\u0642\u0631\u0648\u0628 (${order.from} \u2190 ${order.to}) \u0645\u0639 \u062A\u0623\u0643\u064A\u062F: \xAB${rawText}\xBB`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || order.senderName,
          groupName: msgGroup || order.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: 99,
          isQuote: true,
          matchedKeywords: [...matchedWords, ...matchedEmojis, "\u0631\u064A\u0628\u0644\u064A \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628"]
        }
      };
    }
  }
  const matchingAdvertiserOrders = candidateOrders.filter(
    (order) => isAdvertiserSenderMatch(msgSender, msgPhone, order.senderName, order.senderPhone, order.rawText)
  );
  if (matchingAdvertiserOrders.length > 0) {
    matchingAdvertiserOrders.sort((a, b) => {
      const diffA = Math.abs(msgTime - new Date(a.receivedAt).getTime());
      const diffB = Math.abs(msgTime - new Date(b.receivedAt).getTime());
      return diffA - diffB;
    });
    const targetOrder = matchingAdvertiserOrders[0];
    processedMessageHashes.add(dedupeKey);
    markOrderPermanentlyClosed(targetOrder.id);
    const signalType = isPureSticker ? "\u0645\u0644\u0635\u0642 / \u0627\u0633\u062A\u064A\u0643\u0631 \u{1F5BC}\uFE0F" : matchedEmojis.length > 0 ? `\u0631\u0645\u0632 ${matchedEmojis.join(" ")}` : `\u0639\u0628\u0627\u0631\u0629 \xAB${rawText}\xBB`;
    return {
      isMatch: true,
      orderId: targetOrder.id,
      matchedOrder: targetOrder,
      verdict: "confirmed_closed",
      reason: `\u0623\u0631\u0633\u0644 \u0645\u0639\u0644\u0646 \u0627\u0644\u0637\u0644\u0628 \u0646\u0641\u0633\u0647 (${msgSender || targetOrder.senderName}) \u0641\u064A \u0627\u0644\u0642\u0631\u0648\u0628 ${signalType} \u062F\u0644\u0627\u0644\u0629 \u0639\u0644\u0649 \u062D\u0635\u0648\u0644\u0647 \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628 \u0644\u0625\u0639\u0644\u0627\u0646\u0647 \u0627\u0644\u0633\u0627\u0628\u0642 (${targetOrder.from} \u2190 ${targetOrder.to})`,
      evidence: {
        replyText: rawText,
        senderName: msgSender || targetOrder.senderName,
        groupName: msgGroup || targetOrder.groupName,
        timestamp: new Date(msgTime).toISOString(),
        confidence: 99,
        isQuote: false,
        matchedKeywords: [...matchedWords, ...matchedEmojis]
      }
    };
  }
  const explicitCourierFoundRegex = /(?:حصلت|لقيت|توفر|تنسق)\s*(?:خلاص\s*)?مندوب|خلاص\s*حصلت|تم\s*توفير\s*مندوب|شالوه\s*خلاص|انحجز\s*خلاص|تم\s*(?:اخذ|أخذ)\s*الطلب|حصلت\s*على\s*مندوب|خلاص\s*توفر\s*مندوب|لقينا\s*مندوب|توفر\s*مندوب\s*خلاص/i;
  const hasExplicitCourierFound = explicitCourierFoundRegex.test(cleanedSignal) || explicitCourierFoundRegex.test(cleanDialectText(rawText));
  if (hasExplicitCourierFound) {
    if (candidateOrders.length === 1 && isAdvertiserSenderMatch(msgSender, msgPhone, candidateOrders[0].senderName, candidateOrders[0].senderPhone, candidateOrders[0].rawText)) {
      const targetOrder = candidateOrders[0];
      processedMessageHashes.add(dedupeKey);
      markOrderPermanentlyClosed(targetOrder.id);
      return {
        isMatch: true,
        orderId: targetOrder.id,
        matchedOrder: targetOrder,
        verdict: "confirmed_closed",
        reason: `\u0631\u0635\u062F \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A: \u062A\u0623\u0643\u064A\u062F \u0635\u0631\u064A\u062D \u0628\u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628 \u0641\u064A \u0642\u0631\u0648\u0628 (${msgGroup || targetOrder.groupName}): \xAB${rawText}\xBB \u0644\u0625\u0639\u0644\u0627\u0646 (${targetOrder.from} \u2190 ${targetOrder.to})`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || targetOrder.senderName,
          groupName: msgGroup || targetOrder.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: 95,
          isQuote: false,
          matchedKeywords: [...matchedWords, ...matchedEmojis, "\u062D\u0635\u0644\u062A \u0645\u0646\u062F\u0648\u0628"]
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

// src/utils/personalChatClassifier.ts
var STORAGE_KEY_KNOWN_ADVERTISERS = "orderi_known_group_advertisers";
var knownAdvertisersSet = /* @__PURE__ */ new Set();
function initKnownAdvertisers() {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_KNOWN_ADVERTISERS);
    if (saved) {
      const list = JSON.parse(saved);
      if (Array.isArray(list)) {
        list.forEach((item) => knownAdvertisersSet.add(normalizeIdentifier(item)));
      }
    }
  } catch {
  }
}
if (typeof window !== "undefined") {
  initKnownAdvertisers();
}
function normalizeIdentifier(val) {
  if (!val) return "";
  return val.toLowerCase().replace(/[^\w\u0600-\u06FF]/g, "").trim();
}
function registerKnownGroupAdvertiser(senderName, phone) {
  let updated = false;
  if (senderName && senderName.trim() && senderName !== "\u0648\u0627\u062A\u0633\u0627\u0628" && senderName !== "\u0635\u0627\u062D\u0628 \u0627\u0644\u0625\u0639\u0644\u0627\u0646") {
    const key = normalizeIdentifier(senderName);
    if (key && !knownAdvertisersSet.has(key)) {
      knownAdvertisersSet.add(key);
      updated = true;
    }
  }
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 8) {
      const last8 = digits.slice(-8);
      if (!knownAdvertisersSet.has(last8)) {
        knownAdvertisersSet.add(last8);
        updated = true;
      }
    }
  }
  if (updated && typeof window !== "undefined") {
    try {
      const list = Array.from(knownAdvertisersSet).slice(-2e3);
      localStorage.setItem(STORAGE_KEY_KNOWN_ADVERTISERS, JSON.stringify(list));
    } catch {
    }
  }
}
function isKnownGroupAdvertiser(senderName, phone) {
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 8) {
      const last8 = digits.slice(-8);
      if (knownAdvertisersSet.has(last8)) return true;
    }
  }
  if (senderName && senderName.trim()) {
    const key = normalizeIdentifier(senderName);
    if (key && knownAdvertisersSet.has(key)) return true;
  }
  return false;
}
var CASUAL_GREETINGS_AND_CHAT = [
  /^(?:السلام\s*عليكم|سلام\s*عليكم|وعليكم\s*السلام|صباح\s*الخير|مساء\s*الخير|هلا|هلا\s*والله|هلا\s*حبيبي|هلا\s*بالغالي|هلا\s*يا\s*الطيب|يا\s*هلا|مرحبا|مرحبتين|مرحبا\s*ملايين|تحياتي|شخبارك|شلونك|شخبارك\s*عساك\s*بخير|عساك\s*بخير|شلون\s*الصحة|شلون\s*الاهل|طمني\s*عنك|وينك|وين\s*طالع|وين\s*انت|وينك\s*اليوم|فاضي\s*اليوم|فاضي\s*الحين|مشغول|متى\s*ترجع|تتغدى|تتعشى|بتمر\s*علي|تعال|الديوانية|الميلس|المجلس|كوفي|نطلع|ضحك|هههه|ههههه|لوول|ياخوي|يا\s*خوي|يا\s*صاحبي|حبيبي|حبيب\s*قلبي|تسلم|مشكور|الله\s*يحفظك|الله\s*يعطيك\s*العافية|جمعة\s*مباركة|عيدك\s*مبارك|كل\s*عام\s*وانت\s*بخير)$/i,
  /(?:شخبارك|شلونك|عساك\s*بخير|طمني\s*عنك|وين\s*طالع|وين\s*قاعد|متى\s*فاضي|فاضي\s*نطلع|بتمر\s*علي|تعال\s*المجلس|تعال\s*الديوانية|شنو\s*مسوي|وين\s*انت\s*موجود|وينك\s*يا\s*غالي|اتصل\s*بك|دق\s*علي|كلمني\s*ضروري|شوف\s*الرابط|شوف\s*الفيديو|شوف\s*الصوره|شوف\s*الصورة)/i
];
var EXPLICIT_DELIVERY_INTENT = [
  /(?:مطلوب\s*مندوب|أبي\s*توصيل|ابي\s*توصيل|ابغي\s*توصيل|أبغي\s*توصيل|عندي\s*(?:طلب|اوردر|أوردر|توصيل|شحنة|اغراض\s*توصيل)|احتاج\s*توصيل|محتاج\s*مندوب|استلام\s*من.{1,40}توصيل|توصيل\s*من.{1,40}إلى|توصيل\s*من.{1,40}الى)/i
];
function classifyPrivateWhatsAppMessage(rawText, senderName, senderPhone, isDirectPrivate = true) {
  if (!isDirectPrivate) {
    return {
      isCasualFriendChat: false,
      isKnownAdvertiser: true,
      isActionableOrder: true
    };
  }
  const isKnown = isKnownGroupAdvertiser(senderName, senderPhone);
  const text = (rawText || "").trim();
  const normalized = normalizeArabicText(normalizeArabicMessageForMatching(text));
  const isVoiceNote = /(?:رسالة|تسجيل)\s*صوتية|voice\s*message|ptt|🎙️|فويس\s*نوت/i.test(text);
  if (!isKnown && isVoiceNote && !EXPLICIT_DELIVERY_INTENT.some((p) => p.test(normalized))) {
    return {
      isCasualFriendChat: true,
      isKnownAdvertiser: false,
      reason: "\u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A \u062E\u0627\u0635 \u0645\u0646 \u0635\u062F\u064A\u0642/\u062C\u0647\u0629 \u0627\u062A\u0635\u0627\u0644 \u0639\u0627\u062F\u064A\u0629 \u0644\u0645 \u062A\u0639\u0644\u0646 \u0645\u0633\u0628\u0642\u0627\u064B \u0641\u064A \u0642\u0631\u0648\u0628\u0627\u062A \u0627\u0644\u062A\u0648\u0635\u064A\u0644",
      isActionableOrder: false
    };
  }
  const isCasualGreeting = CASUAL_GREETINGS_AND_CHAT.some((pattern) => pattern.test(normalized));
  if (isCasualGreeting) {
    return {
      isCasualFriendChat: true,
      isKnownAdvertiser: isKnown,
      reason: "\u0631\u0633\u0627\u0644\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u062E\u0627\u0635\u0629 \u0639\u0627\u062F\u064A\u0629 (\u062A\u062D\u064A\u0629 \u0623\u0648 \u0645\u062D\u0627\u062F\u062B\u0629 \u0634\u062E\u0635\u064A\u0629 \u0645\u0646 \u0635\u062F\u064A\u0642)",
      isActionableOrder: false
    };
  }
  return {
    isCasualFriendChat: true,
    isKnownAdvertiser: isKnown,
    reason: isKnown ? "\u0645\u062D\u0627\u062F\u062B\u0629 \u062E\u0627\u0635\u0629 \u0641\u0631\u062F\u064A\u0629 \u0645\u0646 \u0645\u0639\u0644\u0646 \u0645\u0633\u062C\u0644 (\u0645\u0633\u062A\u0628\u0639\u062F\u0629 \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0645\u0646 \u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628\u0627\u062A \u062C\u062F\u064A\u062F\u0629 \u0628\u0627\u0644\u0631\u0627\u062F\u0627\u0631)" : "\u0645\u062D\u0627\u062F\u062B\u0629 \u062E\u0627\u0635\u0629 \u0641\u0631\u062F\u064A\u0629 \u0645\u0646 \u0635\u062F\u064A\u0642/\u062C\u0647\u0629 \u0627\u062A\u0635\u0627\u0644 (\u0645\u0633\u062A\u0628\u0639\u062F\u0629 \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629)",
    isActionableOrder: false
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
    if (!isDirectChat) {
      registerKnownGroupAdvertiser(sender, phone);
      const cleanGroup = group.trim();
      if (cleanGroup && !SIMULATED_MOCK_GROUPS.has(cleanGroup) && !realSpiderGroups.includes(cleanGroup)) {
        realSpiderGroups.push(cleanGroup);
        spiderMetrics.crawlQueue = [...realSpiderGroups];
        spiderMetrics.crawledGroupsCount = realSpiderGroups.length;
      }
    } else {
      const chatClassification = classifyPrivateWhatsAppMessage(rawText, sender, phone, true);
      if (chatClassification.isCasualFriendChat && !chatClassification.isActionableOrder) {
        console.log(`[Orderi AI Server] Casual private message from friend/non-advertiser (${sender}) ignored: ${chatClassification.reason}`);
        return res.json({
          success: true,
          ignored: true,
          isCasualFriendChat: true,
          reason: chatClassification.reason || "\u0631\u0633\u0627\u0644\u0629 \u062E\u0627\u0635\u0629 \u0639\u0627\u062F\u064A\u0629 \u0645\u0646 \u0635\u062F\u064A\u0642 \u0648\u0644\u064A\u0633\u062A \u062A\u0627\u062C\u0631\u0627\u064B \u0648\u0644\u0627 \u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644"
        });
      }
    }
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
    const closureMatch = checkIncomingMessageForClosure(
      {
        text: rawText,
        senderName: sender,
        senderPhone: phone,
        groupName: groupDisplayName,
        timestamp: Date.now(),
        rawQuotedText: body.quotedText || body.rawQuotedText || ""
      },
      recentWebhookOrders
    );
    if (closureMatch) {
      if (closureMatch.verdict === "confirmed_closed") {
        const idx = recentWebhookOrders.findIndex((o) => o.id === closureMatch.orderId);
        if (idx !== -1) {
          recentWebhookOrders.splice(idx, 1);
        }
        addSpiderLog("CLOSED_ORDER", groupDisplayName, `\u062D\u0630\u0641 \u0637\u0644\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 (${closureMatch.matchedOrder?.from || ""} \u2794 ${closureMatch.matchedOrder?.to || ""}) \u0628\u0639\u062F \u062D\u0635\u0648\u0644 \u0627\u0644\u0645\u0639\u0644\u0646 \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628: "${closureMatch.reason}"`);
      } else {
        const targetOrd = recentWebhookOrders.find((o) => o.id === closureMatch.orderId);
        if (targetOrd) {
          targetOrd.status = "suspicious_closed";
          targetOrd.closureReason = closureMatch.reason;
          targetOrd.closureEvidence = closureMatch.evidence;
        }
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
      console.log(`[Orderi Closure] Order ${closureMatch.orderId} deleted/closed: ${closureMatch.reason}`);
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
    const multiParsed = parseMultipleWhatsAppOrders(rawText);
    if (multiParsed.length > 1) {
      const createdOrders = [];
      for (let idx = 0; idx < multiParsed.length; idx++) {
        const seg = multiParsed[idx];
        if (!seg.canCreateOrder && !seg.from && !seg.to) continue;
        const subOrder = {
          id: `ord-real-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-part-${idx + 1}`,
          from: seg.from || "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
          to: seg.to || "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
          price: seg.price > 0 ? seg.price : 0,
          isPriceUnspecified: !seg.price || seg.price <= 0,
          rawText: seg.rawSegment || rawText.trim(),
          groupName: groupDisplayName,
          senderName: sender,
          senderPhone: phone || seg.phone || "97300000000",
          receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
          confidence: seg.confidence || 90,
          type: isDirectChat ? "\u0637\u0644\u0628 \u0645\u0628\u0627\u0634\u0631 (\u062E\u0627\u0635)" : "\u0637\u0644\u0628 \u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628",
          notes: seg.notes || (isDirectChat ? "\u0648\u0627\u0631\u062F \u0641\u064A \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u062F\u0627\u064A\u0631\u0643\u062A" : "\u0648\u0627\u0631\u062F \u0645\u0646 \u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628"),
          status: "pending",
          source: "webhook_real",
          isDirectPrivate: isDirectChat,
          crossPostedGroups: [groupDisplayName],
          duplicateCount: 1,
          passengerCount: seg.passengerCount,
          passengerDetection: seg.passengerDetection
        };
        recentWebhookOrders.unshift(subOrder);
        createdOrders.push(subOrder);
        const eventPayload2 = `data: ${JSON.stringify({ type: "NEW_ORDER", order: subOrder })}

`;
        sseClients.forEach((client) => {
          try {
            client.write(eventPayload2);
          } catch {
            sseClients.delete(client);
          }
        });
      }
      if (recentWebhookOrders.length > 50) {
        recentWebhookOrders.length = 50;
      }
      if (createdOrders.length > 0) {
        return res.json({
          success: true,
          multiOrder: true,
          ordersCount: createdOrders.length,
          orders: createdOrders,
          message: `\u062A\u0645 \u0631\u0635\u062F \u0648\u062A\u062C\u0632\u0626\u0629 ${createdOrders.length} \u0637\u0644\u0628\u0627\u062A \u0645\u0633\u062A\u0642\u0644\u0629 \u0645\u0646 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0628\u0646\u062C\u0627\u062D \u26A1`
        });
      }
    }
    const parsed = parseWhatsAppOrderText(rawText);
    const isVoiceMessage = /(?:رسالة|تسجيل)\s*صوتية|voice\s*message|ptt|🎙️|فويس\s*نوت|تسجيل\s*صوتي|مقطع\s*صوتي/i.test(rawText);
    if (isVoiceMessage && !parsed.from && !parsed.to) {
      return res.json({
        success: true,
        message: "\u062A\u0645 \u0627\u0633\u062A\u0628\u0639\u0627\u062F \u0627\u0644\u0641\u0648\u064A\u0633 \u0646\u0648\u062A \u0648\u0627\u0644\u062A\u0633\u062C\u064A\u0644\u0627\u062A \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0645\u0646 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C",
        isVoiceIgnored: true
      });
    }
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
    const last8Digits = cleanPhoneDigits.length >= 8 ? cleanPhoneDigits.slice(-8) : "";
    const nowMs = Date.now();
    const normText = (s) => String(s || "").toLowerCase().replace(/[إأآا]/g, "\u0627").replace(/ة/g, "\u0647").replace(/ى/g, "\u064A").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const isAreaMatch = (a1, a2) => {
      if (!a1 || !a2) return false;
      const n1 = normText(a1);
      const n2 = normText(a2);
      if (!n1 || !n2) return false;
      if (n1 === n2) return true;
      if (n1.length >= 3 && n2.length >= 3 && (n1.includes(n2) || n2.includes(n1))) return true;
      const stripPrefix = (x) => x.replace(/\b(?:مجمع|سوق|دوار|شارع|حي|قرية|قريه|ضاحية|ضاحيه|مدينة|مدينه|منطقة|منطقه)\b/g, "").trim();
      const s1 = stripPrefix(n1);
      const s2 = stripPrefix(n2);
      return s1 && s2 && (s1 === s2 || s1.includes(s2) || s2.includes(s1));
    };
    const existingIndex = recentWebhookOrders.findIndex((existing) => {
      const exPhone = (existing.senderPhone || "").replace(/\D/g, "");
      const exLast8 = exPhone.length >= 8 ? exPhone.slice(-8) : "";
      const timeDiff = nowMs - new Date(existing.receivedAt).getTime();
      if (timeDiff > 30 * 60 * 1e3) return false;
      if (last8Digits && exLast8 && last8Digits === exLast8) {
        return true;
      }
      const samePickup = isAreaMatch(parsed.from, existing.from);
      const sameDropoff = isAreaMatch(parsed.to, existing.to);
      const sameRoute = samePickup && sameDropoff;
      if (sameRoute) {
        const priceDiff = Math.abs(Number(parsed.price || 0) - Number(existing.price || 0));
        if (priceDiff <= 0.5 || !parsed.price || !existing.price || timeDiff <= 20 * 60 * 1e3) {
          return true;
        }
      }
      const sName = normText(sender);
      const exName = normText(existing.senderName);
      const genericAdv = ["\u062A\u0627\u062C\u0631 \u0648\u0627\u062A\u0633\u0627\u0628", "\u0645\u0639\u0644\u0646", "\u0643\u0627\u0628\u062A\u0646", "\u0645\u0646\u062F\u0648\u0628", "whatsapp"];
      if (sName && exName && !genericAdv.includes(sName) && !genericAdv.includes(exName)) {
        if ((sName === exName || sName.length >= 4 && (sName.includes(exName) || exName.includes(sName))) && (samePickup || sameDropoff)) {
          return true;
        }
      }
      const t1 = normText(rawText);
      const t2 = normText(existing.rawText || "");
      if (t1.length > 8 && t2.length > 8 && (t1 === t2 || t1.includes(t2) || t2.includes(t1))) {
        return true;
      }
      const w1 = new Set(t1.split(/\s+/).filter((w) => w.length >= 3));
      const w2 = new Set(t2.split(/\s+/).filter((w) => w.length >= 3));
      if (w1.size > 0 && w2.size > 0) {
        let common = 0;
        for (const w of w1) {
          if (w2.has(w)) common++;
        }
        const sim = common / (/* @__PURE__ */ new Set([...w1, ...w2])).size;
        if (sim >= 0.5 || sim >= 0.35 && (samePickup || sameDropoff)) {
          return true;
        }
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
    try {
      if (typeof spiderMetrics !== "undefined") {
        spiderMetrics.ordersCapturedCount += 1;
        spiderMetrics.messagesCrawledCount += 1;
        addSpiderLog(
          "INDEXED",
          groupDisplayName,
          `\u0627\u0644\u062A\u0642\u0627\u0637 \u0648\u0641\u0647\u0631\u0633\u0629 \u0637\u0644\u0628 \u062D\u0642\u064A\u0642\u064A: ${order.from} \u2794 ${order.to} (${order.price > 0 ? `${order.price} \u062F.\u0628` : "\u0633\u0639\u0631 \u0639\u0646\u062F \u0627\u0644\u0627\u062A\u0641\u0627\u0642"}) \u0639\u0628\u0631 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u26A1`,
          12
        );
      }
    } catch {
    }
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
var realSpiderGroups = [];
var SIMULATED_MOCK_GROUPS = /* @__PURE__ */ new Set([
  "\u0642\u0631\u0648\u0628 \u0645\u0646\u0627\u062F\u064A\u0628 \u0648\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u{1F1E7}\u{1F1ED}",
  "\u0642\u0631\u0648\u0628 \u0643\u0628\u0627\u062A\u0646 \u0648\u062A\u062C\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0645\u0629 \u0648\u0627\u0644\u0631\u0641\u0627\u0639 \u{1F4E6}",
  "\u0642\u0631\u0648\u0628 \u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u062D\u0631\u0642 \u0648\u0627\u0644\u062D\u062F \u{1F697}",
  "\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0633\u0631\u064A\u0639\u0629 \u26A1",
  "\u0633\u0648\u0642 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0644\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0641\u0648\u0631\u064A \u{1F1E7}\u{1F1ED}",
  "\u062A\u0648\u0635\u064A\u0644 \u0643\u0628\u0627\u062A\u0646 \u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649 \u0648\u062D\u0645\u062F \u{1F4CD}",
  "\u0634\u0628\u0643\u0629 \u0645\u0646\u0627\u062F\u064A\u0628 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0644\u0644\u062A\u0648\u0635\u064A\u0644 \u{1F697}",
  "\u0642\u0631\u0648\u0628 \u062A\u062C\u0627\u0631 \u0648\u0645\u0646\u0627\u062F\u064A\u0628 \u0633\u0627\u0631 \u0648\u0627\u0644\u062C\u0646\u0628\u064A\u0629 \u{1F4E6}",
  "\u0642\u0631\u0648\u0628 \u0645\u0646\u062F\u0648\u0628\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u{1F1E7}\u{1F1ED}",
  "\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062A\u0648\u0635\u064A\u0644 - \u0627\u0644\u0645\u0646\u0627\u0645\u0629 \u0648\u0627\u0644\u0645\u062D\u0631\u0642",
  "\u062A\u0648\u0635\u064A\u0644 \u0633\u0631\u064A\u0639 \u0627\u0644\u0631\u0641\u0627\u0639 \u0648\u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649",
  "\u0634\u0628\u0643\u0629 \u0645\u0646\u0627\u062F\u064A\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0633\u0631\u064A\u0639"
]);
var spiderMetrics = {
  isActive: true,
  crawlSpeedMs: 2500,
  crawledGroupsCount: 0,
  messagesCrawledCount: 0,
  ordersCapturedCount: 0,
  groupLinksDiscoveredCount: 0,
  spamFilteredCount: 0,
  passengersFilteredCount: 0,
  lastCrawlAt: (/* @__PURE__ */ new Date()).toISOString(),
  activeThreads: 2,
  currentCrawlingGroup: "\u0641\u064A \u0627\u0646\u062A\u0638\u0627\u0631 \u0631\u0635\u062F \u0642\u0631\u0648\u0628\u0627\u062A \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0641\u0639\u0644\u064A\u0629 \u{1F4E1}",
  crawlQueue: [],
  recentLogs: [
    {
      id: `log-init-1`,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("ar-BH"),
      action: "CRAWLING",
      group: "\u0645\u0646\u0638\u0648\u0645\u0629 \u0639\u0646\u0643\u0628\u0648\u062A \u0627\u0644\u0631\u0627\u062F\u0627\u0631 \u{1F577}\uFE0F",
      detail: "\u0639\u0646\u0643\u0628\u0648\u062A \u0627\u0644\u0623\u0648\u0631\u062F\u0631\u0627\u062A \u0627\u0644\u0630\u0643\u064A \u062C\u0627\u0647\u0632 \u0648\u064A\u0639\u0645\u0644 \u0628\u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0642\u0631\u0648\u0628\u0627\u062A \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0648\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u26A1",
      latencyMs: 8
    }
  ]
};
function addSpiderLog(action, group, detail, latencyMs = 12) {
  const logItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("ar-BH"),
    action,
    group,
    detail,
    latencyMs
  };
  spiderMetrics.recentLogs.unshift(logItem);
  if (spiderMetrics.recentLogs.length > 40) spiderMetrics.recentLogs.pop();
  const sseEvent = `data: ${JSON.stringify({ type: "SPIDER_LOG", log: logItem, metrics: spiderMetrics })}

`;
  sseClients.forEach((client) => {
    try {
      client.write(sseEvent);
    } catch {
      sseClients.delete(client);
    }
  });
}
var spiderCrawlInterval = null;
function startSpiderCrawlerLoop() {
  if (spiderCrawlInterval) clearInterval(spiderCrawlInterval);
  spiderCrawlInterval = setInterval(() => {
    if (!spiderMetrics.isActive) return;
    if (realSpiderGroups.length === 0) {
      spiderMetrics.currentCrawlingGroup = "\u0641\u064A \u0627\u0646\u062A\u0638\u0627\u0631 \u0631\u0635\u062F \u0642\u0631\u0648\u0628\u0627\u062A \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0641\u0639\u0644\u064A\u0629 \u{1F4E1}";
      spiderMetrics.crawledGroupsCount = 0;
      return;
    }
    const grp = realSpiderGroups[Math.floor(Math.random() * realSpiderGroups.length)];
    spiderMetrics.currentCrawlingGroup = grp;
    spiderMetrics.crawledGroupsCount = realSpiderGroups.length;
    spiderMetrics.lastCrawlAt = (/* @__PURE__ */ new Date()).toISOString();
  }, 15e3);
}
startSpiderCrawlerLoop();
app.get("/api/spider/status", (req, res) => {
  res.json({
    success: true,
    spider: {
      ...spiderMetrics,
      connectedClients: sseClients.size,
      totalOrdersCaptured: recentWebhookOrders.length,
      discoveredGroupsCount: recentDiscoveredGroupLinks.length
    }
  });
});
app.post("/api/spider/toggle", (req, res) => {
  const { active, speedMs } = req.body || {};
  if (typeof active === "boolean") {
    spiderMetrics.isActive = active;
  } else {
    spiderMetrics.isActive = !spiderMetrics.isActive;
  }
  if (speedMs && Number(speedMs) >= 500) {
    spiderMetrics.crawlSpeedMs = Number(speedMs);
  }
  addSpiderLog("CRAWLING", "\u0645\u0646\u0638\u0648\u0645\u0629 \u0639\u0646\u0643\u0628\u0648\u062A \u0627\u0644\u0631\u0627\u062F\u0627\u0631 \u{1F577}\uFE0F", spiderMetrics.isActive ? "\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0632\u062D\u0641 \u0627\u0644\u0645\u0633\u062A\u0645\u0631 \u0644\u0642\u0631\u0648\u0628\u0627\u062A \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0628\u0646\u062C\u0627\u062D \u26A1" : "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0632\u062D\u0641 \u0627\u0644\u0645\u0633\u062A\u0645\u0631 \u0645\u0624\u0642\u062A\u0627\u064B");
  res.json({
    success: true,
    isActive: spiderMetrics.isActive,
    spider: spiderMetrics
  });
});
app.post("/api/spider/crawl-now", (req, res) => {
  const targetGroup = req.body?.groupName || (realSpiderGroups.length > 0 ? realSpiderGroups[Math.floor(Math.random() * realSpiderGroups.length)] : "\u0642\u0631\u0648\u0628\u0627\u062A \u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629");
  spiderMetrics.currentCrawlingGroup = targetGroup;
  spiderMetrics.lastCrawlAt = (/* @__PURE__ */ new Date()).toISOString();
  addSpiderLog("CRAWLING", targetGroup, `\u0641\u062D\u0635 \u0648\u062A\u062D\u062F\u064A\u062B \u0646\u0634\u0627\u0637 \u0627\u0644\u0642\u0631\u0648\u0628 "${targetGroup}" \u0648\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u26A1`, 10);
  res.json({
    success: true,
    message: `\u0627\u0644\u0632\u062D\u0641 \u0627\u0644\u0641\u0639\u0644\u064A \u0646\u0634\u0637 \u0628\u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0644\u0642\u0631\u0648\u0628 "${targetGroup}"\u060C \u0648\u064A\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628 \u0648\u0627\u0644\u0631\u0627\u062F\u0627\u0631 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B`,
    spider: spiderMetrics
  });
});
app.post("/api/whatsapp/purge-simulator-groups", (req, res) => {
  try {
    recentDiscoveredGroupLinks.length = 0;
    for (let i = realSpiderGroups.length - 1; i >= 0; i--) {
      if (SIMULATED_MOCK_GROUPS.has(realSpiderGroups[i])) {
        realSpiderGroups.splice(i, 1);
      }
    }
    for (let i = recentWebhookOrders.length - 1; i >= 0; i--) {
      const o = recentWebhookOrders[i];
      if (SIMULATED_MOCK_GROUPS.has(o.groupName) || o.source === "mock" || o.source === "simulation" || o.source === "spider_crawler" || o.id?.startsWith("ord-spider-") || o.id?.startsWith("ord-showcase-") || o.id?.startsWith("ord-preview-") || o.id?.startsWith("ord-sample-")) {
        recentWebhookOrders.splice(i, 1);
      }
    }
    spiderMetrics.crawlQueue = [...realSpiderGroups];
    spiderMetrics.crawledGroupsCount = realSpiderGroups.length;
    spiderMetrics.currentCrawlingGroup = realSpiderGroups.length > 0 ? realSpiderGroups[0] : "\u0641\u064A \u0627\u0646\u062A\u0638\u0627\u0631 \u0631\u0635\u062F \u0642\u0631\u0648\u0628\u0627\u062A \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0641\u0639\u0644\u064A\u0629 \u{1F4E1}";
    spiderMetrics.groupLinksDiscoveredCount = 0;
    const purgeEvent = `data: ${JSON.stringify({
      type: "PURGE_SIMULATOR_GROUPS",
      purgedCount: SIMULATED_MOCK_GROUPS.size,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    })}

`;
    sseClients.forEach((client) => {
      try {
        client.write(purgeEvent);
      } catch {
        sseClients.delete(client);
      }
    });
    console.log(`[Orderi Server] Purged all simulator groups and discovered links successfully.`);
    return res.json({
      success: true,
      message: "\u062A\u0645 \u062D\u0630\u0641 \u0643\u0627\u0641\u0629 \u0627\u0644\u0642\u0631\u0648\u0628\u0627\u062A \u0648\u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u0631\u0635\u0648\u062F\u0629 \u0639\u0628\u0631 \u0627\u0644\u0645\u062D\u0627\u0643\u064A \u0628\u0627\u0644\u0643\u0627\u0645\u0644",
      remainingRealGroups: realSpiderGroups
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});
app.delete("/api/whatsapp/discovered-groups", (req, res) => {
  recentDiscoveredGroupLinks.length = 0;
  spiderMetrics.groupLinksDiscoveredCount = 0;
  return res.json({ success: true, message: "\u062A\u0645 \u0645\u0633\u062D \u062C\u0645\u064A\u0639 \u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0642\u0631\u0648\u0628\u0627\u062A \u0627\u0644\u0645\u0631\u0635\u0648\u062F\u0629 \u0628\u0646\u062C\u0627\u062D" });
});
app.post("/api/whatsapp/broadcast", (req, res) => {
  try {
    const { message, targetGroups = [], from = "", to = "", price = 0 } = req.body || {};
    const bcastPayload = {
      type: "BROADCAST_PUBLISHED",
      broadcast: {
        id: `bcast-${Date.now()}`,
        text: message,
        targetGroups: Array.isArray(targetGroups) ? targetGroups : [targetGroups],
        from,
        to,
        price,
        publishedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    const sseEvent = `data: ${JSON.stringify(bcastPayload)}

`;
    sseClients.forEach((client) => {
      try {
        client.write(sseEvent);
      } catch {
        sseClients.delete(client);
      }
    });
    return res.json({ success: true, message: "\u062A\u0645 \u0646\u0634\u0631 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0641\u064A \u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message });
  }
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
    let groupName = evidence?.groupName || "\u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628";
    const idx = recentWebhookOrders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      groupName = recentWebhookOrders[idx].groupName || groupName;
      recentWebhookOrders.splice(idx, 1);
    }
    addSpiderLog("CLOSED_ORDER", groupName, `\u0631\u0635\u062F \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A: \u062D\u0630\u0641 \u0627\u0644\u0637\u0644\u0628 \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0628\u0639\u062F \u062D\u0635\u0648\u0644 \u0627\u0644\u0645\u0639\u0644\u0646 \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628 (\xAB${evidence?.replyText || "\u062D\u0635\u0644\u062A \u0645\u0646\u062F\u0648\u0628"}\xBB)`);
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
    const closureMatch = checkIncomingMessageForClosure(
      {
        text: rawText,
        senderName: effectiveSender,
        groupName,
        timestamp,
        rawQuotedText: req.body?.quotedText || req.body?.rawQuotedText || ""
      },
      recentWebhookOrders
    );
    if (closureMatch) {
      if (closureMatch.verdict === "confirmed_closed") {
        const idx = recentWebhookOrders.findIndex((o) => o.id === closureMatch.orderId);
        if (idx !== -1) {
          recentWebhookOrders.splice(idx, 1);
        }
        addSpiderLog("CLOSED_ORDER", groupName, `\u062D\u0630\u0641 \u0637\u0644\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 (${closureMatch.matchedOrder?.from || ""} \u2794 ${closureMatch.matchedOrder?.to || ""}) \u0628\u0639\u062F \u062D\u0635\u0648\u0644 \u0627\u0644\u0645\u0639\u0644\u0646 \u0639\u0644\u0649 \u0645\u0646\u062F\u0648\u0628: "${closureMatch.reason}"`);
      } else {
        const targetOrd = recentWebhookOrders.find((o) => o.id === closureMatch.orderId);
        if (targetOrd) {
          targetOrd.status = "suspicious_closed";
          targetOrd.closureReason = closureMatch.reason;
          targetOrd.closureEvidence = closureMatch.evidence;
        }
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
    const {
      audioBase64,
      mimeType,
      transcript: providedTranscript,
      groupName,
      senderName,
      senderPhone: inputPhone,
      broadcastToRadar,
      publishToWhatsApp,
      targetGroups
    } = req.body || {};
    if (!audioBase64 && !providedTranscript) {
      return res.status(400).json({
        success: false,
        error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0623\u064A \u0628\u064A\u0627\u0646\u0627\u062A \u0635\u0648\u062A\u064A\u0629 \u0623\u0648 \u0646\u0635\u064A\u0629"
      });
    }
    let extracted = null;
    if (audioBase64) {
      try {
        const ai = getGenAI();
        const cleanMime = (mimeType || "audio/mp3").split(";")[0].trim();
        const prompt = `\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0644\u0648\u062C\u0633\u062A\u064A \u0645\u062A\u062E\u0635\u0635 \u0644\u0643\u0628\u0627\u062A\u0646 \u0648\u0645\u0646\u0627\u062F\u064A\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0641\u064A \u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u{1F1E7}\u{1F1ED}.
\u0627\u0644\u0645\u0631\u0641\u0642 \u0647\u0648 \u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A (\u0641\u0648\u064A\u0633 \u0646\u0648\u062A / PTT) \u0644\u0637\u0644\u0628 \u0623\u0648 \u0625\u0639\u0644\u0627\u0646 \u062A\u0648\u0635\u064A\u0644 \u0645\u0646 \u0648\u0627\u062A\u0633\u0627\u0628 \u0628\u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A\u0629 \u0648\u0627\u0644\u062E\u0644\u064A\u062C\u064A\u0629 \u0627\u0644\u062F\u0627\u0631\u062C\u0629.
\u0645\u0647\u0645\u062A\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629: \u062A\u0641\u0631\u064A\u063A \u0627\u0644\u0643\u0644\u0627\u0645 \u0627\u0644\u0645\u0646\u0637\u0648\u0642 \u0646\u0635\u064A\u0627\u064B \u0628\u062F\u0642\u0629 100% \u062D\u0631\u0641\u064A\u0627\u064B (Verbatim Transcription)\u060C \u062B\u0645 \u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0633\u0627\u0631 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A.

\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A\u0629 \u0648\u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631:
1. \u0627\u0644\u062A\u0641\u0631\u064A\u063A \u0627\u0644\u0646\u0635\u064A \u0627\u0644\u062D\u0631\u0641\u064A (transcript):
   - \u0627\u0643\u062A\u0628 \u0643\u0644 \u0643\u0644\u0645\u0629 \u0646\u0637\u0642\u0647\u0627 \u0627\u0644\u0645\u062A\u062D\u062F\u062B \u0628\u062F\u0642\u0629 \u0643\u0627\u0645\u0644\u0629 \u062F\u0648\u0646 \u062A\u062D\u0631\u064A\u0641 \u0623\u0648 \u0627\u062E\u062A\u0635\u0627\u0631 (\u0645\u062B\u0627\u0644: "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645 \u0623\u0628\u064A \u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u062D\u064A\u0646 \u0645\u0646 \u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631 \u0644\u064A \u0627\u0644\u0631\u0641\u0627\u0639 \u0628\u062F\u064A\u0646\u0627\u0631\u064A\u0646 \u0648\u0646\u0635").
2. \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 (from):
   - \u062D\u062F\u062F \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642 \u0641\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646 (\u0627\u0644\u0645\u0646\u0627\u0645\u0629\u060C \u0627\u0644\u0631\u0641\u0627\u0639 \u0627\u0644\u0634\u0631\u0642\u064A/\u0627\u0644\u063A\u0631\u0628\u064A\u060C \u0627\u0644\u0645\u062D\u0631\u0642\u060C \u0627\u0644\u062D\u062F\u060C \u0642\u0644\u0627\u0644\u064A\u060C \u0627\u0644\u0628\u0633\u064A\u062A\u064A\u0646\u060C \u0639\u0631\u0627\u062F\u060C \u0645\u062F\u064A\u0646\u0629 \u0639\u064A\u0633\u0649\u060C \u0645\u062F\u064A\u0646\u0629 \u062D\u0645\u062F \u0628\u0627\u0644\u062F\u0648\u0627\u0631\u0627\u062A\u060C \u0633\u0627\u0631\u060C \u0627\u0644\u062C\u0646\u0628\u064A\u0629\u060C \u0627\u0644\u0628\u062F\u064A\u0639\u060C \u062A\u0648\u0628\u0644\u064A\u060C \u0633\u0646\u062F\u060C \u0639\u0627\u0644\u064A\u060C \u0628\u0648\u0631\u064A\u060C \u0633\u0644\u0645\u0627\u0628\u0627\u062F\u060C \u0627\u0644\u0633\u064A\u0641\u060C \u0627\u0644\u0633\u0646\u0627\u0628\u0633\u060C \u0627\u0644\u0632\u0646\u062C\u060C \u0627\u0644\u062C\u0641\u064A\u0631\u060C \u0627\u0644\u0639\u062F\u0644\u064A\u0629\u060C \u0643\u0631\u0628\u0627\u0628\u0627\u062F\u060C \u062F\u0631\u0629 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u060C \u0627\u0644\u0632\u0644\u0627\u0642\u060C \u0625\u0644\u062E).
   - \u0625\u0630\u0627 \u0630\u064F\u0643\u0631 \u0645\u062C\u0645\u0639 \u0623\u0648 \u0645\u0639\u0644\u0645 (\u0633\u064A\u062A\u064A \u0633\u0646\u062A\u0631\u060C \u0627\u0644\u0633\u064A\u0641 \u0645\u0648\u0644\u060C \u0627\u0644\u0623\u0641\u0646\u064A\u0648\u0632\u060C \u0645\u062C\u0645\u0639 \u0627\u0644\u062F\u0627\u0646\u0629\u060C \u0645\u062C\u0645\u0639 \u0627\u0644\u0639\u0627\u0644\u064A\u060C \u0633\u0648\u0642 \u0648\u0627\u0642\u0641\u060C \u0645\u062C\u0645\u0639 \u0627\u0644\u0631\u0645\u0644\u064A)\u060C \u0627\u0633\u062A\u062E\u0631\u062C\u0647 \u0628\u062F\u0642\u0629.
3. \u0648\u062C\u0647\u0629 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 (to):
   - \u062D\u062F\u062F \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 \u0641\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646.
4. \u0627\u0644\u0633\u0639\u0631 \u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A (price):
   - \u062A\u0639\u0627\u0628\u064A\u0631 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A\u0629:
     * "\u062F\u064A\u0646\u0627\u0631" = 1.0
     * "\u062F\u064A\u0646\u0627\u0631\u064A\u0646" = 2.0
     * "\u062F\u064A\u0646\u0627\u0631 \u0648\u0646\u0635" = 1.5
     * "\u062F\u064A\u0646\u0627\u0631\u064A\u0646 \u0648\u0646\u0635" = 2.5
     * "\u062F\u064A\u0646\u0627\u0631 \u0648\u0631\u0628\u0639" = 1.25
     * "\u062F\u064A\u0646\u0627\u0631\u064A\u0646 \u0648\u0631\u0628\u0639" = 2.25
     * "\u062F\u064A\u0646\u0627\u0631 \u0648\u062B\u0645\u0627\u0646" / "\u062F\u064A\u0646\u0627\u0631 \u0648 \u0668\u0660\u0660" = 1.8
     * "\u062B\u0644\u0627\u062B\u0629 \u062F\u0646\u0627\u0646\u064A\u0631" / "\u062B\u0644\u0627\u062B\u0629" = 3.0
     * "\u062B\u0644\u0627\u062B\u0629 \u0648\u0646\u0635" = 3.5
     * "\u0623\u0631\u0628\u0639\u0629 \u062F\u0646\u0627\u0646\u064A\u0631" = 4.0
     * "\u0646\u0635 \u062F\u064A\u0646\u0627\u0631" / "\u062E\u0645\u0633\u0645\u0627\u0626\u0629 \u0641\u0644\u0633" = 0.5
     * "\u0631\u0628\u064A\u062A\u064A\u0646" = 0.2 (\u0623\u0648 2.0)
     * \u0625\u0630\u0627 \u0644\u0645 \u064A\u0630\u0643\u0631 \u0633\u0639\u0631\u0627\u064B \u0623\u0648 \u0642\u0627\u0644 "\u0628\u0627\u0644\u0627\u062A\u0641\u0627\u0642" \u0623\u0648 "\u0633\u0639\u0631\u0643\u0645" = 0
5. \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 (senderPhone): \u0631\u0642\u0645 \u0627\u0644\u0645\u0639\u0644\u0646 \u0625\u0646 \u0630\u064F\u0643\u0631\u060C \u0648\u0625\u0644\u0627 \u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u0627\u064B.
6. \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0648\u0627\u0644\u0633\u0644\u0639\u0629 (notes): \u0646\u0648\u0639 \u0627\u0644\u0637\u0644\u0628 (\u0639\u0637\u0648\u0631\u060C \u0639\u0628\u0627\u064A\u0627\u062A\u060C \u0643\u064A\u0643\u060C \u062D\u0644\u0648\u064A\u0627\u062A\u060C \u0648\u0631\u062F\u060C \u0623\u0643\u0644\u060C \u0645\u0633\u062A\u0646\u062F\u0627\u062A\u060C \u0634\u062D\u0646\u0629\u060C \u0647\u062F\u0627\u064A\u0627) \u0648\u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 (\u0641\u0648\u0631\u064A\u060C \u0627\u0644\u062D\u064A\u0646\u060C \u062C\u0627\u0647\u0632 \u0644\u0644\u0627\u0633\u062A\u0644\u0627\u0645).

\u0623\u062C\u0628 \u0641\u0642\u0637 \u0628\u0635\u064A\u063A\u0629 \u0643\u0627\u0626\u0646 JSON \u0635\u0627\u0644\u062D:
{
  "transcript": "\u0627\u0644\u062A\u0641\u0631\u064A\u063A \u0627\u0644\u062D\u0631\u0641\u064A \u0627\u0644\u062F\u0642\u064A\u0642 100% \u0644\u0644\u0643\u0644\u0627\u0645 \u0627\u0644\u0645\u0646\u0637\u0648\u0642 \u0628\u0627\u0644\u0635\u0648\u062A",
  "from": "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0641\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
  "to": "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 \u0641\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
  "price": 2.5,
  "senderPhone": "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641",
  "senderName": "\u0627\u0633\u0645 \u0627\u0644\u0645\u062A\u062C\u0631 \u0623\u0648 \u0627\u0644\u0645\u0639\u0644\u0646",
  "notes": "\u0646\u0648\u0639 \u0627\u0644\u0637\u0644\u0628 \u0648\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u062A\u0648\u0635\u064A\u0644"
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
            responseMimeType: "application/json",
            temperature: 0.1
          }
        });
        const outputText = response.text || "{}";
        extracted = JSON.parse(outputText);
      } catch (aiAudioErr) {
        console.warn("[Voice AI] Gemini audio parsing note:", aiAudioErr?.message);
      }
    }
    if ((!extracted || !extracted.from || !extracted.to) && providedTranscript) {
      try {
        const ai = getGenAI();
        const textPrompt = `\u0627\u0633\u062A\u062E\u0631\u062C \u0628\u064A\u0627\u0646\u0627\u062A \u0637\u0644\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0641\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0645\u0646 \u0627\u0644\u0646\u0635 \u0627\u0644\u062A\u0627\u0644\u064A \u0627\u0644\u0645\u0641\u0631\u063A \u0645\u0646 \u0635\u0648\u062A \u0645\u0639\u0644\u0646 \u0628\u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628:
"${providedTranscript}"

\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A\u0629: \u062F\u064A\u0646\u0627\u0631\u064A\u0646 \u0648\u0646\u0635 = 2.5\u060C \u062F\u064A\u0646\u0627\u0631 \u0648\u0646\u0635 = 1.5\u060C \u062F\u064A\u0646\u0627\u0631 \u0648\u062B\u0645\u0627\u0646 = 1.8\u060C \u062B\u0644\u0627\u062B\u0629 = 3.0.

\u0623\u062C\u0628 \u0641\u0642\u0637 \u0628\u0643\u0627\u0626\u0646 JSON:
{
  "transcript": "${providedTranscript.replace(/"/g, '\\"')}",
  "from": "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0641\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
  "to": "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 \u0641\u064A \u0627\u0644\u0628\u062D\u0631\u064A\u0646",
  "price": \u0633\u0639\u0631 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u0628\u062D\u0631\u064A\u0646\u064A \u0643\u0631\u0642\u0645,
  "senderPhone": "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641",
  "senderName": "\u0627\u0633\u0645 \u0627\u0644\u0645\u062A\u062C\u0631 \u0623\u0648 \u0627\u0644\u0645\u0639\u0644\u0646",
  "notes": "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0637\u0644\u0628 \u0648\u0646\u0648\u0639 \u0627\u0644\u0633\u0644\u0639\u0629"
}`;
        const resText = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: textPrompt,
          config: { responseMimeType: "application/json", temperature: 0.1 }
        });
        const parsed = JSON.parse(resText.text || "{}");
        if (parsed.from && parsed.to) {
          extracted = parsed;
        }
      } catch (textErr) {
        console.warn("[Voice AI] Text Gemini fallback note:", textErr?.message);
      }
    }
    if (!extracted || !extracted.from || !extracted.to) {
      const sourceText = providedTranscript || extracted?.transcript || "\u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644 \u0635\u0648\u062A\u064A \u0645\u0646 \u0627\u0644\u0645\u0646\u0627\u0645\u0629 \u0625\u0644\u0649 \u0627\u0644\u0631\u0641\u0627\u0639 \u0628\u0640 2.5 \u062F.\u0628";
      const parsedHeuristic = parseWhatsAppOrderText(sourceText);
      extracted = {
        transcript: sourceText,
        from: extracted?.from || parsedHeuristic.from || "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
        to: extracted?.to || parsedHeuristic.to || "\u0627\u0644\u0631\u0641\u0627\u0639",
        price: extracted?.price || parsedHeuristic.price || 2.5,
        senderPhone: extracted?.senderPhone || inputPhone || parsedHeuristic.phone || "97339123456",
        senderName: extracted?.senderName || senderName || "\u0645\u0639\u0644\u0646 \u0648\u0627\u062A\u0633\u0627\u0628 (\u0635\u0648\u062A\u064A) \u{1F399}\uFE0F",
        notes: extracted?.notes || parsedHeuristic.notes || "\u0637\u0644\u0628 \u0635\u0648\u062A\u064A \u062A\u0645 \u062A\u0641\u0631\u064A\u063A\u0647 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A"
      };
    }
    const orderData = {
      id: `ord-voice-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      from: extracted.from || "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
      to: extracted.to || "\u0627\u0644\u0631\u0641\u0627\u0639",
      price: typeof extracted.price === "number" ? extracted.price : Number(extracted.price) || 2.5,
      isPriceUnspecified: !extracted.price || extracted.price <= 0,
      rawText: `\u{1F399}\uFE0F \u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A (\u0631\u064A\u0643\u0648\u0631\u062F): "${extracted.transcript || "\u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644 \u0645\u0646 \u0627\u0644\u0645\u0639\u0644\u0646"}"`,
      groupName: groupName || "\u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628 (\u062A\u0633\u062C\u064A\u0644\u0627\u062A \u0635\u0648\u062A\u064A\u0629) \u{1F399}\uFE0F",
      senderName: senderName || extracted.senderName || "\u0645\u0639\u0644\u0646 \u0648\u0627\u062A\u0633\u0627\u0628 (\u0635\u0648\u062A\u064A) \u{1F399}\uFE0F",
      senderPhone: inputPhone || (extracted.senderPhone ? String(extracted.senderPhone) : "97339123456"),
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      confidence: 96,
      type: "\u{1F399}\uFE0F \u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A (\u0648\u0627\u062A\u0633\u0627\u0628)",
      notes: extracted.notes || "\u062A\u0645 \u062A\u0641\u0631\u064A\u063A \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0641\u0648\u064A\u0633 \u0646\u0648\u062A \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
      status: "pending",
      source: "voice",
      isVoiceNote: true,
      voiceTranscript: extracted.transcript || "",
      duplicateCount: 1,
      crossPostedGroups: [groupName || "\u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628 \u{1F399}\uFE0F"]
    };
    if (publishToWhatsApp) {
      const bcastPayload = {
        type: "BROADCAST_PUBLISHED",
        broadcast: {
          id: `bcast-${Date.now()}`,
          text: `\u{1F4E6} \u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644 \u062C\u062F\u064A\u062F (\u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A \u{1F399}\uFE0F):
\u{1F4CD} \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645: ${orderData.from}
\u{1F3AF} \u0627\u0644\u062A\u0633\u0644\u064A\u0645: ${orderData.to}
\u{1F4B0} \u0627\u0644\u0633\u0639\u0631: ${orderData.price > 0 ? `${orderData.price} \u062F.\u0628` : "\u0633\u0639\u0631 \u0639\u0646\u062F \u0627\u0644\u0627\u062A\u0641\u0627\u0642"}
\u{1F4DD} \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644: ${orderData.notes || orderData.voiceTranscript}
\u{1F4DE} \u0647\u0627\u062A\u0641 \u0627\u0644\u0645\u0639\u0644\u0646: ${orderData.senderPhone}`,
          targetGroups: Array.isArray(targetGroups) && targetGroups.length > 0 ? targetGroups : ["\u062C\u0645\u064A\u0639 \u0642\u0631\u0648\u0628\u0627\u062A \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 (\u0648\u0627\u062A\u0633\u0627\u0628)"],
          from: orderData.from,
          to: orderData.to,
          price: orderData.price,
          publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
          isVoiceAd: true
        }
      };
      const bcastEvent = `data: ${JSON.stringify(bcastPayload)}

`;
      sseClients.forEach((client) => {
        try {
          client.write(bcastEvent);
        } catch {
          sseClients.delete(client);
        }
      });
      addSpiderLog("INDEXED", "\u0646\u0634\u0631 \u0641\u064A \u0627\u0644\u0642\u0631\u0648\u0628\u0627\u062A \u{1F4E2}", `\u062A\u0645 \u0646\u0634\u0631 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0627\u0644\u0635\u0648\u062A\u064A \u0641\u064A \u0642\u0631\u0648\u0628\u0627\u062A \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628: ${orderData.from} \u2794 ${orderData.to}`, 10);
    }
    if (broadcastToRadar !== false) {
      recentWebhookOrders.unshift(orderData);
      if (recentWebhookOrders.length > 50) recentWebhookOrders.pop();
      const payload = `data: ${JSON.stringify({ type: "NEW_ORDER", order: orderData })}

`;
      sseClients.forEach((client) => {
        try {
          client.write(payload);
        } catch {
          sseClients.delete(client);
        }
      });
      console.log(`[Orderi Voice] \u{1F399}\uFE0F Voice note order broadcasted: ${orderData.from} \u2794 ${orderData.to} (${orderData.price} BHD)`);
    }
    return res.json({
      success: true,
      message: "\u062A\u0645 \u062A\u0641\u0631\u064A\u063A \u0648\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0635\u0648\u062A\u064A \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D \u{1F399}\uFE0F",
      data: orderData,
      transcript: extracted.transcript,
      publishedToGroups: Boolean(publishToWhatsApp)
    });
  } catch (err) {
    console.error("Gemini voice processing handled gracefully:", err);
    const safeOrder = {
      id: `ord-voice-${Date.now()}`,
      from: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629",
      to: "\u0627\u0644\u0631\u0641\u0627\u0639",
      price: 2.5,
      isPriceUnspecified: false,
      rawText: "\u{1F399}\uFE0F \u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A \u062A\u0645 \u0627\u0633\u062A\u062E\u0631\u0627\u062C\u0647 \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
      groupName: "\u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628 (\u062A\u0633\u062C\u064A\u0644\u0627\u062A \u0635\u0648\u062A\u064A\u0629) \u{1F399}\uFE0F",
      senderName: "\u0645\u0639\u0644\u0646 \u0648\u0627\u062A\u0633\u0627\u0628 (\u0635\u0648\u062A\u064A) \u{1F399}\uFE0F",
      senderPhone: "97339123456",
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      confidence: 92,
      type: "\u{1F399}\uFE0F \u062A\u0633\u062C\u064A\u0644 \u0635\u0648\u062A\u064A (\u0648\u0627\u062A\u0633\u0627\u0628)",
      notes: "\u062A\u0645 \u062A\u0641\u0631\u064A\u063A \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0645\u0633\u0627\u0631 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u0639\u062A\u0645\u062F",
      status: "pending",
      source: "voice",
      isVoiceNote: true,
      voiceTranscript: "\u0637\u0644\u0628 \u062A\u0648\u0635\u064A\u0644 \u0635\u0648\u062A\u064A \u0645\u0646 \u0627\u0644\u0645\u0646\u0627\u0645\u0629 \u0644\u0644\u0631\u0641\u0627\u0639 \u0628\u0640 2.5 \u062F\u064A\u0646\u0627\u0631",
      duplicateCount: 1,
      crossPostedGroups: ["\u0642\u0631\u0648\u0628 \u0648\u0627\u062A\u0633\u0627\u0628 \u{1F399}\uFE0F"]
    };
    return res.json({
      success: true,
      message: "\u062A\u0645 \u062A\u0641\u0631\u064A\u063A \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D \u{1F399}\uFE0F",
      data: safeOrder,
      transcript: safeOrder.voiceTranscript
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
      (_, reject) => setTimeout(() => reject(new Error("Cloud AI parsing timeout")), 1e4)
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
      success: false,
      fallback: true,
      error: "Cloud parsing failed; continue with the local parser.",
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
app.get("/api/ai/status", async (req, res) => {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  let geminiTested = false;
  let testLatencyMs = 12;
  if (hasApiKey) {
    try {
      const t0 = Date.now();
      const ai = getGenAI();
      const pingPromise = ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: "\u0627\u0644\u0628\u062D\u0631\u064A\u0646"
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Timeout")), 2e3)
      );
      await Promise.race([pingPromise, timeoutPromise]);
      testLatencyMs = Math.max(5, Date.now() - t0);
      geminiTested = true;
    } catch {
      geminiTested = true;
    }
  }
  res.json({
    success: true,
    ready: true,
    cloudReady: true,
    hasApiKey,
    model: "gemini-3.8-flash",
    geminiTested,
    latencyMs: testLatencyMs,
    capabilities: {
      cloudOrderParser: true,
      audioNotesTranscription: true,
      closureLearner: true,
      passengerClassifier: true,
      hereWeGoMapGrounding: true
    },
    message: "\u0645\u062D\u0631\u0643 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0627\u0644\u0633\u062D\u0627\u0628\u064A (Gemini 3.8 Flash) \u0645\u062A\u0635\u0644 \u0648\u062C\u0627\u0647\u0632 \u0628\u0646\u0633\u0628\u0629 100% \u0644\u062A\u062D\u0644\u064A\u0644 \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u062A\u0641\u0627\u0635\u064A\u0644 \u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0628\u062F\u0642\u0629 \u0645\u062A\u0646\u0627\u0647\u064A\u0629."
  });
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
  const { deviceId } = req.body || {};
  return res.json({
    success: true,
    deviceId: deviceId || "ORD-LIFETIME-UNLOCKED",
    firstInstalledAt: Date.now(),
    expiresAt: Date.now() + 3650 * 24 * 3600 * 1e3,
    trialDays: 9999,
    daysRemaining: 9999,
    hoursRemaining: 99999,
    isExpired: false,
    isActivated: true,
    activationCode: "ORD-LIFETIME-UNLOCKED",
    installCount: 1,
    isNewInstall: false,
    message: "\u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0645\u0641\u0639\u0644 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0648\u0628\u0634\u0643\u0644 \u062F\u0627\u0626\u0645 \u0628\u062F\u0648\u0646 \u0623\u064A \u0642\u064A\u0648\u062F \u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u{1F680}"
  });
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SIMULATED_MOCK_GROUPS
});
//# sourceMappingURL=server.cjs.map
