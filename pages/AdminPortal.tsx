
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, UserProfile } from '../services/authService';
import { wpService } from '../services/wpService';
import { aiService } from '../services/aiService';
import { useTranslation } from '../context/useTranslation';
import { TranslatableText } from '../components/TranslatableText';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface MediaUploadState {
    loading: boolean;
    error: string | null;
}

const AdminPortal: React.FC = () => {
    const { t } = useTranslation();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [resourceCategories, setResourceCategories] = useState<any[]>([]);
    const [webSettings, setWebSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('membresias');
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isProduct, setIsProduct] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [mediaUpload, setMediaUpload] = useState<MediaUploadState>({ loading: false, error: null });
    const [statsPeriod, setStatsPeriod] = useState('30d');
    const [memberFilter, setMemberFilter] = useState('all'); // 'all', 'expiring'
    const [memberTypeFilter, setMemberTypeFilter] = useState('all'); // 'all', 'personal', 'institutional'
    const [memberSearch, setMemberSearch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showMediaLibrary, setShowMediaLibrary] = useState(false);
    const [allMedia, setAllMedia] = useState<any[]>([]);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [aiLoading, setAiLoading] = useState<{ program: boolean, objectives: boolean, content: boolean }>({ program: false, objectives: false, content: false });
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [mediaTarget, setMediaTarget] = useState<string | null>(null);
    const [showManualAssignModal, setShowManualAssignModal] = useState(false);
    const [showMemberDetailModal, setShowMemberDetailModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [manualAssignData, setManualAssignData] = useState({
        userId: '',
        name: '',
        email: '',
        level: 'personal',
        slots: 0,
        expiryDate: '',
        isNewUser: false,
        productType: 'membership' as 'membership' | 'event'
    });
    const [isAssigning, setIsAssigning] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const flattenMeta = (item: any) => {
        const flattened = { ...item };
        if (item.meta_data && Array.isArray(item.meta_data)) {
            item.meta_data.forEach((meta: any) => {
                let val = meta.value;
                if (meta.key === 'rlc_event_is_featured') val = val === 'yes';
                flattened[meta.key] = val;
            });
        }

        // Asignar imagen destacada desde WooCommerce si no viene ya como metadato y tiene imágenes
        if (!flattened.featured_media_url && flattened.images && flattened.images.length > 0) {
            flattened.featured_media_url = flattened.images[0].src;
            flattened.featured_media = flattened.images[0].id;
        }

        return flattened;
    };

    const loadData = async () => {
        try {
            const [membersData, ordersData, postsData, productsData, resourcesData, resourceCategoriesData, webSettingsData] = await Promise.all([
                wpService.getMembers(),
                wpService.getOrders(),
                wpService.getPosts(),
                wpService.getProducts(),
                wpService.getResourcesAdmin(),
                wpService.getResourceCategories(),
                wpService.getWebSettings()
            ]);
            setMembers(membersData);
            setOrders(ordersData);
            setPosts(postsData);
            setProducts(productsData);
            setResources(resourcesData);
            setResourceCategories(resourceCategoriesData);
            setWebSettings(webSettingsData || {
                hero: { title: 'Conectando aulas, transformando el mundo.', subtitle: 'Únete a la red líder en América Latina para el Aprendizaje Internacional Colaborativo en Línea (COIL).', cta_text: 'Únete a la Red', bg_image: '' },
                stats: [{ label: 'UNIVERSIDADES', value: '+150' }, { label: 'ESTUDIANTES', value: '+5,000' }, { label: 'PAÍSES', value: '+12' }, { label: 'PROYECTOS COIL', value: '+300' }],
                team: []
            });
        } catch (error) {
            console.error('Error cargando datos de admin:', error);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const currentUser = await authService.getCurrentUser();
                if (!currentUser || !currentUser.is_admin) {
                    console.warn('Acceso denegado: Usuario no es administrador', currentUser);
                    authService.logout();
                    window.location.href = '/login';
                    return;
                }

                // Si el perfil devolvió un nonce, lo guardamos para wpService
                if ((currentUser as any).nonce) {
                    localStorage.setItem('rlc_nonce', (currentUser as any).nonce);
                }

                setUser(currentUser);
                await loadData();
            } catch (error) {
                console.error('Error durante la inicialización:', error);
                window.location.href = '/login';
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleOpenMediaLibrary = async (target: any = 'featured_media') => {
        const actualTarget = typeof target === 'string' ? target : 'featured_media';
        setMediaTarget(actualTarget);
        setShowMediaLibrary(true);
        setLoadingMedia(true);
        try {
            const media = await wpService.getMedia(30);
            setAllMedia(media);
        } catch (error) {
            console.error("Error cargando biblioteca:", error);
        } finally {
            setLoadingMedia(false);
        }
    };

    const handleSelectMedia = (media: any) => {
        const url = typeof media === 'string' ? media : media.source_url;
        if (mediaTarget === 'hero_bg') {
            setWebSettings({ ...webSettings, hero: { ...webSettings.hero, bg_image: url } });
        } else if (mediaTarget && mediaTarget.startsWith('team_member_')) {
            const index = parseInt(mediaTarget.replace('team_member_', ''));
            const newTeam = [...webSettings.team];
            newTeam[index].image = url;
            setWebSettings({ ...webSettings, team: newTeam });
        } else {
            const mediaId = typeof media === 'object' ? media.id : undefined;
            setEditingItem({ ...editingItem, featured_media: mediaId, featured_media_url: url });
        }
        setShowMediaLibrary(false);
        setMediaTarget(null);
    };

    const handleAIFormatProgram = async () => {
        if (!editingItem.rlc_event_program) return;
        setAiLoading(prev => ({ ...prev, program: true }));
        try {
            const formatted = await aiService.formatEventProgram(editingItem.rlc_event_program);
            setEditingItem({ ...editingItem, rlc_event_program: formatted });
        } catch (error) {
            alert("Error al formatear con IA. Inténtalo de nuevo.");
        } finally {
            setAiLoading(prev => ({ ...prev, program: false }));
        }
    };


    const handleManualAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        const { isNewUser, name, email, userId, level, expiryDate, productType } = manualAssignData;

        if (isNewUser) {
            if (!name || !email || !expiryDate) {
                alert("Por favor completa todos los campos del nuevo usuario.");
                return;
            }
        } else {
            if (!userId || !expiryDate) {
                alert("Por favor selecciona un usuario y completa los campos.");
                return;
            }
        }

        setIsAssigning(true);
        try {
            if (isNewUser) {
                await wpService.createMember({
                    name,
                    email,
                    level,
                    expiry_date: expiryDate,
                    membership_type: productType === 'membership' ? level : 'personal'
                });
                alert("Usuario creado y membresía asignada correctamente");
            } else {
                await wpService.assignMembership(
                    parseInt(userId),
                    level,
                    expiryDate,
                    productType,
                    productType === 'membership' ? level : 'personal'
                );
                alert("Asignación realizada correctamente");
            }

            setShowManualAssignModal(false);
            setManualAssignData({
                userId: '', name: '', email: '', level: 'personal', slots: 0,
                expiryDate: '', isNewUser: false, productType: 'membership'
            });
            await loadData();
        } catch (error: any) {
            alert(error.message || "Error al realizar la operación");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleDeleteMember = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción es irreversible y conservará únicamente los registros de pedidos en WooCommerce por razones contables.')) return;
        setLoading(true);
        try {
            await wpService.deleteMember(id);
            alert('Usuario eliminado correctamente');
            setShowMemberDetailModal(false);
            setSelectedMember(null);
            await loadData();
        } catch (error: any) {
            alert(error.message || "Error al eliminar usuario");
        } finally {
            setLoading(false);
        }
    };

    const handleAIFormatObjectives = async () => {
        if (!editingItem.rlc_event_objectives) return;
        setAiLoading(prev => ({ ...prev, objectives: true }));
        try {
            const formatted = await aiService.formatEventObjectives(editingItem.rlc_event_objectives);
            setEditingItem({ ...editingItem, rlc_event_objectives: formatted });
        } catch (error) {
            alert("Error al formatear con IA. Inténtalo de nuevo.");
        } finally {
            setAiLoading(prev => ({ ...prev, objectives: false }));
        }
    };

    const handleAIFormatContent = async () => {
        const content = isProduct ? editingItem.description : (editingItem.content?.rendered || editingItem.content);
        if (!content) return;

        setAiLoading(prev => ({ ...prev, content: true }));
        try {
            const formatted = await aiService.formatContent(content);
            if (isProduct) {
                setEditingItem({ ...editingItem, description: formatted });
            } else {
                setEditingItem({ ...editingItem, content: formatted });
            }
        } catch (error) {
            alert("Error al dar formato con IA. Inténtalo de nuevo.");
        } finally {
            setAiLoading(prev => ({ ...prev, content: false }));
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetOverride?: string) => {
        e.stopPropagation(); // Evitar que el clic se propague al padre
        const file = e.target.files?.[0];
        if (!file) return;

        const actualTarget = targetOverride || mediaTarget;

        // Si el target es featured_media y no estamos editando nada, no procedemos
        if (actualTarget === 'featured_media' && !editingItem && activeTab !== 'web') {
            console.warn('Upload ignora: featured_media sin item en edición');
            return;
        }

        setMediaUpload({ loading: true, error: null });
        try {
            const media = await wpService.uploadMedia(file);
            if (actualTarget === 'hero_bg') {
                setWebSettings({ ...webSettings, hero: { ...webSettings.hero, bg_image: media.source_url } });
            } else if (actualTarget === 'resource_url') {
                setEditingItem({ ...editingItem, url: media.source_url, rlc_resource_url: media.source_url });
            } else if (actualTarget?.startsWith('team_member_')) {
                const index = parseInt(actualTarget.replace('team_member_', ''));
                const newTeam = [...webSettings.team];
                newTeam[index].image = media.source_url;
                setWebSettings({ ...webSettings, team: newTeam });
            } else if (editingItem) {
                setEditingItem({
                    ...editingItem,
                    featured_media: media.id,
                    featured_media_url: media.source_url
                });
            }
        } catch (error: any) {
            console.error('Error uploading to WP:', error);
            setMediaUpload({ loading: false, error: error.message || 'Error al subir archivo' });
            alert(`Error al subir imagen: ${error.message || 'El servidor rechazó el archivo'}`);
        } finally {
            setMediaUpload((prev) => ({ ...prev, loading: false }));
            setMediaTarget(null);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsCreatingCategory(true);
        try {
            const newCat = await wpService.createResourceCategory(newCategoryName);
            setResourceCategories([...resourceCategories, newCat]);
            const catId = newCat.term_id || newCat.id;
            setEditingItem({
                ...editingItem,
                categories: [...(editingItem.categories || []), catId]
            });
            setNewCategoryName('');
        } catch (error) {
            alert('Error al crear categoría');
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const handleSavePost = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isProduct) {
                const productData: any = {
                    name: editingItem.name,
                    regular_price: editingItem.regular_price,
                    description: editingItem.description,
                    sku: editingItem.sku
                };

                // Si es un evento, añadir los metadatos al formato de WooCommerce
                if (activeTab === 'eventos') {
                    productData.meta_data = [
                        { key: 'rlc_event_date', value: editingItem.rlc_event_date || '' },
                        { key: 'rlc_event_date_end', value: editingItem.rlc_event_date_end || '' },
                        { key: 'rlc_event_time', value: editingItem.rlc_event_time || '' },
                        { key: 'rlc_event_location', value: editingItem.rlc_event_location || '' },
                        { key: 'rlc_event_is_featured', value: editingItem.rlc_event_is_featured ? 'yes' : 'no' },
                        { key: 'rlc_event_pretitle', value: editingItem.rlc_event_pretitle || '' },
                        { key: 'rlc_event_subtitle', value: editingItem.rlc_event_subtitle || '' },
                        { key: 'rlc_event_program', value: editingItem.rlc_event_program || '[]' },
                        { key: 'rlc_event_objectives', value: editingItem.rlc_event_objectives || '[]' },
                        { key: 'rlc_event_program_desc', value: editingItem.rlc_event_program_desc || '' },
                        { key: 'rlc_membership_type', value: editingItem.rlc_membership_type || 'personal' },
                        { key: 'rlc_slots_limit', value: editingItem.rlc_slots_limit || '0' }
                    ];
                } else if (activeTab === 'membresias') {
                    productData.meta_data = [
                        { key: 'rlc_membership_type', value: editingItem.rlc_membership_type || 'personal' },
                        { key: 'rlc_slots_limit', value: editingItem.rlc_slots_limit || '0' },
                        { key: 'rlc_membership_duration', value: editingItem.rlc_membership_duration || '1' },
                        { key: 'rlc_membership_period', value: editingItem.rlc_membership_period || 'years' }
                    ];
                }

                if (editingItem.featured_media) {
                    productData.images = [{ id: editingItem.featured_media }];
                } else if (editingItem.featured_media_url) {
                    productData.images = [{ src: editingItem.featured_media_url }];
                } else if (editingItem.featured_media_url === '') {
                    productData.images = [];
                }

                if (editingItem?.id) {
                    await wpService.updateProduct(editingItem.id, productData);
                    alert('Plan actualizado con éxito');
                } else {
                    await wpService.createProduct({
                        ...productData,
                        type: 'simple',
                        status: 'publish'
                    });
                    alert('¡Plan creado con éxito! Aparecerá en las secciones de Membresías o Eventos de la web.');
                }
            } else if (activeTab === 'recursos') {
                const resourceData = {
                    title: editingItem.title?.rendered || editingItem.title,
                    content: editingItem.content?.rendered || editingItem.content,
                    url: editingItem.url || editingItem.rlc_resource_url,
                    type: editingItem.type || editingItem.rlc_resource_type || 'PDF',
                    is_premium: editingItem.is_premium === true || editingItem.rlc_resource_is_premium === true,
                    categories: editingItem.categories || [],
                    featured_media_url: editingItem.featured_media_url
                };

                if (editingItem?.id) {
                    await wpService.updateResource(editingItem.id, resourceData);
                    alert('Recurso actualizado con éxito');
                } else {
                    await wpService.createResource(resourceData);
                    alert('¡Recurso creado con éxito! Podrás encontrarlo en la página de Recursos, filtrando por el tipo correspondiente.');
                }
            } else if (editingItem?.id) {
                await wpService.updatePost(editingItem.id, {
                    title: editingItem.title?.rendered || editingItem.title || '',
                    content: editingItem.content?.rendered || editingItem.content || '',
                    featured_media_url: editingItem.featured_media_url
                });
            } else {
                // Asignar categoría según la pestaña
                let categories: number[] = [];
                const catMap: any = { 'blog': 1, 'recursos': 2, 'eventos': 3 };
                if (catMap[activeTab]) categories = [catMap[activeTab]];

                await wpService.createPost({
                    title: editingItem.title,
                    content: editingItem.content,
                    categories,
                    featured_media_url: editingItem.featured_media_url
                });
            }
            setEditingItem(null);
            setIsProduct(false);
            await loadData();
        } catch (error: any) {
            console.error("Error detallado en el guardado:", error);
            alert(`Error al guardar: ${error.message || 'Error de conexión con el servidor'}`);
        }
        setIsSaving(false);
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.')) return;
        setLoading(true);
        try {
            if (activeTab === 'membresias' || activeTab === 'eventos') {
                await wpService.deleteProduct(id);
            } else if (activeTab === 'recursos') {
                await wpService.deleteResource(id);
            } else {
                await wpService.deletePost(id);
            }
            await loadData();
        } catch (error: any) {
            console.error("Error al eliminar:", error);
            alert(`Error al eliminar: ${error.message || 'Error de conexión'}`);
        }
        setLoading(false);
    };

    const resolveImageUrl = (item: any) => {
        if (!item) return '';
        // 1. Meta campo personalizado/Unificado
        if (item.featured_media_url) return item.featured_media_url;
        // 2. Sistema de imágenes de WooCommerce
        if (item.images && item.images.length > 0) return item.images[0].src;
        // 3. Sistema nativo de WordPress (si se usa ?_embed)
        if (item._embedded && item._embedded['wp:featuredmedia'] && item._embedded['wp:featuredmedia'][0]) {
            return item._embedded['wp:featuredmedia'][0].source_url || item._embedded['wp:featuredmedia'][0].media_details?.sizes?.full?.source_url;
        }
        return '';
    };

    if (loading && !editingItem) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen text-slate-700 font-light flex">
            {/* Sidebar Lateral - Azul Corporativo */}
            <aside className="w-72 flex-shrink-0 bg-primary border-r border-white/10 flex flex-col p-6 h-screen sticky top-0 overflow-hidden shadow-2xl">
                <div className="flex items-center gap-3 mb-10 px-2 mt-2">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                        <span className="material-symbols-outlined text-secondary font-bold text-2xl">orbit</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white tracking-tighter">{t('admin.sidebar.title')}</h1>
                        <p className="text-[10px] text-white/50 font-bold tracking-widest uppercase leading-none">{t('admin.sidebar.subtitle')}</p>
                    </div>
                </div>

                {/* Perfil Admin en Sidebar */}
                <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.full_name}&background=random`}
                                className="w-10 h-10 rounded-full border-2 border-secondary"
                                alt="Admin"
                            />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-primary rounded-full"></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white truncate max-w-[120px]">Hola, {user?.full_name.split(' ')[0]}</span>
                            <span className="text-[9px] text-secondary font-black uppercase tracking-widest">{t('admin.sidebar.role')}</span>
                        </div>
                    </div>
                </div>

                <nav className="space-y-1 flex-grow overflow-y-auto">
                    {[
                        { id: 'membresias', name: t('admin.sidebar.memberships'), icon: 'card_membership' },
                        { id: 'blog', name: t('admin.sidebar.blog'), icon: 'article' },
                        { id: 'recursos', name: t('admin.sidebar.resources'), icon: 'folder_shared' },
                        { id: 'eventos', name: t('admin.sidebar.events'), icon: 'calendar_today' },
                        { id: 'web', name: t('admin.sidebar.web'), icon: 'language' },
                        { id: 'config', name: t('admin.sidebar.config'), icon: 'settings' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setEditingItem(null); // Corregir Bug de UX: cerrar editor al cambiar de sección
                                setIsProduct(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-white text-primary font-bold shadow-lg shadow-black/10' : 'hover:bg-white/5 text-white/60 hover:text-white'}`}
                        >
                            <span className={`material-symbols-outlined text-[20px] ${activeTab === item.id ? 'text-secondary' : ''}`}>{item.icon}</span>
                            <span className="text-sm">{item.name}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-white/10 space-y-1">
                    <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-white/50 hover:text-white transition-all rounded-xl hover:bg-white/5">
                        <span className="material-symbols-outlined text-[20px]">home</span>
                        <span className="text-sm text-[11px] font-bold uppercase tracking-widest">{t('admin.sidebar.home')}</span>
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-400/20 rounded-xl transition-all">
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <span className="text-sm text-[11px] font-bold uppercase tracking-widest">{t('admin.sidebar.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow min-w-0 p-8 overflow-y-auto">
                {/* Header Superior - Más Limpio */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-primary tracking-tighter flex items-center gap-3">
                            {activeTab === 'membresias' ? 'Gestión de Membresías' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            <div className="h-2 w-2 bg-secondary rounded-full"></div>
                        </h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                            {activeTab === 'config' ? 'Ajustes del sistema y plataforma' : `Gestión integral de ${activeTab}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-colors">search</span>
                            <input
                                type="text"
                                placeholder={t('admin.header.search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white border border-slate-200 rounded-full pl-12 pr-6 py-2.5 text-sm focus:ring-4 focus:ring-secondary/5 focus:border-secondary outline-none w-64 transition-all shadow-sm"
                            />
                        </div>

                        <button className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                    </div>
                </header>


                {/* Contenido Dinámico según Pestaña */}
                {activeTab === 'membresias' && (
                    <>
                        {/* Estadísticas con Filtrado por Periodo */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                            {(() => {
                                const now = new Date();
                                const days = statsPeriod === '7d' ? 7 : statsPeriod === '30d' ? 30 : statsPeriod === '90d' ? 90 : 365;
                                const startDate = new Date(now.setDate(now.getDate() - days));

                                const filteredOrders = orders.filter(o => new Date(o.date_created) >= startDate);
                                const totalRevenue = filteredOrders.reduce((acc, o) => acc + parseFloat(o.total || '0'), 0);
                                const newMembers = members.filter(m => new Date(m.signup_date || '2025-01-01') >= startDate).length;
                                const expiringSoon = members.filter(m => {
                                    const exp = new Date(m.expiry);
                                    const diff = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return diff > 0 && diff <= 30;
                                }).length;

                                return [
                                    { label: 'Nuevos Socios', value: newMembers.toString(), trend: statsPeriod, icon: 'group_add', color: 'bg-primary' },
                                    { label: 'Ingresos', value: `$${totalRevenue.toLocaleString()}`, trend: statsPeriod, icon: 'payments', color: 'bg-secondary' },
                                    { label: 'Pedidos', value: filteredOrders.length.toString(), trend: statsPeriod, icon: 'shopping_basket', color: 'bg-green-500' },
                                    { label: 'Por Caducar', value: expiringSoon.toString(), trend: '30 días', icon: 'timer_off', color: 'bg-amber-500' },
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`w-10 h-10 rounded-2xl ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100 uppercase tracking-widest">{stat.trend}</span>
                                        </div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{stat.label}</p>
                                        <h4 className="text-2xl font-black text-primary tracking-tight">{stat.value}</h4>
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Planes de Membresía */}
                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-6 px-4">
                                <h3 className="text-lg font-black text-primary flex items-center gap-3">
                                    <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                                        <span className="material-symbols-outlined text-xl">workspace_premium</span>
                                    </div>
                                    Gestión de Planes Institucionales
                                </h3>
                                <button
                                    onClick={() => {
                                        if (activeTab === 'eventos') {
                                            setEditingItem({
                                                name: '', regular_price: '0', description: '',
                                                rlc_event_date: '', rlc_event_time: '', rlc_event_location: 'Online',
                                                rlc_event_is_featured: false, sku: 'EVT-' + Date.now(),
                                                rlc_event_pretitle: '', rlc_event_subtitle: '',
                                                rlc_event_program: '', rlc_event_objectives: '', rlc_event_program_desc: ''
                                            });
                                            setIsProduct(true);
                                        } else if (activeTab === 'membresias') {
                                            const level = 'General';
                                            setEditingItem({
                                                name: `Membresía ${level} Personal`,
                                                regular_price: '0',
                                                description: '',
                                                sku: `RLC-PERS-${level.toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
                                                rlc_membership_level: level
                                            });
                                            setIsProduct(true);
                                        } else {
                                            setEditingItem({ title: '', content: '', rlc_resource_url: '', rlc_resource_type: 'PDF', rlc_resource_is_premium: false });
                                            setIsProduct(false);
                                        }
                                    }}
                                    className="bg-primary text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-secondary transition-all shadow-lg shadow-primary/10"
                                >
                                    <span className="material-symbols-outlined text-sm">add_circle</span>
                                    Añadir Plan
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {products
                                    .filter(p => {
                                        const name = p.name?.toLowerCase() || '';
                                        const sku = p.sku?.toUpperCase() || '';
                                        if (activeTab === 'membresias') {
                                            // Incluimos RLC- (nuestro prefijo), membresía, plan, o cualquier producto que NO sea un evento claro
                                            return sku.startsWith('RLC-') || name.includes('membresía') || name.includes('plan') || (!sku.startsWith('EVT-') && !name.includes('evento') && !name.includes('congreso'));
                                        }
                                        if (activeTab === 'eventos') {
                                            return sku.startsWith('EVT-') || name.includes('congreso') || name.includes('evento') || name.includes('global') || name.includes('ciudadanía');
                                        }
                                        return false;
                                    })
                                    .map((prod) => (
                                        <div key={prod.id} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:shadow-xl hover:border-secondary/20 transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 flex gap-2">
                                                <button
                                                    onClick={() => { setEditingItem(flattenMeta(prod)); setIsProduct(true); }}
                                                    className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-secondary hover:border-secondary transition-all flex items-center justify-center shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(prod.id)}
                                                    className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all flex items-center justify-center shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                            <div className="mb-6">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{prod.sku || 'PLAN-HEADLESS'}</span>
                                            </div>
                                            <h4 className="text-xl font-black text-primary mb-1 tracking-tight">{prod.name}</h4>
                                            <div className="flex items-baseline gap-1 mb-6">
                                                <span className="text-3xl font-black text-secondary tracking-tighter">${parseFloat(prod.regular_price).toLocaleString()}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ Anual</span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 mb-8 min-h-[48px]" dangerouslySetInnerHTML={{ __html: prod.description }} />
                                            <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${prod.name.toLowerCase().includes('institucional') ? 'bg-blue-50 text-blue-500 border border-blue-100' : 'bg-purple-50 text-purple-500 border border-purple-100'}`}>
                                                    {prod.name.toLowerCase().includes('institucional') ? 'Institucional' : 'Personal'}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    {prod.stock_status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Tabla de Socios con Filtros */}
                        <div className="mb-4 ml-4">
                            <h3 className="text-2xl font-black text-primary tracking-tight">Socios con Membresía Activa</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">TOTAL REGISTRADOS EN PLATAFORMA: {members.length}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm mb-12">
                            <div className="p-8 border-b border-slate-100 overflow-x-auto bg-slate-50/50">
                                <div className="flex items-center gap-4 w-max min-w-full">
                                    {/* Buscador de Socios */}
                                    <div className="relative group/search bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 shadow-inner">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-secondary transition-colors text-lg">search</span>
                                        <input
                                            type="text"
                                            placeholder="Buscar socio..."
                                            value={memberSearch}
                                            onChange={(e) => setMemberSearch(e.target.value)}
                                            className="bg-transparent border-none text-[11px] font-bold outline-none w-48 placeholder:text-slate-300"
                                        />
                                    </div>

                                    <button
                                        onClick={() => setShowManualAssignModal(true)}
                                        className="bg-secondary text-primary px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-secondary/10"
                                    >
                                        <span className="material-symbols-outlined text-sm">person_add</span>
                                        Asignar Manualmente
                                    </button>

                                    {/* Filtro por Vigencia */}
                                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-inner">
                                        <button
                                            onClick={() => setMemberFilter('all')}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${memberFilter === 'all' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-primary'}`}
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={() => setMemberFilter('expiring')}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${memberFilter === 'expiring' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-amber-500'}`}
                                        >
                                            Por Expirar
                                        </button>
                                    </div>

                                    {/* Filtro por Tipo */}
                                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-inner">
                                        {[
                                            { id: 'all', label: 'Todos', icon: 'groups' },
                                            { id: 'personal', label: 'Personal', icon: 'person' },
                                            { id: 'institutional', label: 'Institucional', icon: 'account_balance' }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setMemberTypeFilter(t.id)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${memberTypeFilter === t.id ? 'bg-secondary text-primary shadow-lg' : 'text-slate-400 hover:text-secondary'}`}
                                            >
                                                <span className="material-symbols-outlined text-xs">{t.icon}</span>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>

                                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all flex items-center gap-2 group">
                                        <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">download</span>
                                        Exportar CSV
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Socio</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Institución</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Suscripción</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expiración</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tipo</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(() => {
                                            const filteredMembers = members.filter((m: any) => {
                                                // Filtro por Vigencia
                                                if (memberFilter === 'expiring') {
                                                    const now = new Date();
                                                    const expiry = new Date(m.expiry);
                                                    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                                    if (!(diffDays > 0 && diffDays <= 30)) return false;
                                                }
                                                // Filtro por Tipo
                                                if (memberTypeFilter !== 'all') {
                                                    const typeStr = (m.membership_type || 'personal').toLowerCase();
                                                    const isInstitutional = typeStr.includes('institutional') || typeStr.includes('institucional');
                                                    if (memberTypeFilter === 'institutional' && !isInstitutional) return false;
                                                    if (memberTypeFilter === 'personal' && isInstitutional) return false;
                                                }
                                                // Buscador
                                                if (memberSearch) {
                                                    const query = memberSearch.toLowerCase();
                                                    return (m.name || '').toLowerCase().includes(query) ||
                                                        (m.email || '').toLowerCase().includes(query) ||
                                                        (m.university || '').toLowerCase().includes(query);
                                                }
                                                return true;
                                            });

                                            if (filteredMembers.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={7} className="px-8 py-16 text-center">
                                                            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">person_search</span>
                                                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">No se encontraron socios</p>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return filteredMembers.map((m: any) => (
                                                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 p-0.5 overflow-hidden group-hover:border-secondary transition-colors">
                                                                <img
                                                                    src={m.avatar}
                                                                    alt={m.name}
                                                                    className="w-full h-full object-cover rounded-[0.8rem]"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${m.name}&background=random`;
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-primary tracking-tight">{m.name}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold">{m.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{m.university}</td>
                                                    <td className="px-8 py-6 text-[11px] text-slate-400 font-black">
                                                        {m.signup_date || '2025-01-20'}
                                                    </td>
                                                    <td className={`px-8 py-6 text-[11px] font-black tracking-widest ${memberFilter === 'expiring' ? 'text-amber-500' : 'text-slate-400'}`}>
                                                        {m.expiry}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${m.membership_type === 'institutional' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                                            {m.membership_type === 'institutional' ? 'Institucional' : 'Personal'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${m.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                                            {m.status === 'active' ? 'Activo' : m.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button
                                                            onClick={() => { setSelectedMember(m); setShowMemberDetailModal(true); }}
                                                            className="w-8 h-8 rounded-lg text-slate-300 hover:text-primary hover:bg-slate-100 transition-all flex items-center justify-center"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'web' && webSettings && (
                    <div className="space-y-12 pb-20">
                        {/* 1. SECCIÓN HERO */}
                        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-primary flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                                        <span className="material-symbols-outlined">rocket_launch</span>
                                    </div>
                                    Banners y Hero Section (Home)
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Título del Hero</label>
                                            <input
                                                type="text"
                                                value={webSettings.hero.title}
                                                onChange={(e) => setWebSettings({ ...webSettings, hero: { ...webSettings.hero, title: e.target.value } })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:border-secondary outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Subtítulo</label>
                                            <textarea
                                                rows={3}
                                                value={webSettings.hero.subtitle}
                                                onChange={(e) => setWebSettings({ ...webSettings, hero: { ...webSettings.hero, subtitle: e.target.value } })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:border-secondary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Texto del Botón (CTA)</label>
                                            <input
                                                type="text"
                                                value={webSettings.hero.cta_text}
                                                onChange={(e) => setWebSettings({ ...webSettings, hero: { ...webSettings.hero, cta_text: e.target.value } })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:border-secondary outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Fondo del Hero (Imagen URL)</label>
                                            <div className="flex gap-3">
                                                <div className="relative flex-grow">
                                                    <input
                                                        type="text"
                                                        value={webSettings.hero.bg_image}
                                                        onChange={(e) => setWebSettings({ ...webSettings, hero: { ...webSettings.hero, bg_image: e.target.value } })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:border-secondary transition-all outline-none pr-12"
                                                    />
                                                    <label className="absolute right-2 top-1.5 bottom-1.5 aspect-square bg-secondary text-primary rounded-xl cursor-pointer hover:scale-105 transition-all flex items-center justify-center shadow-lg active:scale-95">
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => { setMediaTarget('hero_bg'); handleMediaUpload(e, 'hero_bg'); }} disabled={mediaUpload.loading} />
                                                        <span className="material-symbols-outlined text-lg">{mediaUpload.loading && mediaTarget === 'hero_bg' ? 'sync' : 'upload'}</span>
                                                    </label>
                                                </div>
                                                <button onClick={() => handleOpenMediaLibrary('hero_bg')} className="bg-slate-100 p-3 rounded-2xl text-slate-400 hover:text-primary transition-colors h-[46px] w-[46px] flex items-center justify-center">
                                                    <span className="material-symbols-outlined">perm_media</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-32 -translate-y-32 blur-3xl group-hover:bg-secondary/5 transition-colors"></div>
                        </section>

                        {/* 2. TARJETAS DE ESTADÍSTICAS */}
                        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm overflow-hidden">
                            <h3 className="text-xl font-black text-primary flex items-center gap-3 mb-8">
                                <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                                    <span className="material-symbols-outlined">query_stats</span>
                                </div>
                                Cifras y Estadísticas (Home)
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {webSettings.stats.map((stat: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cifra (+150)</label>
                                            <input
                                                type="text"
                                                value={stat.value}
                                                onChange={(e) => {
                                                    const newStats = [...webSettings.stats];
                                                    newStats[idx].value = e.target.value;
                                                    setWebSettings({ ...webSettings, stats: newStats });
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-secondary outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Etiqueta</label>
                                            <input
                                                type="text"
                                                value={stat.label}
                                                onChange={(e) => {
                                                    const newStats = [...webSettings.stats];
                                                    newStats[idx].label = e.target.value.toUpperCase();
                                                    setWebSettings({ ...webSettings, stats: newStats });
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] uppercase font-black outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. EQUIPO / GOBERNANZA */}
                        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-center mb-10 px-1">
                                <h3 className="text-xl font-black text-primary flex items-center gap-3">
                                    <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                                        <span className="material-symbols-outlined">groups</span>
                                    </div>
                                    Gestión de Equipo (Nosotros)
                                </h3>
                                <button
                                    onClick={() => {
                                        const newTeam = [...webSettings.team, { name: 'Nueva Persona', role: 'Cargo', inst: 'Institución', icon: 'person', visible: true }];
                                        setWebSettings({ ...webSettings, team: newTeam });
                                    }}
                                    className="bg-primary text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-secondary transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">person_add</span>
                                    Añadir Miembro
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {webSettings.team.map((member: any, idx: number) => (
                                    <div key={idx} className={`p-6 rounded-[2rem] border transition-all ${member.visible ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                        <div className="flex gap-6 items-start">
                                            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-200 relative group/avatar overflow-hidden shrink-0 shadow-inner">
                                                {member.image ? (
                                                    <img src={member.image} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-4xl">person</span>
                                                )}
                                                <label
                                                    className="absolute inset-0 bg-primary/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center cursor-pointer transition-all backdrop-blur-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            setMediaTarget(`team_member_${idx}`);
                                                            handleMediaUpload(e, `team_member_${idx}`);
                                                        }}
                                                    />
                                                    <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
                                                </label>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMediaTarget(`team_member_${idx}`);
                                                        handleMediaUpload(e as any, `team_member_${idx}`);
                                                    }}
                                                    className="px-4 py-2 bg-slate-100 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">{mediaUpload.loading && mediaTarget === `team_member_${idx}` ? 'sync' : 'upload'}</span>
                                                    Subir
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenMediaLibrary(`team_member_${idx}`);
                                                    }}
                                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">perm_media</span>
                                                    Biblioteca
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newTeam = [...webSettings.team];
                                                    newTeam[idx].visible = !newTeam[idx].visible;
                                                    setWebSettings({ ...webSettings, team: newTeam });
                                                }}
                                                className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[12px] shadow-md border z-10 ${member.visible ? 'bg-green-500 text-white border-green-600' : 'bg-slate-400 text-white border-slate-500'}`}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">{member.visible ? 'visibility' : 'visibility_off'}</span>
                                            </button>
                                        </div>
                                        <div className="flex-grow space-y-3">
                                            <input
                                                type="text"
                                                value={member.name}
                                                onChange={(e) => {
                                                    const newTeam = [...webSettings.team];
                                                    newTeam[idx].name = e.target.value;
                                                    setWebSettings({ ...webSettings, team: newTeam });
                                                }}
                                                className="w-full bg-transparent border-b border-dashed border-slate-200 py-1 text-sm font-black text-primary outline-none focus:border-secondary transition-colors"
                                                placeholder="Nombre Completo"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    value={member.role}
                                                    onChange={(e) => {
                                                        const newTeam = [...webSettings.team];
                                                        newTeam[idx].role = e.target.value;
                                                        setWebSettings({ ...webSettings, team: newTeam });
                                                    }}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-500 outline-none"
                                                    placeholder="Cargo"
                                                />
                                                <input
                                                    type="text"
                                                    value={member.inst}
                                                    onChange={(e) => {
                                                        const newTeam = [...webSettings.team];
                                                        newTeam[idx].inst = e.target.value;
                                                        setWebSettings({ ...webSettings, team: newTeam });
                                                    }}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[10px] italic text-slate-400 outline-none"
                                                    placeholder="Institución"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newTeam = webSettings.team.filter((_: any, i: number) => i !== idx);
                                                setWebSettings({ ...webSettings, team: newTeam });
                                            }}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* BOTÓN DE GUARDADO FLOTANTE O FIJO */}
                        <div className="flex justify-end pt-10 border-t border-slate-200">
                            <button
                                onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                        await wpService.updateWebSettings(webSettings);
                                        alert('¡Configuración guardada exitosamente!');
                                    } catch (error) {
                                        alert('Error al guardar la configuración');
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                disabled={isSaving}
                                className="bg-secondary text-primary px-10 py-4 rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-symbols-outlined">save</span>
                                )}
                                Publicar Cambios Web
                            </button>
                        </div>
                    </div>
                )
                }

                {/* Content Table Container - Conditional rendering to avoid duplicates */}
                {
                    (activeTab !== 'config' && activeTab !== 'membresias' && activeTab !== 'web') && (
                        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-black text-primary tracking-tight">Lista de {activeTab}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mostrando {searchTerm ? 'resultados de búsqueda' : 'todos los registros'}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (activeTab === 'membresias') {
                                            const level = 'General';
                                            setEditingItem({
                                                name: `Membresía ${level} Personal`,
                                                regular_price: '0',
                                                description: '',
                                                sku: `RLC-PERS-${level.toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
                                                rlc_membership_level: level
                                            });
                                            setIsProduct(true);
                                        } else if (activeTab === 'eventos') {
                                            setEditingItem({ name: '', regular_price: '0', sku: 'EVT-' + Date.now() });
                                            setIsProduct(true);
                                        } else {
                                            setEditingItem({});
                                            setIsProduct(false);
                                        }
                                    }}
                                    className="bg-primary text-white px-6 py-3 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-secondary transition-colors shadow-lg shadow-primary/10 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Nuevo Registro
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contenido</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(activeTab === 'membresias' || activeTab === 'eventos' ? products : activeTab === 'recursos' ? resources : posts)
                                            .filter(p => {
                                                const name = p.name?.toLowerCase() || '';
                                                const sku = p.sku?.toUpperCase() || '';
                                                if (activeTab === 'membresias') {
                                                    return sku.startsWith('RLC-') || name.includes('membresía') || name.includes('plan') || (!sku.startsWith('EVT-') && !name.includes('evento') && !name.includes('congreso'));
                                                }
                                                if (activeTab === 'eventos') {
                                                    return sku.startsWith('EVT-') || name.includes('congreso') || name.includes('evento') || name.includes('global') || name.includes('ciudadanía');
                                                }
                                                if (activeTab !== 'recursos') {
                                                    const catMap: any = { 'blog': 1 };
                                                    if (!p.categories?.includes(catMap[activeTab])) return false;
                                                }
                                                if (searchTerm) {
                                                    const title = (activeTab === 'membresias' || activeTab === 'eventos') ? p.name : (p.title?.rendered || p.title);
                                                    return title?.toLowerCase().includes(searchTerm.toLowerCase());
                                                }
                                                return true;
                                            })
                                            .map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-6 text-xs font-mono text-slate-400">#{p.id}</td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner flex-shrink-0">
                                                                {resolveImageUrl(p) ? (
                                                                    <img src={resolveImageUrl(p)} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                        <span className="material-symbols-outlined">image</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="max-w-md">
                                                                <p className="font-bold text-primary truncate">{(activeTab === 'membresias' || activeTab === 'eventos') ? p.name : (p.title?.rendered || p.title || 'Sin Título')}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                        {(activeTab === 'membresias' || activeTab === 'eventos') ? `Precio: $${p.regular_price}` : `TIPO: ${p.type || activeTab}`}
                                                                    </p>
                                                                    {p.status && p.status !== 'publish' && (
                                                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
                                                                            {p.status}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {activeTab === 'recursos' && (p.rlc_resource_is_premium || p.is_premium) ? (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 border border-amber-200">
                                                                Premium
                                                            </span>
                                                        ) : (
                                                            <span className="material-symbols-outlined text-slate-200">fiber_manual_record</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6 text-xs text-slate-500 font-medium">
                                                        {activeTab === 'recursos' ? (p.type || 'N/A') : new Date(p.date || Date.now()).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(flattenMeta(p));
                                                                    setIsProduct(activeTab === 'membresias' || activeTab === 'eventos');
                                                                }}
                                                                className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-secondary hover:border-secondary transition-all flex items-center justify-center shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(p.id)}
                                                                className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all flex items-center justify-center shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'config' && (
                        <div className="p-10 text-center bg-slate-800/30 border border-slate-700/50 rounded-[2.5rem]">
                            <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">settings</span>
                            <h3 className="text-xl font-bold text-white">Configuración del Sistema</h3>
                            <p className="text-slate-500 max-w-md mx-auto mt-2">Ajustes globales de la Red LatAm COIL, claves de API y parámetros de membresía.</p>
                        </div>
                    )
                }

                {/* Modal de Edición */}
                {
                    editingItem && (
                        <div className="fixed inset-0 md:left-72 bg-slate-50 z-[100] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                            <form onSubmit={handleSavePost} className="flex flex-col h-full">
                                {/* Editor Header - Compacted */}
                                <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => { setEditingItem(null); setIsProduct(false); }}
                                            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 transition-all group"
                                        >
                                            <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                        </button>
                                        <div>
                                            <h2 className="text-xl font-black text-primary tracking-tight flex items-center gap-3">
                                                <span className="p-1.5 bg-secondary/10 rounded-lg text-secondary material-symbols-outlined text-xl">
                                                    {isProduct ? 'shopping_bag' : 'edit_note'}
                                                </span>
                                                {editingItem.id ? 'Editar' : 'Crear'} {
                                                    activeTab === 'eventos' ? 'Evento' :
                                                        (activeTab === 'membresias' ? 'Membresía' :
                                                            (isProduct ? 'Plan' : ({ 'blog': 'Blog', 'recursos': 'Recurso' }[activeTab as keyof any] || 'Contenido')))
                                                }
                                            </h2>
                                            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-none">Panel CMS · ID: #{editingItem.id || 'NUEVO'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setEditingItem(null); setIsProduct(false); }}
                                            className="px-4 py-2 rounded-full text-slate-500 hover:text-primary font-black text-[10px] uppercase tracking-widest transition-colors"
                                        >
                                            Descartar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="bg-secondary text-primary font-black px-6 py-2.5 rounded-full hover:scale-105 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 flex items-center gap-2 text-[10px] uppercase tracking-widest"
                                        >
                                            {isSaving ? (
                                                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                            )}
                                            {isSaving ? 'Guardando...' : 'Publicar'}
                                        </button>
                                    </div>
                                </div>

                                {/* Editor Body - Expanded Scrollable Area */}
                                <div className="flex-grow overflow-y-auto bg-slate-50">
                                    <div className="max-w-6xl mx-auto p-10 md:p-16 space-y-12">
                                        {/* Sección: Información Principal */}
                                        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="grid grid-cols-1 gap-8">
                                                <div>
                                                    <label className="block text-[11px] uppercase font-black tracking-widest text-slate-500 mb-3 ml-1">Título del Contenido</label>
                                                    <input
                                                        type="text"
                                                        value={isProduct ? (editingItem.name || '') : (editingItem.title?.rendered || editingItem.title || '')}
                                                        onChange={(e) => setEditingItem(isProduct ? { ...editingItem, name: e.target.value } : { ...editingItem, title: e.target.value })}
                                                        className="w-full bg-white border border-slate-200 rounded-3xl px-8 py-6 text-primary text-2xl font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all outline-none placeholder:text-slate-300 shadow-sm"
                                                        placeholder={isProduct ? "Nombre del plan..." : "Escribe un título impactante..."}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {isProduct && (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                                            <label className="block text-[11px] uppercase font-black tracking-widest text-slate-500 mb-4">
                                                                {(activeTab === 'eventos' || editingItem.sku?.startsWith('EVT-')) ? 'Nombre del Evento' : 'Categoría del Plan'}
                                                            </label>
                                                            {(activeTab === 'eventos' || editingItem.sku?.startsWith('EVT-')) ? (
                                                                <input
                                                                    type="text"
                                                                    value={editingItem.name || ''}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold focus:border-secondary outline-none shadow-sm"
                                                                    placeholder="Nombre comercial del evento..."
                                                                />
                                                            ) : (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="relative">
                                                                        <label className="block text-[10px] text-slate-400 font-bold mb-2">TIPO DE PLAN</label>
                                                                        <select
                                                                            value={editingItem.sku?.includes('INST') ? 'institucional' : 'personal'}
                                                                            onChange={(e) => {
                                                                                const isInst = e.target.value === 'institucional';
                                                                                const level = editingItem.rlc_membership_level || 'General';
                                                                                const type = isInst ? 'Institucional' : 'Personal';
                                                                                setEditingItem({
                                                                                    ...editingItem,
                                                                                    name: `Membresía ${level} ${type}`,
                                                                                    sku: `RLC-${isInst ? 'INST' : 'PERS'}-${level.toUpperCase()}-${Math.floor(Math.random() * 1000)}`
                                                                                });
                                                                            }}
                                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-primary font-bold focus:border-secondary outline-none appearance-none cursor-pointer"
                                                                        >
                                                                            <option value="personal">Individual / Personal</option>
                                                                            <option value="institucional">Universitaria / Institucional</option>
                                                                        </select>
                                                                        <span className="material-symbols-outlined absolute right-4 top-[38px] text-slate-400 pointer-events-none text-sm">expand_content</span>
                                                                    </div>
                                                                    <div className="relative">
                                                                        <label className="block text-[10px] text-slate-400 font-bold mb-2">NIVEL</label>
                                                                        <select
                                                                            value={editingItem.rlc_membership_level || 'General'}
                                                                            onChange={(e) => {
                                                                                const level = e.target.value;
                                                                                const isInst = editingItem.sku?.includes('INST');
                                                                                const type = isInst ? 'Institucional' : 'Personal';
                                                                                setEditingItem({
                                                                                    ...editingItem,
                                                                                    rlc_membership_level: level,
                                                                                    name: `Membresía ${level} ${type}`,
                                                                                    sku: `RLC-${isInst ? 'INST' : 'PERS'}-${level.toUpperCase()}-${Math.floor(Math.random() * 1000)}`
                                                                                });
                                                                            }}
                                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-primary font-bold focus:border-secondary outline-none appearance-none cursor-pointer"
                                                                        >
                                                                            <option value="General">General (Bronce)</option>
                                                                            <option value="Plata">Nivel Plata</option>
                                                                            <option value="Oro">Nivel Oro</option>
                                                                        </select>
                                                                        <span className="material-symbols-outlined absolute right-4 top-[38px] text-slate-400 pointer-events-none text-sm">expand_content</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <span className="material-symbols-outlined absolute right-4 top-[38px] text-slate-400 pointer-events-none text-sm">expand_content</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {activeTab === 'membresias' && (
                                                                <div className="space-y-4">
                                                                    <div className="relative">
                                                                        <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase">Tipo de Membresía</label>
                                                                        <select
                                                                            value={editingItem.rlc_membership_type || 'personal'}
                                                                            onChange={(e) => setEditingItem({ ...editingItem, rlc_membership_type: e.target.value })}
                                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-primary font-bold focus:border-secondary outline-none appearance-none cursor-pointer"
                                                                        >
                                                                            <option value="personal">Personal</option>
                                                                            <option value="institutional">Institucional</option>
                                                                        </select>
                                                                        <span className="material-symbols-outlined absolute right-4 top-[38px] text-slate-400 pointer-events-none text-sm">expand_content</span>
                                                                    </div>
                                                                    {editingItem.rlc_membership_type === 'institutional' && (
                                                                        <div className="relative">
                                                                            <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase">Límite de Cupos</label>
                                                                            <input
                                                                                type="number"
                                                                                value={editingItem.rlc_slots_limit || '0'}
                                                                                onChange={(e) => setEditingItem({ ...editingItem, rlc_slots_limit: e.target.value })}
                                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-primary font-bold focus:border-secondary outline-none shadow-sm"
                                                                                placeholder="Cantidad de cupos..."
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="relative">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                                        {(activeTab === 'eventos' || editingItem.sku?.startsWith('EVT-')) ? 'Precio (USD)' : 'Inversión (USD)'}
                                                                    </label>
                                                                    {isProduct && (
                                                                        <div className="flex items-center gap-2">
                                                                            <label className="text-[10px] text-slate-400 font-bold uppercase">SKU:</label>
                                                                            <input
                                                                                type="text"
                                                                                value={editingItem.sku || ''}
                                                                                onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                                                                                className="bg-slate-50 border-none text-[10px] font-mono font-bold text-secondary text-right outline-none w-24 px-2 py-1 rounded-md shadow-inner"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        value={editingItem.regular_price || ''}
                                                                        onChange={(e) => setEditingItem({ ...editingItem, regular_price: e.target.value })}
                                                                        className="w-full bg-white border border-slate-200 rounded-xl px-10 py-3 text-primary text-lg font-black focus:border-secondary outline-none shadow-sm"
                                                                        placeholder="0.00"
                                                                        required
                                                                    />
                                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold text-lg">$</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {(activeTab === 'eventos' || editingItem.sku?.startsWith('EVT-')) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                                        <label className="block text-[11px] uppercase font-black tracking-widest text-slate-500 mb-4">Pre-título (ej: Evento Anual)</label>
                                                        <input
                                                            type="text"
                                                            value={editingItem.rlc_event_pretitle || ''}
                                                            onChange={(e) => setEditingItem({ ...editingItem, rlc_event_pretitle: e.target.value })}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold focus:border-secondary outline-none shadow-sm"
                                                            placeholder="EJ: CONGRESO 2024"
                                                        />
                                                    </div>
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                                        <label className="block text-[11px] uppercase font-black tracking-widest text-slate-500 mb-4">Sub-título (Lema/Tema)</label>
                                                        <input
                                                            type="text"
                                                            value={editingItem.rlc_event_subtitle || ''}
                                                            onChange={(e) => setEditingItem({ ...editingItem, rlc_event_subtitle: e.target.value })}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold focus:border-secondary outline-none shadow-sm"
                                                            placeholder="EJ: El futuro de la IA"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {(activeTab === 'eventos' || editingItem.sku?.startsWith('EVT-')) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <label className="block text-[11px] uppercase font-black tracking-widest text-slate-500">Fecha</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (editingItem.rlc_event_date_end) {
                                                                        setEditingItem({ ...editingItem, rlc_event_date_end: '' });
                                                                    } else {
                                                                        setEditingItem({ ...editingItem, rlc_event_date_end: editingItem.rlc_event_date || '' });
                                                                    }
                                                                }}
                                                                className={`text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full transition-all ${editingItem.rlc_event_date_end ? 'bg-secondary text-primary' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                            >
                                                                {editingItem.rlc_event_date_end ? '✓ Rango' : '+ Rango'}
                                                            </button>
                                                        </div>
                                                        <div className={`grid gap-3 ${editingItem.rlc_event_date_end ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                            <div>
                                                                {editingItem.rlc_event_date_end && <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1 block">Inicio</span>}
                                                                <input
                                                                    type="date"
                                                                    value={editingItem.rlc_event_date || ''}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, rlc_event_date: e.target.value })}
                                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-primary font-bold focus:border-secondary outline-none shadow-sm text-sm"
                                                                />
                                                            </div>
                                                            {editingItem.rlc_event_date_end && (
                                                                <div>
                                                                    <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1 block">Fin</span>
                                                                    <input
                                                                        type="date"
                                                                        value={editingItem.rlc_event_date_end || ''}
                                                                        onChange={(e) => setEditingItem({ ...editingItem, rlc_event_date_end: e.target.value })}
                                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-primary font-bold focus:border-secondary outline-none shadow-sm text-sm"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                                        <label className="block text-[11px] uppercase font-black tracking-widest text-slate-500 mb-4">Hora (UTC)</label>
                                                        <input
                                                            type="time"
                                                            value={editingItem.rlc_event_time || ''}
                                                            onChange={(e) => setEditingItem({ ...editingItem, rlc_event_time: e.target.value })}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold focus:border-secondary outline-none shadow-sm"
                                                        />
                                                    </div>
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                                        <label className="block text-[11px] uppercase font-black tracking-widest text-slate-500 mb-4">Ubicación / Link</label>
                                                        <input
                                                            type="text"
                                                            value={editingItem.rlc_event_location || ''}
                                                            onChange={(e) => setEditingItem({ ...editingItem, rlc_event_location: e.target.value })}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold focus:border-secondary outline-none shadow-sm"
                                                            placeholder="Online / Sala Zoom"
                                                        />
                                                    </div>
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                                                        <label className="flex items-center gap-4 cursor-pointer">
                                                            <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-slate-200"
                                                                onClick={() => setEditingItem({ ...editingItem, rlc_event_is_featured: !editingItem.rlc_event_is_featured })}
                                                                style={{ backgroundColor: editingItem.rlc_event_is_featured ? '#F6A800' : '#E2E8F0' }}>
                                                                <span className="sr-only">Destacado</span>
                                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editingItem.rlc_event_is_featured ? 'translate-x-5' : 'translate-x-0'}`} />
                                                            </div>
                                                            <span className="text-[11px] uppercase font-black tracking-widest text-slate-500">Evento Destacado (Home)</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}

                                            {(activeTab === 'eventos' || editingItem.sku?.startsWith('EVT-')) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div>
                                                                <h4 className="text-lg font-black text-primary tracking-tight">Programa del Evento</h4>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Temario, exponentes, horarios y actividades detalladas</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={handleAIFormatProgram}
                                                                disabled={aiLoading.program || !editingItem.rlc_event_program}
                                                                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary hover:text-primary transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                                            >
                                                                <span className={`material-symbols-outlined text-sm ${aiLoading.program ? 'animate-spin' : ''}`}>
                                                                    {aiLoading.program ? 'sync' : 'auto_fix_high'}
                                                                </span>
                                                                {aiLoading.program ? 'Procesando...' : 'IA Magic'}
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            value={editingItem.rlc_event_program || ''}
                                                            onChange={(e) => setEditingItem({ ...editingItem, rlc_event_program: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-primary font-mono text-xs focus:border-secondary transition-all outline-none shadow-inner min-h-[150px]"
                                                            placeholder='[{"time": "09:00", "activity": "Bienvenida"}]'
                                                        />
                                                    </div>
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div>
                                                                <h4 className="text-lg font-black text-primary tracking-tight">Objetivos del Evento</h4>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">¿Qué debe esperar el suscriptor de este evento? Metas y alcances</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={handleAIFormatObjectives}
                                                                disabled={aiLoading.objectives || !editingItem.rlc_event_objectives}
                                                                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary hover:text-primary transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                                            >
                                                                <span className={`material-symbols-outlined text-sm ${aiLoading.objectives ? 'animate-spin' : ''}`}>
                                                                    {aiLoading.objectives ? 'sync' : 'auto_fix_high'}
                                                                </span>
                                                                {aiLoading.objectives ? 'Procesando...' : 'IA Magic'}
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            value={editingItem.rlc_event_objectives || ''}
                                                            onChange={(e) => setEditingItem({ ...editingItem, rlc_event_objectives: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-primary font-mono text-xs focus:border-secondary transition-all outline-none shadow-inner min-h-[150px]"
                                                            placeholder='["Objetivo 1", "Objetivo 2"]'
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                                        <label className="block text-[11px] uppercase font-black tracking-widest text-slate-500 mb-4">Descripción Corta del Programa</label>
                                                        <input
                                                            type="text"
                                                            value={editingItem.rlc_event_program_desc || ''}
                                                            onChange={(e) => setEditingItem({ ...editingItem, rlc_event_program_desc: e.target.value })}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold focus:border-secondary outline-none shadow-sm"
                                                            placeholder="EJ: Un recorrido por las mejores prácticas..."
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {/* Sección: Metadatos Específicos (No Productos) */}
                                            {!isProduct && activeTab === 'recursos' && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                                        <label className="block text-[11px] uppercase font-black tracking-widest text-slate-500 mb-4">Recurso (Subir o URL)</label>
                                                        <div className="flex gap-3">
                                                            <div className="relative flex-grow">
                                                                <input
                                                                    type="text"
                                                                    value={editingItem.url || editingItem.rlc_resource_url || ''}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value, rlc_resource_url: e.target.value })}
                                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold focus:border-secondary transition-all outline-none text-sm pr-12"
                                                                    placeholder="Enlace o adjunto..."
                                                                />
                                                                <label className="absolute right-2 top-2 bottom-2 aspect-square bg-secondary text-primary rounded-xl cursor-pointer hover:scale-105 transition-all flex items-center justify-center shadow-lg active:scale-95">
                                                                    <input type="file" className="hidden" onChange={(e) => { setMediaTarget('resource_url'); handleMediaUpload(e, 'resource_url'); }} disabled={mediaUpload.loading} />
                                                                    <span className="material-symbols-outlined text-lg">{mediaUpload.loading && mediaTarget === 'resource_url' ? 'sync' : 'attach_file'}</span>
                                                                </label>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenMediaLibrary('resource_url')}
                                                                className="px-4 bg-slate-100 text-slate-400 rounded-2xl hover:text-primary transition-colors flex items-center justify-center"
                                                            >
                                                                <span className="material-symbols-outlined">perm_media</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                                        <label className="block text-[11px] uppercase font-black tracking-widest text-slate-500 mb-4">Tipo</label>
                                                        <select
                                                            value={editingItem.type || editingItem.rlc_resource_type || 'PDF'}
                                                            onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold focus:border-secondary outline-none appearance-none cursor-pointer"
                                                        >
                                                            <option value="PDF">PDF (Documento)</option>
                                                            <option value="Video">Video (YouTube/vimeo)</option>
                                                            <option value="DOCX">Word (Plantilla)</option>
                                                            <option value="XLSX">Excel (Rúbrica)</option>
                                                            <option value="LINK">Link Externo</option>
                                                        </select>
                                                    </div>

                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm col-span-1 md:col-span-3">
                                                        <div className="flex flex-col md:flex-row gap-8 items-start">
                                                            <div className="flex-1 w-full">
                                                                <label className="block text-[11px] uppercase font-black tracking-widest text-slate-500 mb-4">Categorías</label>
                                                                <div className="flex flex-wrap gap-2 mb-4">
                                                                    {resourceCategories.map(cat => {
                                                                        const catId = cat.term_id || cat.id;
                                                                        const isSelected = (editingItem.categories || []).includes(catId);
                                                                        return (
                                                                            <button
                                                                                key={catId}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const cats = editingItem.categories || [];
                                                                                    if (cats.includes(catId)) {
                                                                                        setEditingItem({ ...editingItem, categories: cats.filter((id: number) => id !== catId) });
                                                                                    } else {
                                                                                        setEditingItem({ ...editingItem, categories: [...cats, catId] });
                                                                                    }
                                                                                }}
                                                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSelected
                                                                                    ? 'bg-secondary text-primary border-2 border-secondary'
                                                                                    : 'bg-slate-50 text-slate-400 border-2 border-slate-100 hover:border-slate-200'
                                                                                    }`}
                                                                            >
                                                                                {cat.name}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                            <div className="w-full md:w-64 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Nueva Categoría</label>
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={newCategoryName}
                                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-secondary transition-all"
                                                                        placeholder="Nombre..."
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleCreateCategory}
                                                                        disabled={isCreatingCategory || !newCategoryName.trim()}
                                                                        className="bg-primary text-white p-2 rounded-xl hover:bg-secondary transition-colors disabled:opacity-50"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">add</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                                                        <label className="flex items-center gap-4 cursor-pointer">
                                                            <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-slate-200"
                                                                onClick={() => setEditingItem({ ...editingItem, is_premium: !editingItem.is_premium })}
                                                                style={{ backgroundColor: editingItem.is_premium ? '#F6A800' : '#E2E8F0' }}>
                                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editingItem.is_premium ? 'translate-x-5' : 'translate-x-0'}`} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] uppercase font-black tracking-widest text-primary">Contenido Premium</p>
                                                                <p className="text-[10px] text-slate-400 font-bold">Solo para socios</p>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </section>

                                        {/* Sección: Imagen Destacada */}
                                        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[11px] uppercase font-black tracking-widest text-slate-500 ml-1">Imagen de Portada / Miniatura</label>
                                                {mediaUpload.loading && <span className="flex items-center gap-2 text-[10px] font-bold text-secondary animate-pulse uppercase tracking-widest"><span className="material-symbols-outlined text-sm animate-spin">sync</span> Procesando imagen...</span>}
                                            </div>

                                            <div className="flex flex-col lg:flex-row gap-10 items-stretch">
                                                <div className="w-full lg:w-5/12 space-y-6 flex flex-col justify-center">
                                                    <div className="flex gap-3 mt-2">
                                                        <div className="relative flex-grow">
                                                            <input
                                                                type="text"
                                                                value={editingItem.featured_media_url || ''}
                                                                onChange={(e) => setEditingItem({ ...editingItem, featured_media_url: e.target.value })}
                                                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-primary focus:border-secondary outline-none transition-all text-xs font-mono pr-16 shadow-sm"
                                                                placeholder="URL de imagen externa..."
                                                            />
                                                            <label
                                                                className="absolute right-2 top-2 bottom-2 aspect-square bg-secondary text-primary rounded-xl cursor-pointer hover:scale-105 transition-all flex items-center justify-center shadow-lg shadow-secondary/20 active:scale-95"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMediaUpload(e, 'featured_media');
                                                                    }}
                                                                    disabled={mediaUpload.loading}
                                                                />
                                                                <span className="material-symbols-outlined text-xl">{mediaUpload.loading ? 'sync' : 'add_photo_alternate'}</span>
                                                            </label>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleOpenMediaLibrary}
                                                            className="px-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-colors flex items-center justify-center shadow-lg active:scale-95"
                                                            title="Explorar Biblioteca"
                                                        >
                                                            <span className="material-symbols-outlined">perm_media</span>
                                                        </button>
                                                    </div>
                                                    {mediaUpload.error && <p className="bg-red-500/10 text-red-500 p-4 rounded-xl text-[10px] font-bold border border-red-500/20 uppercase tracking-wider">{mediaUpload.error}</p>}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Formato</p>
                                                            <p className="text-[10px] text-primary font-bold">JPG, PNG o WebP</p>
                                                        </div>
                                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Recomendado</p>
                                                            <p className="text-[10px] text-primary font-bold">1200 x 630 px</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-grow aspect-video bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 overflow-hidden relative group shadow-inner">
                                                    {resolveImageUrl(editingItem) ? (
                                                        <>
                                                            <img src={resolveImageUrl(editingItem)} alt="Portada" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:blur-sm" />
                                                            <div className="absolute inset-0 bg-slate-100/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                                <button onClick={() => setEditingItem({ ...editingItem, featured_media_url: '' })} className="bg-red-500 text-white p-4 rounded-full hover:scale-110 transition-transform shadow-xl">
                                                                    <span className="material-symbols-outlined">delete_sweep</span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center text-slate-700">
                                                            <span className="material-symbols-outlined text-6xl mb-4 opacity-20">image</span>
                                                            <p className="text-[11px] font-black uppercase tracking-[0.3em]">Vista previa pendiente</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sección: Cuerpo del Contenido */}
                                        <section className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                                            <div className="flex items-center justify-between mb-4 px-2">
                                                <label className="text-[11px] uppercase font-black tracking-widest text-slate-500">Cuerpo del Contenido / Detalles</label>
                                                <button
                                                    type="button"
                                                    onClick={handleAIFormatContent}
                                                    disabled={aiLoading.content}
                                                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary hover:text-primary transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                                >
                                                    <span className={`material-symbols-outlined text-sm ${aiLoading.content ? 'animate-spin' : ''}`}>
                                                        {aiLoading.content ? 'sync' : 'auto_fix'}
                                                    </span>
                                                    {aiLoading.content ? 'Estructurando...' : (activeTab === 'membresias' ? 'IA: Generar Beneficios' : 'IA: Mejorar Formato')}
                                                </button>
                                            </div>
                                            {isProduct ? (
                                                <textarea
                                                    rows={10}
                                                    value={editingItem.description || ''}
                                                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-3xl px-8 py-8 text-primary focus:border-secondary outline-none transition-all font-mono text-base leading-relaxed shadow-sm min-h-[400px]"
                                                    placeholder="Escribe la descripción detallada del plan..."
                                                    required
                                                />
                                            ) : (
                                                <div className="bg-white rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl">
                                                    <ReactQuill
                                                        theme="snow"
                                                        value={editingItem.content?.rendered || editingItem.content || ''}
                                                        onChange={(content) => setEditingItem({ ...editingItem, content })}
                                                        className="h-[600px] text-slate-900 editor-custom-full"
                                                        modules={{
                                                            toolbar: [
                                                                [{ 'header': [1, 2, 3, 4, false] }],
                                                                ['bold', 'italic', 'underline', 'strike'],
                                                                [{ 'color': [] }, { 'background': [] }],
                                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                                [{ 'align': [] }],
                                                                ['link', 'image', 'video'],
                                                                ['blockquote', 'code-block'],
                                                                ['clean']
                                                            ],
                                                        }}
                                                    />
                                                    <div className="h-10 bg-slate-50 border-t border-slate-100"></div>
                                                </div>
                                            )}
                                        </section>

                                        {/* Sección: SEO / Metadatos (Placeholder para expansión futura) */}
                                        <div className="pt-10 border-t border-slate-100 flex justify-center">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">Fin del área de edición · Red LatAm COIL CMS</p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )
                }

                {/* Modal: Asignación Manual / Crear Usuario */}
                {
                    showManualAssignModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                            <div className="absolute inset-0 bg-primary/80 backdrop-blur-md" onClick={() => setShowManualAssignModal(false)}></div>
                            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-primary tracking-tight">Vincular Socio Manual</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Crear o activar membresías y eventos</p>
                                        </div>
                                        <button onClick={() => setShowManualAssignModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-400">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>

                                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-inner max-w-xs mx-auto">
                                        <button
                                            onClick={() => setManualAssignData({ ...manualAssignData, isNewUser: false })}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!manualAssignData.isNewUser ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-primary'}`}
                                        >
                                            Existente
                                        </button>
                                        <button
                                            onClick={() => setManualAssignData({ ...manualAssignData, isNewUser: true })}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${manualAssignData.isNewUser ? 'bg-secondary text-primary shadow-lg' : 'text-slate-400 hover:text-secondary'}`}
                                        >
                                            Nuevo
                                        </button>
                                    </div>
                                </div>

                                <form onSubmit={handleManualAssign} className="p-8 space-y-6">
                                    {manualAssignData.isNewUser ? (
                                        <>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    value={manualAssignData.name}
                                                    onChange={(e) => setManualAssignData({ ...manualAssignData, name: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:border-secondary transition-all outline-none font-bold"
                                                    placeholder="Ej: Juan Pérez"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Correo Electrónico</label>
                                                <input
                                                    type="email"
                                                    value={manualAssignData.email}
                                                    onChange={(e) => setManualAssignData({ ...manualAssignData, email: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:border-secondary transition-all outline-none font-bold"
                                                    placeholder="juan@universidad.edu"
                                                    required
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Seleccionar Usuario</label>
                                            <select
                                                value={manualAssignData.userId}
                                                onChange={(e) => setManualAssignData({ ...manualAssignData, userId: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:border-secondary outline-none appearance-none cursor-pointer font-bold text-primary"
                                                required
                                            >
                                                <option value="">Selecciona un usuario registrado...</option>
                                                {members.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                            <button
                                                type="button"
                                                onClick={() => setManualAssignData({ ...manualAssignData, productType: 'membership' })}
                                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${manualAssignData.productType === 'membership' ? 'bg-white text-primary shadow-sm border border-slate-100' : 'text-slate-400'}`}
                                            >
                                                Membresía
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setManualAssignData({ ...manualAssignData, productType: 'event' })}
                                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${manualAssignData.productType === 'event' ? 'bg-white text-secondary shadow-sm border border-slate-100' : 'text-slate-400'}`}
                                            >
                                                Evento
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">
                                                    {manualAssignData.productType === 'membership' ? 'Nivel' : 'Producto/Evento'}
                                                </label>
                                                <select
                                                    value={manualAssignData.level}
                                                    onChange={(e) => setManualAssignData({ ...manualAssignData, level: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:border-secondary outline-none appearance-none cursor-pointer font-bold text-primary"
                                                >
                                                    {manualAssignData.productType === 'membership' ? (
                                                        <>
                                                            <option value="personal">Personal</option>
                                                            <option value="institutional">Institucional</option>
                                                        </>
                                                    ) : (
                                                        products
                                                            .filter(p => p.sku?.startsWith('EVT-') || p.name?.toLowerCase().includes('evento') || p.name?.toLowerCase().includes('congreso'))
                                                            .map(p => (
                                                                <option key={p.id} value={p.name}>{p.name}</option>
                                                            ))
                                                    )}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Vence el:</label>
                                                <input
                                                    type="date"
                                                    value={manualAssignData.expiryDate}
                                                    onChange={(e) => setManualAssignData({ ...manualAssignData, expiryDate: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:border-secondary outline-none font-bold text-primary"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isAssigning}
                                        className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-secondary hover:text-primary transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isAssigning ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <span className="material-symbols-outlined">how_to_reg</span>
                                        )}
                                        {isAssigning ? 'Procesando...' : (manualAssignData.isNewUser ? 'Crear y Vincular' : 'Confirmar Asignación')}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Modal: Detalle / Editor de Miembro */}
                {
                    showMemberDetailModal && selectedMember && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                            <div className="absolute inset-0 bg-primary/80 backdrop-blur-md" onClick={() => setShowMemberDetailModal(false)}></div>
                            <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
                                <div className="p-10 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                                    <div className="flex gap-6 items-center">
                                        <div className="w-20 h-20 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden">
                                            <img src={selectedMember.avatar} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-primary tracking-tight">{selectedMember.name}</h3>
                                            <p className="text-sm text-slate-400 font-bold">{selectedMember.email}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-primary/5 text-primary rounded-full border border-primary/10">ID: #{selectedMember.id}</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-green-50 text-green-500 rounded-full border border-green-100">{selectedMember.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowMemberDetailModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">verified_user</span>
                                            Membresía Actual
                                        </h4>
                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-bold text-slate-500">Tipo:</span>
                                                <span className="text-sm font-black text-primary capitalize">{selectedMember.membership_type}</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-bold text-slate-500">Expira el:</span>
                                                <span className="text-sm font-black text-secondary">{selectedMember.expiry}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500">Institución:</span>
                                                <span className="text-xs font-black text-primary text-right ml-4">{selectedMember.university}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">engineering</span>
                                            Acciones de Gestión
                                        </h4>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => {
                                                    setManualAssignData({
                                                        ...manualAssignData,
                                                        userId: selectedMember.id.toString(),
                                                        level: selectedMember.membership || 'personal',
                                                        expiryDate: selectedMember.expiry,
                                                        isNewUser: false
                                                    });
                                                    setShowMemberDetailModal(false);
                                                    setShowManualAssignModal(true);
                                                }}
                                                className="w-full flex items-center gap-3 px-5 py-4 bg-slate-100 hover:bg-secondary/10 hover:text-secondary rounded-2xl transition-all group"
                                            >
                                                <span className="material-symbols-outlined text-xl">update</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Renovar / Cambiar Nivel</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMember(selectedMember.id)}
                                                className="w-full flex items-center gap-3 px-5 py-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all group"
                                            >
                                                <span className="material-symbols-outlined text-xl">person_remove</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Eliminar Cuenta Permanentemente</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                    <p className="text-[10px] text-slate-400 font-bold italic">Última actividad: {selectedMember.signup_date || 'No registrada'}</p>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-secondary flex items-center gap-1 transition-colors">
                                        Ver Pedidos en WooCommerce
                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Modal: Biblioteca de Medios */}
                {
                    showMediaLibrary && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                            <div className="absolute inset-0 bg-primary/80 backdrop-blur-md" onClick={() => setShowMediaLibrary(false)}></div>
                            <div className="relative bg-white w-full max-w-5xl h-full max-h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h3 className="text-xl font-black text-primary tracking-tight">Biblioteca de Medios</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selecciona una imagen existente de WordPress</p>
                                    </div>
                                    <button onClick={() => setShowMediaLibrary(false)} className="w-10 h-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="flex-grow overflow-y-auto p-10">
                                    {loadingMedia ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                            <span className="material-symbols-outlined text-5xl animate-spin mb-4">sync</span>
                                            <p className="text-xs font-bold uppercase tracking-widest">Cargando galería...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                            {allMedia.map((media) => (
                                                <button
                                                    key={media.id}
                                                    onClick={() => handleSelectMedia(media)}
                                                    className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border-2 border-transparent hover:border-secondary hover:scale-105 transition-all group relative"
                                                >
                                                    <img src={media.source_url} className="w-full h-full object-cover" alt={media.title?.rendered} />
                                                    <div className="absolute inset-0 bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-white text-3xl">check_circle</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Cargando los últimos 30 archivos de WordPress</p>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

export default AdminPortal;
