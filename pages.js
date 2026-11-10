/**
 * ZUKA - Pages Engine (pages.js)
 * 100% English - No Fake Pages, No Fake Followers, No Fake Likes
 */

class ZukaPagesEngine {
    constructor() {
        this.initPages();
    }

    initPages() {
        let pages = window.ZukaDB.get('pages');
        if (!pages) {
            pages = [];
            window.ZukaDB.set('pages', pages);
        }
    }

    getPages() {
        return window.ZukaDB.get('pages') || [];
    }

    async createPage({ name, category, about, avatarUrl, coverUrl }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to create a Page.');

        const scan = window.ZukaAIModerator.scanContent(name, currentUser.id);
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`Page name blocked: ${scan.reason}`);
        }

        const newPage = {
            id: 'page_' + Date.now().toString(36),
            name,
            category: category || 'Business / Company',
            about: about || '',
            avatar_url: avatarUrl || '',
            cover_url: coverUrl || '',
            is_verified: false,
            followers_count: 0,
            is_following: false,
            created_by: currentUser.id,
            admins: [currentUser.full_name],
            posts: [],
            created_at: new Date().toISOString()
        };

        const pages = this.getPages();
        pages.unshift(newPage);
        window.ZukaDB.set('pages', pages);
        return newPage;
    }

    toggleFollowPage(pageId) {
        const pages = this.getPages();
        const page = pages.find(p => p.id === pageId);
        if (page) {
            page.is_following = !page.is_following;
            page.followers_count += page.is_following ? 1 : -1;
            window.ZukaDB.set('pages', pages);
            return page.is_following;
        }
    }
}

window.ZukaPages = new ZukaPagesEngine();
