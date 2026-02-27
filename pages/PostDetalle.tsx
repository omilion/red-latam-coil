
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { wpService } from '../services/wpService';

interface Post {
    id: number;
    slug: string;
    title: { rendered: string };
    content: { rendered: string };
    date: string;
    categories: number[];
    featured_media_url?: string;
    _embedded?: {
        'wp:featuredmedia'?: Array<{ source_url: string }>;
        'wp:term'?: Array<Array<{ name: string; id: number }>>;
    };
}

const PostDetalle: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            if (slug) {
                const data = await wpService.getPostBySlug(slug);
                if (data) {
                    setPost(data);
                    // Cargar relacionados si hay categoría
                    if (data.categories && data.categories.length > 0) {
                        const related = await wpService.getPostsByCategory(data.categories[0], data.id);
                        setRelatedPosts(related);
                    }
                }
            }
            setLoading(false);
        };
        fetchPost();
        // Scroll al inicio al cambiar de noticia
        window.scrollTo(0, 0);
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
                <h1 className="text-4xl font-display font-bold text-primary mb-4">Post no encontrado</h1>
                <p className="text-slate-500 mb-8">Lo sentimos, la noticia que buscas no existe o ha sido movida.</p>
                <Link to="/blog" className="bg-primary text-white px-8 py-3 rounded-xl font-bold">Volver al Blog</Link>
            </div>
        );
    }

    const imageUrl = post.featured_media_url || post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const category = post._embedded?.['wp:term']?.[0]?.[0]?.name || 'Noticias';

    return (
        <article className="bg-white min-h-screen pb-24 font-light">
            {/* Header / Hero */}
            <header className="relative min-h-[50vh] flex items-end pt-24 pb-12 text-white overflow-hidden bg-primary">
                {imageUrl && (
                    <div className="absolute inset-0 z-0">
                        <img src={imageUrl} className="w-full h-full object-cover brightness-[0.4]" alt={post.title.rendered} />
                    </div>
                )}
                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-secondary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{category}</span>
                        <span className="text-xs font-bold text-slate-300">
                            {new Date(post.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <h1
                        className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight max-w-4xl"
                        dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                    />
                </div>
            </header>

            {/* Main Layout: Content + Sidebar */}
            <div className="max-w-7xl mx-auto px-6 mt-16 text-slate-600">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                    {/* Main Content Area */}
                    <div className="lg:col-span-8 min-w-0">
                        <div
                            className="prose prose-lg prose-slate max-w-none break-words
                                prose-headings:font-display prose-headings:text-primary prose-headings:font-bold
                                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-6
                                prose-img:rounded-3xl prose-img:shadow-xl
                                prose-a:text-secondary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                                prose-table:table-auto prose-table:w-full prose-table:block prose-table:overflow-x-auto pb-4"
                            dangerouslySetInnerHTML={{ __html: post.content.rendered }}
                        />

                        {/* Footer de la noticia */}
                        <div className="mt-16 pt-10 border-t border-slate-100 flex flex-wrap justify-between items-center gap-6">
                            <Link to="/blog" className="inline-flex items-center gap-2 text-primary font-bold hover:text-secondary transition-colors group">
                                <span className="material-symbols-outlined group-hover:translate-x-[-4px] transition-transform">arrow_back</span>
                                Volver a todas las noticias
                            </Link>

                            <div className="flex items-center gap-4">
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Comparte esta noticia</span>
                                <div className="flex gap-2">
                                    {['facebook', 'linkedin', 'x'].map((social) => (
                                        <button key={social} className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
                                            <span className="material-symbols-outlined text-sm">share</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* CTA Recursos / Membresía */}
                        <div className="mt-12 p-10 bg-gradient-to-br from-primary to-primary-light rounded-[3rem] shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex-1 text-center md:text-left">
                                    <span className="inline-block bg-accent/20 text-accent px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">Beneficio Exclusivo</span>
                                    <h3 className="text-white text-3xl font-display font-bold mb-3 italic">¿Ya conoces nuestros materiales?</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed max-w-sm">Los miembros de la Red tienen acceso a toolkits, grabaciones de webinars y guías exclusivas.</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <Link to="/recursos" className="bg-accent text-primary px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl whitespace-nowrap text-center">
                                        Explorar Recursos
                                    </Link>
                                    <Link to="/membresias" className="text-white/60 text-[10px] font-black uppercase tracking-widest text-center hover:text-white transition-colors">
                                        Ver planes de membresía
                                    </Link>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        </div>
                    </div>

                    {/* Sidebar: Related Posts */}
                    <aside className="lg:col-span-4 sticky top-24 self-start">
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                            <h4 className="text-primary font-display font-bold text-xl mb-8 flex items-center gap-2">
                                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
                                Historias Relacionadas
                            </h4>

                            <div className="space-y-8">
                                {relatedPosts.length > 0 ? (
                                    relatedPosts.map((rPost) => {
                                        const rImg = rPost.featured_media_url || rPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400';
                                        return (
                                            <Link key={rPost.id} to={`/blog/${rPost.slug}`} className="group flex gap-4 items-start">
                                                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                                                    <img src={rImg} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={rPost.title.rendered} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h5
                                                        className="text-primary font-bold text-xs leading-snug group-hover:text-secondary transition-colors line-clamp-2"
                                                        dangerouslySetInnerHTML={{ __html: rPost.title.rendered }}
                                                    />
                                                    <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                                                        {new Date(rPost.date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <p className="text-slate-400 text-sm font-light italic">No hay más historias en esta categoría por ahora.</p>
                                )}
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-200">
                                <div className="bg-primary-light/10 p-6 rounded-3xl text-center">
                                    <span className="material-symbols-outlined text-secondary text-3xl mb-2">auto_awesome</span>
                                    <p className="text-primary font-bold text-sm mb-4">¿Te gusta lo que lees?</p>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-secondary hover:underline">Suscríbete al newsletter</button>
                                </div>
                            </div>
                        </div>
                    </aside>

                </div>
            </div>
        </article>
    );
};

export default PostDetalle;
