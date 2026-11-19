import { getStore } from "@netlify/blobs";

export default async function handler() {
  try {
    const store = getStore("raahlab-admissions-monitor");
    const [data, history] = await Promise.all([
      store.get("latest.json", { type: "json" }),
      store.get("history.json", { type: "json" })
    ]);
    if (!data) {
      return new Response(JSON.stringify({ error: "No scan has run yet", sources: [], history: { events: [] } }), {
        status: 503,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
    return new Response(JSON.stringify({ ...data, history: history || { events: [] } }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("Admissions feed error", error);
    return new Response(JSON.stringify({ error: "Feed temporarily unavailable", sources: [], history: { events: [] } }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  }
}
