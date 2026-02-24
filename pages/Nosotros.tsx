import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wpService } from '../services/wpService';
import NetworkMap from '../components/NetworkMap';
import { useTranslation } from '../context/useTranslation';
import { TranslatableText } from '../components/TranslatableText';
import ActionAxes from '../components/ActionAxes';

// Logos Miembros Fundadores
import logoUV from '../img/logo-universidad-veracruzana.png';
import logoUDEM from '../img/logo-universidad-de-monterrrey.png';
import logoCOILConsulting from '../img/logo-coil-consulting.png';
import logoUNESP from '../img/Logo_Universidad-paulista.svg';
import logoITM from '../img/instituto-medallin.jpg';

const Nosotros: React.FC = () => {
  const { t } = useTranslation();
  const [webSettings, setWebSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFounders, setShowFounders] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const settings = await wpService.getWebSettings();
        setWebSettings(settings);
      } catch (error) {
        console.error('Error loading web settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const teamMembers = webSettings?.team?.filter((m: any) => m.visible) || [
    { name: 'Coord. General', role: 'Consejo Directivo', inst: 'Universidad Veracruzana', icon: 'person_filled' },
    { name: 'Rep. México', role: 'Consejo Regional', inst: 'Inst. Tecnológico de Monterrey', icon: 'person' },
    { name: 'Rep. Colombia', role: 'Consejo Regional', inst: 'Univ. de los Andes', icon: 'person' },
    { name: 'Rep. Cono Sur', role: 'Consejo Regional', inst: 'Univ. de Buenos Aires', icon: 'person' }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* 1. SECCIÓN HERO (Cabecera) */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-primary">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-[30rem] absolute -top-40 -left-20 text-white">public</span>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-secondary/30">
            {t('about.hero.pre')}
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
            <TranslatableText>{t('about.hero.title')}</TranslatableText>
          </h1>
          <h2 className="text-2xl md:text-3xl font-display font-medium text-slate-300 mb-10 italic">
            {t('about.hero.subtitle')}
          </h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-slate-400 font-light leading-relaxed mb-0">
              {t('about.hero.desc')}
            </p>
          </div>
        </div>
      </section>

      {/* 3. IDENTIDAD ESTRATÉGICA (Misión, Visión y Valores) */}
      <section className="bg-slate-50 py-32 rounded-[4rem] mx-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <span className="text-secondary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">{t('about.purpose.pre')}</span>
            <h2 className="text-5xl font-display font-black text-primary tracking-tight italic">{t('about.purpose.title')}</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 mb-24">
            <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-white relative overflow-hidden group">
              <span className="material-symbols-outlined text-[10rem] absolute -bottom-10 -right-10 text-primary/5 group-hover:text-secondary/10 transition-colors">rocket_launch</span>
              <h3 className="text-3xl font-display font-black text-primary mb-8 flex items-center gap-4">
                {t('about.mission.title')}
                <div className="h-1 w-20 bg-secondary rounded-full"></div>
              </h3>
              <p className="text-xl text-slate-500 font-light leading-relaxed italic">
                {t('about.mission.desc')}
              </p>
            </div>
            <div className="bg-primary p-12 rounded-[3rem] shadow-xl relative overflow-hidden group">
              <span className="material-symbols-outlined text-[10rem] absolute -bottom-10 -right-10 text-white/5 group-hover:text-secondary/10 transition-colors">visibility</span>
              <h3 className="text-3xl font-display font-black text-white mb-8 flex items-center gap-4">
                {t('about.vision.title')}
                <div className="h-1 w-20 bg-secondary rounded-full"></div>
              </h3>
              <p className="text-xl text-slate-300 font-light leading-relaxed italic">
                {t('about.vision.desc')}
              </p>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid lg:grid-cols-2 gap-16">
              {/* Columna 1: Valores */}
              <div>
                <h3 className="text-3xl font-display font-black text-primary mb-10 flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary">verified</span>
                  Valores
                  <div className="h-1 flex-1 bg-slate-100 rounded-full"></div>
                </h3>
                <div className="space-y-8">
                  {[
                    { title: t('about.values.inclusion'), icon: 'all_inclusive', text: t('about.values.inclusion.desc') },
                    { title: t('about.values.collab'), icon: 'handshake', text: t('about.values.collab.desc') },
                    { title: t('about.values.innov'), icon: 'psychology', text: t('about.values.innov.desc') }
                  ].map((v, i) => (
                    <div key={i} className="flex items-start gap-6 group">
                      <div className="w-12 h-12 shrink-0 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                        <span className="material-symbols-outlined text-2xl">{v.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-primary mb-1">{v.title}</h4>
                        <p className="text-slate-500 font-light leading-relaxed text-sm">{v.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna 2: Objetivos Estratégicos */}
              <div>
                <h3 className="text-3xl font-display font-black text-primary mb-10 flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary">target</span>
                  {t('about.objectives.title')}
                  <div className="h-1 flex-1 bg-slate-100 rounded-full"></div>
                </h3>
                <div className="space-y-8 text-left">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="relative pl-12 group">
                      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-black group-hover:bg-secondary group-hover:text-white transition-all">
                        {i}
                      </div>
                      <p className="text-slate-500 font-light leading-relaxed text-sm">
                        {t(`about.objectives.${i}`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NUESTROS OBJETIVOS / EJES DE ACCIÓN */}
      <ActionAxes />

      {/* 2. LÍNEA DE TIEMPO (Nuestra Historia) */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-display font-black text-primary tracking-tight text-center mb-16">{t('about.history.title')}</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative border-t-2 border-slate-100 pt-16 mt-8">
            {[
              { year: '2016', title: 'Nace COIL-UV', desc: 'El programa inicia en la Rectoría de la Universidad Veracruzana.' },
              { year: '2018', title: 'Alianza SUNY', desc: 'Acuerdo estratégico con SUNY COIL Center de Estados Unidos.' },
              { year: '2020', title: 'Expansión Regional', desc: 'Se crea la Red Latinoamericana COIL ante la demanda de intercambios virtuales COIL en LatAm.' },
              { year: '2026', title: 'Red LatAm COIL', desc: 'Constitución como asociación civil y plataforma autónoma.' }
            ].map((item, i) => (
              <div key={i} className="flex-1 relative group text-center md:text-left">
                <div className="absolute -top-[76px] left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 w-4 h-4 rounded-full bg-secondary border-4 border-white shadow-lg z-20 transition-transform group-hover:scale-150"></div>
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 group-hover:bg-white group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500">
                  <span className="text-3xl font-black text-secondary/30 mb-2 block font-display tracking-tighter group-hover:text-secondary/100 transition-colors">{item.year}</span>
                  <h4 className="text-lg font-black text-primary mb-3 leading-tight">
                    <TranslatableText>{item.title}</TranslatableText>
                  </h4>
                  <p className="text-sm text-slate-500 font-light leading-relaxed">
                    <TranslatableText>{item.desc}</TranslatableText>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. GOBERNANZA (Equipo) */}
      <section className="bg-primary py-32 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/5 skew-x-12 transform origin-top translate-x-32"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mb-24">
            <span className="text-secondary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">{t('about.team.pre')}</span>
            <h2 className="text-5xl font-display font-black text-white tracking-tight italic mb-8">{t('about.team.title')}</h2>
            <p className="text-xl text-slate-400 font-light leading-relaxed">
              {t('about.team.desc')}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {teamMembers.map((m: any, i: number) => (
              <div key={i} className="group cursor-default">
                <div className="aspect-[4/5] bg-white/5 rounded-[2.5rem] border border-white/10 p-2 overflow-hidden mb-6 relative hover:border-secondary/50 transition-colors shadow-2xl">
                  <div className="w-full h-full bg-slate-800 rounded-[2rem] flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-700 overflow-hidden">
                    {m.image ? (
                      <img src={m.image} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" alt={m.name} />
                    ) : (
                      <span className="material-symbols-outlined text-8xl text-white/10 group-hover:text-secondary group-hover:scale-110 transition-all">{m.icon || 'person'}</span>
                    )}
                  </div>
                </div>
                <h4 className="font-bold text-xl text-white group-hover:text-secondary transition-colors">{m.name}</h4>
                <p className="text-secondary/70 text-[10px] font-black uppercase tracking-widest mt-1 mb-2">
                  <TranslatableText>{m.role}</TranslatableText>
                </p>
                <div className="h-px w-8 bg-white/20 mb-3 group-hover:w-full transition-all duration-700"></div>
                <p className="text-slate-400 text-xs italic">
                  <TranslatableText>{m.inst}</TranslatableText>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. DIRECTORIO Y MIEMBROS (El Mapa) */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-12 mb-16 text-center">
              <span className="text-secondary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">{t('about.map.pre')}</span>
              <h2 className="text-5xl font-display font-black text-primary tracking-tight">{t('about.map.title')}</h2>
              <p className="text-xl text-slate-500 font-light mt-6 max-w-2xl mx-auto">{t('about.map.desc')}</p>
            </div>

            <div className="lg:col-span-7 h-[600px] bg-slate-50 rounded-[3rem] border border-slate-100 p-8 shadow-inner overflow-hidden relative">
              <NetworkMap />
            </div>

            <div className="lg:col-span-5 space-y-10">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { n: '200', l: t('about.stats.inst'), icon: 'account_balance', color: 'text-secondary' },
                  { n: '10', l: t('about.stats.countries'), icon: 'public', color: 'text-accent' },
                  { n: '5,000', l: t('about.stats.students'), icon: 'groups', color: 'text-secondary' },
                  { n: '2020', l: t('about.stats.founder'), icon: 'history', color: 'text-accent' }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <span className={`material-symbols-outlined ${s.color} mb-6 text-3xl group-hover:scale-110 transition-transform`}>{s.icon}</span>
                    <div className="text-3xl font-black text-primary mb-1 tracking-tighter">{s.n}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{s.l}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowFounders(true)}
                className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-secondary transition-all shadow-xl group flex items-center justify-center gap-4"
              >
                {t('about.cta.title')}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>

              {/* Modal de Miembros Fundadores */}
              {showFounders && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm" onClick={() => setShowFounders(false)}></div>
                  <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                        <h3 className="text-3xl font-display font-black text-primary italic">Miembros Fundadores</h3>
                        <p className="text-slate-500 text-sm">Las instituciones y líderes que dieron vida a esta red.</p>
                      </div>
                      <button onClick={() => setShowFounders(false)} className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    <div className="p-8 overflow-y-auto">
                      <div className="grid md:grid-cols-3 gap-6">
                        {[
                          {
                            uni: 'Universidad Veracruzana',
                            logo: logoUV,
                            members: ['Verónica Rodríguez Luna', 'Mario Oliva Suárez', 'Ángel Fernández Montiel']
                          },
                          {
                            uni: 'Universidad de Monterrey',
                            logo: logoUDEM,
                            members: ['Brenda García Portillo', 'Thomas Buntru']
                          },
                          {
                            uni: 'COIL Consulting',
                            logo: logoCOILConsulting,
                            members: ['Jon Rubin']
                          },
                          {
                            uni: 'Universidad Estadual Paulista',
                            logo: logoUNESP,
                            members: ['José Celso Freire Junior']
                          },
                          {
                            uni: 'Instituto Tecnológico Metropolitano de Medellín',
                            logo: logoITM,
                            members: ['María Fernanda Vega de Mendoza']
                          }
                        ].map((founder, idx) => (
                          <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div className="h-12 flex items-center justify-center mb-4">
                              <img src={founder.logo} alt={founder.uni} className="max-h-full max-w-full object-contain" />
                            </div>
                            <h4 className="font-bold text-primary mb-3 leading-tight text-sm">{founder.uni}</h4>
                            <div className="space-y-0.5">
                              {founder.members.map((m, mIdx) => (
                                <p key={mIdx} className="text-[10px] text-slate-500 italic font-light">{m}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER CTA (Llamada a la Acción Final) */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden group">
          <div className="absolute inset-0 z-0 opacity-20 transition-transform duration-700 group-hover:scale-110">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200"
              className="w-full h-full object-cover grayscale"
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

export default Nosotros;
