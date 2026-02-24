
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wpService } from '../services/wpService';
import { useTranslation } from '../context/useTranslation';
import { TranslatableText } from '../components/TranslatableText';

const Eventos: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await wpService.getProducts();
        const eventProducts = Array.isArray(data) ? data.filter((p: any) =>
          p.sku?.toLowerCase().includes('evt') ||
          p.categories?.some((c: any) => c.slug?.toLowerCase().includes('eventos')) ||
          p.name?.toLowerCase().includes('congreso')
        ) : [];
        setEvents(eventProducts);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const featuredEvent = events.find(e => e.rlc_event_is_featured) || events[0];
  const otherEvents = events.filter(e => e.id !== featuredEvent?.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header - Simple Hero */}
      <section className="bg-primary pt-32 pb-20 px-6 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4 tracking-tight">
            {t('events.title.agenda')}<span className="text-secondary">LATAM COIL</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl mx-auto uppercase tracking-widest text-[10px]">
            {t('events.subtitle')}
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 -mt-10 relative z-20 pb-32">
        {/* Featured Event Teaser Section */}
        {featuredEvent && (
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-primary/5 border border-slate-100 overflow-hidden mb-20 animate-fade-in">
            <div className="grid lg:grid-cols-2">
              {/* Event Visual Side */}
              <div className="relative h-[400px] lg:h-auto">
                <img
                  src={featuredEvent?.featured_media_url || featuredEvent?.images?.[0]?.src || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200"}
                  alt="Event"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent lg:hidden"></div>
                <div className="absolute bottom-8 left-8 right-8 lg:hidden">
                  {featuredEvent.rlc_event_pretitle && (
                    <span className="inline-block bg-secondary text-primary px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 shadow-xl">
                      <TranslatableText>{featuredEvent.rlc_event_pretitle}</TranslatableText>
                    </span>
                  )}
                </div>
              </div>

              {/* Event Info Side */}
              <div className="p-10 lg:p-16 flex flex-col justify-center">
                {featuredEvent.rlc_event_pretitle && (
                  <span className="hidden lg:inline-block bg-secondary text-primary px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-8 self-start shadow-lg shadow-secondary/20">
                    <TranslatableText>{featuredEvent.rlc_event_pretitle}</TranslatableText>
                  </span>
                )}

                <h2 className="text-4xl lg:text-5xl font-black text-primary mb-4 leading-tight">
                  <TranslatableText>{featuredEvent.name}</TranslatableText>
                </h2>

                {featuredEvent.rlc_event_subtitle && (
                  <p className="text-xl text-secondary font-bold mb-8 italic opacity-90">
                    <TranslatableText>{featuredEvent.rlc_event_subtitle}</TranslatableText>
                  </p>
                )}

                <div className="grid grid-cols-2 gap-8 mb-10 pb-10 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-secondary border border-slate-100">
                      <span className="material-symbols-outlined">calendar_month</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('events.meta.date')}</p>
                      <p className="font-black text-primary text-sm">{featuredEvent.rlc_event_date || 'TBD'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-secondary border border-slate-100">
                      <span className="material-symbols-outlined">location_on</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('events.meta.location')}</p>
                      <p className="font-black text-primary text-sm">
                        <TranslatableText>{featuredEvent.rlc_event_location || t('events.meta.virtual')}</TranslatableText>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none text-slate-500 mb-10 line-clamp-3 leading-relaxed italic">
                  <TranslatableText isHtml>{featuredEvent.description}</TranslatableText>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <Link
                    to={`/eventos/${featuredEvent.id}`}
                    className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-secondary hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3"
                  >
                    {t('events.cta.details')}
                    <span className="material-symbols-outlined text-sm">visibility</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Events - Grid View */}
        <div>
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-1 bg-secondary rounded-full"></div>
            <h2 className="text-3xl font-black text-primary tracking-tight">{t('events.other.title')}</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherEvents.length > 0 ? otherEvents.map((event, i) => (
              <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={event.featured_media_url || event.images?.[0]?.src || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt=""
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[9px] font-black text-primary uppercase tracking-widest">
                      {event.rlc_event_date ? new Date(event.rlc_event_date).toLocaleDateString(t('common.locale', 'es-ES'), { month: 'short', day: 'numeric' }) : 'TBD'}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-primary mb-3 leading-tight group-hover:text-secondary transition-colors">
                    <TranslatableText>{event.name}</TranslatableText>
                  </h3>
                  <div className="text-slate-400 text-xs line-clamp-2 mb-6">
                    <TranslatableText isHtml>{event.description}</TranslatableText>
                  </div>
                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-secondary font-black text-sm">${event.regular_price}</span>
                    <Link to={`/eventos/${event.id}`} className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:text-secondary transition-colors">
                      {t('events.other.details')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-center text-slate-400 italic">
                {t('events.other.notfound')}
              </div>
            )}
          </div>
        </div>

        {/* Why Participate Section */}
        <div className="mt-20">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-1 bg-secondary rounded-full"></div>
            <h2 className="text-3xl font-black text-primary tracking-tight">{t('events.why.title')}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: t('events.why.experts'), icon: 'groups', desc: t('events.why.experts.desc') },
              { title: t('events.why.cert'), icon: 'workspace_premium', desc: t('events.why.cert.desc') },
              { title: t('events.why.res'), icon: 'library_books', desc: t('events.why.res.desc') }
            ].map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex gap-4 items-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">{s.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-primary leading-tight">{s.title}</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-primary rounded-3xl text-white relative overflow-hidden group">
            <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[10rem] opacity-5 group-hover:scale-110 transition-transform">cloud_download</span>
            <h3 className="text-xl font-bold mb-4">{t('events.history.title')}</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">{t('events.history.desc')}</p>
            <Link to="/recursos" className="w-full bg-secondary text-primary py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-xl">
              <span className="material-symbols-outlined text-sm">video_library</span>
              {t('events.history.cta')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Eventos;
