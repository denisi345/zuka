/**
 * ZUKA Super App - Saved Items Engine (saved.js)
 * Implements Facebook-style Saved Items: Posts, Videos, Marketplace listings, and collections.
 */

window.ZukaSaved = {
    getSavedItems() {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) return [];
        const saved = window.ZukaDB.get('saved_items').filter(s => s.user_id === currentUser.id);
        const posts = window.ZukaDB.get('posts');
        const products = window.ZukaDB.get('products');

        return saved.map(item => {
            if (item.item_type === 'post') {
                const p = posts.find(post => post.id === item.item_id);
                return { ...item, data: p, title: p ? p.content.substring(0, 60) + '...' : 'Chapisho lililohifadhiwa' };
            } else if (item.item_type === 'product') {
                const pr = products.find(prod => prod.id === item.item_id);
                return { ...item, data: pr, title: pr ? pr.title : 'Bidhaa iliyohifadhiwa' };
            }
            return item;
        });
    },

    removeItem(savedId) {
        let saved = window.ZukaDB.get('saved_items');
        saved = saved.filter(s => s.id !== savedId);
        window.ZukaDB.set('saved_items', saved);
    }
};
