/**
 * ZUKA - Ads Manager Engine (ads.js)
 * 100% English
 */

window.ZukaAds = {
    boostPost({ postId, budget, durationDays, targetLocation, ageMin, ageMax, paymentMethod }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to create an ad.');

        const newAd = {
            id: 'ad_' + Date.now(),
            user_id: currentUser.id,
            post_id: postId,
            budget: Number(budget),
            duration_days: durationDays || 5,
            target_location: targetLocation || '',
            age_range: `${ageMin || 18} - ${ageMax || 65}`,
            payment_method: paymentMethod || '',
            status: 'Under Review',
            impressions: 0,
            clicks: 0,
            created_at: new Date().toISOString()
        };

        const ads = window.ZukaDB.get('ads') || [];
        ads.unshift(newAd);
        window.ZukaDB.set('ads', ads);
        return newAd;
    },

    getAds() {
        return window.ZukaDB.get('ads') || [];
    }
};
