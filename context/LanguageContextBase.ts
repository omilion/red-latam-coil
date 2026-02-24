
import { createContext } from 'react';

export type Language = 'es' | 'en';

export interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, originalText?: string) => string;
    translateAsync: (text: string) => Promise<string>;
    loading: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
