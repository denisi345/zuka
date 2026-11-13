/**
 * ZUKA - Saved Items Engine (saved.js)
 * 100% English - No Fake Data
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

window.ZukaSaved = {
    /**
     * Fetch all saved bookmarks for the current user and resolve linked data structures asynchronously
     */
    async getSavedItems() {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) return [];

        try {
            // 1. Fetch user specific items from the remote 'saved_items' repository table
            const { data: savedItems, error: savedError } = await window.supabase
                .from('saved_items')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (savedError) throw savedError;
            const itemsList = savedItems || [];

            if (itemsList.length === 0) return [];

            // 2. Fetch comprehensive lists of posts and products in parallel streams to resolve relation lookups
            const { data: posts, error: postsError } = await window.supabase
                .from('posts')
                .select('*');

            const { data: products, error: productsError } = await window.supabase
                .from('products')
                .select('*');

            if (postsError) console.error("Error retrieving lookup posts table:", postsError);
            if (productsError) console.error("Error retrieving lookup products table:", productsError);

            const activePosts = posts || [];
            const activeProducts = products || [];

            // 3. Map cross-reference pointers to associate live records with individual bookmarks
            return itemsList.map(item => {
                if (item.item_type === 'post') {
                    const p = activePosts.find(post => post.id === item.item_id);
                    return { 
                        ...item, 
                        data: p || null, 
                        title: p ? (p.content ? p.content.substring(0, 60) + '...' : 'Saved Post') : 'Saved post' 
                    };
                } else if (item.item_type === 'product') {
                    const pr = activeProducts.find(prod => prod.id === item.item_id);
                    return { 
                        ...item, 
                        data: pr || null, 
                        title: pr ? pr.title : 'Saved product' 
                    };
                }
                return item;
            });

        } catch (e) {
            console.error("Failed to compile user bookmark streams from Supabase:", e);
            return [];
        }
    },

    /**
     * Remove an entry row reference permanently from the server database
     */
    async removeItem(savedId) {
        if (!window.supabase) return;

        try {
            const { error } = await window.supabase
                .from('saved_items')
                .delete()
                .eq('id', savedId);

            if (error) throw error;
        } catch (e) {
            console.error("Failed to execute database row deletion on saved target element:", e);
        }
    }
};
