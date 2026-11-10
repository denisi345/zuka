/**
 * ZUKA - Fundraiser Engine (fundraiser.js)
 * 100% English - No Fake Campaigns, No Fake Donors
 */

class ZukaFundraiserEngine {
    constructor() {
        this.initFundraisers();
    }

    initFundraisers() {
        let funds = window.ZukaDB.get('fundraisers');
        if (!funds) {
            funds = [];
            window.ZukaDB.set('fundraisers', funds);
        }
    }

    getFundraisers() {
        return window.ZukaDB.get('fundraisers') || [];
    }

    donate(fundId, amount, donorName, method = 'M-Pesa') {
        const funds = this.getFundraisers();
        const f = funds.find(item => item.id === fundId);
        if (!f) return null;

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        const finalDonorName = donorName || (currentUser ? currentUser.full_name : 'Anonymous Donor');

        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) throw new Error('Please enter a valid donation amount.');

        f.raised_amount = (f.raised_amount || 0) + numAmount;
        f.donors_count = (f.donors_count || 0) + 1;
        if (!f.donors_list) f.donors_list = [];
        f.donors_list.unshift({
            name: finalDonorName,
            amount: numAmount,
            method,
            time: 'Just now'
        });

        window.ZukaDB.set('fundraisers', funds);
        return f;
    }

    createFundraiser(data) {
        const newFund = {
            id: 'fund_' + Date.now(),
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
        const funds = this.getFundraisers();
        funds.unshift(newFund);
        window.ZukaDB.set('fundraisers', funds);
        return newFund;
    }
}

window.ZukaFundraiser = new ZukaFundraiserEngine();
