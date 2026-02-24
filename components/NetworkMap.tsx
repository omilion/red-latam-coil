
import React from 'react';
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
    { id: 'mex', coordinates: [-102.55, 23.63], name: 'México' },
    { id: 'col', coordinates: [-74.07, 4.71], name: 'Colombia' },
    { id: 'per', coordinates: [-77.04, -12.04], name: 'Perú' },
    { id: 'chi', coordinates: [-70.66, -33.44], name: 'Chile' },
    { id: 'arg', coordinates: [-58.38, -34.60], name: 'Argentina' },
    { id: 'bra', coordinates: [-47.88, -15.79], name: 'Brasil' },
    { id: 'spa', coordinates: [-3.70, 40.41], name: 'España' },
    { id: 'ecu', coordinates: [-78.46, -0.18], name: 'Ecuador' },
    { id: 'pan', coordinates: [-79.51, 8.98], name: 'Panamá' },
    { id: 'cri', coordinates: [-84.09, 9.92], name: 'C. Rica' },
    { id: 'uru', coordinates: [-56.16, -34.90], name: 'Uruguay' },
];

const connections = [
    { from: 'mex', to: 'col' },
    { from: 'mex', to: 'spa' },
    { from: 'col', to: 'bra' },
    { from: 'per', to: 'chi' },
    { from: 'chi', to: 'arg' },
    { from: 'bra', to: 'arg' },
    { from: 'bra', to: 'spa' },
    { from: 'col', to: 'arg' },
    { from: 'mex', to: 'pan' },
    { from: 'mex', to: 'cri' },
    { from: 'cri', to: 'pan' },
    { from: 'pan', to: 'col' },
    { from: 'per', to: 'bra' },
    { from: 'ecu', to: 'per' },
    { from: 'arg', to: 'uru' },
];

const NetworkMap: React.FC = () => {
    return (
        <div className="relative w-full h-[600px] overflow-hidden bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-primary/5 group/map cursor-move">
            <style>
                {`
                @keyframes dash {
                    from { stroke-dashoffset: 1000; opacity: 0; }
                    to { stroke-dashoffset: 0; opacity: 1; }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.5); opacity: 0.8; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .connection-line {
                    stroke-dasharray: 1000;
                    animation: dash 5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                .point-ring {
                    animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .floating-text {
                    animation: float 6s ease-in-out infinite;
                }
                .map-container svg {
                    filter: drop-shadow(0 10px 30px rgba(15, 23, 42, 0.05));
                }
                `}
            </style>

            <div className="w-full h-full p-4 map-container">
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 300,
                    }}
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <ZoomableGroup center={[-60, 0]} zoom={0.8} minZoom={0.5} maxZoom={4}>
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#F1F5F9"
                                        stroke="#E2E8F0"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#F8FAFC", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                ))
                            }
                        </Geographies>

                        {/* Líneas de conexión */}
                        {connections.map((conn, i) => {
                            const p1 = points.find(p => p.id === conn.from)!;
                            const p2 = points.find(p => p.id === conn.to)!;

                            return (
                                <Line
                                    key={i}
                                    from={p1.coordinates as [number, number]}
                                    to={p2.coordinates as [number, number]}
                                    stroke="#F6A800"
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                    className="connection-line"
                                    style={{
                                        animationDelay: `${i * 0.4}s`,
                                        opacity: 0.4
                                    }}
                                />
                            );
                        })}

                        {/* Marcadores */}
                        {points.map((p, idx) => (
                            <Marker key={p.id} coordinates={p.coordinates as [number, number]}>
                                <g className="group/marker transition-all duration-300">
                                    <circle
                                        r={p.id === 'spa' ? 6 : 4}
                                        className="point-ring"
                                        fill="#F6A800"
                                        fillOpacity={0.6}
                                    />
                                    <circle
                                        r={3}
                                        fill="#0F172A"
                                        className="group-hover/marker:fill-secondary group-hover/marker:r-4 transition-all"
                                    />
                                    <text
                                        textAnchor="middle"
                                        y={-12}
                                        className="text-[8px] font-black uppercase tracking-widest fill-slate-400 group-hover/marker:fill-primary transition-colors pointer-events-none floating-text"
                                        style={{
                                            fontSize: '8px',
                                            animationDelay: `${idx * 0.3}s`,
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

            {/* Hint overlay */}
            <div className="absolute bottom-32 right-10 flex items-center gap-2 bg-white/40 backdrop-blur px-4 py-2 rounded-full border border-white/40 opacity-0 group-hover/map:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-xs text-primary">drag_pan</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-primary">Arrastra para mover • Scroll para zoom</span>
            </div>

            {/* Glassmorphism Details Overlay */}
            <div className="absolute top-10 left-10 flex flex-col gap-3">
                <div className="bg-white/70 backdrop-blur-md border border-white/40 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-sm">public</span>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Impacto Global</p>
                        <p className="text-xs font-black text-primary leading-none">Iberoamérica Conectada</p>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-10 left-10 right-10 bg-white/60 backdrop-blur-lg border border-white/50 p-6 rounded-[2rem] flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                                <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="" />
                            </div>
                        ))}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Membresía Activa</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase transition-all">+200 Instituciones</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest italic">Live Connections</span>
                </div>
            </div>
        </div>
    );
};

export default NetworkMap;
