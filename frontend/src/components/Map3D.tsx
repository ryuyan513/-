import { useEffect, useRef } from "react";
import { CHOKEPOINTS, TANKER_ROUTES, MAJOR_PORTS } from "../data/mapData";

const RISK_COLOR: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };
const PORT_COLOR: Record<string, string> = {
  OIL_TERMINAL: "#f97316", LNG_HUB: "#3b82f6", LNG_EXPORT: "#06b6d4",
  LNG_IMPORT: "#8b5cf6", OIL_HUB: "#f59e0b", BUNKERING: "#10b981",
};

type GlobeInstance = {
  globeImageUrl: (url: string) => GlobeInstance;
  bumpImageUrl:  (url: string) => GlobeInstance;
  backgroundImageUrl: (url: string) => GlobeInstance;
  showAtmosphere: (v: boolean) => GlobeInstance;
  atmosphereColor: (c: string) => GlobeInstance;
  atmosphereAltitude: (v: number) => GlobeInstance;
  width:  (v: number) => GlobeInstance;
  height: (v: number) => GlobeInstance;
  pointsData: (d: object[]) => GlobeInstance;
  pointLat:    (k: string) => GlobeInstance;
  pointLng:    (k: string) => GlobeInstance;
  pointColor:  (fn: (d: object) => string) => GlobeInstance;
  pointAltitude: (v: number) => GlobeInstance;
  pointRadius:   (v: number) => GlobeInstance;
  pointLabel:    (fn: (d: object) => string) => GlobeInstance;
  arcsData: (d: object[]) => GlobeInstance;
  arcStartLat: (fn: (d: object) => number) => GlobeInstance;
  arcStartLng: (fn: (d: object) => number) => GlobeInstance;
  arcEndLat:   (fn: (d: object) => number) => GlobeInstance;
  arcEndLng:   (fn: (d: object) => number) => GlobeInstance;
  arcColor:    (fn: (d: object) => string[]) => GlobeInstance;
  arcAltitude:       (v: number) => GlobeInstance;
  arcStroke:         (fn: (d: object) => number) => GlobeInstance;
  arcDashLength:     (v: number) => GlobeInstance;
  arcDashGap:        (v: number) => GlobeInstance;
  arcDashAnimateTime:(v: number) => GlobeInstance;
  arcLabel:    (fn: (d: object) => string) => GlobeInstance;
  ringsData: (d: object[]) => GlobeInstance;
  ringLat:   (fn: (d: object) => number) => GlobeInstance;
  ringLng:   (fn: (d: object) => number) => GlobeInstance;
  ringColor: (fn: (d: object) => string)  => GlobeInstance;
  ringMaxRadius: (v: number) => GlobeInstance;
  ringPropagationSpeed: (v: number) => GlobeInstance;
  ringRepeatPeriod: (v: number) => GlobeInstance;
  pointOfView: (pov: { lat: number; lng: number; altitude: number }, ms?: number) => GlobeInstance;
  controls: () => { autoRotate: boolean; autoRotateSpeed: number };
  scene:    () => unknown;
};

export default function Map3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized  = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initialized.current) return;
    initialized.current = true;

    let globe: GlobeInstance | null = null;
    let animFrame = 0;

    (async () => {
      if (!containerRef.current) return;
      const mod = await import("globe.gl");
      // globe.gl exports a factory function (not a class)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobeFactory = (mod.default ?? mod) as unknown as (el: HTMLElement) => GlobeInstance;
      if (!containerRef.current) return;

      globe = GlobeFactory(containerRef.current)
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("https://unpkg.com/three-globe/example/img/night-sky.png")
        .showAtmosphere(true)
        .atmosphereColor("#1d4ed8")
        .atmosphereAltitude(0.18)
        .width(containerRef.current.clientWidth)
        .height(containerRef.current.clientHeight)
        // Chokepoints as points
        .pointsData(CHOKEPOINTS as unknown as object[])
        .pointLat("lat")
        .pointLng("lng")
        .pointColor((d) => RISK_COLOR[(d as typeof CHOKEPOINTS[0]).risk] ?? "#94a3b8")
        .pointAltitude(0.015)
        .pointRadius(0.5)
        .pointLabel((d) => {
          const cp = d as typeof CHOKEPOINTS[0];
          return `<div style="background:#1e293b;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px;line-height:1.5">
            <strong style="color:${RISK_COLOR[cp.risk]}">${cp.name}</strong><br/>
            流量: ${cp.flow} | リスク: ${cp.risk}
          </div>`;
        })
        // Pulse rings for HIGH risk chokepoints
        .ringsData(CHOKEPOINTS.filter((c) => c.risk === "HIGH") as unknown as object[])
        .ringLat((d) => (d as typeof CHOKEPOINTS[0]).lat)
        .ringLng((d) => (d as typeof CHOKEPOINTS[0]).lng)
        .ringColor(() => "#ef4444")
        .ringMaxRadius(3)
        .ringPropagationSpeed(1.5)
        .ringRepeatPeriod(1500)
        // Tanker arcs
        .arcsData(TANKER_ROUTES as unknown as object[])
        .arcStartLat((d) => (d as typeof TANKER_ROUTES[0]).from[0])
        .arcStartLng((d) => (d as typeof TANKER_ROUTES[0]).from[1])
        .arcEndLat((d)   => (d as typeof TANKER_ROUTES[0]).to[0])
        .arcEndLng((d)   => (d as typeof TANKER_ROUTES[0]).to[1])
        .arcColor((d) => {
          const r = d as typeof TANKER_ROUTES[0];
          return [`${r.color}66`, r.color];
        })
        .arcAltitude(0.2)
        .arcStroke((d) => (d as typeof TANKER_ROUTES[0]).width * 0.35)
        .arcDashLength(0.45)
        .arcDashGap(0.15)
        .arcDashAnimateTime(2500)
        .arcLabel((d) => (d as typeof TANKER_ROUTES[0]).label);

      // Initial view focused on Middle East / Persian Gulf
      globe.pointOfView({ lat: 22, lng: 55, altitude: 2.2 }, 1000);

      // Slow auto-rotate
      const ctrl = globe.controls();
      ctrl.autoRotate = true;
      ctrl.autoRotateSpeed = 0.3;

      // Remove loading text
      const loading = containerRef.current?.querySelector(".globe-loading");
      if (loading) loading.remove();

      // Resize handler
      const onResize = () => {
        if (containerRef.current && globe) {
          globe.width(containerRef.current.clientWidth).height(containerRef.current.clientHeight);
        }
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    })().catch(console.error);

    return () => {
      cancelAnimationFrame(animFrame);
      initialized.current = false;
      // Clean up globe canvas
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative">
      <div className="globe-loading absolute inset-0 flex items-center justify-center text-slate-600 text-sm animate-pulse pointer-events-none">
        3D Globe 読み込み中…
      </div>
    </div>
  );
}
