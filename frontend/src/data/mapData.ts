// 戦略的チョークポイントと主要タンカーレーン（静的データ）
export const CHOKEPOINTS = [
  { id: "hormuz",    name: "ホルムズ海峡",    en: "Hormuz Strait",    lat: 26.56,  lng: 56.25,  risk: "HIGH",   flow: "21M bbl/day",  color: "#ef4444" },
  { id: "malacca",   name: "マラッカ海峡",    en: "Malacca Strait",   lat: 1.25,   lng: 103.82, risk: "MEDIUM", flow: "16M bbl/day",  color: "#f59e0b" },
  { id: "suez",      name: "スエズ運河",      en: "Suez Canal",       lat: 30.42,  lng: 32.35,  risk: "MEDIUM", flow: "9.2M bbl/day", color: "#f59e0b" },
  { id: "bab",       name: "バブ・エル・マンデブ", en: "Bab-el-Mandeb", lat: 12.58, lng: 43.47,  risk: "HIGH",   flow: "6.2M bbl/day", color: "#ef4444" },
  { id: "bosphorus", name: "ボスポラス海峡",  en: "Bosphorus",        lat: 41.04,  lng: 28.98,  risk: "LOW",    flow: "3M bbl/day",   color: "#22c55e" },
  { id: "gibraltar", name: "ジブラルタル海峡",en: "Gibraltar",         lat: 35.99,  lng: -5.46,  risk: "LOW",    flow: "2M bbl/day",   color: "#22c55e" },
  { id: "panama",    name: "パナマ運河",      en: "Panama Canal",     lat: 9.38,   lng: -79.92, risk: "LOW",    flow: "1.5M bbl/day", color: "#22c55e" },
  { id: "danish",    name: "デンマーク海峡",  en: "Danish Straits",   lat: 55.73,  lng: 12.50,  risk: "LOW",    flow: "3M bbl/day",   color: "#22c55e" },
] as const;

export const TANKER_ROUTES = [
  // ペルシャ湾 → アジア (ホルムズ → マラッカ)
  { from: [26.56, 56.25], to: [1.25, 103.82], label: "PG→Asia", color: "#3b82f6", width: 2 },
  // ペルシャ湾 → ヨーロッパ (スエズ経由)
  { from: [26.56, 56.25], to: [51.5, -0.12],  label: "PG→EU",   color: "#8b5cf6", width: 1.5 },
  // アメリカ湾岸 → ヨーロッパ
  { from: [28.0, -90.0],  to: [51.5, -0.12],  label: "US→EU",   color: "#06b6d4", width: 1.5 },
  // ロシア → アジア (北極海ルート)
  { from: [68.0, 33.0],   to: [35.68, 139.69],label: "RU→Asia", color: "#f97316", width: 1 },
  // 西アフリカ → アジア
  { from: [-1.0, 8.5],    to: [1.25, 103.82], label: "WAF→Asia",color: "#10b981", width: 1 },
  // 南米 → USA
  { from: [-22.9, -43.18],to: [29.76, -95.37],label: "SA→US",   color: "#ec4899", width: 1 },
] as const;

export const MAJOR_PORTS = [
  { name: "Ras Tanura", lat: 26.64, lng: 50.16, type: "OIL_TERMINAL", country: "Saudi Arabia" },
  { name: "Kharg Island", lat: 29.26, lng: 50.32, type: "OIL_TERMINAL", country: "Iran" },
  { name: "Fujairah", lat: 25.14, lng: 56.33, type: "BUNKERING", country: "UAE" },
  { name: "Singapore", lat: 1.28, lng: 103.85, type: "LNG_HUB", country: "Singapore" },
  { name: "Rotterdam", lat: 51.90, lng: 4.48, type: "OIL_HUB", country: "Netherlands" },
  { name: "Houston", lat: 29.76, lng: -95.37, type: "OIL_HUB", country: "USA" },
  { name: "Sabine Pass", lat: 29.73, lng: -93.87, type: "LNG_EXPORT", country: "USA" },
  { name: "Yokohama", lat: 35.44, lng: 139.64, type: "LNG_IMPORT", country: "Japan" },
] as const;
