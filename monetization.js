/**
 * ZUKA Super App - Monetization Engine (monetization.js)
 * Implements Creator Mode earnings, sending Stars, and subscriptions.
 */

window.ZukaMonetization = {
    sendStars(postId, recipientId, amount = 50) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Ingia kwanza kutuma Stars.');

        if ((currentUser.stars_balance || 0) < amount) {
            throw new Error(`Salio lako la Stars halitoshi (Una Stars ${currentUser.stars_balance || 0}). Nunua Stars zaidi.`);
        }

        currentUser.stars_balance -= amount;
        window.ZukaAuth.setCurrentUser(currentUser);

        // Record star transaction
        const starsLog = window.ZukaDB.get('stars') || [];
        starsLog.push({
            id: 'star_' + Date.now(),
            sender_id: currentUser.id,
            recipient_id: recipientId,
            post_id: postId,
            amount,
            created_at: new Date().toISOString()
        });
        window.ZukaDB.set('stars', starsLog);

        alert(`⭐ Umefanikiwa kumtumia muumbaji Stars ${amount}!`);
        return true;
    },

    buyStars(packageAmount, costTzs, method = 'M-Pesa') {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) return;
        currentUser.stars_balance = (currentUser.stars_balance || 0) + packageAmount;
        window.ZukaAuth.setCurrentUser(currentUser);
        alert(`⭐ Umefanikiwa kununua Stars ${packageAmount} kupitia ${method} (TZS ${costTzs.toLocaleString()})!`);
        return currentUser.stars_balance;
    }
};
