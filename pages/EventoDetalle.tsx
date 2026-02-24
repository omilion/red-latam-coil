
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { wpService } from '../services/wpService';
import { useTranslation } from '../context/useTranslation';
import { TranslatableText } from '../components/TranslatableText';

const EventoDetalle: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEvent = async () => {
            if (!id) return;
            try {
                const data = await wpService.getProductById(id);
                if (data) {
                    setEvent(data);
                } else {
                    navigate('/eventos');
                }
            } catch (error) {
                console.error('Error loading event details:', error);
                navigate('/eventos');
            } finally {
                setLoading(false);
            }
        };
        loadEvent();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-secondary"></div>
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Hero Section */}
            <section className="bg-primary pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        {event.rlc_event_pretitle && (
                            <span className="inline-block bg-secondary text-primary px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-6 shadow-xl">
                                <TranslatableText>{event.rlc_event_pretitle}</TranslatableText>
                            </span>
                        )}
                        <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-6 leading-tight text-white">
                            <TranslatableText>{event.name}</TranslatableText>
                        </h1>
                        {event.rlc_event_subtitle && (
                            <p className="text-xl md:text-2xl text-secondary font-bold mb-8 italic opacity-90">
                                <TranslatableText>{event.rlc_event_subtitle}</TranslatableText>
                            </p>
                        )}

                        <div className="flex flex-wrap gap-6 mb-10">
                            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
                                    <span className="material-symbols-outlined">calendar_month</span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('event.detail.meta.date')}</p>
                                    <p className="font-bold text-white text-sm">{event.rlc_event_date || t('common.tbd')}</p>
                                    {event.rlc_event_time && <p className="text-xs text-slate-400 font-medium">{event.rlc_event_time} (UTC)</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
                                    <span className="material-symbols-outlined">location_on</span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('event.detail.meta.location')}</p>
                                    <p className="font-bold text-white text-sm">
                                        <TranslatableText>{event.rlc_event_location || t('common.virtual')}</TranslatableText>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Link
                            to={`/checkout/${event.id}`}
                            className="inline-flex bg-secondary text-primary px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-xl hover:scale-105 active:scale-95 items-center gap-3"
                        >
                            {t('event.detail.register')} ${event.regular_price}
                            <span className="material-symbols-outlined text-sm text-primary">rocket_launch</span>
                        </Link>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-4 bg-secondary/20 rounded-[3rem] blur-2xl group-hover:bg-secondary/30 transition-all"></div>
                        <img
                            src={event.featured_media_url || event.images?.[0]?.src || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200"}
                            alt={event.name}
                            className="relative w-full aspect-video lg:aspect-square object-cover rounded-[3rem] shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid lg:grid-cols-12 gap-16">
                    {/* Left Column: Description & Program */}
                    <div className="lg:col-span-8 space-y-16">
                        {/* Description */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-sm text-secondary">info</span>
                                </div>
                                <h2 className="text-3xl font-black text-primary tracking-tight">{t('event.detail.about')}</h2>
                            </div>
                            <div className="prose prose-slate max-w-none text-slate-600 text-lg leading-relaxed italic border-l-4 border-secondary/30 pl-8">
                                <TranslatableText isHtml>{event.description}</TranslatableText>
                            </div>
                        </section>

                        {/* Program */}
                        {event.rlc_event_program && (
                            <section>
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-primary tracking-tight">{t('event.detail.program')}</h2>
                                </div>

                                <div className="space-y-4">
                                    {(() => {
                                        try {
                                            const program = typeof event.rlc_event_program === 'string'
                                                ? JSON.parse(event.rlc_event_program)
                                                : event.rlc_event_program;

                                            return Array.isArray(program) ? program.map((item: any, idx: number) => (
                                                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-6 group hover:border-secondary transition-all hover:-translate-x-1 shadow-sm">
                                                    <span className="w-20 font-black text-secondary text-sm flex-shrink-0">{item.time}</span>
                                                    <span className="h-2 w-2 rounded-full bg-slate-200 group-hover:bg-secondary transition-colors"></span>
                                                    <p className="font-bold text-primary text-md">
                                                        <TranslatableText>{item.activity}</TranslatableText>
                                                    </p>
                                                </div>
                                            )) : null;
                                        } catch (e) {
                                            return null;
                                        }
                                    })()}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column: Objectives & Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-32 space-y-8">
                            {/* Objectives */}
                            {event.rlc_event_objectives && (
                                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-primary/5">
                                    <h3 className="text-xl font-black text-primary mb-8 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-secondary">target</span>
                                        {t('event.detail.objectives')}
                                    </h3>
                                    <ul className="space-y-6">
                                        {(() => {
                                            try {
                                                const objs = typeof event.rlc_event_objectives === 'string'
                                                    ? JSON.parse(event.rlc_event_objectives)
                                                    : event.rlc_event_objectives;

                                                return Array.isArray(objs) ? objs.map((obj: string, i: number) => (
                                                    <li key={i} className="flex gap-4 text-slate-500 text-sm leading-relaxed group">
                                                        <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-secondary group-hover:text-white transition-colors">
                                                            <span className="material-symbols-outlined text-[10px] font-black">check</span>
                                                        </div>
                                                        <TranslatableText>{obj}</TranslatableText>
                                                    </li>
                                                )) : null;
                                            } catch (e) {
                                                return null;
                                            }
                                        })()}
                                    </ul>

                                    <div className="mt-12 pt-10 border-t border-slate-50 italic text-slate-400 text-[10px] text-center uppercase tracking-widest leading-relaxed">
                                        {t('event.detail.certificate')}
                                    </div>
                                </div>
                            )}

                            {/* Why Participate Card */}
                            <div className="bg-primary p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                                <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[10rem] opacity-5 group-hover:scale-110 transition-transform">workspace_premium</span>
                                <h3 className="text-xl font-bold mb-4 relative z-10">{t('event.detail.why')}</h3>
                                <ul className="space-y-4 relative z-10 text-slate-300 text-xs">
                                    <li className="flex gap-3">
                                        <span className="text-secondary font-black">✓</span>
                                        {t('event.detail.why.benefit1')}
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-secondary font-black">✓</span>
                                        {t('event.detail.why.benefit2')}
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-secondary font-black">✓</span>
                                        {t('event.detail.why.benefit3')}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EventoDetalle;
