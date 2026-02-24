
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useTranslation } from '../context/useTranslation';

const Login: React.FC = () => {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const success = await authService.login(username, password);
            if (success) {
                // Disparar evento para que el Navbar se actualice si es necesario
                window.dispatchEvent(new Event('storage'));
                navigate('/dashboard');
            } else {
                setError(t('login.error.creds'));
            }
        } catch (err) {
            setError(t('login.error.server'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-6 py-20 font-light">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 md:p-12 shadow-2xl border border-slate-100">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl">person</span>
                    </div>
                    <h1 className="text-3xl font-display font-black text-primary mb-2">{t('login.welcome')}</h1>
                    <p className="text-slate-400 text-sm">{t('login.subtitle')}</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 text-xs p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">{t('login.user')}</label>
                        <input
                            required
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-slate-300"
                            placeholder="Ej: j.perez@universidad.edu"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">{t('login.pass')}</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-slate-300"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex justify-end">
                        <a href="#" className="text-xs font-bold text-secondary hover:underline">{t('login.forgot')}</a>
                    </div>

                    <button
                        disabled={loading}
                        className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl
                            ${loading
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-primary text-white hover:scale-[1.02] active:scale-[0.98] shadow-primary/20 hover:shadow-primary/30'}
                        `}
                    >
                        {loading ? t('login.loading') : t('login.cta')}
                    </button>
                </form>

                <div className="mt-10 text-center border-t border-slate-50 pt-8">
                    <p className="text-sm text-slate-400">
                        {t('login.nomember')} <br />
                        <Link to="/membresias" className="text-secondary font-black hover:underline uppercase text-xs tracking-widest mt-2 inline-block">
                            {t('login.viewplans')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
