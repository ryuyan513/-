export interface PriceItem {
  price: number;
  period: string;
  change: number;
  unit: string;
}

export interface EnergyPrices {
  wti: PriceItem | null;
  brent: PriceItem | null;
  henry_hub: PriceItem | null;
  gasoline: PriceItem | null;
}

export interface InventoryItem {
  price: number;
  period: string;
  change: number;
  unit: string;
}

export interface InventoryData {
  us_crude_stock: InventoryItem | null;
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  seen_date: string;
  language: string;
  tone: number;
  signals?: string[];
  social_image?: string;
}

export type RiskLevel = "red" | "yellow" | "green" | "gray";

export interface SignalDef {
  id: string;
  nameJa: string;
  nameEn: string;
  icon: string;
  desc: string;
}

export interface Signal extends SignalDef {
  count: number;
  avgTone: number;
  level: RiskLevel;
  headlines: string[];
}
