/// <reference types="vite/client" />

const WP_URL = import.meta.env.VITE_WP_URL;

export interface UserProfile {
    id: number;
    full_name: string;
    email: string;
    university: string;
    country: string;
    membership: string;
    membership_type: 'personal' | 'institutional' | 'none';
    status: string;
    avatar: string;
    expiry_date: string;
    slots_limit: number;
}

export const authService = {
    /**
     * Intenta obtener el perfil del usuario actual.
     */
    async getCurrentUser(): Promise<UserProfile | null> {
        try {
            const token = localStorage.getItem('rlc_token');
            if (!token) return null;

            const response = await fetch(`${WP_URL}/wp-json/rlc/v1/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Session expired');
            return await response.json();
        } catch (error) {
            console.error('Auth error:', error);
            // No borramos el token aquí automáticamente para evitar bucles si hay error de red
            return null;
        }
    },

    async login(username: string, password: string): Promise<boolean> {
        const url = `${WP_URL}/wp-json/rlc/v1/login`;
        console.log(`[AUTH] Intentando login en: ${url}`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            console.log(`[AUTH] Respuesta recibida. Status: ${response.status} ${response.statusText}`);

            // Verificamos cabeceras de depuración si existen
            const debugHeader = response.headers.get('X-RLC-Debug');
            if (debugHeader) console.log(`[AUTH] Debug Header: ${debugHeader}`);

            if (!response.ok) {
                let errorMsg = `Error HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error('[AUTH] Detalles del error:', errorData);
                    errorMsg = errorData.message || errorMsg;
                } catch (e) {
                    const text = await response.text();
                    console.error('[AUTH] La respuesta no es JSON:', text.substring(0, 200));
                    if (text.includes('404')) errorMsg = "No se encontró el endpoint de login (404). Revisa los Permalinks.";
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('rlc_token', data.token);
                localStorage.setItem('rlc_user_name', data.name);
                console.log('[AUTH] Login exitoso');
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('[AUTH] Error fatal en login:', error);
            if (error.message === 'Failed to fetch') {
                throw new Error('Error de conexión o bloqueo de CORS. Verifica que el servidor WordPress esté funcionando.');
            }
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('rlc_token');
        localStorage.removeItem('rlc_user_name');
        window.dispatchEvent(new Event('storage'));
    },

    isLoggedIn() {
        return !!localStorage.getItem('rlc_token');
    }
};
