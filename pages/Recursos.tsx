
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wpService } from '../services/wpService';
import { authService, UserProfile } from '../services/authService';
import { useTranslation } from '../context/useTranslation';
import { TranslatableText } from '../components/TranslatableText';

const Recursos: React.FC = () => {
  const { t } = useTranslation();
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideoCategory, setActiveVideoCategory] = useState<number | null>(null);
  const [activeDocCategory, setActiveDocCategory] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resData, userData, catData] = await Promise.all([
          wpService.getResourcesPublic(),
          authService.getCurrentUser(),
          wpService.getResourceCategories()
        ]);
        setResources(resData);
        setUser(userData);
        setCategories(catData);
      } catch (error) {
        console.error('Error cargando recursos:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const isMember = user?.status === 'active';

  const videos = resources.filter(r => {
    const rType = r.type || r.rlc_resource_type;
    if (rType !== 'Video') return false;
    if (!activeVideoCategory) return true;
    const rCats = r.categories || r.categoria_recurso || [];
    return Array.isArray(rCats) && rCats.includes(activeVideoCategory);
  });

  const toolkits = resources.filter(r => {
    const rType = r.type || r.rlc_resource_type;
    if (rType === 'Video') return false;
    if (!activeDocCategory) return true;
    const rCats = r.categories || r.categoria_recurso || [];
    return Array.isArray(rCats) && rCats.includes(activeDocCategory);
  });

  const videoCategories = categories.filter(cat => {
    const catId = cat.term_id || cat.id;
    return resources.some(r => {
      const rType = r.type || r.rlc_resource_type;
      if (rType !== 'Video') return false;
      const rCats = r.categories || r.categoria_recurso || [];
      return Array.isArray(rCats) && rCats.includes(catId);
    });
  });

  const docCategories = categories.filter(cat => {
    const catId = cat.term_id || cat.id;
    return resources.some(r => {
      const rType = r.type || r.rlc_resource_type;
      if (rType === 'Video') return false;
      const rCats = r.categories || r.categoria_recurso || [];
      return Array.isArray(rCats) && rCats.includes(catId);
    });
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary py-24 px-6 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[20rem] absolute -top-20 -right-20">library_books</span>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="text-secondary font-display font-bold uppercase tracking-widest text-xs mb-4 inline-block">{t('resources.hero.pre')}</span>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-6 italic tracking-tight">{t('resources.hero.title')}</h1>
          <p className="text-xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto">
            {t('resources.hero.desc')}
          </p>
        </div>
      </section>

      {/* Videoteca Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-secondary/10 flex items-center justify-center text-secondary shadow-inner">
              <span className="material-symbols-outlined text-4xl">video_library</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-1 block">{t('resources.videoteca.pre')}</span>
              <h2 className="text-4xl font-display font-extrabold text-primary">{t('resources.videoteca.title')}</h2>
            </div>
          </div>

          {/* Category Filter for Videos */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveVideoCategory(null)}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${!activeVideoCategory ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {t('resources.videoteca.all')}
            </button>
            {videoCategories.map(cat => {
              const catId = cat.term_id || cat.id;
              return (
                <button
                  key={catId}
                  onClick={() => setActiveVideoCategory(catId)}
                  className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeVideoCategory === catId ? 'bg-secondary text-primary shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  <TranslatableText>{cat.name}</TranslatableText>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-10">
          {videos.length > 0 ? videos.map((video, i) => {
            const isLocked = (video.is_premium || video.rlc_resource_is_premium) && !isMember;
            return (
              <div key={i} className="group flex flex-col relative">
                <div className={`relative aspect-video bg-black rounded-3xl overflow-hidden shadow-xl border-2 border-slate-100 mb-6 transition-transform group-hover:scale-[1.02] ${isLocked ? 'grayscale' : ''}`}>
                  {!isLocked ? (
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`${video.url || video.rlc_resource_url}?modestbranding=1&rel=0`}
                      title={video.title?.rendered || video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/20 text-6xl">lock</span>
                    </div>
                  )}
                </div>

                {isLocked && (
                  <div className="absolute top-0 left-0 w-full aspect-video z-20 flex flex-col items-center justify-center text-center p-6 bg-primary/40 rounded-3xl backdrop-blur-md border border-white/20">
                    <span className="material-symbols-outlined text-5xl text-amber-400 mb-3 drop-shadow-lg">lock</span>
                    <p className="text-white font-black text-xs uppercase tracking-widest mb-4">{t('resources.locked.pre')}</p>
                    <Link to="/membresias" className="bg-secondary text-primary px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                      {t('resources.locked.cta')}
                    </Link>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black bg-secondary/10 text-secondary px-2 py-0.5 rounded-md uppercase tracking-widest border border-secondary/10">
                    {video.type || video.rlc_resource_type || 'Video'}
                  </span>
                  {(video.is_premium || video.rlc_resource_is_premium) && (
                    <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-md uppercase tracking-widest">Premium</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-primary mb-3 leading-tight group-hover:text-secondary transition-colors">
                  <TranslatableText>{video.title?.rendered || video.title}</TranslatableText>
                </h3>
                <div className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow line-clamp-2 font-light">
                  <TranslatableText isHtml>
                    {video.content?.rendered || video.content}
                  </TranslatableText>
                </div>

                {!isLocked && (
                  <a
                    href={video.url || video.rlc_resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2 hover:translate-x-1 transition-all"
                  >
                    {t('resources.video.fullscreen')}
                    <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                  </a>
                )}
              </div>
            );
          }) : (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs font-display">No se encontraron videos en esta categoría</p>
            </div>
          )}
        </div>
      </section>

      {/* Toolkit Grid - "Documentos" */}
      <section className="bg-slate-50 py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-4xl">folder_zip</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">{t('resources.toolkit.pre')}</span>
                <h2 className="text-4xl font-display font-extrabold text-primary italic">{t('resources.toolkit.title')}</h2>
              </div>
            </div>

            {/* Category Filter for Docs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveDocCategory(null)}
                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${!activeDocCategory ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}
              >
                {t('resources.videoteca.all')}
              </button>
              {docCategories.map(cat => {
                const catId = cat.term_id || cat.id;
                return (
                  <button
                    key={catId}
                    onClick={() => setActiveDocCategory(catId)}
                    className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeDocCategory === catId ? 'bg-secondary text-primary shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}
                  >
                    <TranslatableText>{cat.name}</TranslatableText>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {toolkits.length > 0 ? toolkits.map((tool, i) => {
              const isLocked = (tool.is_premium || tool.rlc_resource_is_premium) && !isMember;
              return (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-secondary/20 transition-all flex flex-col items-center text-center group relative overflow-hidden">
                  {isLocked && (
                    <div className="absolute inset-0 bg-primary/40 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
                      <span className="material-symbols-outlined text-4xl text-amber-500 mb-2 drop-shadow-lg">lock</span>
                      <p className="text-white font-black text-[10px] uppercase tracking-widest mb-4">{t('resources.toolkit.locked')}</p>
                      <Link to="/membresias" className="bg-secondary text-primary w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg">{t('resources.toolkit.join')}</Link>
                    </div>
                  )}

                  <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-secondary/10 transition-colors relative">
                    <span className="material-symbols-outlined text-primary text-4xl">
                      {tool.type === 'Video' || tool.rlc_resource_type === 'Video' ? 'video_library' :
                        (tool.type === 'PDF' || tool.rlc_resource_type === 'PDF' ? 'picture_as_pdf' :
                          (tool.type === 'XLSX' || tool.rlc_resource_type === 'XLSX' ? 'table_chart' :
                            (tool.type === 'DOCX' || tool.rlc_resource_type === 'DOCX' ? 'description' : 'article')))}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-black bg-primary/5 text-primary px-2.5 py-1 rounded-md uppercase tracking-widest border border-primary/5">
                      {tool.type || tool.rlc_resource_type || 'Recurso'}
                    </span>
                    {(tool.is_premium || tool.rlc_resource_is_premium) && (
                      <span className="text-[9px] font-black bg-amber-500 text-white px-2.5 py-1 rounded-md uppercase tracking-widest">Premium</span>
                    )}
                  </div>

                  <h4 className="font-bold text-primary mb-6 leading-tight text-lg min-h-[3rem] line-clamp-2">
                    <TranslatableText>{tool.title?.rendered || tool.title}</TranslatableText>
                  </h4>

                  <a
                    href={isLocked ? '#' : (tool.url || tool.rlc_resource_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-auto w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-secondary hover:text-primary'}`}
                  >
                    <span className="material-symbols-outlined text-lg">{isLocked ? 'lock' : 'download'}</span>
                    {isLocked ? t('resources.toolkit.blocked') : t('resources.toolkit.download')}
                  </a>
                </div>
              );
            }) : (
              <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">No hay documentos en esta categoría.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* External Link Section */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="bg-primary rounded-[4rem] p-12 lg:p-20 text-white flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-secondary/10 skew-x-12 translate-x-1/2"></div>
          <div className="flex-1 space-y-8 relative z-10 text-center lg:text-left">
            <div className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary font-black text-[10px] uppercase tracking-[0.2em]">{t('resources.external.pre')}</div>
            <h2 className="text-4xl lg:text-5xl font-display font-extrabold leading-tight italic">Accede a todo el contenido</h2>
            <p className="text-slate-300 leading-relaxed font-light text-xl max-w-2xl">
              Videoteca, informes, y eventos exclusivos con tu membresía de la Red LatAm COIL.
            </p>
            <Link
              to="/membresias"
              className="inline-flex items-center gap-4 bg-secondary text-primary px-12 py-6 rounded-[2rem] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-secondary/20"
            >
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              Ver Membresías
            </Link>
          </div>
          <div className="w-full lg:w-1/3 aspect-square bg-white/5 rounded-[3rem] flex items-center justify-center relative overflow-hidden backdrop-blur-3xl border border-white/10">
            <span className="material-symbols-outlined text-[15rem] text-white/10">workspace_premium</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Recursos;
