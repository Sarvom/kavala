"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

export interface MapShape {
  points: [number, number][];
  /** CSS class that sets the stroke and fill colours (see globals.css). */
  className: string;
  tooltip?: string;
}

interface Props {
  center: [number, number];
  zoom: number;
  shapes: MapShape[];
  /** Optional dot, drawn only on this screen (for the user's own position). */
  dot?: [number, number] | null;
  /** Fit the view to the shapes whenever they change. */
  fit?: boolean;
  height?: number;
}

/**
 * A Leaflet map with OpenStreetMap tiles that draws H3 hexagons. Leaflet works
 * with the page directly, so this component must only render in the browser.
 */
export default function HexMap({ center, zoom, shapes, dot, fit = false, height = 360 }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!box.current || map.current) return;
    map.current = L.map(box.current, { center, zoom, scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
    // The map is created once; later changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const bounds: L.LatLngExpression[] = [];
    for (const s of shapes) {
      const poly = L.polygon(s.points, { className: s.className, weight: 1.5 });
      if (s.tooltip) poly.bindTooltip(s.tooltip, { sticky: true });
      poly.addTo(g);
      bounds.push(...s.points);
    }
    if (dot) {
      L.circleMarker(dot, { radius: 6, className: "map-dot", weight: 2 }).addTo(g);
      bounds.push(dot);
    }
    if (fit && bounds.length > 0) m.fitBounds(L.latLngBounds(bounds), { padding: [24, 24], maxZoom: 18 });
  }, [shapes, dot, fit]);

  useEffect(() => {
    if (!fit) map.current?.setView(center, map.current.getZoom() < zoom ? zoom : map.current.getZoom());
    // Only follow the centre when not fitting to shapes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], fit]);

  return <div ref={box} className="map" style={{ height }} role="region" aria-label="Map" />;
}
