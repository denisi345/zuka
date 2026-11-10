/**
 * ZUKA Super App - Fundraiser Engine (fundraiser.js)
 * Implements fundraising campaigns, goal progress bar, donation with mobile money, and donors list.
 */

class ZukaFundraiserEngine {
    constructor() {
        this.initFundraisers();
    }

    initFundraisers() {
        let funds = window.ZukaDB.get('fundraisers');
        if (funds.length === 0) {
            funds = [
                {
                    id: 'fund_01',
                    title: 'Ujenzi wa Maktaba ya Kidijitali kwa Shule za Msingi Vijijini',
                    organizer: 'Elimu Kwanza Foundation',
                    target_amount: 15000000,
                    raised_amount: 9450000,
                    currency: 'TZS',
                    description: 'Mchango wa kununua kompyuta 20 na vitabu vya ziada kwa wanafunzi wa wilaya ya Kisarawe.',
                    cover_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900',
                    donors_count: 148,
                    donors_list: [
                        { name: 'Juma Salum', amount: 50000, method: 'M-Pesa', time: 'Masaa 2 yaliyopita' },
                        { name: 'Sarah Kimaro', amount: 100000, method: 'Tigo Pesa', time: 'Jana' }
                    ]
                }
            ];
            window.ZukaDB.set('fundraisers', funds);
        }
    }

    getFundraisers() {
        return window.ZukaDB.get('fundraisers');
    }

    donate(fundId, amount, donorName = 'Msamaria Mwema', method = 'M-Pesa') {
        const funds = this.getFundraisers();
        const f = funds.find(item => item.id === fundId);
        if (!f) return;

        const numAmount = Number(amount);
        f.raised_amount += numAmount;
        f.donors_count += 1;
        f.donors_list.unshift({
            name: donorName,
            amount: numAmount,
            method,
            time: 'Sasa hivi'
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
            cover_url: data.coverUrl || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb4?w=900',
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
