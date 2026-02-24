
const WP_URL = import.meta.env.VITE_WP_URL;
const CONSUMER_KEY = import.meta.env.VITE_WC_CONSUMER_KEY;
const CONSUMER_SECRET = import.meta.env.VITE_WC_CONSUMER_SECRET;

/**
 * Servicio para conectar con la API de WordPress y WooCommerce.
 */
export const wpService = {
  /**
   * Utility to map English fields if language is set to 'en'
   */
  applyLanguage(item: any) {
    const lang = localStorage.getItem('rlc_lang') || 'es';
    if (lang === 'en' && item) {
      // Direct title/content (posts, resources)
      if (item.title_en) {
        if (typeof item.title === 'object') item.title.rendered = item.title_en;
        else item.title = item.title_en;
      }
      if (item.content_en) {
        if (typeof item.content === 'object') item.content.rendered = item.content_en;
        else item.content = item.content_en;
      }
      if (item.subtitle_en) item.rlc_event_subtitle = item.subtitle_en;

      // WooCommerce Product Name
      if (item.title_en && item.name) item.name = item.title_en;
    }
    return item;
  },

  /**
   * Obtiene las entradas desde WordPress, soportando categorías.
   */
  async getPosts(categories?: number[]) {
    try {
      let url = `${WP_URL}/wp-json/wp/v2/posts?_embed&per_page=50`;
      if (categories && categories.length > 0) {
        url += `&categories=${categories.join(',')}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const posts = await response.json();
      return Array.isArray(posts) ? posts.map((p: any) => this.applyLanguage(p)) : [];
    } catch (error) {
      console.error('WP Service Error (getPosts):', error);
      return [];
    }
  },

  /**
   * Obtiene los productos (Membresías/Cursos) desde WooCommerce.
   */
  async getProducts() {
    try {
      const url = `${WP_URL}/wp-json/wc/v3/products?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}&per_page=100`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const products = await response.json();
      return Array.isArray(products) ? products.map(p => this.applyLanguage(this.flattenProduct(p))) : [];
    } catch (error) {
      console.error('WC Service Error (getProducts):', error);
      return [];
    }
  },

  /**
   * Obtiene un producto específico por ID.
   */
  async getProductById(id: string) {
    try {
      const url = `${WP_URL}/wp-json/wc/v3/products/${id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const product = await response.json();
      return this.applyLanguage(this.flattenProduct(product));
    } catch (error) {
      console.error('WC Service Error (getProductById):', error);
      return null;
    }
  },

  /**
   * Utilidad para aplanar metadatos de WooCommerce.
   */
  flattenProduct(product: any) {
    if (!product || !product.meta_data) return product;
    const flattened = { ...product };
    product.meta_data.forEach((meta: any) => {
      let val = meta.value;
      if (meta.key === 'rlc_event_is_featured') val = val === 'yes';
      flattened[meta.key] = val;
    });
    return flattened;
  },

  /**
   * Obtiene un post específico por su slug.
   */
  async getPostBySlug(slug: string) {
    try {
      const response = await fetch(`${WP_URL}/wp-json/wp/v2/posts?slug=${slug}&_embed`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      return data.length > 0 ? this.applyLanguage(data[0]) : null;
    } catch (error) {
      console.error('WP Service Error (getPostBySlug):', error);
      return null;
    }
  },

  /**
   * Obtiene posts relacionados por categoría.
   */
  async getPostsByCategory(categoryId: number, excludeId: number) {
    try {
      const response = await fetch(`${WP_URL}/wp-json/wp/v2/posts?categories=${categoryId}&exclude=${excludeId}&per_page=3&_embed`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (getPostsByCategory):', error);
      return [];
    }
  },

  /**
   * Obtiene los métodos de pago habilitados en WooCommerce.
   */
  async getPaymentGateways() {
    try {
      const url = `${WP_URL}/wp-json/wc/v3/payment_gateways?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      return data.filter((gw: any) => gw.enabled);
    } catch (error) {
      console.error('WC Service Error (getPaymentGateways):', error);
      return [];
    }
  },

  /**
   * Crea un pedido en WooCommerce.
   */
  async createOrder(orderData: any) {
    try {
      const url = `${WP_URL}/wp-json/wc/v3/orders?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) throw new Error('Error al crear el pedido');
      return await response.json();
    } catch (error) {
      console.error('WC Service Error (createOrder):', error);
      throw error;
    }
  },

  /**
   * Obtiene todos los miembros con planes activos.
   */
  async getMembers() {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('RLC Service Error (getMembers):', error);
      return [];
    }
  },

  /**
   * Asigna una membresía o evento manualmente a un usuario.
   */
  async assignMembership(userId: number, level: string, expiryDate: string, productType: 'membership' | 'event' = 'membership', membershipType?: string) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/members/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          level,
          expiry_date: expiryDate,
          product_type: productType,
          membership_type: membershipType
        })
      });
      if (!response.ok) throw new Error('Error al asignar');
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (assignMembership):', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo miembro manualmente.
   */
  async createMember(userData: { name: string, email: string, level?: string, expiry_date?: string, membership_type?: string }) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/members/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al crear usuario');
      }
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (createMember):', error);
      throw error;
    }
  },

  /**
   * Elimina un miembro por ID.
   */
  async deleteMember(userId: number) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al eliminar usuario');
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (deleteMember):', error);
      throw error;
    }
  },

  /**
   * Obtiene los últimos pedidos.
   */
  async getOrders() {
    try {
      const url = `${WP_URL}/wp-json/wc/v3/orders?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}&per_page=10`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('WC Service Error (getOrders):', error);
      return [];
    }
  },

  // Crear entrada
  async createPost(postData: any) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...postData,
          status: 'publish'
        })
      });
      if (!response.ok) throw new Error('Error al crear entrada');
      return await response.json();
    } catch (error) {
      console.error('Error en createPost:', error);
      throw error;
    }
  },

  // Actualizar entrada
  async updatePost(id: number, postData: any) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });
      if (!response.ok) throw new Error('Error al actualizar entrada');
      return await response.json();
    } catch (error) {
      console.error('Error en updatePost:', error);
      throw error;
    }
  },

  /**
   * CMS: Eliminar un post.
   */
  async deletePost(id: number) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('CMS Error (deletePost):', error);
      throw error;
    }
  },

  /**
   * WooCommerce: Actualizar un producto.
   */
  async updateProduct(id: number, productData: any) {
    try {
      const url = `${WP_URL}/wp-json/wc/v3/products/${id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('WC Error (updateProduct):', error);
      throw error;
    }
  },

  /**
   * WooCommerce: Crear un nuevo producto.
   */
  async createProduct(productData: any) {
    try {
      const url = `${WP_URL}/wp-json/wc/v3/products?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('WC Error (createProduct):', error);
      throw error;
    }
  },

  /**
   * WooCommerce: Eliminar un producto.
   */
  async deleteProduct(id: number) {
    try {
      const url = `${WP_URL}/wp-json/wc/v3/products/${id}?force=true&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      const response = await fetch(url, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('WC Error (deleteProduct):', error);
      throw error;
    }
  },

  /**
   * WordPress: Subir un archivo a la biblioteca de medios.
   */
  async uploadMedia(file: File) {
    try {
      const token = localStorage.getItem('rlc_token');

      // WordPress REST API: Binario en el body + metadatos en headers/query
      // Agregamos el título en la query string para asegurar que WP lo asigne correctamente
      const url = `${WP_URL}/wp-json/wp/v2/media?title=${encodeURIComponent(file.name)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': file.type,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`
        },
        body: file
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WP Media Upload Failure:', data);
        throw new Error(data.message || 'Error al subir medios a WordPress');
      }

      return data;
    } catch (error) {
      console.error('WP Service Error (uploadMedia):', error);
      throw error;
    }
  },

  /**
   * WordPress: Obtener archivos de la biblioteca de medios.
   */
  async getMedia(perPage: number = 20) {
    try {
      const response = await fetch(`${WP_URL}/wp-json/wp/v2/media?per_page=${perPage}`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (getMedia):', error);
      return [];
    }
  },

  /**
   * RECURSOS: Obtener todos los recursos para el público.
   */
  async getResourcesPublic() {
    try {
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/resources`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const resources = await response.json();
      return Array.isArray(resources) ? resources.map((r: any) => this.applyLanguage(r)) : [];
    } catch (error) {
      console.error('WP Service Error (getResourcesPublic):', error);
      return [];
    }
  },

  /**
   * RECURSOS: Métodos Administrativos.
   */
  async getResourcesAdmin() {
    try {
      const token = localStorage.getItem('rlc_token');
      // console.log('RLC Admin: Solicitando recursos con token', token ? 'Presente' : 'Ausente');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/resources`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('RLC Admin Auth Error:', response.status, errorData);
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('RLC Service Error (getResourcesAdmin):', error);
      return [];
    }
  },
  async createResource(data: any) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          categories: data.categories || []
        })
      });
      if (!response.ok) throw new Error('Error al crear recurso');
      return await response.json();
    } catch (error) {
      console.error('Error en createResource:', error);
      throw error;
    }
  },

  async updateResource(id: number, data: any) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/resources/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          categories: data.categories || []
        })
      });
      if (!response.ok) throw new Error('Error al actualizar recurso');
      return await response.json();
    } catch (error) {
      console.error('Error en updateResource:', error);
      throw error;
    }
  },

  /**
   * RECURSOS: Categorías.
   */
  async getResourceCategories() {
    try {
      // Usamos el endpoint personalizado rlc/v1 para evitar errores 404 del core
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/categories`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (getResourceCategories):', error);
      return [];
    }
  },

  async createResourceCategory(name: string) {
    try {
      const token = localStorage.getItem('rlc_token');
      // Usamos el endpoint administrativo rlc/v1
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error('Error al crear categoría');
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (createResourceCategory):', error);
      throw error;
    }
  },

  async deleteResource(id: number) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/resources/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al eliminar recurso');
      return await response.json();
    } catch (error) {
      console.error('Error en deleteResource:', error);
      throw error;
    }
  },

  /**
   * CONFIGURACIÓN WEB: Obtener y actualizar ajustes globales.
   */
  async getWebSettings() {
    try {
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/settings`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();

      const lang = localStorage.getItem('rlc_lang') || 'es';
      if (lang === 'en' && data.mirror_en) {
        return data.mirror_en;
      }
      return data.settings || data;
    } catch (error) {
      console.error('WP Service Error (getWebSettings):', error);
      return null;
    }
  },

  async updateWebSettings(settings: any) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Error al actualizar configuración');
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (updateWebSettings):', error);
      throw error;
    }
  },

  /**
   * Gestión de Cupos (Slots) para Institucionales
   */
  async getSlots() {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/member/slots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (getSlots):', error);
      return { slots_limit: 0, slots_used: 0, members: [] };
    }
  },

  async assignSlot(email: string) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/member/slots/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al asignar cupo');
      }
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (assignSlot):', error);
      throw error;
    }
  },

  async removeSlot(userId: number) {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/member/slots/remove?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al remover cupo');
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (removeSlot):', error);
      throw error;
    }
  },

  async getUserActivity() {
    try {
      const token = localStorage.getItem('rlc_token');
      const response = await fetch(`${WP_URL}/wp-json/rlc/v1/user/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('WP Service Error (getUserActivity):', error);
      return { events: [], orders: [] };
    }
  }
};
