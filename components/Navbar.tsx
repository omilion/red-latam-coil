import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoClaro from '../img/logo RLC fondo claro.png';
import { authService, UserProfile } from '../services/authService';
import { useTranslation } from '../context/useTranslation';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t, loading: uiLoading } = useTranslation();

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const controlNavbar = () => {
    if (typeof window !== 'undefined') {
      const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;

      if (isAtBottom) {
        setShow(true);
      } else if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShow(false);
      } else {
        setShow(true);
      }
      setLastScrollY(window.scrollY);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate('/');
  };

  const navLinks = [
    { name: t('nav.inicio'), path: '/' },
    { name: t('nav.nosotros'), path: '/nosotros' },
    { name: t('nav.recursos'), path: '/recursos' },
    { name: t('nav.eventos'), path: '/eventos' },
    { name: t('nav.membresias'), path: '/membresias' },
    { name: t('nav.blog'), path: '/blog' },
    { name: t('nav.contacto'), path: '/contacto' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLinkClick = () => {
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <nav className={`bg-white border-b border-slate-100 fixed w-full top-0 z-50 transition-transform duration-300 ${show ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" onClick={handleLinkClick} className="flex items-center">
            <img
              src={logoClaro}
              alt="Red LatAm COIL Logo"
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Menu - Centered Links */}
          <div className="hidden lg:flex flex-1 justify-center items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${isActive(link.path) ? 'text-secondary' : 'text-primary hover:text-secondary'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* User/Login Actions - Right Aligned */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 border-l border-slate-100 pl-6 ml-2">
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-3 hover:bg-slate-50 p-1 rounded-lg transition-all group"
                  >
                    <div className="text-right hidden sm:block">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter leading-none">{t('nav.dashboard')}</p>
                      <p className="text-[11px] font-bold text-primary">Hola, {user.full_name.split(' ')[0]}</p>
                    </div>
                    <img
                      src={user.avatar || 'https://via.placeholder.com/150'}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full border-2 border-slate-100 group-hover:border-secondary transition-colors"
                    />
                    <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Link
                          to="/dashboard"
                          onClick={() => { setDropdownOpen(false); handleLinkClick(); }}
                          className="flex items-center gap-3 px-4 py-2 text-[11px] font-bold text-primary hover:bg-slate-50 hover:text-secondary transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">dashboard</span>
                          {t('nav.dashboard')}
                        </Link>
                        <div className="h-px bg-slate-50 my-1"></div>
                        <button
                          onClick={() => { setDropdownOpen(false); handleLogout(); }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">logout</span>
                          {t('nav.logout') || 'Cerrar Sesión'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-100 bg-white text-[10px] font-black hover:bg-slate-50 transition-all text-primary relative overflow-hidden group shadow-sm"
                  title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                >
                  <span className={`transition-all duration-300 ${language === 'es' ? 'text-secondary' : 'text-slate-300'}`}>ES</span>
                  <span className="mx-0.5 text-slate-200">|</span>
                  <span className={`transition-all duration-300 ${language === 'en' ? 'text-secondary' : 'text-slate-300'}`}>EN</span>
                  {uiLoading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><span className="material-symbols-outlined text-xs animate-spin text-secondary">sync</span></div>}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-100 bg-white text-[10px] font-black hover:bg-slate-50 transition-all text-primary relative overflow-hidden group shadow-sm"
                  title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                >
                  <span className={`transition-all duration-300 ${language === 'es' ? 'text-secondary' : 'text-slate-300'}`}>ES</span>
                  <span className="mx-0.5 text-slate-200">|</span>
                  <span className={`transition-all duration-300 ${language === 'en' ? 'text-secondary' : 'text-slate-300'}`}>EN</span>
                  {uiLoading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><span className="material-symbols-outlined text-xs animate-spin text-secondary">sync</span></div>}
                </button>
                <Link to="/login" onClick={handleLinkClick} className="bg-primary text-white px-5 py-2 rounded-full font-bold text-[11px] uppercase tracking-wider hover:bg-secondary transition shadow-md border border-primary/10">
                  {t('nav.login')}
                </Link>
              </div>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 text-primary">
            <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={handleLinkClick}
              className={`block px-4 py-2 text-[11px] font-bold uppercase tracking-wider ${isActive(link.path) ? 'text-secondary bg-slate-50' : 'text-primary'}`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
