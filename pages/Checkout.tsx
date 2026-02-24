
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { wpService } from '../services/wpService';
import { useTranslation } from '../context/useTranslation';
import { TranslatableText } from '../components/TranslatableText';

interface Product {
    id: number;
    name: string;
    price: string;
    description: string;
}

const Checkout: React.FC = () => {
    const { t } = useTranslation();
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [gateways, setGateways] = useState<any[]>([]);
    const [orderSuccess, setOrderSuccess] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        university: '',
        country: '',
        position: '',
        linkedin: '',
        paymentMethod: '',
        terms: false
    });

    useEffect(() => {
        const loadData = async () => {
            if (productId) {
                const [allProducts, activeGateways] = await Promise.all([
                    wpService.getProducts(),
                    wpService.getPaymentGateways()
                ]);

                const found = allProducts.find((p: any) => p.id === parseInt(productId));
                if (found) setProduct(found);
                setGateways(activeGateways);
            }
            setLoading(false);
        };
        loadData();
        window.scrollTo(0, 0);
    }, [productId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;
        setProcessing(true);

        try {
            const selectedGateway = gateways.find(g => g.id === formData.paymentMethod);

            const orderData = {
                payment_method: selectedGateway.id,
                payment_method_title: selectedGateway.title,
                set_paid: false, // El administrador lo marcará como pagado o usará pasarela real
                billing: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    country: formData.country === 'Chile' ? 'CL' : (formData.country === 'México' ? 'MX' : 'ES') // Simplificado
                },
                line_items: [
                    {
                        product_id: product.id,
                        quantity: 1
                    }
                ],
                meta_data: [
                    { key: '_rlc_university', value: formData.university },
                    { key: '_rlc_country', value: formData.country },
                    { key: '_rlc_linkedin', value: formData.linkedin }
                ]
            };

            const result = await wpService.createOrder(orderData);
            setOrderSuccess(result);
            window.scrollTo(0, 0);
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;

    if (!product) return <div className="min-h-screen flex flex-col items-center justify-center"><h2>{t('memberships.notfound')}</h2><Link to="/membresias">{t('checkout.back')}</Link></div>;

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-20">
                <div className="max-w-xl w-full bg-white rounded-[3rem] p-12 shadow-2xl text-center border border-slate-100">
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <span className="material-symbols-outlined text-5xl">check_circle</span>
                    </div>
                    <h2 className="text-3xl font-display font-extrabold text-primary mb-4">{t('checkout.success.title')}</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        {t('checkout.success.msg')}<span className="font-bold text-primary">{formData.firstName}</span>.
                        {t('checkout.success.order.no')}<span className="bg-slate-100 px-3 py-1 rounded-lg font-mono font-bold text-secondary">#{orderSuccess.id}</span>.
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-6 mb-10 text-left">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">{t('checkout.success.steps.title')}</p>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex gap-3">
                                <span className="text-secondary font-bold">1.</span> {t('checkout.success.step1')}
                            </li>
                            <li className="flex gap-3">
                                <span className="text-secondary font-bold">2.</span> {t('checkout.success.step2')}
                            </li>
                        </ul>
                    </div>
                    <Link to="/" className="inline-block bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20">
                        {t('checkout.success.home')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen py-12 px-6 font-light">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <Link to="/membresias" className="text-slate-400 hover:text-primary flex items-center gap-2 mb-4 text-sm font-bold transition-colors">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        {t('checkout.back')}
                    </Link>
                    <h1 className="text-3xl font-display font-extrabold text-primary">{t('checkout.title')}</h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Form Area */}
                    <div className="lg:col-span-7">
                        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100">
                            <h2 className="text-xl font-display font-bold text-primary mb-8 pb-4 border-b border-slate-50">{t('checkout.form.member.info')}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">{t('checkout.form.name')}</label>
                                    <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary/20 outline-none transition-all" placeholder="Ej: Juan" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">{t('checkout.form.lastname')}</label>
                                    <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary/20 outline-none transition-all" placeholder="Ej: Pérez" />
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">{t('contact.form.email')}</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary/20 outline-none transition-all" placeholder="juan.perez@universidad.edu" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">{t('checkout.form.university')}</label>
                                    <input required name="university" value={formData.university} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary/20 outline-none transition-all" placeholder={t('checkout.form.university.placeholder')} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">{t('checkout.form.country')}</label>
                                    <select name="country" value={formData.country} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary/20 outline-none transition-all appearance-none">
                                        <option value="">{t('checkout.form.country.select')}</option>
                                        <option value="Argentina">Argentina</option>
                                        <option value="Chile">Chile</option>
                                        <option value="Colombia">Colombia</option>
                                        <option value="México">México</option>
                                        <option value="Perú">Perú</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-10">
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">{t('checkout.form.linkedin')}</label>
                                <input name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary/20 outline-none transition-all" placeholder="https://linkedin.com/in/usuario" />
                            </div>

                            {/* Payment Method Selector */}
                            <h2 className="text-xl font-display font-bold text-primary mb-8 mt-12 pb-4 border-b border-slate-50">{t('checkout.form.payment.method')}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-10">
                                {gateways.map((method) => {
                                    const icons: Record<string, string> = {
                                        'bacs': 'account_balance',
                                        'cheque': 'payments',
                                        'cod': 'local_shipping',
                                        'paypal': 'account_balance_wallet',
                                        'stripe': 'credit_card'
                                    };
                                    return (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                                            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all text-center
                                                ${formData.paymentMethod === method.id
                                                    ? 'border-secondary bg-secondary/5 text-secondary shadow-md'
                                                    : 'border-slate-100 hover:border-slate-200 text-slate-400'}
                                            `}
                                        >
                                            <span className="material-symbols-outlined text-3xl">
                                                {icons[method.id] || 'payments'}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-tight">
                                                {method.title}
                                            </span>
                                        </button>
                                    );
                                })}
                                {gateways.length === 0 && (
                                    <p className="col-span-full text-slate-400 text-sm italic py-4">{t('checkout.form.payment.none')}</p>
                                )}
                            </div>

                            <div className="mb-8 flex items-start gap-3">
                                <input required type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} className="mt-1 w-4 h-4 text-secondary rounded focus:ring-secondary/20 border-slate-200 cursor-pointer" />
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {t('checkout.form.terms')}
                                </p>
                            </div>

                            <button
                                disabled={processing || !formData.paymentMethod}
                                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl
                                    ${processing || !formData.paymentMethod
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-secondary text-white hover:scale-[1.02] shadow-secondary/20 hover:shadow-secondary/40'}
                                `}
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                                        {t('checkout.form.processing')}
                                    </span>
                                ) : (
                                    `${t('checkout.form.cta')} $${product.price} USD`
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Summary Area */}
                    <div className="lg:col-span-5">
                        <div className="bg-primary rounded-3xl p-8 text-white sticky top-24">
                            <h3 className="text-xl font-display font-bold mb-8">{t('checkout.summary.title')}</h3>

                            <div className="bg-white/10 p-6 rounded-2xl mb-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-lg">
                                            <TranslatableText>{product.name}</TranslatableText>
                                        </h4>
                                        <p className="text-xs text-slate-300">{t('checkout.summary.period')}</p>
                                    </div>
                                    <span className="text-accent font-black text-xl">${product.price}</span>
                                </div>
                                <div className="border-t border-white/10 pt-4 mt-4 text-xs text-slate-300 leading-relaxed italic">
                                    {t('checkout.summary.desc')}
                                </div>
                            </div>

                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="material-symbols-outlined text-accent text-lg">verified</span>
                                    {t('checkout.summary.benefit1')}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="material-symbols-outlined text-accent text-lg">verified</span>
                                    {t('checkout.summary.benefit2')}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="material-symbols-outlined text-accent text-lg">verified</span>
                                    {t('checkout.summary.benefit3')}
                                </div>
                            </div>

                            <div className="p-6 bg-secondary/20 rounded-2xl border border-secondary/30">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-2xl text-secondary">encrypted</span>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">{t('checkout.summary.secure')}</p>
                                        <p className="text-[10px] text-slate-300">SSL Encrypted Transaction</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
