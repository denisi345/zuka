/**
 * ZUKA - User Profile Engine (profile.js)
 * 100% English - No Fake Data
 */

class ZukaProfileEngine {
    constructor() {}

    getProfileData(userId) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const users = window.ZukaDB.get('users') || [];
        const target = userId ? (users.find(u => u.id === userId) || currentUser) : currentUser;

        const posts = (window.ZukaDB.get('posts') || []).filter(p => p.user_id === (target ? target.id : ''));
        const photos = posts.filter(p => p.media_url && p.media_type === 'image');
        const videos = posts.filter(p => p.media_url && p.media_type === 'video');

        return {
            user: target,
            posts,
            photos,
            videos
        };
    }

    updateBio(newBio) {
        return window.ZukaAuth.updateProfile({ bio: newBio });
    }

    updateDetails({ location, work, education, relationship }) {
        return window.ZukaAuth.updateProfile({ location, work, education, relationship });
    }

    updateAvatar(avatarUrl) {
        return window.ZukaAuth.updateProfile({ avatar_url: avatarUrl });
    }

    updateCover(coverUrl) {
        return window.ZukaAuth.updateProfile({ cover_url: coverUrl });
    }

    requestVerification(category, reason, documentUrl) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to submit a Blue Tick verification request.');

        const reqs = window.ZukaDB.get('verification_requests') || [];
        const newReq = {
            id: 'verif_' + Date.now(),
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            category,
            reason,
            document_url: documentUrl || '',
            status: 'pending',
            created_at: new Date().toISOString()
        };

        reqs.unshift(newReq);
        window.ZukaDB.set('verification_requests', reqs);
        return newReq;
    }
}

window.ZukaProfile = new ZukaProfileEngine();
