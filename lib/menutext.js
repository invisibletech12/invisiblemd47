// lib/menutext.js
// Simple single-message text menu (no pages, no buttons, no carousel).
// Commands are read live from the script's own command registry, grouped by category.
const config = require("../config");
const { commands } = require("../arslan");

let VERSION = "1.0.0";
try { VERSION = require("../package.json").version || VERSION; } catch (_) {}

const SC = {
    a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ғ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ",
    n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ"
};
const smallCaps = (t) => String(t || "").split("").map(ch => SC[ch.toLowerCase()] || ch).join("");

// "<name>" jaise arguments sirf tab dikhte hain jab command ke .use mein likhe hon
const argHint = (c) => {
    const use = String(c.use || "");
    const tags = use.match(/<[^<>]{1,24}>/g);
    if (!tags) return "";
    const w = tags[0].slice(1, -1).toLowerCase();
    let s;
    if (/jid1/.test(w)) s = "<jids>";
    else if (/jid/.test(w)) s = "<jid>";
    else if (/link|url/.test(w)) s = "<link>";
    else if (/server/.test(w)) s = "<id>";
    else if (/\|/.test(w)) s = "<option>";
    else if (/number/.test(w)) s = "<num>";
    else if (/name/.test(w)) s = "<name>";
    else if (/message|details|text|lines|description/.test(w)) s = "<text>";
    else if (/category/.test(w)) s = "<cat>";
    else s = w.length > 8 ? "<" + w.slice(0, 8) + ">" : tags[0];
    return " " + smallCaps(s);
};

const botName = () => String(config.BOT_NAME || "𝐀𝐡𝐦𝐞𝐝 𝐌𝐢𝐧𝐢 𝐌𝐃")
    .replace(/(\s*[-_ ]\s*bot)+\s*$/i, "").trim() || "𝐀𝐡𝐦𝐞𝐝 𝐌𝐢𝐧𝐢 𝐌𝐃";

const ORDER = ["owner", "download", "general", "group", "ai", "tools", "fun", "islamic", "kashmir", "anime",
    "love", "emotions", "games", "image", "photoedit", "videoedit", "video", "audio", "audioedit", "voice",
    "voicechange", "name", "prank", "search", "settings", "system", "main", "utility"];

const TITLES = { videoedit: "VIDEO EDIT", photoedit: "PHOTO EDIT", audioedit: "AUDIO EDIT", voicechange: "VOICE CHANGE" };
const titleOf = (cat) => TITLES[cat] || String(cat).toUpperCase();

// { cat: [ {name, hint} ] }  — duplicates nahi, A-Z sorted
function groupCommands() {
    const grouped = {};
    const seen = new Set();
    let total = 0;
    for (const c of commands) {
        if (!c.pattern || c.dontAddCommandList) continue;
        let cat = String(c.category || "utility").toLowerCase();
        if (cat === "downloader") cat = "download";
        const key = cat + ":" + c.pattern;
        if (seen.has(key)) continue;
        seen.add(key);
        total++;
        (grouped[cat] = grouped[cat] || []).push({ name: c.pattern, hint: argHint(c) });
    }
    for (const k of Object.keys(grouped)) grouped[k].sort((a, b) => a.name.localeCompare(b.name));
    const cats = [...ORDER.filter(c => grouped[c]), ...Object.keys(grouped).filter(c => !ORDER.includes(c)).sort()];
    return { grouped, cats, total };
}

const LINE = "╰───────────────────⊷";

function headerText() {
    const { total } = groupCommands();
    const mode = String(config.WORK_TYPE || "public");
    const num = String(config.OWNER_DISPLAY_NUMBER || config.OWNER_NUMBER || "").replace(/[^0-9]/g, "");
    return [
        `*╭┈───〔 ${botName()} 〕┈───⊷*`,
        `*├✦ Owner:* ${config.OWNER_NAME || "Owner"}`,
        num ? `*├✦ Owner number:* ${num}` : null,
        `*├✦ Version:* ${VERSION}`,
        `*├✦ Prefix:* ${config.PREFIX || "."}`,
        `*├✦ Commands:* ${total}`,
        `*├✦ Mode:* ${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
        `*${LINE}*`
    ].filter(Boolean).join("\n");
}

function categoryBlock(cat, grouped) {
    const list = grouped[cat];
    if (!list || !list.length) return "";
    return [
        "`『 " + titleOf(cat) + " 』`",
        "╭───────────────────⊷",
        ...list.map(it => `*┋ ⬡ ${smallCaps(it.name)}${it.hint}*`),
        LINE
    ].join("\n");
}

const footerText = () => `> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${botName()}*`;

// Poora menu: ek hi message (sirf bahut lamba ho to category ki hadd par todta hai)
function fullMenuChunks(maxLen) {
    const max = maxLen || 30000;
    const { grouped, cats } = groupCommands();
    const chunks = [];
    let cur = "";
    for (const cat of cats) {
        const b = categoryBlock(cat, grouped);
        if (!b) continue;
        if (cur && (cur + "\n" + b).length > max) { chunks.push(cur); cur = ""; }
        cur += (cur ? "\n" : "") + b;
    }
    if (cur) chunks.push(cur);
    if (!chunks.length) chunks.push("No commands found.");
    chunks[chunks.length - 1] += "\n\n" + footerText();
    return chunks;
}

// ".menu <category>" — sirf ek category
function findCategory(wanted) {
    const w = String(wanted || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!w) return null;
    const { cats } = groupCommands();
    return cats.find(c => c === w) || cats.find(c => c.startsWith(w)) || null;
}

function categoryText(cat) {
    const { grouped } = groupCommands();
    return categoryBlock(cat, grouped) + "\n\n" + footerText();
}

function categoryListText() {
    const { cats, grouped } = groupCommands();
    const p = config.PREFIX || ".";
    return [
        "`『 CATEGORIES 』`",
        "╭───────────────────⊷",
        ...cats.map(c => `*┋ ⬡ ${smallCaps(c)} (${grouped[c].length})*`),
        LINE,
        "",
        `> ${p}menu <category> ➜ ${smallCaps("category commands")}`,
        footerText()
    ].join("\n");
}

// Connect message ke liye: header + poora menu ek text mein
function fullListText() {
    return headerText() + "\n\n" + fullMenuChunks(60000).join("\n");
}

module.exports = { groupCommands, headerText, fullMenuChunks, findCategory, categoryText, categoryListText, footerText, fullListText, botName, smallCaps };
