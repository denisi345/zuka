/**
 * ZUKA - Settings Engine (settings.js)
 * 100% English - Dark Mode, Language, News Categories, Privacy, Account Deletion
 */

window.ZukaSettings = {
    toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('zuka_dark_mode', isDark ? 'true' : 'false');
        return isDark;
    },

    initDarkMode() {
        if (localStorage.getItem('zuka_dark_mode') === 'true') {
            document.documentElement.classList.add('dark');
        }
    },

    openLanguageSelector() {
        if (window.ZukaI18n) {
            window.ZukaI18n.openLanguageModal();
        }
    },

    setLanguage(lang = 'en') {
        if (window.ZukaI18n) {
            window.ZukaI18n.setLanguage(lang);
        } else {
            localStorage.setItem('zuka_lang', lang);
            window.location.reload();
        }
    },

    saveNewsCategories(categoriesArray) {
        localStorage.setItem('zuka_news_categories', JSON.stringify(categoriesArray));
        alert('Your news preferences have been saved successfully!');
        if (window.ZukaNews) window.ZukaNews.fetchRealNews();
    },

    deleteMyAccount() {
        const confirmText = prompt('Are you sure you want to permanently delete your account? Type "DELETE" to confirm:');
        if (confirmText === 'DELETE') {
            const currentUser = window.ZukaAuth.getCurrentUser();
            if (currentUser) {
                window.ZukaDB.delete('users', currentUser.id);
            }
            window.ZukaAuth.logout();
        }
    }
};

window.ZukaSettings.initDarkMode();
