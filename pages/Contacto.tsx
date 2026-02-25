
import React, { useEffect } from 'react';
import { useTranslation } from '../context/useTranslation';

const Contacto: React.FC = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen py-24 px-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="max-w-3xl mb-16 text-center lg:text-left animate-on-scroll stagger-1">
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-primary mb-6">{t('contact.title.part1')}<span className="text-secondary">{t('contact.title.part2')}</span></h1>
          <p className="text-lg text-slate-500 font-light leading-relaxed">{t('contact.desc')}</p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-20 items-start">
          <div className="space-y-12 order-2 lg:order-1">
            <div className="grid gap-6">
              {[
                { title: t('contact.support.title'), info: 'info@redlatamcoil.com', icon: 'mail', color: 'bg-secondary/10 text-secondary' },
                { title: 'Oficina Central (México)', info: 'Operando desde nuestra sede en México para toda Latinoamérica y el mundo.', icon: 'location_on', color: 'bg-primary/5 text-primary' }
              ].map((item, i) => (
                <div key={i} className={`bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-6 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300 animate-on-scroll stagger-${i + 2}`}>
                  <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                    <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary text-xl mb-1">{item.title}</h4>
                    <p className="text-slate-500 font-medium">{item.info}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-slate-200 animate-on-scroll stagger-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">{t('contact.social.title')}</h4>
              <div className="flex gap-6">
                <a
                  href="https://linkedin.com/in/red-latinoamericana-coil?originalSubdomain=mx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 rounded-full border-2 border-slate-200 flex items-center justify-center text-primary/70 hover:bg-accent hover:border-accent hover:text-primary hover:scale-110 active:scale-95 transition-all shadow-md group"
                >
                  <i className="fa-brands fa-linkedin text-3xl group-hover:drop-shadow-sm"></i>
                </a>
                <a
                  href="https://www.instagram.com/latam_coil/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 rounded-full border-2 border-slate-200 flex items-center justify-center text-primary/70 hover:bg-accent hover:border-accent hover:text-primary hover:scale-110 active:scale-95 transition-all shadow-md group"
                >
                  <i className="fa-brands fa-instagram text-3xl group-hover:drop-shadow-sm"></i>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 lg:p-14 rounded-[3rem] shadow-2xl border border-slate-100/50 order-1 lg:order-2 w-full animate-on-scroll stagger-3 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full pointer-events-none"></div>
            <form className="space-y-6 relative z-10">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('contact.form.name')}</label>
                  <input type="text" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-secondary/20 outline-none" placeholder="Ej. Ana García" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('contact.form.email')}</label>
                  <input type="email" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-secondary/20 outline-none" placeholder="ana@ejemplo.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('contact.form.subject')}</label>
                <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-secondary/20 outline-none">
                  <option>{t('contact.form.subject.mem')}</option>
                  <option>{t('contact.form.subject.reg')}</option>
                  <option>{t('contact.form.subject.alli')}</option>
                  <option>{t('contact.form.subject.supp')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('contact.form.msg')}</label>
                <textarea rows={5} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-secondary/20 outline-none resize-none" placeholder={t('contact.form.msg.placeholder')}></textarea>
              </div>
              <button type="submit" className="pulse-glow-btn w-full bg-accent text-primary font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-lg tracking-widest uppercase">
                {t('contact.form.cta')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacto;
