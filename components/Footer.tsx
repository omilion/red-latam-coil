import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoOscuro from '../img/logo RLC fondo oscuro vertical.png';
import { useTranslation } from '../context/useTranslation';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      alert(t('footer.newsletter.invalid_email') || 'Please enter a valid email');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const wpUrl = import.meta.env.VITE_WP_URL || 'http://redlatamcoil.local';
      const response = await fetch(`${wpUrl}/wp-json/rlc/v1/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Newsletter error:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-primary text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="mb-6">
              <img
                src={logoOscuro}
                alt="Red LatAm COIL Logo"
                className="h-32 w-auto hover:brightness-110 hover:scale-[1.02] transition-all origin-left cursor-pointer"
              />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              {t('footer.desc')}
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-display font-bold mb-6 text-secondary uppercase tracking-widest text-xs text-center md:text-left">
              {t('footer.links.title')}
            </h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-slate-300 text-sm">
              <ul className="space-y-4">
                <li><Link to="/nosotros" className="hover:text-white transition">{t('nav.nosotros')}</Link></li>
                <li><Link to="/recursos" className="hover:text-white transition">{t('nav.recursos')}</Link></li>
                <li><Link to="/eventos" className="hover:text-white transition">{t('nav.eventos')}</Link></li>
                <li><Link to="/membresias" className="hover:text-white transition">{t('nav.membresias')}</Link></li>
              </ul>
              <ul className="space-y-4">
                <li><Link to="/blog" className="hover:text-white transition">{t('nav.blog')}</Link></li>
                <li><Link to="/contacto" className="hover:text-white transition">{t('nav.contacto')}</Link></li>
                <li><Link to="/login" className="hover:text-white transition">{t('nav.login')}</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition">{t('nav.dashboard')}</Link></li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold mb-6 text-secondary uppercase tracking-widest text-xs">{t('footer.newsletter.title')}</h4>
            <p className="text-sm text-slate-400 mb-4">{t('footer.newsletter.desc')}</p>
            <div className="flex flex-col gap-2">
              <div className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.newsletter.placeholder')}
                  className="bg-white/10 border-white/20 rounded-l-lg px-4 py-2 w-full focus:ring-secondary focus:border-secondary outline-none text-white text-sm"
                  disabled={loading}
                />
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="pulse-glow-btn bg-accent px-5 py-2 rounded-r-lg transition-all disabled:opacity-50 group hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">send</span>
                  )}
                </button>
              </div>
              {status === 'success' && (
                <p className="text-xs text-secondary mt-1 animate-pulse">
                  {t('footer.newsletter.success') || '¡Suscripción exitosa!'}
                </p>
              )}
              {status === 'error' && (
                <p className="text-xs text-red-400 mt-1">
                  {t('footer.newsletter.error') || 'Error al suscribirse. Intente de nuevo.'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 text-center md:text-left">
          <p className="mb-4 md:mb-0">{t('footer.copy')}</p>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            <div className="flex gap-4 border-r border-white/10 pr-6 mr-2">
              <a href="https://www.instagram.com/latam_coil/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-accent hover:scale-110 transition-all inline-block">
                <i className="fa-brands fa-instagram text-lg"></i>
              </a>
              <a href="https://linkedin.com/in/red-latinoamericana-coil?originalSubdomain=mx" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-accent hover:scale-110 transition-all inline-block">
                <i className="fa-brands fa-linkedin text-lg"></i>
              </a>
            </div>
            <Link to="/contacto" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
            <Link to="/contacto" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
            <Link to="/admin-portal" className="bg-white/5 hover:bg-white/10 px-3 py-1 rounded border border-white/10 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
              {t('footer.admin')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
