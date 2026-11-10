/**
 * ZUKA - Marketplace Engine (marketplace.js)
 * 100% English - No Fake Products, No Fake Ratings
 */

class ZukaMarketplaceEngine {
    constructor() {
        this.initProducts();
    }

    initProducts() {
        let products = window.ZukaDB.get('products');
        if (!products) {
            products = [];
            window.ZukaDB.set('products', products);
        }
    }

    getProducts(category = 'All') {
        const products = window.ZukaDB.get('products') || [];
        if (category === 'All' || !category) return products;
        return products.filter(p => p.category === category);
    }

    async postProduct({ title, price, category, location, description, photoUrl }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to sell a product.');

        const scan = window.ZukaAIModerator.scanContent(`${title} ${description}`, currentUser.id);
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`Product blocked: ${scan.reason}`);
        }

        if (photoUrl) {
            const imgCheck = window.ZukaAIModerator.checkImage(photoUrl);
            if (imgCheck.action === 'AUTO_BLOCK') {
                throw new Error('Product image contains disallowed content.');
            }
        }

        const newProd = {
            id: 'prod_' + Date.now().toString(36),
            title,
            price: Number(price) || 0,
            currency: 'TZS',
            category: category || 'Electronics',
            location: location || 'Dar es Salaam',
            description: description || '',
            photo_url: photoUrl || '',
            seller_id: currentUser.id,
            seller_name: currentUser.full_name,
            seller_rating: 0,
            seller_reviews_count: 0,
            is_sold: false,
            created_at: new Date().toISOString()
        };

        const products = window.ZukaDB.get('products') || [];
        products.unshift(newProd);
        window.ZukaDB.set('products', products);
        return newProd;
    }

    makeOffer(productId, offerAmount) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const products = window.ZukaDB.get('products') || [];
        const prod = products.find(p => p.id === productId);
        if (!prod) return false;

        if (window.ZukaChat) {
            window.ZukaChat.sendMessage({
                contactId: prod.seller_id,
                text: `Hi ${prod.seller_name}, I am interested in "${prod.title}". I am offering TZS ${Number(offerAmount).toLocaleString()}. Do you accept?`
            });
        }
        return true;
    }
}

window.ZukaMarketplace = new ZukaMarketplaceEngine();
