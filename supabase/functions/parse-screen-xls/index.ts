import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Built-in classification database
const KNOWN_APPS: Record<string, "productivite" | "neutre" | "dopamine"> = {
  // Dopamine / distraction
  tiktok: "dopamine",
  instagram: "dopamine",
  snapchat: "dopamine",
  facebook: "dopamine",
  twitter: "dopamine",
  x: "dopamine",
  reddit: "dopamine",
  youtube: "dopamine",
  netflix: "dopamine",
  twitch: "dopamine",
  "candy crush": "dopamine",
  "clash royale": "dopamine",
  "brawl stars": "dopamine",
  pinterest: "dopamine",
  tumblr: "dopamine",
  threads: "dopamine",
  "disney+": "dopamine",
  "prime video": "dopamine",
  roblox: "dopamine",
  fortnite: "dopamine",
  // Productivité
  notion: "productivite",
  slack: "productivite",
  trello: "productivite",
  asana: "productivite",
  linear: "productivite",
  figma: "productivite",
  "vs code": "productivite",
  "visual studio": "productivite",
  github: "productivite",
  gitlab: "productivite",
  chatgpt: "productivite",
  whatsai: "productivite",
  duolingo: "productivite",
  anki: "productivite",
  kindle: "productivite",
  "google docs": "productivite",
  "google sheets": "productivite",
  "google drive": "productivite",
  excel: "productivite",
  word: "productivite",
  powerpoint: "productivite",
  outlook: "productivite",
  gmail: "productivite",
  calendar: "productivite",
  "google calendar": "productivite",
  zoom: "productivite",
  "google meet": "productivite",
  teams: "productivite",
  "microsoft teams": "productivite",
  coursera: "productivite",
  udemy: "productivite",
  "khan academy": "productivite",
  calculator: "productivite",
  notes: "productivite",
  evernote: "productivite",
  todoist: "productivite",
  // Neutre
  whatsapp: "neutre",
  telegram: "neutre",
  signal: "neutre",
  messenger: "neutre",
  safari: "neutre",
  chrome: "neutre",
  firefox: "neutre",
  maps: "neutre",
  "google maps": "neutre",
  waze: "neutre",
  uber: "neutre",
  spotify: "neutre",
  "apple music": "neutre",
  weather: "neutre",
  clock: "neutre",
  photos: "neutre",
  camera: "neutre",
  settings: "neutre",
  "app store": "neutre",
  "play store": "neutre",
  phone: "neutre",
};

function classifyApp(
  appName: string,
  userClassifications: Record<string, string>
): "productivite" | "neutre" | "dopamine" {
  const normalized = appName.toLowerCase().trim();

  // User corrections take priority
  if (userClassifications[normalized]) {
    return userClassifications[normalized] as "productivite" | "neutre" | "dopamine";
  }

  // Check known apps (partial match)
  for (const [key, category] of Object.entries(KNOWN_APPS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return category;
    }
  }

  return "neutre"; // Default
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userClassificationsStr = formData.get("userClassifications") as string;
    const userClassifications = userClassificationsStr
      ? JSON.parse(userClassificationsStr)
      : {};

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

    // Try to identify columns (flexible)
    const firstRow = rows[0] || {};
    const keys = Object.keys(firstRow);

    // Find app name column
    const appCol = keys.find((k) =>
      /app|application|nom|name/i.test(k)
    ) || keys[0];

    // Find time/duration column
    const timeCol = keys.find((k) =>
      /time|temps|dur|duration|minutes|min|usage/i.test(k)
    ) || keys[1];

    // Find date column (optional)
    const dateCol = keys.find((k) => /date|jour|day/i.test(k));

    const apps: Array<{
      appName: string;
      minutes: number;
      category: string;
      date?: string;
    }> = [];

    for (const row of rows) {
      const appName = String(row[appCol] || "").trim();
      if (!appName) continue;

      // Parse time - could be minutes, HH:MM, or decimal hours
      let minutes = 0;
      const rawTime = String(row[timeCol] || "0");
      if (rawTime.includes(":")) {
        const [h, m] = rawTime.split(":").map(Number);
        minutes = (h || 0) * 60 + (m || 0);
      } else {
        const num = parseFloat(rawTime);
        minutes = num > 24 ? num : Math.round(num * 60); // assume hours if < 24
      }

      const category = classifyApp(appName, userClassifications);
      const date = dateCol ? String(row[dateCol] || "") : undefined;

      apps.push({ appName, minutes, category, date });
    }

    // Aggregate by app
    const aggregated: Record<string, { minutes: number; category: string }> = {};
    for (const app of apps) {
      if (aggregated[app.appName]) {
        aggregated[app.appName].minutes += app.minutes;
      } else {
        aggregated[app.appName] = {
          minutes: app.minutes,
          category: app.category,
        };
      }
    }

    const result = Object.entries(aggregated).map(([appName, data]) => ({
      appName,
      minutes: data.minutes,
      category: data.category,
    }));

    const totalMinutes = result.reduce((s, a) => s + a.minutes, 0);
    const productifMinutes = result
      .filter((a) => a.category === "productivite")
      .reduce((s, a) => s + a.minutes, 0);
    const neutreMinutes = result
      .filter((a) => a.category === "neutre")
      .reduce((s, a) => s + a.minutes, 0);
    const dopamineMinutes = result
      .filter((a) => a.category === "dopamine")
      .reduce((s, a) => s + a.minutes, 0);

    return new Response(
      JSON.stringify({
        apps: result,
        totalMinutes,
        productifMinutes,
        neutreMinutes,
        dopamineMinutes,
        columnsDetected: { appCol, timeCol, dateCol },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
