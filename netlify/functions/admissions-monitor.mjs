import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const SOURCES = [
  { id: "nust", name: "NUST Undergraduate / NET", url: "https://nust.edu.pk/admissions/undergraduates/" },
  { id: "numl", name: "NUML Admissions", url: "https://numl.edu.pk/academic-branch/" },
  { id: "comsats", name: "COMSATS Admissions", url: "https://admissions.comsats.edu.pk/" },
  { id: "nums", name: "NUMS Admissions", url: "https://numspak.edu.pk/" },
  { id: "pu", name: "University of the Punjab — Admission Notices", url: "https://pu.edu.pk/home/admission_notices" },
  { id: "vu", name: "Virtual University — Admissions", url: "https://vu.edu.pk/Admissions/AdmissionProcedure" },
  { id: "fast", name: "FAST-NUCES Admissions", url: "https://www.nu.edu.pk/Admissions" },
  { id: "iba", name: "IBA Karachi — Admission Schedule", url: "https://admissions.iba.edu.pk/admissions_schedule.php" },
  { id: "lums", name: "LUMS Undergraduate Admissions", url: "https://admission.lums.edu.pk/undergraduate-programmes" },
  { id: "pmdc", name: "PM&DC — Notices", url: "https://pmdc.pk/" },
  { id: "uet", name: "UET ECAT", url: "https://ecat.uet.edu.pk/General/Ecat" },
  { id: "hec", name: "Higher Education Commission — News", url: "https://www.hec.gov.pk/english/news/Pages/default.aspx" }
];

function cleanText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ").trim();
}

function extractDateMentions(text) {
  const month = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
  const patterns = [
    new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${month}\\s+20\\d{2}\\b`, "gi"),
    new RegExp(`\\b${month}\\s+\\d{1,2}(?:st|nd|rd|th)?[,]?\\s+20\\d{2}\\b`, "gi"),
    /\b20\d{2}-\d{2}-\d{2}\b/g
  ];
  const hits = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const start = Math.max(0, match.index - 105);
      const end = Math.min(text.length, match.index + match[0].length + 105);
      const context = text.slice(start, end).trim();
      if (!hits.some(item => item.date.toLowerCase() === match[0].toLowerCase())) {
        hits.push({ date: match[0], context });
      }
      if (hits.length >= 8) break;
    }
    if (hits.length >= 8) break;
  }
  return hits;
}

async function checkSource(source, previous) {
  const checkedAt = new Date().toISOString();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    const response = await fetch(source.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "RaahLabAdmissionsMonitor/1.1 (+https://raahlab.netlify.app/)",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    clearTimeout(timeout);
    if (!response.ok) {
      return { ...source, ok: false, status: response.status, changed: false, checkedAt, dateMentions: [] };
    }
    const body = await response.text();
    const text = cleanText(body).slice(0, 30000);
    const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? cleanText(titleMatch[1]).slice(0, 180) : source.name;
    const digest = createHash("sha256").update(text).digest("hex");
    const old = previous?.sources?.find(item => item.id === source.id);
    return {
      ...source,
      ok: true,
      status: response.status,
      title,
      excerpt: text.slice(0, 420),
      fingerprint: digest,
      changed: Boolean(old?.fingerprint && old.fingerprint !== digest),
      checkedAt,
      dateMentions: extractDateMentions(text)
    };
  } catch (error) {
    return {
      ...source, ok: false, status: null,
      error: error?.name === "AbortError" ? "Timed out" : "Fetch failed",
      changed: false, checkedAt, dateMentions: []
    };
  }
}

export default async function handler() {
  const store = getStore("raahlab-admissions-monitor");
  const previous = await store.get("latest.json", { type: "json" });
  const history = (await store.get("history.json", { type: "json" })) || { events: [] };
  const sources = await Promise.all(SOURCES.map(source => checkSource(source, previous)));
  const checkedAt = new Date().toISOString();
  const changedSources = sources.filter(source => source.changed);
  const events = changedSources.map(source => ({
    id: `${source.id}-${checkedAt}`,
    sourceId: source.id,
    name: source.name,
    url: source.url,
    changedAt: checkedAt,
    title: source.title || source.name,
    excerpt: source.excerpt || "The official page content changed. Open the source to review the notice."
  }));
  const nextHistory = { updatedAt: checkedAt, events: [...events, ...(history.events || [])].slice(0, 40) };
  const result = {
    product: "RaahLab Admissions Radar",
    schemaVersion: 2,
    lastChecked: checkedAt,
    schedule: "Daily at 07:15 Pakistan Standard Time",
    summary: {
      total: sources.length,
      reachable: sources.filter(source => source.ok).length,
      changed: changedSources.length,
      failed: sources.filter(source => !source.ok).length
    },
    note: "This checker detects official-page content changes and surfaces date mentions as review candidates. It does not confirm that a date is an application deadline. Verify every date on the linked official notice.",
    sources
  };
  await store.setJSON("latest.json", result);
  await store.setJSON("history.json", nextHistory);
  console.log(`RaahLab monitor: ${result.summary.reachable}/${sources.length} reachable; ${changedSources.length} changed; ${nextHistory.events.length} history events retained.`);
  return new Response("Admissions sources checked", { status: 200 });
}

export const config = { schedule: "15 2 * * *" };
