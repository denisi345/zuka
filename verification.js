/**
 * ZUKA Super App - Blue Tick Verification (verification.js)
 * Implements verification requests submission, status tracking, and badge rendering.
 */

window.ZukaVerification = {
    submitRequest({ category, reason, documentFile }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('You must log in first.');

        const reqs = window.ZukaDB.get('verification_requests') || [];
        const newReq = {
            id: 'verif_' + Date.now(),
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            category: category || 'Creator',
            reason: reason || 'Verify official identity',
            document_url: documentFile ? documentFile.name : null,
            document_name: documentFile ? documentFile.name : null,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        reqs.unshift(newReq);
        window.ZukaDB.set('verification_requests', reqs);
        return newReq;
    },

    getPendingRequests() {
        return (window.ZukaDB.get('verification_requests') || []).filter(r => r.status === 'pending');
    },

    getUserRequest(userId) {
        return (window.ZukaDB.get('verification_requests') || []).find(r => r.user_id === userId) || null;
    },

    approveRequest(requestId) {
        const req = (window.ZukaDB.get('verification_requests') || []).find(r => r.id === requestId);
        if (!req) throw new Error('Request not found.');
        window.ZukaDB.update('verification_requests', requestId, { status: 'approved' });
        window.ZukaDB.update('users', req.user_id, { is_verified: true });
        return true;
    },

    rejectRequest(requestId) {
        const req = (window.ZukaDB.get('verification_requests') || []).find(r => r.id === requestId);
        if (!req) throw new Error('Request not found.');
        window.ZukaDB.update('verification_requests', requestId, { status: 'rejected' });
        return true;
    },

    renderBadge(user) {
        if (!user || !user.is_verified) return '';
        return '<span class="blue-tick-badge" title="Verified">✓</span>';
    }
};
