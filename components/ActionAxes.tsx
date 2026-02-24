import React from 'react';
import { useTranslation } from '../context/useTranslation';
import { TranslatableText } from './TranslatableText';

const ActionAxes: React.FC = () => {
    const { t } = useTranslation();

    const actions = [
        {
            title: 'Profesionalización Docente',
            icon: 'school',
            text: 'Capacitamos a profesores en diseño instruccional para intercambios virtuales COIL y competencias interculturales, asegurando aprendizaje colaborativo internacional en línea de calidad y certificable.'
        },
        {
            title: 'Gestión y Vinculación',
            icon: 'hub',
            text: 'Actuamos como el nodo central que conecta a coordinadores de internacionalización con socios estratégicos en más de 200 instituciones.'
        },
        {
            title: 'Investigación e Impacto',
            icon: 'query_stats',
            text: 'Generamos datos y evidencia sobre la eficacia del intercambio virtual para influir en las políticas educativas regionales.'
        },
        {
            title: 'Diplomacia Académica',
            icon: 'public',
            text: 'Fortalecemos los lazos entre universidades latinoamericanas, creando una comunidad de práctica resiliente y solidaria.'
        }
    ];

    return (
        <section className="pt-12 pb-16 max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <span className="text-secondary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">{t('about.actions.pre')}</span>
                <h2 className="text-5xl font-display font-black text-primary tracking-tight">{t('about.actions.title')}</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                {actions.map((obj, i) => (
                    <div key={i} className="flex flex-col items-center text-center group">
                        <div className="w-16 h-16 rounded-3xl bg-primary text-secondary flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all">
                            <span className="material-symbols-outlined text-3xl">{obj.icon}</span>
                        </div>
                        <h4 className="text-xl font-black text-primary mb-4 leading-tight min-h-[3rem]">
                            <TranslatableText>{obj.title}</TranslatableText>
                        </h4>
                        <p className="text-sm text-slate-500 font-light leading-relaxed">
                            <TranslatableText>{obj.text}</TranslatableText>
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ActionAxes;
