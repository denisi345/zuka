/**
 * ZUKA Super App - Omni Search Engine (search.js)
 * Searches across People, Groups, Pages, Posts, Marketplace, and Hashtags.
 * 100% English Code Documentation - Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

window.ZukaSearch = {
    /**
     * Perform global search lookups concurrently across multiple Supabase relational data vectors
     */
    async searchAll(query = '') {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const q = query.trim().toLowerCase();
        if (!q) {
            return { people: [], groups: [], pages: [], posts: [], products: [] };
        }

        try {
            // Execute all target lookups concurrently in parallel streams to save network cycles
            const [
                usersResult,
                groupsResult,
                pagesResult,
                postsResult,
                productsResult
            ] = await Promise.all([
                window.supabaseClient.from('profiles').select('id, full_name, username, avatar_url'),
                window.supabaseClient.from('groups').select('*'),
                window.supabaseClient.from('pages').select('*'),
                window.supabaseClient.from('posts').select('*').eq('is_hidden', false),
                window.supabaseClient.from('products').select('*').eq('is_sold', false)
            ]);

            // Handle errors for individual fetch channels silently while providing fallbacks
            const users = usersResult.data || [];
            const groups = groupsResult.data || [];
            const pages = pagesResult.data || [];
            const posts = postsResult.data || [];
            const products = productsResult.data || [];

            // Client side query mapping and pattern filter execution
            const people = users.filter(u => 
                (u.full_name && u.full_name.toLowerCase().includes(q)) || 
                (u.username && u.username.toLowerCase().includes(q))
            );

            const foundGroups = groups.filter(g => 
                (g.name && g.name.toLowerCase().includes(q)) || 
                (g.description && g.description.toLowerCase().includes(q))
            );

            const foundPages = pages.filter(p => 
                (p.name && p.name.toLowerCase().includes(q)) || 
                (p.category && p.category.toLowerCase().includes(q))
            );

            const foundPosts = posts.filter(p => 
                p.content && p.content.toLowerCase().includes(q)
            );

            const foundProducts = products.filter(pr => 
                (pr.title && pr.title.toLowerCase().includes(q)) || 
                (pr.description && pr.description.toLowerCase().includes(q))
            );

            return {
                people,
                groups: foundGroups,
                pages: foundPages,
                posts: foundPosts,
                products: foundProducts
            };

        } catch (e) {
            console.error("Omni Search runtime parsing error execution on Supabase:", e);
            return { people: [], groups: [], pages: [], posts: [], products: [] };
        }
    }
};
