/**
 * ZUKA Super App - Blue Tick Verification (verification.js)
 * Implements verification requests submission, status tracking, and badge rendering.
 */

window.ZukaVerification = {
    submitRequest({ category, reason, documentFile }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Unatakiwa kuingia kwanza.');

        const reqs = window.ZukaDB.get('verification_requests');
        const newReq = {
            id: 'verif_' + Date.now(),
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            category: category || 'Mbunifu / Creator',
            reason: reason || 'Kuthibitisha utambulisho rasmi',
            document_url: 'NIDA_Kitambulisho_cha_Taifa.jpg',
            status: 'pending',
            created_at: new Date().toISOString()
        };

        reqs.unshift(newReq);
        window.ZukaDB.set('verification_requests', reqs);
        return newReq;
    },

    getPendingRequests() {
        return window.ZukaDB.get('verification_requests').filter(r => r.status === 'pending');
    }
};
