/**
 * ZUKA Super App - Marketplace Engine (marketplace.js)
 * Implements Facebook-style Marketplace: browse items, categories, post product with AI checks,
 * make offers, seller ratings, and direct Messenger seller contact.
 */

class ZukaMarketplaceEngine {
    constructor() {
        this.initProducts();
    }

    initProducts() {
        let products = window.ZukaDB.get('products');
        if (products.length === 0) {
            products = [
                {
                    id: 'prod_01',
                    title: 'iPhone 15 Pro Max 256GB - Hali Mpya kabisa',
                    price: 2450000,
                    currency: 'TZS',
                    category: 'Kielektroniki',
                    location: 'Kariakoo, Dar es Salaam',
                    description: 'Simu ipo katika hali nzuri sana na betri health 98%. Ina box lake na warranty ya miezi 6. Bei inazungumzika.',
                    photo_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
                    seller_id: 'usr_kelvin_05',
                    seller_name: 'Kelvin Mushi',
                    seller_rating: 4.9,
                    seller_reviews_count: 28,
                    is_sold: false,
                    created_at: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 'prod_02',
                    title: 'Toyota Harrier New Model - Mwaka 2018 Clean Condition',
                    price: 48000000,
                    currency: 'TZS',
                    category: 'Magari',
                    location: 'Kinondoni, Dar es Salaam',
                    description: 'Gari imetumika kidogo sana Tanzania, full option, leather seats, panoramic roof. Karibu ukague.',
                    photo_url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800',
                    seller_id: 'usr_baraka_03',
                    seller_name: 'Baraka John',
                    seller_rating: 4.8,
                    seller_reviews_count: 42,
                    is_sold: false,
                    created_at: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    id: 'prod_03',
                    title: 'Sofa Set ya Kisasa (5 Seater) - Kitambaa cha Velvet',
                    price: 1350000,
                    currency: 'TZS',
                    category: 'Samani',
                    location: 'Mikocheni, Dar es Salaam',
                    description: 'Seti nzuri sana ya sofa za sebuleni zenye sponji nzito na muundo wa kisasa. Usafiri bure kwa Dar es Salaam.',
                    photo_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
                    seller_id: 'usr_sarah_02',
                    seller_name: 'Sarah Kimaro',
                    seller_rating: 5.0,
                    seller_reviews_count: 15,
                    is_sold: false,
                    created_at: new Date(Date.now() - 250000000).toISOString()
                }
            ];
            window.ZukaDB.set('products', products);
        }
    }

    getProducts(category = 'All') {
        const products = window.ZukaDB.get('products');
        if (category === 'All' || !category) return products;
        return products.filter(p => p.category === category);
    }

    async postProduct({ title, price, category, location, description, photoUrl }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Ingia kwanza kuuza bidhaa.');

        // AI Moderation check
        const scan = window.ZukaAIModerator.scanContent(`${title} ${description}`, currentUser.id);
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`🚫 Bidhaa imezuiwa: ${scan.reason}`);
        }

        if (photoUrl) {
            const imgCheck = window.ZukaAIModerator.checkImage(photoUrl);
            if (imgCheck.action === 'AUTO_BLOCK') {
                throw new Error('🚫 Picha ya bidhaa ina viashiria visivyoruhusiwa.');
            }
        }

        const newProd = {
            id: 'prod_' + Date.now().toString(36),
            title,
            price: Number(price) || 0,
            currency: 'TZS',
            category: category || 'Kielektroniki',
            location: location || 'Dar es Salaam',
            description: description || '',
            photo_url: photoUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
            seller_id: currentUser.id,
            seller_name: currentUser.full_name,
            seller_rating: 5.0,
            seller_reviews_count: 1,
            is_sold: false,
            created_at: new Date().toISOString()
        };

        const products = window.ZukaDB.get('products');
        products.unshift(newProd);
        window.ZukaDB.set('products', products);
        return newProd;
    }

    makeOffer(productId, offerAmount) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const products = window.ZukaDB.get('products');
        const prod = products.find(p => p.id === productId);
        if (!prod) return;

        // Auto send chat message to seller
        if (window.ZukaChat) {
            window.ZukaChat.sendMessage({
                contactId: prod.seller_id,
                text: `Habari ${prod.seller_name}, ninavutiwa na "${prod.title}". Ninatoa ofa ya TZS ${Number(offerAmount).toLocaleString()}. Je unakubali?`
            });
        }
        return true;
    }
}

window.ZukaMarketplace = new ZukaMarketplaceEngine();
