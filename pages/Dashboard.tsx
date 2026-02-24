
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, UserProfile } from '../services/authService';
import { useTranslation } from '../context/useTranslation';
import { wpService } from '../services/wpService';

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState<{ slots_limit: number, slots_used: number, members: any[] }>({ slots_limit: 0, slots_used: 0, members: [] });
    const [activity, setActivity] = useState<{ events: any[], orders: any[] }>({ events: [], orders: [] });
    const [inviting, setInviting] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const loadInitialData = async () => {
            const currentUser = await authService.getCurrentUser();
            if (!currentUser) {
                navigate('/login');
            } else {
                setUser(currentUser);
                const [activityData, slotData] = await Promise.all([
                    wpService.getUserActivity(),
                    currentUser.membership_type === 'institutional' || (currentUser.membership && currentUser.membership.toLowerCase().includes('institucional'))
                        ? wpService.getSlots()
                        : Promise.resolve({ slots_limit: 0, slots_used: 0, members: [] })
                ]);
                setActivity(activityData);
                setSlots(slotData);
            }
            setLoading(false);
        };
        loadInitialData();
    }, [navigate]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;
        setInviting(true);
        try {
            await wpService.assignSlot(newEmail);
            const slotData = await wpService.getSlots();
            setSlots(slotData);
            setNewEmail('');
            alert('Invitación enviada correctamente.');
        } catch (error: any) {
            alert(error.message || 'Error al invitar');
        } finally {
            setInviting(false);
        }
    };

    const handleRemoveSlot = async (subUserId: number) => {
        if (!confirm('¿Seguro que quieres remover a este usuario?')) return;
        try {
            await wpService.removeSlot(subUserId);
            const slotData = await wpService.getSlots();
            setSlots(slotData);
        } catch (error: any) {
            alert('Error al remover');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-secondary"></div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="bg-slate-50 min-h-screen py-12 px-6 font-light">
            <div className="max-w-7xl mx-auto">
                {/* Header del Dashboard */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-display font-black text-primary mb-2">{t('dashboard.title')}</h1>
                        <p className="text-slate-500">{t('dashboard.welcome')} <span className="font-bold text-secondary">{user.full_name}</span></p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('dashboard.status')} {user.status}</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar / Info Rápida */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
                            <img src={user.avatar || 'https://via.placeholder.com/150'} alt="Avatar" className="w-24 h-24 rounded-3xl mx-auto mb-6 shadow-lg border-2 border-white" />
                            <h2 className="text-xl font-bold text-primary mb-1">{user.full_name}</h2>
                            <p className="text-sm text-slate-400 mb-6">{user.university}</p>

                            <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3">
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="material-symbols-outlined text-slate-400 text-sm font-light">public</span>
                                    <span className="text-slate-600 font-medium">{user.country}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="material-symbols-outlined text-slate-400 text-sm font-light">verified_user</span>
                                    <span className="text-slate-600 font-medium">{t('dashboard.membership')} {user.membership}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="material-symbols-outlined text-slate-400 text-sm font-light">calendar_today</span>
                                    <span className="text-slate-600 font-medium">Vigencia: <span className="text-primary font-bold">{user.expiry_date || 'N/A'}</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Gestión de Cupos Institucionales */}
                        {(user.membership_type === 'institutional' || (user.membership && user.membership.toLowerCase().includes('institucional'))) && (
                            <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl text-white/5 rotate-12 group-hover:scale-110 transition-transform">corporate_fare</span>
                                <h3 className="text-lg font-bold mb-2 relative z-10">Membresía Institucional</h3>
                                <p className="text-slate-300 text-xs mb-6 leading-relaxed relative z-10">
                                    Tienes <span className="text-accent font-bold">{slots.slots_used} de {slots.slots_limit}</span> cupos ocupados.
                                </p>

                                <form onSubmit={handleInvite} className="relative z-10 mb-6">
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="Email del miembro"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={inviting}
                                            className="bg-accent text-primary px-4 py-2 rounded-xl font-bold text-xs hover:brightness-105 transition disabled:opacity-50"
                                        >
                                            {inviting ? '...' : 'Invitar'}
                                        </button>
                                    </div>
                                </form>

                                <div className="space-y-3 relative z-10 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {slots.members.map((member) => (
                                        <div key={member.id} className="bg-white/5 border border-white/10 p-3 rounded-2xl flex justify-between items-center group/item hover:bg-white/10 transition-colors">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase text-accent truncate">{member.name || 'Pendiente'}</p>
                                                <p className="text-[9px] text-slate-300 truncate">{member.email}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveSlot(member.id)}
                                                className="opacity-0 group-hover/item:opacity-100 material-symbols-outlined text-red-400 text-sm hover:text-red-300 transition-all p-1 hover:bg-red-400/10 rounded-lg"
                                            >
                                                delete
                                            </button>
                                        </div>
                                    ))}
                                    {slots.members.length === 0 && (
                                        <p className="text-[10px] text-slate-400 text-center py-4">No hay miembros asignados.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contenido Principal */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Accesos Rápidos */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { title: t('nav.recursos'), icon: 'auto_stories', color: 'bg-blue-500', link: '/recursos' },
                                { title: t('dashboard.quick.cert'), icon: 'workspace_premium', color: 'bg-secondary', link: '#' },
                                { title: t('dashboard.quick.dir'), icon: 'groups', color: 'bg-accent', link: '#' }
                            ].map((item, idx) => (
                                <button key={idx} onClick={() => item.link !== '#' && navigate(item.link)} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <div className={`${item.color} text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200`}>
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-primary">{item.title}</span>
                                </button>
                            ))}
                        </div>

                        {/* Mis Eventos Inscritos */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
                                <span className="material-symbols-outlined text-secondary">event_available</span>
                                Mis Eventos
                            </h3>
                            <div className="space-y-4">
                                {activity.events.map((event, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
                                                <span className="material-symbols-outlined text-secondary">star</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-primary">{event.title}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{event.status === 'enrolled' ? 'Inscrito' : event.status}</p>
                                            </div>
                                        </div>
                                        <button className="text-secondary font-black text-[10px] uppercase tracking-widest hover:underline">Ver Info</button>
                                    </div>
                                ))}
                                {activity.events.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <p className="text-xs uppercase font-bold tracking-widest">No tienes eventos inscritos</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Historial de Suscripciones */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-500">receipt_long</span>
                                Historial de Actividad
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                                            <th className="pb-4">Fecha</th>
                                            <th className="pb-4">Concepto</th>
                                            <th className="pb-4">Estado</th>
                                            <th className="pb-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs">
                                        {activity.orders.map(order => (
                                            <tr key={order.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 text-slate-500 font-medium">{order.date}</td>
                                                <td className="py-4">
                                                    <span className="font-bold text-primary">{order.items.join(', ')}</span>
                                                    <p className="text-[9px] text-slate-400">ID #{order.id}</p>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right font-black text-primary">
                                                    {order.total} <span className="text-[9px] text-slate-400">{order.currency}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {activity.orders.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-slate-400 italic">No hay registros de compras recientes.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
