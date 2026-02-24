
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/useTranslation';

interface TranslatableTextProps {
    children: string;
    className?: string;
    as?: React.ElementType;
    isHtml?: boolean;
}

/**
 * Component that automatically translates its children if English is selected.
 * Uses AI translation and caches results. Optionally renders as HTML.
 */
export const TranslatableText: React.FC<TranslatableTextProps> = ({
    children: text,
    className,
    as: Component = 'span',
    isHtml = false
}) => {
    const { language, translateAsync } = useTranslation();
    const [displayText, setDisplayText] = useState(text);
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        const handleTranslation = async () => {
            if (language === 'en' && text) {
                setIsTranslating(true);
                const translated = await translateAsync(text);
                setDisplayText(translated);
                setIsTranslating(false);
            } else {
                setDisplayText(text);
            }
        };

        handleTranslation();
    }, [language, text, translateAsync]);

    if (isHtml) {
        return (
            <Component
                className={`${className} ${isTranslating ? 'opacity-50 transition-opacity' : 'opacity-100'}`}
                dangerouslySetInnerHTML={{ __html: displayText }}
            />
        );
    }

    return (
        <Component className={`${className} ${isTranslating ? 'opacity-50 transition-opacity' : 'opacity-100'}`}>
            {displayText}
        </Component>
    );
};
