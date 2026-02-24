---
description: Guía de estándares y contexto del proyecto Red LATAM COIL para el modelo Gemini
---

# Skill: Red LATAM COIL - Horizonte Digital

Esta guía sirve como memoria persistente para el desarrollo y mantenimiento del proyecto. Debe consultarse antes de realizar cambios estructurales o estéticos.

## 1. Contexto Tecnológico
- **Frontend**: React + Vite (SPA).
- **Styling**: Tailwind CSS (Vanilla).
- **Backend (Headless)**: WordPress + WooCommerce (vía `wpService.ts`).
- **Modelo de IA**: Optimizado para Gemini 1.5/2.0 Flash.

## 2. Estándares de Diseño (Premium Aesthetics)
- **Color Primario (Highlight)**: `#00b8d4` (Cian brillante). Se usa para palabras clave en títulos y acentos.
- **Tipografía**: Fuentes de display para encabezados, `font-black` para énfasis.
- **Secciones Oscuras**: Se usan para transición (Slate-900) con efectos de desenfoque (Glassmorphism).
- **Animaciones**: 
  - Revelado de texto palabra por palabra usando `IntersectionObserver`.
  - Transiciones suaves (`transition-all`, `duration-700`).
  - Efectos hover escalables (`group-hover:scale-105`).

## 3. Sistema de Traducción e Inteligencia de Contenido
- **Componente**: `TranslatableText.tsx` (para contenido dinámico).
- **Contexto**: `LanguageContext.tsx` y `translations.ts` (para contenido estático).
- **Regla de Oro**: Al traducir títulos con resaltado de color, usar lógica de `.split(" ")` y `.map()` para identificar palabras clave en ambos idiomas (ES/EN) y aplicar el color condicionalmente.
  - *Keywords ES*: aulas, mundo, poder, crear, muros.
  - *Keywords EN*: classrooms, world, power, create, walls.

## 4. Estructura de Páginas Clave
- **Home**: Hero -> Stats -> Map -> Events -> ActionAxes -> Scroll Title -> Testimonials -> Final Banner.
- **Membresías**: Header con dual-badges -> Grid de Productos -> Banner de Eventos Premium (Glassmorphism dark).

## 5. Prevención de "Desincronización" (IA Safety)
- **Ediciones Críticas**: Antes de aplicar un `replace_file_content`, verificar el cierre correcto de etiquetas JSX y paréntesis de retorno.
- **Contexto de Sesión**: Si se percibe una caída en la calidad, re-leer `RED_LATAM_SKILL.md` y `metadata.json`.
- **Media**: Las imágenes generadas deben copiarse a la carpeta de artefactos y referenciarse con rutas absolutas en los walkthroughs.
