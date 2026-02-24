
import React from 'react';
import { useTranslation } from '../context/useTranslation';

const Contacto: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-slate-50 min-h-screen py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-16 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-primary mb-6">{t('contact.title.part1')}<span className="text-secondary">{t('contact.title.part2')}</span></h1>
          <p className="text-lg text-slate-500 font-light leading-relaxed">{t('contact.desc')}</p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-20 items-start">
          <div className="space-y-12 order-2 lg:order-1">
            <div className="grid gap-6">
              {[
                { title: t('contact.support.title'), info: 'info@redlatamcoil.org', icon: 'mail', color: 'bg-secondary/10 text-secondary' },
                { title: t('contact.office.title'), info: t('contact.office.info'), icon: 'location_on', color: 'bg-primary/5 text-primary' }
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-6 shadow-sm">
                  <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">{item.title}</h4>
                    <p className="text-slate-500 font-medium">{item.info}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-slate-200">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">{t('contact.social.title')}</h4>
              <div className="flex gap-4">
                <a
                  href="https://linkedin.com/in/red-latinoamericana-coil?originalSubdomain=mx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  <i className="fa-brands fa-linkedin text-xl"></i>
                </a>
                <a
                  href="https://www.instagram.com/latam_coil/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  <i className="fa-brands fa-instagram text-xl"></i>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 lg:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 order-1 lg:order-2 w-full">
            <form className="space-y-6">
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
              <button type="submit" className="w-full bg-accent text-primary font-black py-5 rounded-2xl shadow-xl shadow-amber-200 hover:brightness-105 transition-all text-lg">
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
