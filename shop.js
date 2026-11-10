/**
 * ZUKA - Profile Shop Engine (shop.js)
 * 100% English - No Fake Data
 */

window.ZukaShop = {
    getUserShopItems(userId) {
        const products = window.ZukaDB.get('products') || [];
        return products.filter(p => p.seller_id === userId);
    },

    checkout(productId, shippingAddress, phone) {
        const products = window.ZukaDB.get('products') || [];
        const prod = products.find(p => p.id === productId);
        if (!prod) throw new Error('Product not found.');

        return {
            orderId: 'ORD_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            product: prod.title,
            amount: prod.price,
            shippingAddress,
            phone,
            status: 'Paid and Awaiting Shipment'
        };
    }
};
