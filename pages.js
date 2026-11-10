/**
 * ZUKA Super App - Pages Engine (pages.js)
 * Implements Facebook-style Pages, follow/like, page posts, insights, and admin roles.
 */

class ZukaPagesEngine {
    constructor() {
        this.initSamplePages();
    }

    initSamplePages() {
        let pages = window.ZukaDB.get('pages');
        if (pages.length === 0) {
            pages = [
                {
                    id: 'page_zuka_official',
                    name: 'ZUKA Tanzania Rasmi',
                    category: 'Mtandao wa Kijamii',
                    avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
                    cover_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200',
                    about: 'Ukurasa rasmi wa mtandao wa kijamii wa ZUKA. Karibu ujumuike na mamilioni ya watumiaji!',
                    is_verified: true,
                    followers_count: 540200,
                    is_following: true,
                    posts: [
                        {
                            id: 'p_post_1',
                            content: 'Karibuni kwenye toleo jipya la ZUKA! Tumeongeza mfumo thabiti wa AI Moderation kulinda jamii yetu na kuhakikisha usalama wa wote. 🛡️🇹🇿',
                            media_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
                            likes: 1240,
                            comments: 180,
                            created_at: 'Siku 1 iliyopita'
                        }
                    ]
                }
            ];
            window.ZukaDB.set('pages', pages);
        }
    }

    getPages() {
        return window.ZukaDB.get('pages');
    }

    async createPage({ name, category, about, avatarUrl, coverUrl }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Ingia kwanza kutengeneza Ukurasa.');

        // AI check on page name
        const scan = window.ZukaAIModerator.scanContent(name, currentUser.id);
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`🚫 Jina la Ukurasa limezuiwa: ${scan.reason}`);
        }

        const newPage = {
            id: 'page_' + Date.now().toString(36),
            name,
            category: category || 'Biashara / Kampuni',
            about: about || '',
            avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            cover_url: coverUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200',
            is_verified: false,
            followers_count: 1,
            is_following: true,
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
