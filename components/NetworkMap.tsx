
import React, { useState, useEffect, useRef } from 'react';
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Line,
    ZoomableGroup
} from "react-simple-maps";

// TopoJSON data URL
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const points = [
    { id: 'mex', coordinates: [-102.55, 23.63], name: 'México', institutions: 45 },
    { id: 'col', coordinates: [-74.07, 4.71], name: 'Colombia', institutions: 38 },
    { id: 'per', coordinates: [-77.04, -12.04], name: 'Perú', institutions: 22 },
    { id: 'chi', coordinates: [-70.66, -33.44], name: 'Chile', institutions: 15 },
    { id: 'arg', coordinates: [-58.38, -34.60], name: 'Argentina', institutions: 28 },
    { id: 'bra', coordinates: [-47.88, -15.79], name: 'Brasil', institutions: 31 },
    { id: 'ecu', coordinates: [-78.46, -0.18], name: 'Ecuador', institutions: 18 },
    { id: 'pan', coordinates: [-79.51, 8.98], name: 'Panamá', institutions: 9 },
    { id: 'cri', coordinates: [-84.09, 9.92], name: 'C. Rica', institutions: 11 },
    { id: 'uru', coordinates: [-56.16, -34.90], name: 'Uruguay', institutions: 7 },
];

const connections = [
    { from: 'mex', to: 'col' },
    { from: 'col', to: 'bra' },
    { from: 'per', to: 'chi' },
    { from: 'chi', to: 'arg' },
    { from: 'bra', to: 'arg' },
    { from: 'col', to: 'arg' },
    { from: 'mex', to: 'pan' },
    { from: 'mex', to: 'cri' },
    { from: 'cri', to: 'pan' },
    { from: 'pan', to: 'col' },
    { from: 'per', to: 'bra' },
    { from: 'ecu', to: 'per' },
    { from: 'arg', to: 'uru' },
];

// Nombres de países socios para colorear
const partnerCountries = [
    "Mexico", "Colombia", "Peru", "Chile", "Argentina", "Brazil",
    "Ecuador", "Panama", "Costa Rica", "Uruguay"
];

const NetworkMap: React.FC = () => {
    const [tooltipContent, setTooltipContent] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        if (mapRef.current) {
            observer.observe(mapRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={mapRef} className="relative w-full h-[600px] overflow-hidden bg-slate-50 rounded-[3rem] border border-slate-200 shadow-2xl shadow-primary/10 group/map cursor-grab active:cursor-grabbing">
            <style>
                {`
                @keyframes flow {
                    0% { stroke-dashoffset: 20; opacity: 0.3; }
                    50% { opacity: 1; }
                    100% { stroke-dashoffset: 0; opacity: 0.3; }
                }
                @keyframes pulse-cyan {
                    0% { box-shadow: 0 0 0 0 rgba(0, 184, 212, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(0, 184, 212, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 184, 212, 0); }
                }
                .connection-line {
                    stroke-dasharray: 4;
                    animation: flow 3s linear infinite;
                    filter: drop-shadow(0 0 2px rgba(246, 168, 0, 0.5));
                }
                .partner-land {
                    transition: all 0.5s ease;
                }
                .map-svg {
                  filter: drop-shadow(0 20px 50px rgba(15, 23, 42, 0.1));
                }
                `}
            </style>

            <div className="w-full h-full map-container">
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 320,
                    }}
                    className={`map-svg transition-transform duration-[2000ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <ZoomableGroup center={[-70, -15]} zoom={1.0} minZoom={0.5} maxZoom={4}>
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const isPartner = partnerCountries.includes(geo.properties.name);
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={isPartner ? "#E0F2F1" : "#FFFFFF"}
                                            stroke={isPartner ? "#00B8D4" : "#F1F5F9"}
                                            strokeWidth={isPartner ? 0.8 : 0.4}
                                            className="partner-land"
                                            style={{
                                                default: { outline: "none" },
                                                hover: {
                                                    fill: isPartner ? "#B2DFDB" : "#F8FAFC",
                                                    outline: "none",
                                                    cursor: isPartner ? "pointer" : "default"
                                                },
                                                pressed: { outline: "none" },
                                            }}
                                            onMouseEnter={() => {
                                                if (isPartner) setTooltipContent(geo.properties.name);
                                            }}
                                            onMouseLeave={() => setTooltipContent(null)}
                                        />
                                    );
                                })
                            }
                        </Geographies>

                        {/* Líneas de conexión curvas */}
                        {connections.map((conn, i) => {
                            const p1 = points.find(p => p.id === conn.from)!;
                            const p2 = points.find(p => p.id === conn.to)!;

                            return (
                                <Line
                                    key={i}
                                    from={p1.coordinates as [number, number]}
                                    to={p2.coordinates as [number, number]}
                                    stroke="#F6A800"
                                    strokeWidth={1.2}
                                    strokeLinecap="round"
                                    className="connection-line"
                                    style={{
                                        animationDelay: `${i * 0.2}s`,
                                    }}
                                />
                            );
                        })}

                        {/* Marcadores Neón */}
                        {points.map((p, idx) => (
                            <Marker key={p.id} coordinates={p.coordinates as [number, number]}>
                                <g
                                    className="group/marker transition-all duration-300 cursor-pointer"
                                    onMouseEnter={() => setTooltipContent(`${p.name}: ${p.institutions} Instituciones`)}
                                    onMouseLeave={() => setTooltipContent(null)}
                                >
                                    <circle
                                        r={6}
                                        fill="#00B8D4"
                                        fillOpacity={0.2}
                                        className="animate-pulse"
                                    />
                                    <circle
                                        r={3}
                                        fill="#00B8D4"
                                        className="group-hover/marker:r-5 transition-all shadow-lg"
                                        style={{ filter: 'drop-shadow(0 0 5px #00B8D4)' }}
                                    />

                                    <text
                                        textAnchor="start"
                                        x={8}
                                        y={3}
                                        className="text-[8px] font-black uppercase tracking-widest fill-primary/60 group-hover/marker:fill-primary transition-all pointer-events-none"
                                        style={{
                                            fontSize: '6px',
                                            fontFamily: 'system-ui, -apple-system, sans-serif'
                                        }}
                                    >
                                        {p.name}
                                    </text>
                                </g>
                            </Marker>
                        ))}
                    </ZoomableGroup>
                </ComposableMap>
            </div>

            {/* Floating Tooltip */}
            {tooltipContent && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="bg-primary/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/20 animate-in zoom-in duration-200">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-1">Nivel de Conexión</p>
                        <p className="text-sm font-bold">{tooltipContent}</p>
                    </div>
                </div>
            )}

            {/* Hint overlay */}
            <div className="absolute bottom-32 right-10 flex items-center gap-2 bg-white/40 backdrop-blur px-4 py-2 rounded-full border border-white/40 opacity-0 group-hover/map:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-xs text-primary">drag_pan</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-primary">Navega por el continente</span>
            </div>


            <div className="absolute bottom-10 left-10 right-10 bg-white/70 backdrop-blur-2xl border border-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom duration-1000">
                <div className="flex items-center gap-6">
                    <div className="flex -space-x-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-3 border-white bg-slate-200 overflow-hidden shadow-xl hover:scale-110 hover:z-10 transition-all">
                                <img src={`https://i.pravatar.cc/150?u=rlc${i}`} alt="" />
                            </div>
                        ))}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1.5">Nuestra Comunidad</p>
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="material-symbols-outlined text-sm">apartment</span>
                            <p className="text-xs font-bold transition-all">+200 Universidades en Red</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-secondary/10 px-6 py-3 rounded-full border border-secondary/20">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                    </span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Live Connections</span>
                </div>
            </div>
        </div>
    );
};

export default NetworkMap;
