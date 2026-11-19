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
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 14000);
}

async function checkSource(source, previous) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    const response = await fetch(source.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "RaahLabAdmissionsMonitor/1.0 (+https://raahlab.netlify.app/)",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    clearTimeout(timeout);
    if (!response.ok) {
      return { ...source, ok: false, status: response.status, changed: false, checkedAt: new Date().toISOString() };
    }
    const body = await response.text();
    const text = cleanText(body);
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
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      ...source,
      ok: false,
      status: null,
      error: error?.name === "AbortError" ? "Timed out" : "Fetch failed",
      changed: false,
      checkedAt: new Date().toISOString()
    };
  }
}

export default async function handler() {
  const store = getStore("raahlab-admissions-monitor");
  const previous = await store.get("latest.json", { type: "json" });
  const sources = await Promise.all(SOURCES.map(source => checkSource(source, previous)));
  const result = {
    product: "RaahLab Admissions Radar",
    schemaVersion: 1,
    lastChecked: new Date().toISOString(),
    schedule: "Daily at 07:15 Pakistan Standard Time",
    note: "This service detects changes on official source pages. It does not automatically validate or extract every admission deadline.",
    sources
  };
  await store.setJSON("latest.json", result);
  console.log(`RaahLab monitor: ${sources.filter(s => s.ok).length}/${sources.length} sources reachable; ${sources.filter(s => s.changed).length} changed.`);
  return new Response("Admissions sources checked", { status: 200 });
}

export const config = {
  schedule: "15 2 * * *"
};
