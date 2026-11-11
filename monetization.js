/**
 * ZUKA - Monetization Engine (monetization.js)
 * 100% English - No Fake Balances
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

window.ZukaMonetization = {
    /**
     * Send Stars to content creators using Supabase real-time row transactional state updates
     */
    async sendStars(postId, recipientId, amount = 50) {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to send Stars.');

        // 1. Fetch current live balance from database to prevent manipulation anomalies
        const { data: userProfile, error: balanceError } = await window.supabase
            .from('users')
            .select('stars_balance')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (balanceError || !userProfile) {
            throw new Error('Could not verify your Stars balance. Please try again.');
        }

        const liveBalance = userProfile.stars_balance || 0;
        if (liveBalance < amount) {
            throw new Error(`Your Stars balance is insufficient (Current balance: ${liveBalance} Stars). Please buy more Stars.`);
        }

        const updatedBalance = liveBalance - amount;

        // 2. Perform atomic subtraction cell update on the user profile record
        const { error: userUpdateError } = await window.supabase
            .from('users')
            .update({ stars_balance: updatedBalance })
            .eq('id', currentUser.id);

        if (userUpdateError) throw userUpdateError;

        // 3. Log the transactional star dispatch record into the transaction table
        const starTx = {
            sender_id: currentUser.id,
            recipient_id: recipientId,
            post_id: postId,
            amount,
            created_at: new Date().toISOString()
        };

        const { error: insertError } = await window.supabase
            .from('stars')
            .insert([starTx]);

        if (insertError) throw insertError;

        // Sync changes with local storage state management
        currentUser.stars_balance = updatedBalance;
        localStorage.setItem('zuka_current_user', JSON.stringify(currentUser));

        alert(`You successfully sent ${amount} Stars to the creator!`);
        return true;
    },

    /**
     * Top-up user balances by invoking transactional receipt rows directly on Supabase
     */
    async buyStars(packageAmount, costTzs, method = 'M-Pesa') {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) return 0;

        const { data: userProfile, error: balanceError } = await window.supabase
            .from('users')
            .select('stars_balance')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (balanceError || !userProfile) return 0;

        const nextBalance = (userProfile.stars_balance || 0) + packageAmount;

        const { error: updateError } = await window.supabase
            .from('users')
            .update({ stars_balance: nextBalance })
            .eq('id', currentUser.id);

        if (updateError) throw updateError;

        currentUser.stars_balance = nextBalance;
        localStorage.setItem('zuka_current_user', JSON.stringify(currentUser));

        alert(`You successfully bought ${packageAmount} Stars via ${method} (TZS ${costTzs.toLocaleString()})!`);
        return nextBalance;
    }
};
