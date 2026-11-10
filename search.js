/**
 * ZUKA Super App - Omni Search Engine (search.js)
 * Searches across People, Groups, Pages, Posts, Marketplace, and Hashtags.
 */

window.ZukaSearch = {
    searchAll(query = '') {
        const q = query.trim().toLowerCase();
        if (!q) return { people: [], groups: [], pages: [], posts: [], products: [] };

        const users = window.ZukaDB.get('users');
        const groups = window.ZukaDB.get('groups');
        const pages = window.ZukaDB.get('pages');
        const posts = window.ZukaDB.get('posts');
        const products = window.ZukaDB.get('products');

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
    }
};
