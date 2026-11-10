/**
 * ZUKA - Monetization Engine (monetization.js)
 * 100% English - No Fake Balances
 */

window.ZukaMonetization = {
    sendStars(postId, recipientId, amount = 50) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to send Stars.');

        if ((currentUser.stars_balance || 0) < amount) {
            throw new Error(`Your Stars balance is not enough (You have ${currentUser.stars_balance || 0} Stars). Buy more Stars.`);
        }

        currentUser.stars_balance -= amount;
        window.ZukaAuth.setCurrentUser(currentUser);

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

        alert(`You successfully sent ${amount} Stars to the creator!`);
        return true;
    },

    buyStars(packageAmount, costTzs, method = 'M-Pesa') {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) return;
        currentUser.stars_balance = (currentUser.stars_balance || 0) + packageAmount;
        window.ZukaAuth.setCurrentUser(currentUser);
        alert(`You successfully bought ${packageAmount} Stars via ${method} (TZS ${costTzs.toLocaleString()})!`);
        return currentUser.stars_balance;
    }
};
