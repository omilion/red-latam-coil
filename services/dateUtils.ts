export const formatEventDateRange = (startDateStr: string | undefined, endDateStr: string | undefined, locale: string = 'es-ES'): string => {
    if (!startDateStr) return 'TBD';

    try {
        const startDate = new Date(startDateStr);
        // Ajustamos la zona horaria para asegurarnos de que el día sea el correcto
        startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());

        if (!endDateStr) {
            return startDate.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
        }

        const endDate = new Date(endDateStr);
        endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());

        const startMonth = startDate.getMonth();
        const endMonth = endDate.getMonth();
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();

        if (startYear !== endYear) {
            // Distinto año: "2 Sep 2026 - 4 Oct 2027"
            return `${startDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else if (startMonth !== endMonth) {
            // Mismo año, distinto mes: "2 Sep - 4 Oct 2026"
            return `${startDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else if (startDate.getDate() !== endDate.getDate()) {
            // Mismo mes/año, distinto día: "2-4 Sep 2026"
            return `${startDate.toLocaleDateString(locale, { day: 'numeric' })}-${endDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else {
            // Mismo día
            return startDate.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
        }
    } catch (e) {
        return startDateStr;
    }
};
