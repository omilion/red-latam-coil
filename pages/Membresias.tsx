import React, { useState, useEffect } from 'react';
import { wpService } from '../services/wpService';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/useTranslation';
import { TranslatableText } from '../components/TranslatableText';
import paypalLogo from '../img/PayPal.svg.png';

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  short_description: string;
  permalink: string;
  sku?: string;
}

const Membresias: React.FC = () => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const data = await wpService.getProducts();
      // Filtrar para mostrar solo membresías (evitando eventos)
      const filtered = Array.isArray(data) ? data.filter((p: any) => {
        const name = p.name?.toLowerCase() || '';
        const sku = p.sku?.toUpperCase() || '';
        return sku.startsWith('RLC-') ||
          name.includes('membresía') ||
          name.includes('plan') ||
          (!sku.startsWith('EVT-') && !name.includes('evento') && !name.includes('congreso'));
      }) : [];

      setProducts(filtered);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const faqs = [
    { q: t('memberships.faq.q1'), a: t('memberships.faq.a1') },
    { q: t('memberships.faq.q2'), a: t('memberships.faq.a2') },
    { q: t('memberships.faq.q3'), a: t('memberships.faq.a3') },
    { q: t('memberships.faq.q4'), a: t('memberships.faq.a4') },
    { q: t('memberships.faq.q5'), a: t('memberships.faq.a5') },
    { q: t('memberships.faq.q6'), a: t('memberships.faq.a6') },
    { q: t('memberships.faq.q7'), a: t('memberships.faq.a7') },
    { q: t('memberships.faq.q8'), a: t('memberships.faq.a8') },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary pt-32 pb-24 px-6 text-white text-center relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(0,184,212,0.15)_0%,transparent_70%)]"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <span className="bg-white/10 text-white px-8 py-2.5 rounded-full text-[14px] font-black uppercase tracking-[0.2em] border border-white/20">
              {t('memberships.title.badge')}
            </span>
            <span className="bg-secondary/20 text-secondary px-8 py-2.5 rounded-full text-[14px] font-black uppercase tracking-[0.2em] border border-secondary/30">
              {t('memberships.title.pre')}
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-display font-black mb-8 leading-tight">
            {t('memberships.title')}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-light leading-relaxed max-w-3xl mx-auto">
            {t('memberships.desc')}
          </p>
        </div>
      </section>

      <main className="max-w-7xl w-full mx-auto px-6 pb-24 -mt-12 relative z-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Membership Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(products.length || 1, 2)} gap-8 lg:gap-12 max-w-5xl mx-auto mb-32`}>
              {products.length > 0 ? (
                products.map((product) => (
                  <div key={product.id} className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 flex flex-col hover:border-secondary transition-all group relative">
                    {/* Etiqueta para productos destacados (ej: Institucional) */}
                    {(product.name.toLowerCase().includes('institucional') || product.sku?.includes('INST')) && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-primary text-[10px] font-black uppercase tracking-widest px-5 py-1.5 rounded-full shadow-lg">
                        {t('memberships.popular')}
                      </div>
                    )}
                    <div className="mb-8">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary/10 transition-colors">
                        <span className="material-symbols-outlined text-primary text-4xl">
                          {product.name.toLowerCase().includes('institucional') ? 'account_balance' : 'person'}
                        </span>
                      </div>
                      <h3 className="text-3xl font-display font-extrabold text-primary mb-2">
                        <TranslatableText>{product.name}</TranslatableText>
                      </h3>
                      <div className="text-slate-400 mb-6 text-sm">
                        <TranslatableText isHtml>{product.short_description}</TranslatableText>
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-5xl font-extrabold text-primary">${product.price}</span>
                        <span className="text-slate-400 ml-2 font-bold">{t('memberships.price.year')}</span>
                      </div>
                    </div>

                    <div className="space-y-4 mb-10 flex-grow">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                        <span className="text-slate-600 font-medium">{t('memberships.total.access')}</span>
                      </div>
                      <div className="text-sm text-slate-500 prose-sm prose-slate max-w-none
                        [&_ul]:list-none [&_ul]:p-0 [&_ul]:m-0 [&_ul]:space-y-3
                        [&_li]:relative [&_li]:pl-7 [&_li]:font-medium
                        [&_li]:before:content-['stars'] [&_li]:before:font-['Material_Symbols_Outlined']
                        [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-0.5
                        [&_li]:before:text-secondary [&_li]:before:text-lg
                      ">
                        <TranslatableText isHtml>{product.description}</TranslatableText>
                      </div>
                    </div>

                    <Link
                      to={`/checkout/${product.id}`}
                      className="block text-center bg-primary text-white hover:bg-secondary font-black py-5 px-6 rounded-2xl transition-all shadow-lg hover:shadow-secondary/20 uppercase text-xs tracking-widest"
                    >
                      {t('memberships.select')}
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400">{t('memberships.notfound')}</p>
                </div>
              )}
            </div>

            {/* Redesigned Events Banner - Unique & Premium */}
            <div className="max-w-6xl mx-auto mb-24 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-primary rounded-[3.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

              <div className="relative bg-slate-900 rounded-[3.5rem] p-10 md:p-16 flex flex-col lg:flex-row items-center gap-12 overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

                <div className="flex-1 text-center lg:text-left relative z-10">
                  <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                    </span>
                    Próximas Experiencias
                  </div>
                  <h3 className="text-3xl md:text-5xl font-display font-black text-white mb-6 leading-tight italic">
                    Participa de <br className="hidden md:block" /> nuestros eventos
                  </h3>
                  <p className="text-slate-400 text-lg font-light leading-relaxed mb-10 max-w-xl">
                    Compra tu pase único y accede a la innovación internacional más relevante de Iberoamérica.
                  </p>
                  <Link to="/eventos" className="inline-flex items-center gap-4 bg-accent text-primary px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl hover:shadow-accent/20">
                    Explorar Calendario
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </Link>
                </div>

                <div className="w-full lg:w-auto relative z-10">
                  <div className="grid grid-cols-2 gap-4 lg:w-80">
                    <div className="aspect-square bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center p-6 text-center group/card hover:bg-white/10 transition-colors">
                      <span className="material-symbols-outlined text-secondary text-4xl mb-3">forum</span>
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">Coloquios</span>
                    </div>
                    <div className="aspect-square bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center p-6 text-center translate-y-4 group/card hover:bg-white/10 transition-colors">
                      <span className="material-symbols-outlined text-accent text-4xl mb-3">theater_comedy</span>
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">Webinars</span>
                    </div>
                    <div className="aspect-square bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center p-6 text-center -translate-y-4 group/card hover:bg-white/10 transition-colors">
                      <span className="material-symbols-outlined text-secondary text-4xl mb-3">workspace_premium</span>
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">Talleres</span>
                    </div>
                    <div className="aspect-square bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center p-6 text-center group/card hover:bg-white/10 transition-colors">
                      <span className="material-symbols-outlined text-accent text-4xl mb-3">public</span>
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">Congresos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <section className="max-w-6xl mx-auto px-6 mb-24 py-24">
        <h2 className="text-3xl font-display font-extrabold text-center mb-16 text-primary">{t('memberships.faq.title')}</h2>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm h-fit">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-8 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-primary text-sm leading-snug">
                  <TranslatableText>{faq.q}</TranslatableText>
                </span>
                <span className={`material-symbols-outlined transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              {openFaq === i && (
                <div className="px-8 pb-5 text-slate-500 text-xs leading-relaxed border-t border-slate-50 pt-4">
                  <TranslatableText>{faq.a}</TranslatableText>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-24 border-t border-slate-200 max-w-7xl mx-auto">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{t('memberships.payment.secure')}</p>
        <div className="flex justify-center items-center">
          <img src={paypalLogo} alt="PayPal" className="h-12 w-auto" />
        </div>
      </footer>
    </div>
  );
};

export default Membresias;
