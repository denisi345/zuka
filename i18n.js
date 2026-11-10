/**
 * ZUKA - Internationalization Engine (i18n.js)
 * English (US) Only - No Other Languages
 */

const ZUKA_TRANSLATIONS = {
    en: {
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

        story_create_title: "Create story",
        story_share_photo: "Share a photo or write something.",
        whats_on_your_mind: "What's on your mind, {name}?",
        btn_live_video: "Live video",
        btn_photo_video: "Photo/video",
        btn_feeling_activity: "Feeling/activity",
        create_post_modal_title: "Create post",
        privacy_public: "Public",
        privacy_friends: "Friends",
        privacy_only_me: "Only me",
        post_textarea_placeholder: "What's on your mind? Share your thoughts...",
        btn_ai_write: "ZUKA AI Writing Assistant",
        add_to_post: "Add to your post:",
        btn_post_submit: "Post",
        posting_anonymous: "Anonymous Member",

        post_action_like: "Like",
        post_action_comment: "Comment",
        post_action_share: "Share",
        post_action_stars: "Send Stars",
        post_comments_count: "{count} comments",
        post_shares_count: "{count} shares",
        write_comment_placeholder: "Write a respectful comment...",
        btn_send_comment: "Send",
        poll_total_votes: "Total votes: {count}",

        sidebar_sponsored: "Sponsored",
        sidebar_create_ad: "Create Ad",
        sidebar_contacts: "Contacts (Messenger)",
        chat_online: "Active now",
        chat_offline: "Offline",
        chat_input_placeholder: "Type a message...",
        btn_zuka_pay: "Send Money (ZUKA Pay)",

        notifications_title: "Notifications",
        btn_mark_all_read: "Mark all as read",
        notif_empty: "No new notifications",

        menu_dark_mode: "Dark mode",
        menu_bluetick: "Request Blue Tick Verification",
        menu_logout: "Log Out",
        menu_switch_lang: "Language",

        lang_modal_title: "Select Your Language",
        lang_modal_subtitle: "Choose your preferred language for the ZUKA interface.",
        btn_save_language: "Save Language",
        btn_cancel: "Cancel",

        login_header_tagline: "ZUKA helps you connect, buy, watch, and share with the people in your life.",
        login_input_identifier: "Email or phone number",
        login_input_password: "Password",
        btn_login: "Log In",
        link_forgot_password: "Forgot password?",
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

        watch_header: "ZUKA Watch & Video Hub",
        watch_all: "All",
        watch_sports: "Sports",
        watch_documentary: "Documentaries",
        mkt_header: "ZUKA Marketplace",
        mkt_subtitle: "Buy and sell items with trusted people locally and across Tanzania",
        mkt_sell_btn: "+ Sell Something",
        mkt_msg_seller: "Message",
        mkt_make_offer: "Make Offer",
        groups_header: "ZUKA Groups",
        groups_subtitle: "Join communities of people who share your passions and goals",
        groups_create_btn: "+ Create New Group",
        groups_join_btn: "Join Group",
        groups_joined_btn: "Joined",
        groups_chat_btn: "Group Chat",
        reels_header: "ZUKA Reels",
        reels_create_btn: "+ Create Reel",

        profile_edit_bio: "Edit Profile",
        profile_lock: "Lock Profile",
        profile_unlock: "Unlock Profile",
        profile_followers: "{count} Followers",
        profile_following: "{count} Following",
        settings_title: "Account Settings",
        settings_dark_mode_desc: "Adjust the appearance of ZUKA to reduce glare",
        settings_lang_title: "Language",
        settings_lang_desc: "Select your preferred language",
        settings_news_pref_title: "News Preferences",
        settings_news_pref_desc: "Choose topics you want to see in your Feed from BBC, CNN, Azam TV, TBC, and ITV:",
        settings_delete_account: "Delete My Account",
        settings_delete_desc: "Permanently delete your profile and all associated data"
    }
};

class ZukaI18nEngine {
    constructor() {
        const savedLang = localStorage.getItem('zuka_lang');
        this.currentLang = (savedLang && ZUKA_TRANSLATIONS[savedLang]) ? savedLang : 'en';

        if (!savedLang) {
            localStorage.setItem('zuka_lang', 'en');
        }

        this.languages = [
            { code: 'en', name: 'English (US)', flag: 'US', native: 'English (US)' }
        ];
    }

    t(key, params = {}) {
        const dict = ZUKA_TRANSLATIONS[this.currentLang] || ZUKA_TRANSLATIONS.en;
        let text = dict[key] || ZUKA_TRANSLATIONS.en[key] || key;

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

        document.documentElement.lang = langCode;
        document.documentElement.removeAttribute('dir');
        document.body.classList.remove('rtl-layout');

        this.applyDomTranslations();

        window.dispatchEvent(new CustomEvent('zuka:language_changed', { detail: { lang: langCode } }));
    }

    applyDomTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const paramName = el.getAttribute('data-i18n-param-name');
            const paramVal = el.getAttribute('data-i18n-param-val');
            const params = {};
            if (paramName && paramVal) params[paramName] = paramVal;
            el.innerText = this.t(key, params);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });
    }

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
                            <span>${this.t('lang_modal_title')}</span>
                        </h3>
                        <p class="text-xs text-gray-500 mt-0.5">${this.t('lang_modal_subtitle')}</p>
                    </div>
                    <button onclick="window.ZukaI18n.closeLanguageModal()" class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold">X</button>
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
                                        <div class="text-xs text-gray-500">${l.name} (Default)</div>
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

document.addEventListener('DOMContentLoaded', () => {
    window.ZukaI18n.applyDomTranslations();
});
