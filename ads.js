/**
 * ZUKA Super App - Ads Manager Engine (ads.js)
 * Implements Boost Post, Ads Manager, audience targeting, and mobile money payment.
 */

window.ZukaAds = {
    boostPost({ postId, budget, durationDays, targetLocation, ageMin, ageMax, paymentMethod }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Ingia kwanza kutangaza.');

        const newAd = {
            id: 'ad_' + Date.now(),
            user_id: currentUser.id,
            post_id: postId,
            budget: Number(budget),
            duration_days: durationDays || 5,
            target_location: targetLocation || 'Tanzania Nzima',
            age_range: `${ageMin || 18} - ${ageMax || 65}`,
            payment_method: paymentMethod || 'M-Pesa',
            status: 'Inakaguliwa na AI (Active)',
            impressions: 0,
            clicks: 0,
            created_at: new Date().toISOString()
        };

        const ads = window.ZukaDB.get('ads') || [];
        ads.unshift(newAd);
        window.ZukaDB.set('ads', ads);

        alert(`🚀 Tangazo lako la ZUKA limekamilika na limeanza kuwafikia walengwa kupitia ${paymentMethod}! Bajeti: TZS ${Number(budget).toLocaleString()}`);
        return newAd;
    },

    getAds() {
        return window.ZukaDB.get('ads') || [];
    }
};
