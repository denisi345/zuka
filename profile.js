/**
 * ZUKA Super App - User Profile Engine (profile.js)
 * Implements full Facebook-style user profile: Cover photo, Avatar, Bio, Details,
 * My Posts, Photos, Videos, and Blue Tick Verification submission.
 */

class ZukaProfileEngine {
    constructor() {}

    getProfileData(userId) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const users = window.ZukaDB.get('users');
        const target = userId ? (users.find(u => u.id === userId) || currentUser) : currentUser;

        const posts = window.ZukaDB.get('posts').filter(p => p.user_id === (target ? target.id : ''));
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
        if (!currentUser) throw new Error('Ingia kwanza kutuma maombi ya Blue Tick.');

        const reqs = window.ZukaDB.get('verification_requests') || [];
        const newReq = {
            id: 'verif_' + Date.now(),
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            category,
            reason,
            document_url: documentUrl || 'Kitambulisho_cha_NIDA.jpg',
            status: 'pending',
            created_at: new Date().toISOString()
        };

        reqs.unshift(newReq);
        window.ZukaDB.set('verification_requests', reqs);
        return newReq;
    }
}

window.ZukaProfile = new ZukaProfileEngine();
