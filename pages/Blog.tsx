import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wpService } from '../services/wpService';
import { useTranslation } from '../context/useTranslation';
import { TranslatableText } from '../components/TranslatableText';

interface Post {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
    'wp:term'?: Array<Array<{ name: string }>>;
  };
}

const Blog: React.FC = () => {
  const { t, language } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const data = await wpService.getPosts();
      setPosts(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  // Función para limpiar el HTML de los extractos de WP
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white py-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-primary mb-6">{t('blog.title')}</h1>
            <p className="text-slate-500 leading-relaxed font-light">{t('blog.desc')}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-bounce text-secondary font-bold">{t('blog.loading')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.length > 0 ? (
              posts.map((post) => {
                const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800';
                const category = post._embedded?.['wp:term']?.[0]?.[0]?.name || t('blog.category.default');

                return (
                  <Link to={`/blog/${post.slug}`} key={post.id} className="group cursor-pointer">
                    <article>
                      <div className="aspect-[16/10] bg-slate-100 rounded-3xl overflow-hidden mb-6 shadow-sm group-hover:shadow-xl transition-all">
                        <img
                          src={imageUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={post.title.rendered}
                        />
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-black uppercase text-secondary tracking-widest">{category}</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-slate-400">{formatDate(post.date)}</span>
                      </div>
                      <h3
                        className="text-xl font-bold text-primary group-hover:text-secondary transition-colors leading-tight"
                        dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                      />
                      <p className="text-slate-500 text-sm mt-4 line-clamp-2 leading-relaxed font-light">
                        {stripHtml(post.excerpt.rendered)}
                      </p>
                      <div className="mt-6 text-primary font-black text-xs uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                        {t('common.readmore')}
                        <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                      </div>
                    </article>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400">{t('blog.notfound')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
