/**
 * ZUKA - Marketplace Engine (marketplace.js)
 * 100% English - No Fake Products, No Fake Ratings
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaMarketplaceEngine {
    constructor() {
        this.initProducts();
    }

    initProducts() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    async getProducts(category = 'All') {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        let query = window.supabase
            .from('products')
            .select('*')
            .eq('is_sold', false)
            .order('created_at', { ascending: false });

        if (category && category !== 'All') {
            query = query.eq('category', category);
        }

        const { data: products, error } = await query;
        if (error) {
            console.error("Error fetching marketplace products:", error);
            return [];
        }

        return products || [];
    }

    async postProduct({ title, price, category, location, description, photoUrl }) {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to sell a product.');

        if (window.ZukaAIModerator) {
            const scan = window.ZukaAIModerator.scanContent(`${title} ${description}`, currentUser.id);
            if (scan && scan.action === 'AUTO_BLOCK') {
                throw new Error(`Product blocked by AI Moderation: ${scan.reason}`);
            }

            if (photoUrl) {
                const imgCheck = window.ZukaAIModerator.checkImage(photoUrl);
                if (imgCheck && imgCheck.action === 'AUTO_BLOCK') {
                    throw new Error('Product image contains disallowed content.');
                }
            }
        }

        const newProd = {
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

        const { data, error } = await window.supabase
            .from('products')
            .insert([newProd])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async makeOffer(productId, offerAmount) {
        if (!window.supabase) return false;

        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) return false;

        // Fetch seller details from the remote products row
        const { data: prod, error } = await window.supabase
            .from('products')
            .select('title, seller_id, seller_name')
            .eq('id', productId)
            .maybeSingle();

        if (error || !prod) {
            console.error("Product listing not found:", error);
            return false;
        }

        if (window.ZukaChat && window.ZukaChat.sendMessage) {
            try {
                await window.ZukaChat.sendMessage({
                    contactId: prod.seller_id,
                    text: `Hi ${prod.seller_name}, I am interested in "${prod.title}". I am offering TZS ${Number(offerAmount).toLocaleString()}. Do you accept?`
                });
                return true;
            } catch (chatErr) {
                console.error("Failed to route marketplace offer message container:", chatErr);
                return false;
            }
        }
        return false;
    }
}

window.ZukaMarketplace = new ZukaMarketplaceEngine();
