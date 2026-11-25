/**
 * ZUKA - Ads Manager Engine (ads.js)
 * 100% English
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

window.ZukaAds = {
    /**
     * Boost an existing post by committing an ad tracking row document straight to Supabase
     */
    async boostPost({ postId, budget, durationDays, targetLocation, ageMin, ageMax, paymentMethod }) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) throw new Error('Please log in first to create an ad.');

        const newAd = {
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

        const { data, error } = await window.supabaseClient
            .from('ads')
            .insert([newAd])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Fetch active promotional campaigns across the network directly via Supabase select queries
     */
    async getAds() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const { data: ads, error } = await window.supabaseClient
            .from('ads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching advertisements from Supabase:", error);
            return [];
        }

        return ads || [];
    }
};
