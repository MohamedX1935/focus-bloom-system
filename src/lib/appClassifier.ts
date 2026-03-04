import type { AppCategory } from "@/types/app";

const CLASSIFICATION_DB: Record<string, AppCategory> = {
  // Dopamine
  tiktok: "dopamine",
  instagram: "dopamine",
  facebook: "dopamine",
  snapchat: "dopamine",
  twitter: "dopamine",
  x: "dopamine",
  "youtube shorts": "dopamine",
  reddit: "dopamine",
  twitch: "dopamine",
  pinterest: "dopamine",
  tumblr: "dopamine",
  "candy crush": "dopamine",
  "clash royale": "dopamine",
  "clash of clans": "dopamine",
  "brawl stars": "dopamine",
  "genshin impact": "dopamine",
  "call of duty": "dopamine",
  fortnite: "dopamine",
  roblox: "dopamine",
  "among us": "dopamine",
  telegram: "dopamine",
  discord: "dopamine",
  
  // Productivité
  chatgpt: "productivite",
  whatsai: "productivite",
  notion: "productivite",
  "google docs": "productivite",
  "google sheets": "productivite",
  "google slides": "productivite",
  "linkedin learning": "productivite",
  linkedin: "productivite",
  coursera: "productivite",
  "khan academy": "productivite",
  udemy: "productivite",
  duolingo: "productivite",
  anki: "productivite",
  todoist: "productivite",
  trello: "productivite",
  asana: "productivite",
  slack: "productivite",
  "microsoft teams": "productivite",
  teams: "productivite",
  zoom: "productivite",
  "vs code": "productivite",
  "visual studio": "productivite",
  figma: "productivite",
  canva: "productivite",
  excel: "productivite",
  word: "productivite",
  powerpoint: "productivite",
  evernote: "productivite",
  obsidian: "productivite",
  "google drive": "productivite",
  dropbox: "productivite",
  github: "productivite",
  stackoverflow: "productivite",
  medium: "productivite",
  kindle: "productivite",
  audible: "productivite",
  blinkist: "productivite",
  
  // Neutre
  chrome: "neutre",
  safari: "neutre",
  firefox: "neutre",
  edge: "neutre",
  spotify: "neutre",
  "apple music": "neutre",
  deezer: "neutre",
  gmail: "neutre",
  outlook: "neutre",
  mail: "neutre",
  maps: "neutre",
  "google maps": "neutre",
  waze: "neutre",
  uber: "neutre",
  whatsapp: "neutre",
  messages: "neutre",
  sms: "neutre",
  telephone: "neutre",
  horloge: "neutre",
  calculatrice: "neutre",
  photos: "neutre",
  camera: "neutre",
  "app store": "neutre",
  "play store": "neutre",
  parametres: "neutre",
  settings: "neutre",
  meteo: "neutre",
  weather: "neutre",
  youtube: "neutre",
  netflix: "neutre",
  "prime video": "neutre",
};

export function classifyApp(appName: string, userOverrides: Record<string, AppCategory> = {}): AppCategory {
  const normalized = appName.toLowerCase().trim();
  
  // Check user overrides first
  if (userOverrides[normalized]) return userOverrides[normalized];
  
  // Exact match
  if (CLASSIFICATION_DB[normalized]) return CLASSIFICATION_DB[normalized];
  
  // Partial match
  for (const [key, category] of Object.entries(userOverrides)) {
    if (normalized.includes(key) || key.includes(normalized)) return category;
  }
  for (const [key, category] of Object.entries(CLASSIFICATION_DB)) {
    if (normalized.includes(key) || key.includes(normalized)) return category;
  }
  
  return "neutre";
}
