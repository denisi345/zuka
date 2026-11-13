/**
 * ZUKA - Pages Engine (pages.js)
 * 100% English - No Fake Pages, No Fake Followers, No Fake Likes
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaPagesEngine {
    constructor() {
        this.initPages();
    }

    initPages() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    async getPages() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const { data: pages, error } = await window.supabaseClient
            .from('pages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching pages from Supabase:", error);
            return [];
        }

        return pages || [];
    }

    async createPage({ name, category, about, avatarUrl, coverUrl }) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to create a Page.');

        if (window.ZukaAIModerator) {
            const scan = window.ZukaAIModerator.scanContent(name, currentUser.id);
            if (scan && scan.action === 'AUTO_BLOCK') {
                throw new Error(`Page name blocked: ${scan.reason}`);
            }
        }

        const newPage = {
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

        const { data, error } = await window.supabaseClient
            .from('pages')
            .insert([newPage])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async toggleFollowPage(pageId) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        // 1. Fetch current follow status of the page from Supabase
        const { data: page, error: fetchError } = await window.supabaseClient
            .from('pages')
            .select('is_following, followers_count')
            .eq('id', pageId)
            .maybeSingle();

        if (fetchError || !page) {
            console.error("Error finding target page:", fetchError);
            return false;
        }

        const nextStatus = !page.is_following;
        const nextCount = page.followers_count + (nextStatus ? 1 : -1);

        // 2. Perform an atomic column cell update on the page fields
        const { error: updateError } = await window.supabaseClient
            .from('pages')
            .update({ 
                is_following: nextStatus, 
                followers_count: Math.max(0, nextCount) 
            })
            .eq('id', pageId);

        if (updateError) throw updateError;
        return nextStatus;
    }
}

window.ZukaPages = new ZukaPagesEngine();
