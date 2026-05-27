import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CHOKEPOINTS, TANKER_ROUTES, MAJOR_PORTS } from "../data/mapData";

const RISK_COLOR: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };
const PORT_COLOR: Record<string, string> = {
  OIL_TERMINAL: "#f97316", LNG_HUB: "#3b82f6", LNG_EXPORT: "#06b6d4",
  LNG_IMPORT: "#8b5cf6", OIL_HUB: "#f59e0b", BUNKERING: "#10b981",
};

export default function Map2D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map with CartoDB Dark Matter tiles
    const map = L.map(containerRef.current, {
      center: [20, 55],
      zoom: 3,
      minZoom: 2,
      maxZoom: 8,
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer(
      "https://tile.openstreetmap.jp/styles/osm-bright-ja/{z}/{x}/{y}.png",
      { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }
    ).addTo(map);

    // Apply dark theme filter to the tile layer via CSS
    const style = document.createElement("style");
    style.textContent = `.leaflet-tile-pane { filter: invert(1) hue-rotate(200deg) brightness(0.65) saturate(1.4); }`;
    document.head.appendChild(style);
    (containerRef.current as HTMLDivElement & { _darkStyle?: HTMLStyleElement })._darkStyle = style;

    // Draw tanker routes as polylines
    TANKER_ROUTES.forEach((route) => {
      const from = route.from as [number, number];
      const to   = route.to   as [number, number];
      // Create a curved arc using intermediate points
      const midLat = (from[0] + to[0]) / 2 + (Math.abs(to[1] - from[1]) * 0.1);
      const midLng = (from[1] + to[1]) / 2;
      const points: [number, number][] = [from, [midLat, midLng], to];
      L.polyline(points, {
        color: route.color,
        weight: route.width,
        opacity: 0.6,
        dashArray: "6 4",
        smoothFactor: 2,
      }).addTo(map).bindTooltip(route.label, { className: "map-tooltip" });
    });

    // Chokepoint markers
    CHOKEPOINTS.forEach((cp) => {
      const color = RISK_COLOR[cp.risk] ?? "#94a3b8";
      const icon = L.divIcon({
        html: `<div style="
          width:16px;height:16px;border-radius:50%;
          background:${color};border:2px solid #fff;
          box-shadow:0 0 8px ${color};
          animation: ${cp.risk === "HIGH" ? "pulse 1.5s infinite" : "none"};
        "></div>`,
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([cp.lat, cp.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="background:#1e293b;color:#e2e8f0;padding:8px;border-radius:6px;min-width:160px;">
            <strong style="color:${color}">${cp.name}</strong><br/>
            <span style="color:#94a3b8;font-size:11px">${cp.en}</span><br/>
            <div style="margin-top:4px;font-size:12px">
              流量: <strong>${cp.flow}</strong><br/>
              リスク: <strong style="color:${color}">${cp.risk}</strong>
            </div>
          </div>
        `, { className: "dark-popup" });
    });

    // Port markers
    MAJOR_PORTS.forEach((port) => {
      const color = PORT_COLOR[port.type] ?? "#94a3b8";
      const icon = L.divIcon({
        html: `<div style="width:8px;height:8px;border-radius:2px;background:${color};opacity:0.9;"></div>`,
        className: "",
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      });
      L.marker([port.lat, port.lng], { icon })
        .addTo(map)
        .bindTooltip(`${port.name} (${port.country})`, { direction: "top" });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      const el = containerRef.current as HTMLDivElement & { _darkStyle?: HTMLStyleElement };
      if (el?._darkStyle) { el._darkStyle.remove(); el._darkStyle = undefined; }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-navy-900/90 border border-navy-700 rounded-lg p-2 text-[10px] space-y-1 z-[1000]">
        <div className="text-slate-400 font-bold mb-1 uppercase tracking-wider">凡例</div>
        {[{ color: "#ef4444", label: "HIGH RISK チョークポイント" },
          { color: "#f59e0b", label: "MEDIUM RISK" },
          { color: "#22c55e", label: "LOW RISK" },
          { color: "#3b82f6", label: "タンカーレーン" }].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-slate-300">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
