<?php
/**
 * Plugin Name: RLC Membership Core
 * Description: Sistema integral de membresías para Red LATAM COIL con API REST para React, integración con WooCommerce y Panel Administrativo.
 * Version: 2.2.0
 * Author: Gemini AI & Hazlo Mejor
 */

if (!defined('ABSPATH'))
    exit;

class RLC_Membership_Core
{
    public function __construct()
    {
        // 1. Inicialización y API
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('init', [$this, 'register_resource_taxonomy']); // Register taxonomy FIRST
        add_action('init', [$this, 'register_resource_cpt']);
        add_action('init', [$this, 'register_product_meta_fields']);
        add_action('init', [$this, 'register_user_meta_fields']);
        add_action('init', [$this, 'maybe_flush_rewrites'], 20); // Flush if needed
        add_filter('rest_prepare_post', [$this, 'expose_post_image_meta'], 10, 3);

        // 2. Integración WooCommerce
        add_action('woocommerce_order_status_completed', [$this, 'handle_membership_purchase']);
        add_action('woocommerce_checkout_update_order_meta', [$this, 'save_checkout_fields_to_order']);

        // 3. Automatización (Cron Job)
        add_action('rlc_daily_expiry_check', [$this, 'check_expirations']);
        if (!wp_next_scheduled('rlc_daily_expiry_check')) {
            wp_schedule_event(time(), 'daily', 'rlc_daily_expiry_check');
        }

        // 4. Panel Administrativo (WP Admin)
        add_action('admin_menu', [$this, 'add_admin_menu']);

        // 5. CORS y Autenticación robusta
        add_filter('allowed_http_origins', [$this, 'add_allowed_origins']);
        add_action('determine_current_user', [$this, 'rest_authorize'], 10);
        add_filter('rest_authentication_errors', [$this, 'force_rest_auth'], 10);

        // 6. AI Translation Hooks
        add_action('save_post', [$this, 'handle_post_translation_sync'], 20, 3);

        // 7. Configuración de Correo Saliente y Newsletter
        add_filter('wp_mail_from', function () {
            return 'info@redlatamcoil.com';
        });
        add_filter('wp_mail_from_name', function () {
            return 'Red LATAM COIL';
        });
    }

    /**
     * REGISTRO DE RUTAS API REST
     */
    public function register_routes()
    {
        $admin_args = [
            'methods' => 'GET',
            'callback' => [$this, 'get_admin_members'],
            'permission_callback' => [$this, 'is_admin']
        ];

        register_rest_route('rlc/v1', '/user/profile', [
            'methods' => 'GET',
            'callback' => [$this, 'get_user_profile'],
            'permission_callback' => [$this, 'is_authenticated']
        ]);

        register_rest_route('rlc/v1', '/user/status', [
            'methods' => 'GET',
            'callback' => [$this, 'get_user_status'],
            'permission_callback' => [$this, 'is_authenticated']
        ]);

        register_rest_route('rlc/v1', '/login', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_login'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route('rlc/v1', '/admin/members', $admin_args);

        // Rutas Administrativas para Recursos
        register_rest_route('rlc/v1', '/admin/resources', [
            ['methods' => 'GET', 'callback' => [$this, 'get_admin_resources'], 'permission_callback' => [$this, 'is_admin']],
            ['methods' => 'POST', 'callback' => [$this, 'create_admin_resource'], 'permission_callback' => [$this, 'is_admin']]
        ]);

        register_rest_route('rlc/v1', '/resources', [
            'methods' => 'GET',
            'callback' => [$this, 'get_public_resources'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route('rlc/v1', '/admin/resources/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [$this, 'update_admin_resource'], 'permission_callback' => [$this, 'is_admin']],
            ['methods' => 'DELETE', 'callback' => [$this, 'delete_admin_resource'], 'permission_callback' => [$this, 'is_admin']]
        ]);

        // Rutas Administrativas para Posts (Blog/Eventos en WP)
        register_rest_route('rlc/v1', '/admin/posts', [
            'methods' => 'POST',
            'callback' => [$this, 'create_admin_post'],
            'permission_callback' => [$this, 'is_admin']
        ]);

        register_rest_route('rlc/v1', '/admin/posts/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [$this, 'update_admin_post'], 'permission_callback' => [$this, 'is_admin']],
            ['methods' => 'DELETE', 'callback' => [$this, 'delete_admin_post'], 'permission_callback' => [$this, 'is_admin']]
        ]);

        register_rest_route('rlc/v1', '/seed', [
            'methods' => ['GET', 'POST'],
            'callback' => [$this, 'seed_data'],
            'permission_callback' => '__return_true'
        ]);

        // Rutas Globales de Configuración Web
        register_rest_route('rlc/v1', '/settings', [
            'methods' => 'GET',
            'callback' => [$this, 'get_web_settings'],
            'permission_callback' => '__return_true' // Público para que el front lo vea
        ]);

        register_rest_route('rlc/v1', '/admin/settings', [
            'methods' => 'POST',
            'callback' => [$this, 'update_web_settings'],
            'permission_callback' => [$this, 'is_admin']
        ]);

        register_rest_route('rlc/v1', '/admin/translate-all', [
            'methods' => 'POST',
            'callback' => [$this, 'bulk_translate_content'],
            'permission_callback' => [$this, 'is_admin']
        ]);

        register_rest_route('rlc/v1', '/newsletter/subscribe', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_newsletter_subscription'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route('rlc/v1', '/contact', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_contact_form'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route('rlc/v1', '/categories', [
            'methods' => 'GET',
            'callback' => [$this, 'get_resource_categories'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route('rlc/v1', '/admin/categories', [
            'methods' => 'POST',
            'callback' => [$this, 'create_resource_category'],
            'permission_callback' => [$this, 'is_admin']
        ]);

        register_rest_route('rlc/v1', '/admin/newsletter/leads', [
            'methods' => 'GET',
            'callback' => [$this, 'get_newsletter_leads'],
            'permission_callback' => [$this, 'is_admin']
        ]);

        // AI Proxy - Gemini (key segura en wp-config.php)
        register_rest_route('rlc/v1', '/ai/generate', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_ai_generate'],
            'permission_callback' => [$this, 'is_admin']
        ]);
    }

    public function get_resource_categories()
    {
        $terms = get_terms(['taxonomy' => 'categoria_recurso', 'hide_empty' => false]);
        return new WP_REST_Response($terms, 200);
    }

    public function create_resource_category($request)
    {
        $name = $request['name'];
        $term = wp_insert_term($name, 'categoria_recurso');
        if (is_wp_error($term))
            return $term;
        return new WP_REST_Response(get_term($term['term_id'], 'categoria_recurso'), 200);
    }

    /**
     * PERMISOS Y AUTENTICACIÓN
     */
    public function is_authenticated($request)
    {
        return get_current_user_id() > 0;
    }
    public function is_admin($request)
    {
        $id = $this->rest_authorize(0);
        $is_admin = $id > 0 && user_can($id, 'administrator');

        if (!$is_admin && defined('WP_DEBUG') && WP_DEBUG) {
            error_log("RLC Admin Check Failed: User ID $id is not admin or not found via Bearer Token.");
        }

        return $is_admin;
    }

    public function rest_authorize($user_id)
    {
        if ($user_id > 0)
            return $user_id;

        $auth_header = null;
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }

        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return $user_id;
        }

        $token = str_replace('Bearer ', '', $auth_header);
        $decoded = base64_decode($token);

        if (!$decoded)
            return $user_id;

        $parts = explode(':', $decoded);
        if (count($parts) >= 2) {
            $id = intval($parts[0]);
            // Verificación cruzada: el ID debe ser un usuario real
            $user = get_userdata($id);
            if ($user && $user->user_email === $parts[1]) {
                return $id;
            }
        }

        return $user_id;
    }

    /**
     * Fuerza la identidad del usuario en el contexto de la API REST
     * para evitar que otros plugins o el core bloqueen la petición antes de tiempo.
     */
    public function force_rest_auth($result)
    {
        // Si ya hay un error de autenticación previo, lo mantenemos a menos que tengamos Bearer
        $id = $this->rest_authorize(0);
        if ($id > 0) {
            wp_set_current_user($id);
            // Si el ID es válido, sobreescribimos cualquier error de nonce/cookie
            return true;
        }
        return $result;
    }

    /**
     * CORS NATIVO DE ALTO NIVEL
     */
    public function add_allowed_origins($origins)
    {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        if (!empty($origin) && !in_array($origin, $origins))
            $origins[] = $origin;
        return $origins;
    }

    public function handle_cors()
    {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';

        if (!headers_sent()) {
            header("Access-Control-Allow-Origin: $origin");
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
            header("Access-Control-Allow-Credentials: true");
            header("Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce, X-Requested-With, Accept, Origin");
            header("Access-Control-Expose-Headers: Content-Disposition, X-WP-Total, X-WP-TotalPages");
        }

        if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            status_header(200);
            header("Content-Type: text/plain");
            exit;
        }

        // Limpieza redundante para el núcleo de WordPress
        remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
        add_filter('rest_pre_serve_request', function ($value) use ($origin) {
            if (!headers_sent()) {
                header("Access-Control-Allow-Origin: $origin");
            }
            return $value;
        }, 99);
    }

    /**
     * CALLBACKS DE PERFIL Y MIEMBROS
     */
    public function handle_login($request)
    {
        // Intentar múltiples fuentes de parámetros para máxima compatibilidad
        $params = $request->get_json_params();

        // Fallback 1: get_params() (incluye query, body, y defaults)
        if (empty($params) || (!isset($params['email']) && !isset($params['username']))) {
            $all_params = $request->get_params();
            if (!empty($all_params) && (isset($all_params['email']) || isset($all_params['username']))) {
                $params = $all_params;
            }
        }

        // Fallback 2: parsear php://input directamente
        if (empty($params) || (!isset($params['email']) && !isset($params['username']))) {
            $raw = file_get_contents('php://input');
            if (!empty($raw)) {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $params = $decoded;
                }
            }
        }

        $login_input = isset($params['email']) ? trim($params['email']) : (isset($params['username']) ? trim($params['username']) : '');
        $password = isset($params['password']) ? $params['password'] : '';

        if (empty($login_input) || empty($password)) {
            return new WP_REST_Response([
                'message' => 'Email/usuario y contraseña son requeridos',
                'debug_keys' => array_keys($params ?: [])
            ], 400);
        }

        // Resolver el user_login: si el input es un email, buscar el usuario por email
        $username = $login_input;
        if (is_email($login_input)) {
            $user_by_email = get_user_by('email', $login_input);
            if ($user_by_email) {
                $username = $user_by_email->user_login;
            }
            // Si no existe, wp_authenticate fallará naturalmente
        }

        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("[RLC Login] Input: '$login_input' -> Resolved username: '$username'");
        }

        $user = wp_authenticate($username, $password);

        if (is_wp_error($user)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log("[RLC Login] Failed for '$username': " . $user->get_error_message());
            }
            return new WP_REST_Response(['message' => 'Credenciales inválidas'], 401);
        }

        $uid = $user->ID;
        // Generar token Bearer compatible con rest_authorize()
        $token = base64_encode($uid . ':' . $user->user_email);

        $res = [
            'token' => $token,
            'id' => $uid,
            'full_name' => $user->display_name,
            'email' => $user->user_email,
            'university' => get_user_meta($uid, 'rlc_university', true) ?: '',
            'country' => get_user_meta($uid, 'rlc_country', true) ?: '',
            'position' => get_user_meta($uid, 'rlc_position', true) ?: '',
            'linkedin' => get_user_meta($uid, 'rlc_linkedin', true) ?: '',
            'membership' => get_user_meta($uid, 'rlc_membership_level', true) ?: 'Ninguna',
            'status' => get_user_meta($uid, 'rlc_status', true) ?: 'inactive',
            'expiry_date' => get_user_meta($uid, 'rlc_expiry_date', true) ?: 'N/A',
            'avatar' => get_avatar_url($uid),
            'roles' => (array) $user->roles,
            'is_admin' => in_array('administrator', (array) $user->roles),
            'nonce' => wp_create_nonce('wp_rest')
        ];

        return new WP_REST_Response($res, 200);
    }

    public function handle_newsletter_subscription($request)
    {
        $email = sanitize_email($request['email']);
        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Email inválido', ['status' => 400]);
        }

        // Guardar en una lista de opciones (simple leads list)
        $leads = get_option('rlc_newsletter_leads', []);
        if (!in_array($email, $leads)) {
            $leads[] = $email;
            update_option('rlc_newsletter_leads', $leads);
        }

        // Enviar notificación al admin
        $to = 'info@redlatamcoil.com';
        $subject = 'Nueva suscripción al Newsletter - Red LATAM COIL';
        $message = "Se ha recibido una nueva suscripción al newsletter:\n\nEmail: $email\nFecha: " . date('Y-m-d H:i:s');

        wp_mail($to, $subject, $message);

        return new WP_REST_Response(['success' => true, 'message' => 'Suscripción exitosa'], 200);
    }

    public function handle_contact_form($request)
    {
        $name = sanitize_text_field($request['name']);
        $email = sanitize_email($request['email']);
        $subject_type = sanitize_text_field($request['subject']);
        $message_text = sanitize_textarea_field($request['message']);

        if (empty($name) || empty($email) || empty($message_text)) {
            return new WP_Error('missing_fields', 'Todos los campos son obligatorios', ['status' => 400]);
        }

        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Email inválido', ['status' => 400]);
        }

        // Notificación al Admin
        $to = 'info@redlatamcoil.com';
        $email_subject = "Nuevo mensaje de contacto: $subject_type - $name";
        $email_body = "Has recibido un nuevo mensaje desde el sitio web de Red LATAM COIL.\n\n";
        $email_body .= "Nombre: $name\n";
        $email_body .= "Email: $email\n";
        $email_body .= "Asunto: $subject_type\n\n";
        $email_body .= "Mensaje:\n$message_text\n\n";
        $email_body .= "Fecha: " . date('Y-m-d H:i:s');

        $headers = array('Content-Type: text/plain; charset=UTF-8', "Reply-To: $name <$email>");

        $sent = wp_mail($to, $email_subject, $email_body, $headers);

        if (!$sent) {
            return new WP_Error('email_failed', 'No se pudo enviar el correo', ['status' => 500]);
        }

        return new WP_REST_Response(['success' => true, 'message' => 'Mensaje enviado correctamente'], 200);
    }

    public function get_newsletter_leads()
    {
        $leads = get_option('rlc_newsletter_leads', []);
        return new WP_REST_Response($leads, 200);
    }

    public function get_user_profile()
    {
        $uid = get_current_user_id();
        $user = get_userdata($uid);
        return new WP_REST_Response([
            'id' => $uid,
            'full_name' => $user->display_name,
            'email' => $user->user_email,
            'university' => get_user_meta($uid, 'rlc_university', true) ?: '',
            'country' => get_user_meta($uid, 'rlc_country', true) ?: '',
            'position' => get_user_meta($uid, 'rlc_position', true) ?: '',
            'linkedin' => get_user_meta($uid, 'rlc_linkedin', true) ?: '',
            'membership' => get_user_meta($uid, 'rlc_membership_level', true) ?: 'Ninguna',
            'status' => get_user_meta($uid, 'rlc_status', true) ?: 'inactive',
            'expiry_date' => get_user_meta($uid, 'rlc_expiry_date', true) ?: 'N/A',
            'avatar' => get_avatar_url($uid),
            'roles' => (array) $user->roles,
            'is_admin' => in_array('administrator', (array) $user->roles)
        ], 200);
    }

    public function get_user_status()
    {
        $uid = get_current_user_id();
        return new WP_REST_Response([
            'status' => get_user_meta($uid, 'rlc_status', true) ?: 'pending',
            'level' => get_user_meta($uid, 'rlc_membership_level', true) ?: 'none'
        ], 200);
    }

    public function get_admin_members()
    {
        $users = get_users(['role__in' => ['subscriber', 'customer', 'author', 'editor', 'administrator']]);
        $data = array_map(function ($u) {
            return [
                'id' => $u->ID,
                'name' => $u->display_name,
                'email' => $u->user_email,
                'university' => get_user_meta($u->ID, 'rlc_university', true) ?: '',
                'country' => get_user_meta($u->ID, 'rlc_country', true) ?: '',
                'membership' => get_user_meta($u->ID, 'rlc_membership_level', true) ?: 'Ninguna',
                'status' => get_user_meta($u->ID, 'rlc_status', true) ?: 'inactive',
                'expiry' => get_user_meta($u->ID, 'rlc_expiry_date', true) ?: '',
                'date' => $u->user_registered
            ];
        }, $users);
        return new WP_REST_Response($data, 200);
    }

    /**
     * GESTIÓN DE RECURSOS (ADMIN)
     */
    public function get_admin_resources()
    {
        $posts = get_posts(['post_type' => 'recurso', 'post_status' => 'any', 'posts_per_page' => -1]);
        $data = array_map(function ($p) {
            $terms = wp_get_object_terms($p->ID, 'categoria_recurso', ['fields' => 'ids']);
            $category_ids = is_wp_error($terms) ? [] : array_map('intval', $terms);

            $term_names = wp_get_object_terms($p->ID, 'categoria_recurso', ['fields' => 'names']);
            $category_names = is_wp_error($term_names) ? [] : $term_names;

            return [
                'id' => $p->ID,
                'title' => $p->post_title,
                'content' => $p->post_content,
                'status' => $p->post_status,
                'url' => get_post_meta($p->ID, 'rlc_resource_url', true) ?: '',
                'type' => get_post_meta($p->ID, 'rlc_resource_type', true) ?: 'PDF',
                'is_premium' => get_post_meta($p->ID, 'rlc_resource_is_premium', true) === '1' || get_post_meta($p->ID, 'rlc_resource_is_premium', true) === true,
                'categories' => $category_ids,
                'categoria_recurso' => $category_ids,
                'category_names' => $category_names,
                'featured_media_url' => get_the_post_thumbnail_url($p->ID, 'full') ?: get_post_meta($p->ID, 'featured_media_url', true),
                'title_en' => get_post_meta($p->ID, '_rlc_title_en', true) ?: $p->post_title,
                'content_en' => get_post_meta($p->ID, '_rlc_content_en', true) ?: $p->post_content,
                'date' => $p->post_date
            ];
        }, $posts);
        return new WP_REST_Response($data, 200);
    }

    public function get_public_resources()
    {
        $posts = get_posts(['post_type' => 'recurso', 'post_status' => 'publish', 'posts_per_page' => -1]);
        $data = array_map(function ($p) {
            $terms = wp_get_object_terms($p->ID, 'categoria_recurso', ['fields' => 'ids']);
            $category_ids = is_wp_error($terms) ? [] : array_map('intval', $terms);

            $term_names = wp_get_object_terms($p->ID, 'categoria_recurso', ['fields' => 'names']);
            $category_names = is_wp_error($term_names) ? [] : $term_names;

            return [
                'id' => $p->ID,
                'title' => $p->post_title,
                'content' => $p->post_content,
                'url' => get_post_meta($p->ID, 'rlc_resource_url', true) ?: '',
                'type' => get_post_meta($p->ID, 'rlc_resource_type', true) ?: 'PDF',
                'is_premium' => get_post_meta($p->ID, 'rlc_resource_is_premium', true) === '1' || get_post_meta($p->ID, 'rlc_resource_is_premium', true) === true,
                'categories' => $category_ids,
                'categoria_recurso' => $category_ids,
                'category_names' => $category_names,
                'featured_media_url' => get_the_post_thumbnail_url($p->ID, 'full') ?: get_post_meta($p->ID, 'featured_media_url', true),
                'title_en' => get_post_meta($p->ID, '_rlc_title_en', true) ?: $p->post_title,
                'content_en' => get_post_meta($p->ID, '_rlc_content_en', true) ?: $p->post_content,
                'date' => $p->post_date
            ];
        }, $posts);
        return new WP_REST_Response($data, 200);
    }

    public function create_admin_resource($request)
    {
        $id = wp_insert_post(['post_type' => 'recurso', 'post_title' => $request['title'], 'post_content' => $request['content'], 'post_status' => 'publish']);
        if ($id && !is_wp_error($id)) {
            update_post_meta($id, 'rlc_resource_url', $request['url']);
            update_post_meta($id, 'rlc_resource_type', $request['type']);
            update_post_meta($id, 'rlc_resource_is_premium', $request['is_premium']);
            if (isset($request['categories'])) {
                wp_set_object_terms($id, array_map('intval', (array) $request['categories']), 'categoria_recurso');
            }
            if (isset($request['featured_media_url']))
                update_post_meta($id, 'featured_media_url', $request['featured_media_url']);
            return new WP_REST_Response(['id' => $id], 200);
        }
        return new WP_Error('failed', 'Error al crear recurso', ['status' => 500]);
    }

    public function update_admin_resource($request)
    {
        $id = $request['id'];
        wp_update_post(['ID' => $id, 'post_title' => $request['title'], 'post_content' => $request['content']]);
        update_post_meta($id, 'rlc_resource_url', $request['url']);
        update_post_meta($id, 'rlc_resource_type', $request['type']);
        update_post_meta($id, 'rlc_resource_is_premium', $request['is_premium']);
        if (isset($request['categories'])) {
            wp_set_object_terms($id, array_map('intval', (array) $request['categories']), 'categoria_recurso');
        }
        if (isset($request['featured_media_url']))
            update_post_meta($id, 'featured_media_url', $request['featured_media_url']);
        return new WP_REST_Response(['success' => true], 200);
    }

    public function delete_admin_resource($request)
    {
        wp_delete_post($request['id'], true);
        return new WP_REST_Response(['success' => true], 200);
    }

    /**
     * GESTIÓN DE POSTS (ADMIN)
     */
    public function create_admin_post($request)
    {
        $id = wp_insert_post(['post_type' => 'post', 'post_title' => $request['title'], 'post_content' => $request['content'], 'post_status' => 'publish']);
        if ($id && !is_wp_error($id)) {
            if (isset($request['featured_media_url']))
                update_post_meta($id, 'featured_media_url', $request['featured_media_url']);
            return new WP_REST_Response(['id' => $id], 200);
        }
        return new WP_Error('failed', 'Error al crear entrada', ['status' => 500]);
    }

    public function update_admin_post($request)
    {
        $id = $request['id'];
        wp_update_post(['ID' => $id, 'post_title' => $request['title'], 'post_content' => $request['content']]);
        if (isset($request['featured_media_url']))
            update_post_meta($id, 'featured_media_url', $request['featured_media_url']);
        return new WP_REST_Response(['success' => true], 200);
    }

    public function delete_admin_post($request)
    {
        wp_delete_post($request['id'], true);
        return new WP_REST_Response(['success' => true], 200);
    }

    /**
     * WOOCOMMERCE E INIT
     */
    public function register_user_meta_fields()
    {
        $meta = ['rlc_university', 'rlc_country', 'rlc_position', 'rlc_linkedin', 'rlc_membership_level', 'rlc_status', 'rlc_expiry_date'];
        foreach ($meta as $f)
            register_meta('user', $f, ['type' => 'string', 'single' => true, 'show_in_rest' => true]);
    }

    public function register_product_meta_fields()
    {
        $meta = ['rlc_event_date', 'rlc_event_date_end', 'rlc_event_time', 'rlc_event_location', 'rlc_event_is_featured', 'rlc_event_pretitle', 'rlc_event_subtitle', 'rlc_event_program', 'rlc_event_objectives', 'rlc_event_program_desc', 'rlc_membership_duration'];
        foreach ($meta as $f)
            register_meta('post', $f, ['object_subtype' => 'product', 'type' => 'string', 'single' => true, 'show_in_rest' => true]);
        add_filter('rest_prepare_product', [$this, 'expose_product_event_meta'], 10, 3);
    }

    public function expose_product_event_meta($response, $post, $request)
    {
        $fields = ['rlc_event_date', 'rlc_event_date_end', 'rlc_event_time', 'rlc_event_location', 'rlc_event_pretitle', 'rlc_event_subtitle', 'rlc_event_program', 'rlc_event_objectives', 'rlc_event_program_desc', 'rlc_membership_duration'];
        foreach ($fields as $f)
            $response->data[$f] = get_post_meta($post->ID, $f, true);
        $response->data['rlc_event_is_featured'] = (bool) get_post_meta($post->ID, 'rlc_event_is_featured', true);
        $response->data['title_en'] = get_post_meta($post->ID, '_rlc_title_en', true) ?: $post->post_title;
        $response->data['content_en'] = get_post_meta($post->ID, '_rlc_content_en', true) ?: $post->post_content;
        $response->data['subtitle_en'] = get_post_meta($post->ID, '_rlc_subtitle_en', true) ?: get_post_meta($post->ID, 'rlc_event_subtitle', true);
        $response->data['featured_media_url'] = has_post_thumbnail($post->ID) ? get_the_post_thumbnail_url($post->ID, 'full') : get_post_meta($post->ID, 'featured_media_url', true);
        return $response;
    }

    public function expose_post_image_meta($response, $post, $request)
    {
        $response->data['featured_media_url'] = has_post_thumbnail($post->ID) ? get_the_post_thumbnail_url($post->ID, 'full') : get_post_meta($post->ID, 'featured_media_url', true);
        $response->data['title_en'] = get_post_meta($post->ID, '_rlc_title_en', true) ?: $post->post_title;
        $response->data['content_en'] = get_post_meta($post->ID, '_rlc_content_en', true) ?: $post->post_content;
        return $response;
    }

    public function save_checkout_fields_to_order($order_id)
    {
        $fields = ['rlc_university', 'rlc_country', 'rlc_position', 'rlc_linkedin'];
        foreach ($fields as $field)
            if (!empty($_POST[$field]))
                update_post_meta($order_id, '_' . $field, sanitize_text_field($_POST[$field]));
    }

    public function handle_membership_purchase($order_id)
    {
        $order = wc_get_order($order_id);
        $uid = $order->get_user_id();
        if (!$uid)
            return;

        foreach ($order->get_items() as $item) {
            $product_id = $item->get_product_id();
            $name = strtolower($item->get_name());
            $level = (strpos($name, 'oro') !== false) ? 'Oro' : ((strpos($name, 'plata') !== false) ? 'Plata' : ((strpos($name, 'bronce') !== false) ? 'Bronce' : ''));

            if ($level) {
                $duration_months = get_post_meta($product_id, 'rlc_membership_duration', true) ?: '12';
                $expiry_date = date('Y-m-d', strtotime("+$duration_months months"));

                update_user_meta($uid, 'rlc_membership_level', $level);
                update_user_meta($uid, 'rlc_status', 'active');
                update_user_meta($uid, 'rlc_expiry_date', $expiry_date);
                foreach (['rlc_university', 'rlc_country', 'rlc_position', 'rlc_linkedin'] as $m) {
                    $val = $order->get_meta('_' . $m);
                    if ($val)
                        update_user_meta($uid, $m, $val);
                }
            }
        }
    }

    public function check_expirations()
    {
        $users = get_users(['meta_query' => [['key' => 'rlc_expiry_date', 'value' => date('Y-m-d'), 'compare' => '<=', 'type' => 'DATE'], ['key' => 'rlc_status', 'value' => 'active', 'compare' => '=']]]);
        foreach ($users as $u)
            update_user_meta($u->ID, 'rlc_status', 'expired');
    }

    public function add_admin_menu()
    {
        add_menu_page('RLC Membresías', 'RLC Membresías', 'manage_options', 'rlc-admin', [$this, 'admin_page_html'], 'dashicons-groups', 6);
    }

    public function admin_page_html()
    {
        // Procesar Formulario Manual
        if (isset($_POST['rlc_save_manual']) && check_admin_referer('rlc_manual_action')) {
            $u_id = intval($_POST['user_id']);
            update_user_meta($u_id, 'rlc_membership_level', sanitize_text_field($_POST['level']));
            update_user_meta($u_id, 'rlc_status', sanitize_text_field($_POST['status']));
            update_user_meta($u_id, 'rlc_expiry_date', sanitize_text_field($_POST['expiry']));
            echo '<div class="updated"><p>Usuario actualizado correctamente.</p></div>';
        }

        $members = get_users(['meta_query' => [['key' => 'rlc_status', 'compare' => 'EXISTS']]]);
        $all_users = get_users(['fields' => ['ID', 'display_name', 'user_email']]);
        ?>
        <div class="wrap">
            <h1 style="color: #1D3E51;">Gestión de Membresías RLC (Escritorio)</h1>

            <!-- Herramientas Globales -->
            <div
                style="background: #eef7ff; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #c2e1ff;">
                <h3 style="margin-top: 0;">Herramientas de Traducción AI (Polylang Style)</h3>
                <p>Usa esta herramienta para traducir <strong>todo</strong> el contenido existente (Blog, Recursos, Eventos) al
                    inglés de una sola vez.</p>
                <button id="rlc_bulk_btn" class="button button-secondary" onclick="runBulkTranslate()">Traducción Masiva de
                    Contenido</button>
                <span id="rlc_bulk_status" style="margin-left: 15px; font-weight: bold;"></span>
            </div>

            <div style="display: flex; gap: 20px;">
                <div style="flex: 2;">
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Nivel</th>
                                <th>Estado</th>
                                <th>Vencimiento</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($members as $m): ?>
                                <tr>
                                    <td><strong><?php echo $m->display_name; ?></strong></td>
                                    <td><?php echo get_user_meta($m->ID, 'rlc_membership_level', true); ?></td>
                                    <td><?php echo strtoupper(get_user_meta($m->ID, 'rlc_status', true)); ?></td>
                                    <td><?php echo get_user_meta($m->ID, 'rlc_expiry_date', true); ?></td>
                                    <td><button class="button"
                                            onclick="loadUser('<?php echo $m->ID; ?>', '<?php echo get_user_meta($m->ID, 'rlc_membership_level', true); ?>', '<?php echo get_user_meta($m->ID, 'rlc_status', true); ?>', '<?php echo get_user_meta($m->ID, 'rlc_expiry_date', true); ?>')">Editar</button>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                <div style="flex: 1; background: #fff; padding: 20px; border: 1px solid #ccc;">
                    <h3>Asignación Manual</h3>
                    <form method="post">
                        <?php wp_nonce_field('rlc_manual_action'); ?>
                        <label>Usuario:</label>
                        <select name="user_id" id="f_user" style="width:100%" required>
                            <?php foreach ($all_users as $au): ?>
                                <option value="<?php echo $au->ID; ?>"><?php echo $au->display_name; ?></option>
                            <?php endforeach; ?>
                        </select><br><br>
                        <label>Nivel:</label>
                        <select name="level" id="f_level" style="width:100%">
                            <option value="Oro">Oro</option>
                            <option value="Plata">Plata</option>
                            <option value="Bronce">Bronce</option>
                        </select><br><br>
                        <label>Estado:</label>
                        <select name="status" id="f_status" style="width:100%">
                            <option value="active">Activo</option>
                            <option value="expired">Vencido</option>
                            <option value="pending">Pendiente</option>
                        </select><br><br>
                        <label>Vencimiento:</label>
                        <input type="date" name="expiry" id="f_expiry" style="width:100%" required><br><br>
                        <input type="submit" name="rlc_save_manual" class="button button-primary" value="Guardar Cambios">
                    </form>
                </div>
            </div>
        </div>
        <script>
            function loadUser(id, level, status, expiry) { document.getElementById('f_user').value = id; document.getElementById('f_level').value = level; document.getElementById('f_status').value = status; document.getElementById('f_expiry').value = expiry; }

            async function runBulkTranslate() {
                const btn = document.getElementById('rlc_bulk_btn');
                const status = document.getElementById('rlc_bulk_status');
                if (!confirm('Esto traducirá todo el contenido existente. ¿Continuar?')) return;

                btn.disabled = true;
                status.innerText = 'Traduciendo... (Esto puede tardar varios minutos)';

                try {
                    const response = await fetch('<?php echo rest_url("rlc/v1/admin/translate-all"); ?>', {
                        method: 'POST',
                        headers: { 'X-WP-Nonce': '<?php echo wp_create_nonce("wp_rest"); ?>' }
                    });
                    const data = await response.json();
                    status.innerText = '¡Completado! ' + data.translated + ' elementos procesados.';
                } catch (e) {
                    status.innerText = 'Error en la traducción masiva.';
                    console.error(e);
                } finally {
                    btn.disabled = false;
                }
            }
        </script>
        <?php
    }

    public function register_resource_cpt()
    {
        register_post_type('recurso', [
            'labels' => ['name' => 'Recursos', 'singular_name' => 'Recurso'],
            'public' => true,
            'show_in_rest' => true,
            'rest_base' => 'recurso',
            'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
            'menu_icon' => 'dashicons-media-document',
            'taxonomies' => ['categoria_resource']
        ]);
        register_post_meta('recurso', 'rlc_resource_url', ['type' => 'string', 'single' => true, 'show_in_rest' => true]);
        register_post_meta('recurso', 'rlc_resource_type', ['type' => 'string', 'single' => true, 'show_in_rest' => true]);
        register_post_meta('recurso', 'rlc_resource_is_premium', ['type' => 'boolean', 'single' => true, 'show_in_rest' => true]);
    }

    public function register_resource_taxonomy()
    {
        register_taxonomy('categoria_recurso', 'recurso', [
            'labels' => [
                'name' => 'Categorías de Recurso',
                'singular_name' => 'Categoría de Recurso',
                'menu_name' => 'Categorías',
            ],
            'hierarchical' => true,
            'show_in_rest' => true,
            'rest_base' => 'categoria_recurso',
            'public' => true,
            'show_ui' => true,
            'show_admin_column' => true,
            'query_var' => true,
            'rewrite' => ['slug' => 'categoria-recurso'],
        ]);
    }

    public function maybe_flush_rewrites()
    {
        if (get_option('rlc_flush_rewrites_v2')) {
            return;
        }
        flush_rewrite_rules();
        update_option('rlc_flush_rewrites_v2', true);
    }

    public function seed_data()
    {
        // 1. Crear Categorías si no existen
        $cats = ['MANUALES', 'GUÍAS', 'PLANTILLAS', 'CONGRESOS'];
        $cat_map = [];
        foreach ($cats as $c) {
            $term = get_term_by('name', $c, 'categoria_recurso');
            if (!$term) {
                $inserted = wp_insert_term($c, 'categoria_recurso');
                $cat_map[$c] = is_wp_error($inserted) ? 0 : $inserted['term_id'];
            } else {
                $cat_map[$c] = $term->term_id;
            }
        }

        // 2. Definir Recursos de Ejemplo
        $resources = [
            [
                'title' => 'Manual de Buenas Prácticas 5',
                'type' => 'Video',
                'url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'is_premium' => true,
                'cat' => 'MANUALES'
            ],
            [
                'title' => 'Rúbrica de Evaluación Intercultural',
                'type' => 'XLSX',
                'url' => 'https://docs.google.com/spreadsheets/d/1_yK7d1G...',
                'is_premium' => true,
                'cat' => 'GUÍAS'
            ],
            [
                'title' => 'Guía de Rompehielos Virtuales',
                'type' => 'PDF',
                'url' => 'https://example.com/guia.pdf',
                'is_premium' => false,
                'cat' => 'GUÍAS'
            ],
            [
                'title' => 'Plantilla de Sílabo COIL',
                'type' => 'DOCX',
                'url' => 'https://example.com/plantilla.docx',
                'is_premium' => false,
                'cat' => 'PLANTILLAS'
            ],
            [
                'title' => 'Metodologías Activas y COIL',
                'type' => 'Video',
                'url' => 'https://www.youtube.com/embed/ScMzIvxBSi4',
                'is_premium' => true,
                'cat' => 'MANUALES'
            ]
        ];

        $created_recursos = 0;
        foreach ($resources as $r) {
            // Evitar duplicados por título (solo si están publicados o en borrador)
            $existing = get_posts([
                'post_type' => 'recurso',
                'post_title' => $r['title'],
                'post_status' => 'any',
                'posts_per_page' => 1
            ]);

            if (empty($existing)) {
                $id = wp_insert_post([
                    'post_type' => 'recurso',
                    'post_title' => $r['title'],
                    'post_status' => 'publish',
                    'post_content' => 'Contenido de ejemplo para ' . $r['title']
                ]);

                if ($id && !is_wp_error($id)) {
                    update_post_meta($id, 'rlc_resource_url', $r['url']);
                    update_post_meta($id, 'rlc_resource_type', $r['type']);
                    update_post_meta($id, 'rlc_resource_is_premium', $r['is_premium'] ? '1' : '0');
                    if (isset($cat_map[$r['cat']]) && $cat_map[$r['cat']]) {
                        wp_set_object_terms($id, [(int) $cat_map[$r['cat']]], 'categoria_recurso');
                    }
                    $created_recursos++;
                }
            }
        }

        return new WP_REST_Response([
            'message' => 'Seeding completed successfully',
            'details' => [
                'resources_created' => $created_recursos,
                'events_created' => 0,
                'user_id' => get_current_user_id()
            ]
        ], 200);
    }

    /**
     * GESTIÓN DE CONFIGURACIÓN WEB
     */
    public function get_web_settings()
    {
        $settings = get_option('rlc_web_settings', []);

        // Valores por defecto si no existen
        if (empty($settings)) {
            $settings = [
                'hero' => [
                    'title' => 'Conectando aulas, transformando el mundo.',
                    'subtitle' => 'Líderes en Aprendizaje Colaborativo Internacional en Línea (COIL).',
                    'cta_text' => 'Solicitar Membresía',
                    'bg_image' => 'https://images.unsplash.com/photo-1523240715181-2f0f9f224a49?auto=format&fit=crop&w=1600'
                ],
                'stats' => [
                    ['value' => '+150', 'label' => 'UNIVERSIDADES'],
                    ['value' => '+5,000', 'label' => 'ESTUDIANTES'],
                    ['value' => '+12', 'label' => 'PAÍSES'],
                    ['value' => '+300', 'label' => 'PROYECTOS COIL']
                ],
                'team' => [
                    ['name' => 'Coord. General', 'role' => 'Consejo Directivo', 'inst' => 'Universidad Veracruzana', 'icon' => 'person_filled', 'visible' => true],
                    ['name' => 'Rep. México', 'role' => 'Consejo Regional', 'inst' => 'Inst. Tecnológico de Monterrey', 'icon' => 'person', 'visible' => true]
                ]
            ];
        }

        return new WP_REST_Response([
            'settings' => $settings,
            'mirror_en' => get_option('rlc_web_settings_en', [])
        ], 200);
    }

    public function update_web_settings($request)
    {
        $params = $request->get_json_params();
        if (empty($params)) {
            return new WP_Error('invalid_data', 'No se recibieron datos', ['status' => 400]);
        }

        // Si los datos vienen dentro de una clave 'settings', los extraemos
        $settings_to_save = isset($params['settings']) ? $params['settings'] : $params;

        update_option('rlc_web_settings', $settings_to_save);

        // Generar Mirror Traducido solo si hay cambios en texto
        $mirror = $settings_to_save;
        if (isset($mirror['hero'])) {
            $mirror['hero']['title'] = $this->translate_with_gemini($mirror['hero']['title']);
            $mirror['hero']['subtitle'] = $this->translate_with_gemini($mirror['hero']['subtitle']);
        }
        if (isset($mirror['stats'])) {
            foreach ($mirror['stats'] as &$stat) {
                $stat['label'] = $this->translate_with_gemini($stat['label']);
            }
        }
        update_option('rlc_web_settings_en', $mirror);

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Configuración actualizada correctamente',
            'data' => $settings_to_save
        ], 200);
    }

    /**
     * AI TRANSLATION LOGIC (MIRROR)
     */
    public function translate_with_gemini($text, $target_lang = 'English')
    {
        if (empty($text) || trim($text) === '')
            return $text;

        $api_key = 'AIzaSyAkfDJNMZWzE9yZY3FsDERDPo5QlnJtJmA';
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$api_key";

        $prompt = "Translate the following text to $target_lang. Keep HTML tags intact. Tone: Professional/Academic. Do NOT return anything other than the translation.\n\n$text";

        $response = wp_remote_post($url, [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => json_encode([
                'contents' => [['parts' => [['text' => $prompt]]]]
            ]),
            'timeout' => 30
        ]);

        if (is_wp_error($response))
            return $text;

        $body = json_decode(wp_remote_retrieve_body($response), true);
        $translated = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';

        return !empty($translated) ? trim($translated) : $text;
    }

    public function handle_post_translation_sync($post_id, $post, $update)
    {
        // Avoid infinite loop and auto-drafts
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
            return;
        if ($post->post_status === 'auto-draft')
            return;
        if (!in_array($post->post_type, ['post', 'recurso', 'product']))
            return;

        // Prevent recursion
        remove_action('save_post', [$this, 'handle_post_translation_sync'], 20);

        $title = $post->post_title;
        $content = $post->post_content;

        // Check if content actually changed to avoid unnecessary API calls
        $last_title = get_post_meta($post_id, '_rlc_last_translated_title', true);
        $last_content = get_post_meta($post_id, '_rlc_last_translated_content', true);

        if ($title !== $last_title || $content !== $last_content) {
            $title_en = $this->translate_with_gemini($title);
            $content_en = $this->translate_with_gemini($content);

            update_post_meta($post_id, '_rlc_title_en', $title_en);
            update_post_meta($post_id, '_rlc_content_en', $content_en);
            update_post_meta($post_id, '_rlc_last_translated_title', $title);
            update_post_meta($post_id, '_rlc_last_translated_content', $content);

            // Special fields for products (subtitle)
            if ($post->post_type === 'product') {
                $subtitle = get_post_meta($post_id, 'rlc_event_subtitle', true);
                if ($subtitle) {
                    $subtitle_en = $this->translate_with_gemini($subtitle);
                    update_post_meta($post_id, '_rlc_subtitle_en', $subtitle_en);
                }
            }
        }

        add_action('save_post', [$this, 'handle_post_translation_sync'], 20, 3);
    }

    /**
     * BULK TRANSLATION LOGIC
     */
    public function bulk_translate_content()
    {
        $post_types = ['post', 'recurso', 'product'];
        $count = 0;

        foreach ($post_types as $type) {
            $posts = get_posts([
                'post_type' => $type,
                'post_status' => 'any',
                'posts_per_page' => -1
            ]);

            foreach ($posts as $p) {
                // Trigger the sync manually
                $this->handle_post_translation_sync($p->ID, $p, true);
                $count++;
            }
        }

        return new WP_REST_Response(['translated' => $count], 200);
    }

    /**
     * AI PROXY - Llama a Gemini desde el servidor (key segura en wp-config.php)
     * Requiere: define('RLC_GEMINI_API_KEY', 'tu-key-aqui'); en wp-config.php
     */
    public function handle_ai_generate($request)
    {
        // Leer key desde la base de datos (wp_options)
        $api_key = get_option('rlc_gemini_api_key', '');
        if (empty($api_key)) {
            return new WP_REST_Response([
                'message' => 'API key de Gemini no configurada en la base de datos'
            ], 500);
        }

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $prompt = isset($params['prompt']) ? $params['prompt'] : '';
        if (empty($prompt)) {
            return new WP_REST_Response(['message' => 'Prompt requerido'], 400);
        }

        $model = isset($params['model']) ? $params['model'] : 'gemini-3-flash-preview';
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$api_key}";

        $body = json_encode([
            'contents' => [
                ['parts' => [['text' => $prompt]]]
            ]
        ]);

        $response = wp_remote_post($url, [
            'timeout' => 60,
            'headers' => ['Content-Type' => 'application/json'],
            'body' => $body
        ]);

        if (is_wp_error($response)) {
            return new WP_REST_Response([
                'message' => 'Error al conectar con Gemini: ' . $response->get_error_message()
            ], 502);
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $response_body = json_decode(wp_remote_retrieve_body($response), true);

        if ($status_code !== 200) {
            return new WP_REST_Response([
                'message' => 'Error de Gemini API',
                'status' => $status_code,
                'details' => $response_body
            ], $status_code);
        }

        return new WP_REST_Response($response_body, 200);
    }
}

new RLC_Membership_Core();