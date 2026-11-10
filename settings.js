/**
 * ZUKA Super App - Settings Engine (settings.js)
 * Implements Dark Mode, Language Selector, News Categories, Privacy, and Account Deletion.
 * Default language: English (US)
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

    // Trigger language selector popup
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
        const msg = (window.ZukaI18n && window.ZukaI18n.getLanguage() === 'sw')
            ? 'Vipengele vya habari unavyopenda vimehifadhiwa kikamilifu!'
            : 'Your news preferences have been saved successfully!';
        alert(msg);
        if (window.ZukaNews) window.ZukaNews.fetchRealNews();
    },

    deleteMyAccount() {
        const isSwahili = window.ZukaI18n && window.ZukaI18n.getLanguage() === 'sw';
        const promptMsg = isSwahili
            ? 'Je, una uhakika unataka kufuta akaunti yako kabisa? Andika "FUTA" kuthibitisha:'
            : 'Are you sure you want to permanently delete your account? Type "DELETE" to confirm:';
        const requiredWord = isSwahili ? 'FUTA' : 'DELETE';

        const confirmText = prompt(promptMsg);
        if (confirmText === requiredWord || confirmText === 'DELETE' || confirmText === 'FUTA') {
            const currentUser = window.ZukaAuth.getCurrentUser();
            if (currentUser) {
                window.ZukaDB.delete('users', currentUser.id);
            }
            window.ZukaAuth.logout();
        }
    }
};

window.ZukaSettings.initDarkMode();
