/**
 * ZUKA - Settings Engine (settings.js)
 * 100% English - Dark Mode, Language, News Categories, Privacy, Account Deletion
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

window.ZukaSettings = {
    /**
     * Toggles dark mode presentation classes across HTML element branches
     */
    toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('zuka_dark_mode', isDark ? 'true' : 'false');
        return isDark;
    },

    /**
     * Initializes dark theme preferences upon page generation layout loading
     */
    initDarkMode() {
        if (localStorage.getItem('zuka_dark_mode') === 'true') {
            document.documentElement.classList.add('dark');
        }
    },

    /**
     * Spawns the translation language modal component injection engine
     */
    openLanguageSelector() {
        if (window.ZukaI18n && window.ZukaI18n.openLanguageModal) {
            window.ZukaI18n.openLanguageModal();
        }
    },

    /**
     * Standardizes interface localization code tracking tokens
     */
    setLanguage(lang = 'en') {
        if (window.ZukaI18n && window.ZukaI18n.setLanguage) {
            window.ZukaI18n.setLanguage(lang);
        } else {
            localStorage.setItem('zuka_lang', lang);
            window.location.reload();
        }
    },

    /**
     * Saves user news category filters to adjust dynamic feed generation
     */
    saveNewsCategories(categoriesArray) {
        localStorage.setItem('zuka_news_categories', JSON.stringify(categoriesArray));
        alert('Your news preferences have been saved successfully!');
        if (window.ZukaNews && window.ZukaNews.fetchRealNews) {
            window.ZukaNews.fetchRealNews();
        }
    },

    /**
     * Permanently deletes the current user profile account directly from Supabase
     */
    async deleteMyAccount() {
        const confirmText = prompt('Are you sure you want to permanently delete your account? Type "DELETE" to confirm:');
        if (confirmText === 'DELETE') {
            const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
            
            if (currentUser && currentUser.id && window.supabase) {
                try {
                    // Perform an asynchronous row deletion query directly on your remote Postgres table
                    const { error } = await window.supabase
                        .from('users')
                        .delete()
                        .eq('id', currentUser.id);

                    if (error) throw error;
                } catch (e) {
                    console.error("Failed to execute account removal from Supabase server:", e);
                    alert("An error occurred while deleting your account from the database. Please try again.");
                    return;
                }
            }
            
            if (window.ZukaAuth && window.ZukaAuth.logout) {
                window.ZukaAuth.logout();
            }
        }
    }
};

window.ZukaSettings.initDarkMode();
