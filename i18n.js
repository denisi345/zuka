/**
 * ZUKA Super App - Internationalization Engine (i18n.js)
 * DEFAULT Language: English (US)
 * Supported Languages: English (US), Kiswahili, Français, Español, العربية
 * Instant in-memory and DOM translation with persistent user preference.
 */

const ZUKA_TRANSLATIONS = {
    en: {
        // App Core & Nav
        app_tagline: "ZUKA helps you connect, buy, watch, and share with the people in your life.",
        search_placeholder: "Search ZUKA...",
        nav_feed: "Home",
        nav_watch: "Watch",
        nav_marketplace: "Marketplace",
        nav_groups: "Groups",
        nav_gaming: "Gaming",
        btn_go_live: "Go Live",
        badge_ai_active: "AI Moderation Active",
        title_messenger: "Messenger",
        title_notifications: "Notifications",
        title_profile_menu: "Your Profile",
        view_your_profile: "View your profile",

        // Left Sidebar
        menu_friends: "Friends",
        menu_groups: "Groups",
        menu_marketplace: "Marketplace",
        menu_watch: "Watch & Video",
        menu_reels: "ZUKA Reels",
        menu_memories: "Memories",
        menu_saved: "Saved",
        menu_pages: "Pages",
        menu_events: "Events",
        menu_dating: "ZUKA Dating",
        menu_jobs: "Jobs",
        menu_fundraiser: "Fundraisers",
        menu_ads: "Ads Manager",
        menu_settings: "Settings & Privacy",
        menu_language: "Language",
        creator_mode_title: "Creator Mode",
        creator_mode_active: "Active",
        stars_balance: "Stars Balance",
        btn_buy_stars: "Buy Stars / Cash Out",

        // Stories & Create Post
        story_create_title: "Create story",
        story_share_photo: "Share a photo or write something.",
        whats_on_your_mind: "What's on your mind, {name}?",
        btn_live_video: "Live video",
        btn_photo_video: "Photo/video",
        btn_feeling_activity: "Feeling/activity",
        create_post_modal_title: "Create post",
        privacy_public: "🌍 Public",
        privacy_friends: "👥 Friends",
        privacy_only_me: "🔒 Only me",
        post_textarea_placeholder: "What's on your mind? Share your thoughts...",
        btn_ai_write: "✨ ZUKA AI Writing Assistant",
        add_to_post: "Add to your post:",
        btn_post_submit: "Post",
        posting_anonymous: "Anonymous Member 👤",

        // Post Card Actions
        post_action_like: "Like",
        post_action_comment: "Comment",
        post_action_share: "Share",
        post_action_stars: "Send Stars",
        post_comments_count: "{count} comments",
        post_shares_count: "{count} shares",
        write_comment_placeholder: "Write a respectful comment...",
        btn_send_comment: "Send",
        poll_total_votes: "Total votes: {count}",

        // Right Sidebar
        sidebar_sponsored: "Sponsored",
        sidebar_create_ad: "Create Ad",
        sidebar_contacts: "Contacts (Messenger)",
        chat_online: "Active now",
        chat_offline: "Offline",
        chat_input_placeholder: "Type a message...",
        btn_zuka_pay: "Send Money (ZUKA Pay)",

        // Notifications
        notifications_title: "Notifications",
        btn_mark_all_read: "Mark all as read",
        notif_empty: "No new notifications",

        // Dropdown Menu
        menu_dark_mode: "Dark mode",
        menu_bluetick: "Request Blue Tick Verification",
        menu_logout: "Log Out",
        menu_switch_lang: "Language",

        // Language Selector Modal
        lang_modal_title: "Select Your Language",
        lang_modal_subtitle: "Choose your preferred language for the ZUKA interface.",
        btn_save_language: "Save Language",
        btn_cancel: "Cancel",

        // Login & Landing Page (index.html)
        login_header_tagline: "ZUKA helps you connect, buy, watch, and share with the people in your life.",
        login_input_identifier: "Email or phone number",
        login_input_password: "Password",
        btn_login: "Log In",
        link_forgot_password: "Forgot password?",
        btn_demo_entry: "Enter ZUKA Directly (Demo Mode)",
        btn_create_account: "Create new account",
        create_page_notice: "Create a Page for a celebrity, brand or business.",
        signup_modal_title: "Sign Up",
        signup_modal_subtitle: "It's quick and easy.",
        reg_full_name: "Full Name",
        reg_username: "Username (e.g. john_doe)",
        reg_email: "Email address",
        reg_phone: "Mobile phone number",
        reg_password: "New password",
        signup_terms_notice: "By clicking Sign Up, you agree to our ZUKA Terms and Community AI Moderation Standards.",
        btn_signup_submit: "Sign Up",

        // Watch, Marketplace, Groups, Reels tabs
        watch_header: "📺 ZUKA Watch & Video Hub",
        watch_all: "All",
        watch_sports: "Sports",
        watch_documentary: "Documentaries",
        mkt_header: "🏪 ZUKA Marketplace",
        mkt_subtitle: "Buy and sell items with trusted people locally and across Tanzania",
        mkt_sell_btn: "+ Sell Something",
        mkt_msg_seller: "Message",
        mkt_make_offer: "Make Offer",
        groups_header: "🏛️ ZUKA Groups",
        groups_subtitle: "Join communities of people who share your passions and goals",
        groups_create_btn: "+ Create New Group",
        groups_join_btn: "Join Group",
        groups_joined_btn: "Joined ✓",
        groups_chat_btn: "💬 Group Chat",
        reels_header: "🎬 ZUKA Reels",
        reels_create_btn: "+ Create Reel",

        // Profile & Settings
        profile_edit_bio: "Edit Profile",
        profile_lock: "🔒 Lock Profile",
        profile_unlock: "🔓 Unlock Profile",
        profile_followers: "{count} Followers",
        profile_following: "{count} Following",
        settings_title: "⚙️ Account Settings",
        settings_dark_mode_desc: "Adjust the appearance of ZUKA to reduce glare",
        settings_lang_title: "Language",
        settings_lang_desc: "Select your preferred language",
        settings_news_pref_title: "News Preferences",
        settings_news_pref_desc: "Choose topics you want to see in your Feed from BBC, CNN, Azam TV, TBC, and ITV:",
        settings_delete_account: "Delete My Account",
        settings_delete_desc: "Permanently delete your profile and all associated data"
    },

    sw: {
        // App Core & Nav
        app_tagline: "ZUKA inakusaidia kuungana, kuuza, kutazama na kushirikiana na watu katika maisha yako.",
        search_placeholder: "Tafuta ZUKA...",
        nav_feed: "Nyumbani",
        nav_watch: "Watch",
        nav_marketplace: "Soko",
        nav_groups: "Vikundi",
        nav_gaming: "Michezo",
        btn_go_live: "Anza Live",
        badge_ai_active: "AI Moderation Inafanya Kazi",
        title_messenger: "Messenger",
        title_notifications: "Notifications",
        title_profile_menu: "Your Profile",
        view_your_profile: "View your profile",

        // Left Sidebar
        menu_friends: "Friends",
        menu_groups: "Groups",
        menu_marketplace: "Marketplace",
        menu_watch: "Watch & Video",
        menu_reels: "ZUKA Reels",
        menu_memories: "Memories",
        menu_saved: "Saved",
        menu_pages: "Pages",
        menu_events: "Events",
        menu_dating: "ZUKA Dating",
        menu_jobs: "Jobs",
        menu_fundraiser: "Fundraisers",
        menu_ads: "Ads Manager",
        menu_settings: "Settings",
        menu_language: "Language",
        creator_mode_title: "Creator Mode",
        creator_mode_active: "Active",
        stars_balance: "Stars Balance",
        btn_buy_stars: "Buy Stars",

        // Stories & Create Post
        story_create_title: "Create story",
        story_share_photo: "Share a photo or video.",
        whats_on_your_mind: "What's on your mind, {name}?",
        btn_live_video: "Live video",
        btn_photo_video: "Photo/video",
        btn_feeling_activity: "Feeling/activity",
        create_post_modal_title: "Create post",
        privacy_public: "🌍 Public",
        privacy_friends: "👥 Friends",
        privacy_only_me: "🔒 Only me",
        post_textarea_placeholder: "What's on your mind? Share your thoughts...",
        btn_ai_write: "✨ ZUKA AI Writing Assistant",
        add_to_post: "Add to your post:",
        btn_post_submit: "Post",
        posting_anonymous: "Anonymous Member 👤",

        // Post Card Actions
        post_action_like: "Like",
        post_action_comment: "Comments",
        post_action_share: "Share",
        post_action_stars: "Send Stars",
        post_comments_count: "{count} Comments",
        post_shares_count: "{count} Shares",
        write_comment_placeholder: "Andika maoni ya heshima...",
        btn_send_comment: "Tuma",
        poll_total_votes: "Jumla ya kura: {count}",

        // Right Sidebar
        sidebar_sponsored: "Matangazo ya ZUKA",
        sidebar_create_ad: "Unda Tangazo",
        sidebar_contacts: "Mawasiliano (Messenger)",
        chat_online: "Mtandaoni",
        chat_offline: "Nje ya mtandao",
        chat_input_placeholder: "Andika ujumbe...",
        btn_zuka_pay: "Tuma Pesa (ZUKA Pay)",

        // Notifications
        notifications_title: "Taarifa Mpya",
        btn_mark_all_read: "Soma Zote",
        notif_empty: "Hakuna taarifa mpya kwa sasa",

        // Dropdown Menu
        menu_dark_mode: "Hali ya Giza (Dark Mode)",
        menu_bluetick: "Omba Blue Tick (Verification)",
        menu_logout: "Toka kwenye Akaunti (Log Out)",
        menu_switch_lang: "Badili Lugha",

        // Language Selector Modal
        lang_modal_title: "Chagua Lugha Yako",
        lang_modal_subtitle: "Chagua lugha unayopendelea kutumia kwenye mtandao wa ZUKA.",
        btn_save_language: "Hifadhi Lugha",
        btn_cancel: "Ghairi",

        // Login & Landing Page
        login_header_tagline: "ZUKA inakusaidia kuungana, kuuza, kutazama na kushirikiana na watu katika maisha yako.",
        login_input_identifier: "Barua pepe au nambari ya simu",
        login_input_password: "Nenosiri (Password)",
        btn_login: "Ingia (Log In)",
        link_forgot_password: "Umesahau nenosiri?",
        btn_demo_entry: "Ingia Moja kwa Moja kwenye ZUKA (Demo Mode)",
        btn_create_account: "Unda Akaunti Mpya ya ZUKA",
        create_page_notice: "Unda Ukurasa kwa ajili ya mtu mashuhuri, bendi au biashara.",
        signup_modal_title: "Jisajili ZUKA",
        signup_modal_subtitle: "Ni haraka na rahisi sana.",
        reg_full_name: "Jina Kamili",
        reg_username: "Jina la Utani (Username)",
        reg_email: "Barua Pepe",
        reg_phone: "Namba ya Simu",
        reg_password: "Nenosiri Jipya",
        signup_terms_notice: "Kwa kubofya Jisajili, unakubali Sheria na Masharti yetu ya ZUKA na Sera ya AI Moderation.",
        btn_signup_submit: "Kamilisha Usajili",

        // Watch, Marketplace, Groups, Reels tabs
        watch_header: "📺 ZUKA Watch & Video Hub",
        watch_all: "Zote",
        watch_sports: "Michezo",
        watch_documentary: "Makala",
        mkt_header: "🏪 Soko la ZUKA (Marketplace)",
        mkt_subtitle: "Nunua na uuze bidhaa kwa usalama kote Tanzania",
        mkt_sell_btn: "+ Uza Kitu (Sell)",
        mkt_msg_seller: "Tuma Ujumbe",
        mkt_make_offer: "Ofa",
        groups_header: "🏛️ Vikundi vya ZUKA (Groups)",
        groups_subtitle: "Jiunge na jamii za watu wenye mapenzi na malengo sawa",
        groups_create_btn: "+ Unda Kundi Jipya",
        groups_join_btn: "Jiunge na Kundi",
        groups_joined_btn: "Umejiunga ✓",
        groups_chat_btn: "💬 Soga ya Kundi",
        reels_header: "🎬 ZUKA Reels",
        reels_create_btn: "+ Unda Reel",

        // Profile & Settings
        profile_edit_bio: "Hariri Wasifu",
        profile_lock: "🔒 Funga Profile",
        profile_unlock: "🔓 Fungua Profile",
        profile_followers: "Wafuasi {count}",
        profile_following: "Wanaofuatwa {count}",
        settings_title: "⚙️ Mipangilio ya Akaunti",
        settings_dark_mode_desc: "Washa au zima muonekano wa giza",
        settings_lang_title: "Lugha",
        settings_lang_desc: "Chagua lugha unayopendelea",
        settings_news_pref_title: "Vipengele vya Habari Unavyopendelea",
        settings_news_pref_desc: "Chagua mada unazotaka kuona kwenye Feed kutoka BBC, CNN, Azam TV, TBC, ITV:",
        settings_delete_account: "Futa Akaunti Yangu",
        settings_delete_desc: "Ondoa taarifa zako zote na akaunti yako kabisa"
    },

    fr: {
        // App Core & Nav
        app_tagline: "ZUKA vous aide à vous connecter et à partager avec les personnes qui comptent pour vous.",
        search_placeholder: "Rechercher sur ZUKA...",
        nav_feed: "Accueil",
        nav_watch: "Watch",
        nav_marketplace: "Marketplace",
        nav_groups: "Groupes",
        nav_gaming: "Jeux",
        btn_go_live: "En direct",
        badge_ai_active: "Modération IA Active",
        title_messenger: "Messenger",
        title_notifications: "Notifications",
        title_profile_menu: "Votre profil",
        view_your_profile: "Voir votre profil",

        // Left Sidebar
        menu_friends: "Amis",
        menu_groups: "Groupes",
        menu_marketplace: "Marketplace",
        menu_watch: "Vidéos et Watch",
        menu_reels: "ZUKA Reels",
        menu_memories: "Souvenirs",
        menu_saved: "Enregistrements",
        menu_pages: "Pages",
        menu_events: "Événements",
        menu_dating: "ZUKA Rencontres",
        menu_jobs: "Emplois",
        menu_fundraiser: "Collectes de fonds",
        menu_ads: "Gestionnaire de publicités",
        menu_settings: "Paramètres et confidentialité",
        menu_language: "Langue",
        creator_mode_title: "Mode Créateur",
        creator_mode_active: "Actif",
        stars_balance: "Solde d'étoiles",
        btn_buy_stars: "Acheter des étoiles",

        // Stories & Create Post
        story_create_title: "Créer une story",
        story_share_photo: "Partagez une photo ou écrivez un message.",
        whats_on_your_mind: "Quoi de neuf, {name} ?",
        btn_live_video: "Vidéo en direct",
        btn_photo_video: "Photo/vidéo",
        btn_feeling_activity: "Humeur/activité",
        create_post_modal_title: "Créer une publication",
        privacy_public: "🌍 Public",
        privacy_friends: "👥 Amis",
        privacy_only_me: "🔒 Moi uniquement",
        post_textarea_placeholder: "Quoi de neuf ? Exprimez-vous...",
        btn_ai_write: "✨ Assistant de rédaction IA ZUKA",
        add_to_post: "Ajouter à votre publication :",
        btn_post_submit: "Publier",
        posting_anonymous: "Membre anonyme 👤",

        // Post Card Actions
        post_action_like: "J'aime",
        post_action_comment: "Commenter",
        post_action_share: "Partager",
        post_action_stars: "Envoyer des étoiles",
        post_comments_count: "{count} commentaires",
        post_shares_count: "{count} partages",
        write_comment_placeholder: "Écrivez un commentaire respectueux...",
        btn_send_comment: "Envoyer",
        poll_total_votes: "Total des votes : {count}",

        // Right Sidebar
        sidebar_sponsored: "Sponsorisé",
        sidebar_create_ad: "Créer une pub",
        sidebar_contacts: "Contacts (Messenger)",
        chat_online: "En ligne",
        chat_offline: "Hors ligne",
        chat_input_placeholder: "Écrivez un message...",
        btn_zuka_pay: "Envoyer de l'argent (ZUKA Pay)",

        // Notifications
        notifications_title: "Notifications",
        btn_mark_all_read: "Tout marquer comme lu",
        notif_empty: "Aucune nouvelle notification",

        // Dropdown Menu
        menu_dark_mode: "Mode sombre",
        menu_bluetick: "Demander le badge vérifié",
        menu_logout: "Se déconnecter",
        menu_switch_lang: "Changer de langue",

        // Language Selector Modal
        lang_modal_title: "Sélectionnez votre langue",
        lang_modal_subtitle: "Choisissez la langue d'affichage pour l'application ZUKA.",
        btn_save_language: "Enregistrer la langue",
        btn_cancel: "Annuler",

        // Login & Landing Page
        login_header_tagline: "ZUKA vous aide à vous connecter et à partager avec les personnes qui comptent pour vous.",
        login_input_identifier: "Numéro de mobile ou e-mail",
        login_input_password: "Mot de passe",
        btn_login: "Se connecter",
        link_forgot_password: "Mot de passe oublié ?",
        btn_demo_entry: "Accéder directement à ZUKA (Mode Démo)",
        btn_create_account: "Créer nouveau compte",
        create_page_notice: "Créer une Page pour une célébrité, une marque ou une entreprise.",
        signup_modal_title: "S'inscrire",
        signup_modal_subtitle: "C'est rapide et facile.",
        reg_full_name: "Nom complet",
        reg_username: "Nom d'utilisateur",
        reg_email: "Adresse e-mail",
        reg_phone: "Numéro de téléphone",
        reg_password: "Nouveau mot de passe",
        signup_terms_notice: "En cliquant sur S'inscrire, vous acceptez nos Conditions générales de ZUKA.",
        btn_signup_submit: "S'inscrire",

        // Watch, Marketplace, Groups, Reels tabs
        watch_header: "📺 ZUKA Watch & Vidéos",
        watch_all: "Toutes",
        watch_sports: "Sports",
        watch_documentary: "Documentaires",
        mkt_header: "🏪 ZUKA Marketplace",
        mkt_subtitle: "Achetez et vendez facilement et en toute sécurité",
        mkt_sell_btn: "+ Vendre un article",
        mkt_msg_seller: "Envoyer message",
        mkt_make_offer: "Faire une offre",
        groups_header: "🏛️ Groupes ZUKA",
        groups_subtitle: "Rejoignez des communautés partageant vos centres d'intérêt",
        groups_create_btn: "+ Créer un groupe",
        groups_join_btn: "Rejoindre",
        groups_joined_btn: "Membre ✓",
        groups_chat_btn: "💬 Discussion de groupe",
        reels_header: "🎬 ZUKA Reels",
        reels_create_btn: "+ Créer un Reel",

        // Profile & Settings
        profile_edit_bio: "Modifier le profil",
        profile_lock: "🔒 Verrouiller le profil",
        profile_unlock: "🔓 Déverrouiller le profil",
        profile_followers: "{count} Abonnés",
        profile_following: "{count} Abonnements",
        settings_title: "⚙️ Paramètres du compte",
        settings_dark_mode_desc: "Ajuster l'apparence de l'interface",
        settings_lang_title: "Langue",
        settings_lang_desc: "Sélectionnez votre langue préférée",
        settings_news_pref_title: "Préférences d'actualités",
        settings_news_pref_desc: "Choisissez vos catégories d'actualités dans votre fil d'actualité :",
        settings_delete_account: "Supprimer mon compte",
        settings_delete_desc: "Supprimer définitivement votre compte et vos données"
    },

    es: {
        // App Core & Nav
        app_tagline: "ZUKA te ayuda a comunicarte y compartir con las personas que forman parte de tu vida.",
        search_placeholder: "Buscar en ZUKA...",
        nav_feed: "Inicio",
        nav_watch: "Watch",
        nav_marketplace: "Marketplace",
        nav_groups: "Grupos",
        nav_gaming: "Videojuegos",
        btn_go_live: "Transmitir",
        badge_ai_active: "Moderación IA Activa",
        title_messenger: "Messenger",
        title_notifications: "Notificaciones",
        title_profile_menu: "Tu perfil",
        view_your_profile: "Ver tu perfil",

        // Left Sidebar
        menu_friends: "Amigos",
        menu_groups: "Grupos",
        menu_marketplace: "Marketplace",
        menu_watch: "Videos y Watch",
        menu_reels: "ZUKA Reels",
        menu_memories: "Recuerdos",
        menu_saved: "Guardado",
        menu_pages: "Páginas",
        menu_events: "Eventos",
        menu_dating: "ZUKA Parejas",
        menu_jobs: "Empleos",
        menu_fundraiser: "Recaudaciones de fondos",
        menu_ads: "Administrador de anuncios",
        menu_settings: "Configuración y privacidad",
        menu_language: "Idioma",
        creator_mode_title: "Modo para creadores",
        creator_mode_active: "Activo",
        stars_balance: "Saldo de estrellas",
        btn_buy_stars: "Comprar estrellas",

        // Stories & Create Post
        story_create_title: "Crear historia",
        story_share_photo: "Comparte una foto o escribe algo.",
        whats_on_your_mind: "¿Qué estás pensando, {name}?",
        btn_live_video: "Video en vivo",
        btn_photo_video: "Foto/video",
        btn_feeling_activity: "Sentimiento/actividad",
        create_post_modal_title: "Crear publicación",
        privacy_public: "🌍 Público",
        privacy_friends: "👥 Amigos",
        privacy_only_me: "🔒 Solo yo",
        post_textarea_placeholder: "¿Qué estás pensando? Exprésate...",
        btn_ai_write: "✨ Asistente de redacción IA ZUKA",
        add_to_post: "Agregar a tu publicación:",
        btn_post_submit: "Publicar",
        posting_anonymous: "Miembro anónimo 👤",

        // Post Card Actions
        post_action_like: "Me gusta",
        post_action_comment: "Comentar",
        post_action_share: "Compartir",
        post_action_stars: "Enviar estrellas",
        post_comments_count: "{count} comentarios",
        post_shares_count: "{count} veces compartido",
        write_comment_placeholder: "Escribe un comentario respetuoso...",
        btn_send_comment: "Enviar",
        poll_total_votes: "Votos totales: {count}",

        // Right Sidebar
        sidebar_sponsored: "Publicidad",
        sidebar_create_ad: "Crear anuncio",
        sidebar_contacts: "Contactos (Messenger)",
        chat_online: "Activo(a) ahora",
        chat_offline: "Desconectado",
        chat_input_placeholder: "Escribe un mensaje...",
        btn_zuka_pay: "Enviar dinero (ZUKA Pay)",

        // Notifications
        notifications_title: "Notificaciones",
        btn_mark_all_read: "Marcar todas como leídas",
        notif_empty: "No tienes notificaciones nuevas",

        // Dropdown Menu
        menu_dark_mode: "Modo oscuro",
        menu_bluetick: "Solicitar insignia de verificación",
        menu_logout: "Cerrar sesión",
        menu_switch_lang: "Cambiar idioma",

        // Language Selector Modal
        lang_modal_title: "Selecciona tu idioma",
        lang_modal_subtitle: "Elige el idioma que deseas utilizar en ZUKA.",
        btn_save_language: "Guardar idioma",
        btn_cancel: "Cancelar",

        // Login & Landing Page
        login_header_tagline: "ZUKA te ayuda a comunicarte y compartir con las personas que forman parte de tu vida.",
        login_input_identifier: "Correo electrónico o número de teléfono",
        login_input_password: "Contraseña",
        btn_login: "Iniciar sesión",
        link_forgot_password: "¿Olvidaste tu contraseña?",
        btn_demo_entry: "Entrar directamente a ZUKA (Modo Demo)",
        btn_create_account: "Crear cuenta nueva",
        create_page_notice: "Crea una página para un famoso, una marca o un negocio.",
        signup_modal_title: "Registrarte",
        signup_modal_subtitle: "Es rápido y fácil.",
        reg_full_name: "Nombre completo",
        reg_username: "Nombre de usuario",
        reg_email: "Correo electrónico",
        reg_phone: "Número de teléfono",
        reg_password: "Contraseña nueva",
        signup_terms_notice: "Al hacer clic en Registrarte, aceptas las Condiciones de ZUKA.",
        btn_signup_submit: "Registrarte",

        // Watch, Marketplace, Groups, Reels tabs
        watch_header: "📺 ZUKA Watch y Videos",
        watch_all: "Todos",
        watch_sports: "Deportes",
        watch_documentary: "Documentales",
        mkt_header: "🏪 ZUKA Marketplace",
        mkt_subtitle: "Compra y vende artículos nuevos o usados con facilidad",
        mkt_sell_btn: "+ Vender artículo",
        mkt_msg_seller: "Enviar mensaje",
        mkt_make_offer: "Hacer oferta",
        groups_header: "🏛️ Grupos de ZUKA",
        groups_subtitle: "Únete a comunidades que comparten tus pasiones",
        groups_create_btn: "+ Crear grupo",
        groups_join_btn: "Unirte al grupo",
        groups_joined_btn: "Miembro ✓",
        groups_chat_btn: "💬 Chat grupal",
        reels_header: "🎬 ZUKA Reels",
        reels_create_btn: "+ Crear Reel",

        // Profile & Settings
        profile_edit_bio: "Editar perfil",
        profile_lock: "🔒 Bloquear perfil",
        profile_unlock: "🔓 Desbloquear perfil",
        profile_followers: "{count} Seguidores",
        profile_following: "{count} Siguiendo",
        settings_title: "⚙️ Configuración de la cuenta",
        settings_dark_mode_desc: "Ajusta la apariencia visual de la aplicación",
        settings_lang_title: "Idioma",
        settings_lang_desc: "Selecciona tu idioma preferido",
        settings_news_pref_title: "Preferencias de noticias",
        settings_news_pref_desc: "Selecciona las categorías que deseas ver en tu Feed:",
        settings_delete_account: "Eliminar mi cuenta",
        settings_delete_desc: "Elimina permanentemente tu cuenta y todos tus datos"
    },

    ar: {
        // App Core & Nav
        app_tagline: "يساعدك ZUKA على التواصل والمشاركة مع الأشخاص في حياتك.",
        search_placeholder: "بحث في ZUKA...",
        nav_feed: "الرئيسية",
        nav_watch: "فيديوهات",
        nav_marketplace: "المتجر",
        nav_groups: "المجموعات",
        nav_gaming: "الألعاب",
        btn_go_live: "بث مباشر",
        badge_ai_active: "نظام الإشراف الذكي مفعل",
        title_messenger: "المراسلة",
        title_notifications: "الإشعارات",
        title_profile_menu: "ملفك الشخصي",
        view_your_profile: "عرض ملفك الشخصي",

        // Left Sidebar
        menu_friends: "الأصدقاء",
        menu_groups: "المجموعات",
        menu_marketplace: "المتجر",
        menu_watch: "الفيديو وWatch",
        menu_reels: "مقاطع Reels",
        menu_memories: "الذكريات",
        menu_saved: "العناصر المحفوظة",
        menu_pages: "الصفحات",
        menu_events: "المناسبات",
        menu_dating: "المواعدة",
        menu_jobs: "الوظائف",
        menu_fundraiser: "جمع التبرعات",
        menu_ads: "مدير الإعلانات",
        menu_settings: "الإعدادات والخصوصية",
        menu_language: "اللغة",
        creator_mode_title: "وضع المنشئ",
        creator_mode_active: "نشط",
        stars_balance: "رصيد النجوم",
        btn_buy_stars: "شراء النجوم",

        // Stories & Create Post
        story_create_title: "إنشاء قصة",
        story_share_photo: "شارك صورة أو اكتب شيئاً.",
        whats_on_your_mind: "ما الذي يخطر في بالك، {name}؟",
        btn_live_video: "بث مباشر",
        btn_photo_video: "صورة/فيديو",
        btn_feeling_activity: "الشعور/النشاط",
        create_post_modal_title: "إنشاء منشور",
        privacy_public: "🌍 عام",
        privacy_friends: "👥 الأصدقاء",
        privacy_only_me: "🔒 أنا فقط",
        post_textarea_placeholder: "بماذا تفكر؟ شارك أفكارك...",
        btn_ai_write: "✨ مساعد الذكاء الاصطناعي ZUKA للكتابة",
        add_to_post: "إضافة إلى منشورك:",
        btn_post_submit: "نشر",
        posting_anonymous: "عضو مجهول 👤",

        // Post Card Actions
        post_action_like: "أعجبني",
        post_action_comment: "تعليق",
        post_action_share: "مشاركة",
        post_action_stars: "إرسال النجوم",
        post_comments_count: "{count} تعليق",
        post_shares_count: "{count} مشاركة",
        write_comment_placeholder: "اكتب تعليقاً لائقاً...",
        btn_send_comment: "إرسال",
        poll_total_votes: "إجمالي الأصوات: {count}",

        // Right Sidebar
        sidebar_sponsored: "مُموَّل",
        sidebar_create_ad: "إنشاء إعلان",
        sidebar_contacts: "جهات الاتصال (Messenger)",
        chat_online: "نشط الآن",
        chat_offline: "غير متصل",
        chat_input_placeholder: "اكتب رسالة...",
        btn_zuka_pay: "إرسال الأموال (ZUKA Pay)",

        // Notifications
        notifications_title: "الإشعارات",
        btn_mark_all_read: "تحديد الكل كمقروء",
        notif_empty: "لا توجد إشعارات جديدة",

        // Dropdown Menu
        menu_dark_mode: "الوضع الداكن",
        menu_bluetick: "طلب شارة التحقق الزرقاء",
        menu_logout: "تسجيل الخروج",
        menu_switch_lang: "تغيير اللغة",

        // Language Selector Modal
        lang_modal_title: "اختر لغتك",
        lang_modal_subtitle: "اختر لغة العرض التي تفضلها لاستخدام ZUKA.",
        btn_save_language: "حفظ اللغة",
        btn_cancel: "إلغاء",

        // Login & Landing Page
        login_header_tagline: "يساعدك ZUKA على التواصل والمشاركة مع الأشخاص في حياتك.",
        login_input_identifier: "البريد الإلكتروني أو رقم الهاتف",
        login_input_password: "كلمة السر",
        btn_login: "تسجيل الدخول",
        link_forgot_password: "هل نسيت كلمة السر؟",
        btn_demo_entry: "الدخول مباشرة إلى ZUKA (الوضع التجريبي)",
        btn_create_account: "إنشاء حساب جديد",
        create_page_notice: "إنشاء صفحة لشخصية مشهورة أو علامة تجارية أو نشاط تجاري.",
        signup_modal_title: "إنشاء حساب",
        signup_modal_subtitle: "الأمر سريع وسهل.",
        reg_full_name: "الاسم بالكامل",
        reg_username: "اسم المستخدم",
        reg_email: "البريد الإلكتروني",
        reg_phone: "رقم الهاتف",
        reg_password: "كلمة السر الجديدة",
        signup_terms_notice: "بالنقر على إنشاء حساب، فإنك توافق على شروط وسياسات ZUKA.",
        btn_signup_submit: "إنشاء حساب",

        // Watch, Marketplace, Groups, Reels tabs
        watch_header: "📺 مركز الفيديوهات ZUKA Watch",
        watch_all: "الكل",
        watch_sports: "الرياضة",
        watch_documentary: "وثائقيات",
        mkt_header: "🏪 متجر ZUKA Marketplace",
        mkt_subtitle: "بيع واشترِ المنتجات بكل سهولة وأمان",
        mkt_sell_btn: "+ بيع عنصر",
        mkt_msg_seller: "إرسال رسالة",
        mkt_make_offer: "تقديم عرض",
        groups_header: "🏛️ مجموعات ZUKA",
        groups_subtitle: "انضم إلى مجتمعات تشاركك اهتماماتك",
        groups_create_btn: "+ إنشاء مجموعة جديدة",
        groups_join_btn: "انضمام للمجموعة",
        groups_joined_btn: "عضو ✓",
        groups_chat_btn: "💬 دردشة المجموعة",
        reels_header: "🎬 مقاطع ZUKA Reels",
        reels_create_btn: "+ إنشاء مقطع Reel",

        // Profile & Settings
        profile_edit_bio: "تعديل الملف الشخصي",
        profile_lock: "🔒 قفل الملف الشخصي",
        profile_unlock: "🔓 إلغاء قفل الملف الشخصي",
        profile_followers: "{count} متابع",
        profile_following: "{count} يتابعهم",
        settings_title: "⚙️ إعدادات الحساب",
        settings_dark_mode_desc: "تغيير المظهر إلى الداكن أو الفاتح",
        settings_lang_title: "اللغة",
        settings_lang_desc: "اختر لغتك المفضلة",
        settings_news_pref_title: "تفضيلات الأخبار",
        settings_news_pref_desc: "حدد فئات الأخبار التي ترغب في رؤيتها في آخر الأخبار:",
        settings_delete_account: "حذف حسابي",
        settings_delete_desc: "حذف حسابك وجميع بياناتك المرتبطة به نهائياً"
    }
};

class ZukaI18nEngine {
    constructor() {
        // ALWAYS DEFAULT TO ENGLISH (US) for all users unless explicitly changed
        const savedLang = localStorage.getItem('zuka_lang');
        this.currentLang = (savedLang && ZUKA_TRANSLATIONS[savedLang]) ? savedLang : 'en';

        // Save default explicitly if none was stored yet
        if (!savedLang) {
            localStorage.setItem('zuka_lang', 'en');
        }

        this.languages = [
            { code: 'en', name: 'English (US)', flag: '🇺🇸', native: 'English (US)' },
            { code: 'sw', name: 'Kiswahili', flag: '🇹🇿', native: 'Kiswahili' },
            { code: 'fr', name: 'French (Français)', flag: '🇫🇷', native: 'Français' },
            { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸', native: 'Español' },
            { code: 'ar', name: 'Arabic (العربية)', flag: '🇸🇦', native: 'العربية' }
        ];
    }

    t(key, params = {}) {
        const dict = ZUKA_TRANSLATIONS[this.currentLang] || ZUKA_TRANSLATIONS.en;
        let text = dict[key] || ZUKA_TRANSLATIONS.en[key] || key;

        // Replace parameters e.g. {name}, {count}
        Object.keys(params).forEach(k => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
        });
        return text;
    }

    getLanguage() {
        return this.currentLang;
    }

    setLanguage(langCode) {
        if (!ZUKA_TRANSLATIONS[langCode]) {
            console.warn(`Unsupported language code: ${langCode}, falling back to English.`);
            langCode = 'en';
        }

        this.currentLang = langCode;
        localStorage.setItem('zuka_lang', langCode);

        // Adjust HTML document lang and direction (RTL for Arabic)
        document.documentElement.lang = langCode;
        if (langCode === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
            document.body.classList.add('rtl-layout');
        } else {
            document.documentElement.removeAttribute('dir');
            document.body.classList.remove('rtl-layout');
        }

        // Apply translations instantly to all DOM elements marked with data-i18n
        this.applyDomTranslations();

        // Broadcast language change to re-render dynamic views (e.g., Feed, Stories, Watch)
        window.dispatchEvent(new CustomEvent('zuka:language_changed', { detail: { lang: langCode } }));

        console.log(`🌐 [ZUKA i18n] Language updated instantly to: ${langCode}`);
    }

    applyDomTranslations() {
        // Text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const paramName = el.getAttribute('data-i18n-param-name');
            const paramVal = el.getAttribute('data-i18n-param-val');
            const params = {};
            if (paramName && paramVal) params[paramName] = paramVal;
            el.innerText = this.t(key, params);
        });

        // Placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Titles
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });
    }

    /**
     * Renders or displays the official Facebook-style Language Selector Modal
     */
    openLanguageModal() {
        let modal = document.getElementById('zuka-language-selector-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'zuka-language-selector-modal';
            modal.className = 'fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                <div class="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 class="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            <span>🌐</span>
                            <span>${this.t('lang_modal_title')}</span>
                        </h3>
                        <p class="text-xs text-gray-500 mt-0.5">${this.t('lang_modal_subtitle')}</p>
                    </div>
                    <button onclick="window.ZukaI18n.closeLanguageModal()" class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold">✕</button>
                </div>

                <div class="space-y-2 py-1 max-h-72 overflow-y-auto">
                    ${this.languages.map(l => {
                        const isSelected = this.currentLang === l.code;
                        return `
                            <label onclick="window.ZukaI18n.selectLanguageRadio('${l.code}')" class="flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${isSelected ? 'border-[#1877F2] bg-blue-50/70 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60'}">
                                <div class="flex items-center gap-3">
                                    <span class="text-2xl">${l.flag}</span>
                                    <div>
                                        <div class="font-bold text-sm text-gray-900 dark:text-white">${l.native}</div>
                                        <div class="text-xs text-gray-500">${l.name} ${l.code === 'en' ? '(Default)' : ''}</div>
                                    </div>
                                </div>
                                <input type="radio" name="zuka_selected_lang" value="${l.code}" ${isSelected ? 'checked' : ''} class="w-4 h-4 text-[#1877F2] focus:ring-[#1877F2]">
                            </label>
                        `;
                    }).join('')}
                </div>

                <div class="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                    <button onclick="window.ZukaI18n.closeLanguageModal()" class="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                        ${this.t('btn_cancel')}
                    </button>
                    <button onclick="window.ZukaI18n.confirmLanguageSelection()" class="px-5 py-2 rounded-lg text-xs font-bold bg-[#1877F2] hover:bg-blue-600 text-white shadow-sm transition">
                        ${this.t('btn_save_language')}
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    selectLanguageRadio(code) {
        this.pendingSelection = code;
        const radios = document.querySelectorAll('input[name="zuka_selected_lang"]');
        radios.forEach(r => {
            r.checked = (r.value === code);
        });
    }

    confirmLanguageSelection() {
        const checked = document.querySelector('input[name="zuka_selected_lang"]:checked');
        const code = checked ? checked.value : (this.pendingSelection || 'en');
        this.setLanguage(code);
        this.closeLanguageModal();
    }

    closeLanguageModal() {
        const modal = document.getElementById('zuka-language-selector-modal');
        if (modal) modal.classList.add('hidden');
    }
}

window.ZukaI18n = new ZukaI18nEngine();

// Auto-run on load
document.addEventListener('DOMContentLoaded', () => {
    window.ZukaI18n.applyDomTranslations();
});
