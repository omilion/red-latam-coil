
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wpService } from '../services/wpService';
import NetworkMap from '../components/NetworkMap';
import ActionAxes from '../components/ActionAxes';
import { TranslatableText } from '../components/TranslatableText';
import { useTranslation } from '../context/useTranslation';
import { formatEventDateRange } from '../services/dateUtils';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [featuredEvent, setFeaturedEvent] = useState<any>(null);
  const [webSettings, setWebSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intersection Observer for reveal animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.15 });

    const revealElements = document.querySelectorAll('.reveal-container');
    revealElements.forEach(el => observer.observe(el));

    return () => {
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, [loading]); // Re-run when loading finished and sections are rendered

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [productsData, settingsData] = await Promise.all([
          wpService.getProducts(),
          wpService.getWebSettings()
        ]);

        // Buscamos el primero que sea destacado, o el último evento creado
        const events = productsData.filter((p: any) =>
          p.sku?.startsWith('EVT-') ||
          p.categories?.some((c: any) => c.slug === 'eventos')
        );
        const featured = events.find((e: any) => e.rlc_event_is_featured) || events[0];
        setFeaturedEvent(featured);
        setWebSettings(settingsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  // Valores dinámicos del hero o fallbacks
  const heroTitle = webSettings?.hero?.title || t('hero.title');
  const heroSubtitle = webSettings?.hero?.subtitle || t('hero.subtitle');
  const heroCtaText = webSettings?.hero?.cta_text || t('hero.cta');
  const heroBgImage = webSettings?.hero?.bg_image || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80';
  const stats = webSettings?.stats || [
    { label: t('stats.unis', 'Universidades'), value: '+150' },
    { label: t('stats.students', 'Estudiantes'), value: '+5,000' },
    { label: t('stats.countries', 'Países'), value: '+12' },
    { label: t('stats.projects', 'Proyectos COIL'), value: '+300' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBgImage}
            className="w-full h-full object-cover brightness-[0.4]"
            alt="Hero Background"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="font-display text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
            {t('hero.title')
              .split(" ")
              .map((word, i) => (
                <span
                  key={i}
                  className={(
                    word.toLowerCase().includes("aula") ||
                    word.toLowerCase().includes("mundo") ||
                    word.toLowerCase().includes("classroom") ||
                    word.toLowerCase().includes("world")
                  ) ? "text-[#00b8d4]" : "text-white"}
                >
                  {word}{" "}
                </span>
              ))}
          </h1>
          <p className="text-xl lg:text-2xl text-slate-200 mb-10 leading-relaxed font-light max-w-2xl mx-auto">
            <TranslatableText>{heroSubtitle}</TranslatableText>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/membresias" className="bg-accent text-primary px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition transform shadow-xl">
              {t('hero.cta')}
            </Link>
            <Link to="/recursos" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-primary transition transform shadow-xl flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">search</span>
              {t('hero.explore')}
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat: any, i: number) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100 hover:translate-y-[-4px] transition-transform">
              <div className={`text-4xl font-display font-extrabold mb-2 ${i % 2 === 0 ? 'text-secondary' : 'text-accent'}`}>{stat.value}</div>
              <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                <TranslatableText>{stat.label}</TranslatableText>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Membership Invitation Section */}
      <section className="max-w-7xl mx-auto px-6 mb-24 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative animate-fade-in order-2 lg:order-1">
            <NetworkMap />
            {/* Overlay badge */}
            <div className="absolute top-8 left-8 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce-slow">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary font-black">
                <span className="material-symbols-outlined">public</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">
                  <TranslatableText>Red Global</TranslatableText>
                </p>
                <p className="text-sm font-black text-primary leading-none">
                  <TranslatableText>+12 Países Unidos</TranslatableText>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div>
              <span className="inline-block bg-secondary/10 text-secondary px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-6 border border-secondary/20">
                {t('home.membership.pre')}
              </span>
              <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-primary leading-tight mb-6">
                {t('home.membership.title1')} <span className="text-secondary">{t('home.membership.title2')}</span>
              </h2>
              <p className="text-lg text-slate-500 font-light leading-relaxed">
                {t('home.membership.desc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: t('home.benefits.net'), icon: 'hub', desc: t('home.benefits.net_desc') },
                { title: t('home.benefits.proj'), icon: 'account_tree', desc: t('home.benefits.proj_desc') },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl border border-dotted border-slate-200 hover:border-secondary transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-secondary transition-colors">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <Link
                to="/membresias"
                className="inline-flex items-center gap-3 bg-primary text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-secondary hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                {t('home.cta.join')}
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Event Banner */}
      {!loading && featuredEvent && (
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <div className="relative overflow-hidden bg-primary rounded-[2.5rem] p-8 lg:p-20 flex flex-col lg:flex-row items-center justify-between text-white border border-slate-800 shadow-2xl group">
            <div className="absolute inset-0 opacity-15 pointer-events-none transition-transform duration-700 group-hover:scale-105">
              <img src={featuredEvent.featured_media_url || featuredEvent.images?.[0]?.src || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200"} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent z-0"></div>

            <div className="relative z-10 lg:w-3/5">
              {featuredEvent.rlc_event_pretitle && (
                <span className="inline-block bg-secondary text-primary px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-6 shadow-lg shadow-secondary/20">
                  <TranslatableText>{featuredEvent.rlc_event_pretitle}</TranslatableText>
                </span>
              )}
              <h2 className="font-display text-4xl lg:text-6xl font-extrabold mb-4 leading-tight">
                <TranslatableText>{featuredEvent.name}</TranslatableText>
              </h2>
              {featuredEvent.rlc_event_subtitle && (
                <p className="text-xl text-secondary font-medium mb-8 italic">
                  <TranslatableText>{featuredEvent.rlc_event_subtitle}</TranslatableText>
                </p>
              )}
              <div className="text-lg text-slate-300 mb-10 max-w-xl line-clamp-2 font-light">
                <TranslatableText isHtml>
                  {featuredEvent.short_description || featuredEvent.description || ''}
                </TranslatableText>
              </div>

              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                    <span className="material-symbols-outlined text-secondary">calendar_today</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('home.event.when')}</span>
                    <span className="text-sm font-black">{formatEventDateRange(featuredEvent.rlc_event_date, featuredEvent.rlc_event_date_end, 'es-ES')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                    <span className="material-symbols-outlined text-secondary">location_on</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('home.event.where')}</span>
                    <span className="text-sm font-black">{featuredEvent.rlc_event_location || t('common.virtual')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 lg:mt-0 relative z-10">
              <Link to={`/eventos/${featuredEvent.id}`} className="group/btn bg-white text-primary px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-secondary hover:text-white transition-all shadow-2xl inline-flex items-center gap-4 hover:scale-105 active:scale-95">
                {t('home.event.cta')}
                <span className="material-symbols-outlined transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Action Axes Section */}
      <ActionAxes />

      {/* Scroll Animated Title Section */}
      <section className="pt-8 pb-40 bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-black leading-tight reveal-container px-4">
            {t('home.scroll_title')
              .split(" ")
              .map((word, i) => (
                <span
                  key={i}
                  className="reveal-word inline-block"
                  style={{
                    transitionDelay: `${i * 0.1}s`,
                    color: (
                      word.toLowerCase().includes("muro") ||
                      word.toLowerCase().includes("aula") ||
                      word.toLowerCase().includes("poder") ||
                      word.toLowerCase().includes("crear") ||
                      word.toLowerCase().includes("wall") ||
                      word.toLowerCase().includes("classroom") ||
                      word.toLowerCase().includes("power") ||
                      word.toLowerCase().includes("create")
                    ) ? "#00b8d4" : "inherit"
                  }}
                >
                  {word}&nbsp;
                </span>
              ))}
          </h2>
        </div>
        <style>
          {`
          .reveal-word {
            opacity: 0;
            transform: translateY(30px);
            filter: blur(5px);
            transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .reveal-container.visible .reveal-word {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
          `}
        </style>
      </section>

      {/* Testimonials (Experiencias que inspiran) */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary mb-4">{t('home.testimonials.title')}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t('home.testimonials.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Dra. Ana Martínez', org: 'Tec de Monterrey, México', text: '"La red COIL nos permitió internacionalizar el currículo de una forma que nunca imaginamos, conectando a mis estudiantes con pares en México y Chile."', initial: 'AM', color: 'bg-primary' },
              { name: 'Ricardo Castro', org: 'Univ. de los Andes, Colombia', text: '"Encontrar socios estratégicos era nuestro mayor reto. El buscador de la Red LatAm simplificó todo el proceso de emparejamiento."', initial: 'RC', color: 'bg-secondary' },
              { name: 'Sofia González', org: 'USP, Brasil', text: '"COIL no es solo tecnología, es pedagogía centrada en la diversidad. La formación de la Red fue fundamental para nuestro éxito."', initial: 'SG', color: 'bg-accent text-primary' }
            ].map((testi, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative">
                <span className="material-symbols-outlined text-secondary/20 text-6xl absolute top-4 left-4">format_quote</span>
                <p className="text-slate-600 mb-8 relative z-10 italic leading-relaxed">
                  <TranslatableText>{testi.text}</TranslatableText>
                </p>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${testi.color} rounded-full flex items-center justify-center text-white font-bold`}>{testi.initial}</div>
                  <div>
                    <h4 className="font-bold text-primary">{testi.name}</h4>
                    <p className="text-xs text-slate-500">{testi.org}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Banner */}
      <section className="px-6 py-24 mb-24">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden group">
          <div className="absolute inset-0 z-0 opacity-40 transition-transform duration-700 group-hover:scale-110">
            <img
              src="/img/home_final_banner_bg.png"
              className="w-full h-full object-cover"
              alt="Community"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent opacity-90 z-10"></div>

          <div className="relative z-20">
            <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-8 tracking-tight">
              {t('about.footer.title')}
            </h2>
            <p className="text-xl text-slate-300 font-light mb-12 max-w-2xl mx-auto">
              {t('about.footer.desc')}
            </p>
            <Link
              to="/membresias"
              className="inline-flex bg-accent text-primary px-12 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              {t('about.footer.cta')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
