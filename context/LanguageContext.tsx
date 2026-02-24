import React, { useState, useEffect, ReactNode } from 'react';
import { staticTranslations } from '../constants/translations';
import { aiService } from '../services/aiService';
import { Language, LanguageContext } from './LanguageContextBase';

const CACHE_KEY = 'rlc_translations_cache';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(
        (localStorage.getItem('rlc_lang') as Language) || 'es'
    );
    const [cache, setCache] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem(CACHE_KEY);
        return saved ? JSON.parse(saved) : {};
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('rlc_lang', language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }, [cache]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    /**
     * Translate function for UI components.
     * Returns static translation or original text.
     */
    const t = (key: string, originalText?: string): string => {
        if (staticTranslations[language] && staticTranslations[language][key]) {
            return staticTranslations[language][key];
        }
        return originalText || key;
    };

    /**
     * For dynamic content (AI-powered translation).
     */
    const translateAsync = async (text: string): Promise<string> => {
        if (!text || language === 'es') return text;
        if (cache[text]) return cache[text];

        try {
            setLoading(true);
            const translated = await aiService.translateText(text, 'en');
            if (translated && translated !== text) {
                setCache(prev => ({ ...prev, [text]: translated }));
                return translated;
            }
            return text;
        } catch (error) {
            console.error("Translation error:", error);
            return text;
        } finally {
            setLoading(false);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, translateAsync, loading }}>
            {children}
        </LanguageContext.Provider>
    );
};
