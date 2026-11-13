/**
 * ZUKA - Fundraiser Engine (fundraiser.js)
 * 100% English - No Fake Campaigns, No Fake Donors
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaFundraiserEngine {
    constructor() {
        this.initFundraisers();
    }

    initFundraisers() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    async getFundraisers() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const { data: fundraisers, error } = await window.supabaseClient
            .from('fundraisers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching fundraisers from Supabase:", error);
            return [];
        }

        return fundraisers || [];
    }

    async donate(fundId, amount, donorName, method = 'M-Pesa') {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) {
            throw new Error('Please enter a valid donation amount.');
        }

        // 1. Fetch current fundraiser totals and donor sub-arrays from Supabase
        const { data: f, error: fetchError } = await window.supabaseClient
            .from('fundraisers')
            .select('raised_amount, donors_count, donors_list')
            .eq('id', fundId)
            .maybeSingle();

        if (fetchError || !f) {
            throw new Error('Fundraiser campaign not found.');
        }

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        const finalDonorName = donorName || (currentUser ? currentUser.full_name : 'Anonymous Donor');

        const currentDonors = f.donors_list || [];
        currentDonors.unshift({
            name: finalDonorName,
            amount: numAmount,
            method,
            time: new Date().toISOString()
        });

        const nextRaisedAmount = (f.raised_amount || 0) + numAmount;
        const nextDonorsCount = (f.donors_count || 0) + 1;

        // 2. Perform transaction cell update to live remote row columns
        const { data: updatedFund, error: updateError } = await window.supabaseClient
            .from('fundraisers')
            .update({
                raised_amount: nextRaisedAmount,
                donors_count: nextDonorsCount,
                donors_list: currentDonors
            })
            .eq('id', fundId)
            .select()
            .single();

        if (updateError) throw updateError;
        return updatedFund;
    }

    async createFundraiser(data) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const newFund = {
            title: data.title,
            organizer: data.organizer,
            target_amount: Number(data.targetAmount),
            raised_amount: 0,
            currency: 'TZS',
            description: data.description,
            cover_url: data.coverUrl || '',
            donors_count: 0,
            donors_list: [],
            created_at: new Date().toISOString()
        };

        const { data: createdData, error } = await window.supabaseClient
            .from('fundraisers')
            .insert([newFund])
            .select()
            .single();

        if (error) throw error;
        return createdData;
    }
}

window.ZukaFundraiser = new ZukaFundraiserEngine();
