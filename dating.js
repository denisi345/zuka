/**
 * ZUKA Super App - Dating Engine (dating.js)
 * Implements Facebook-style Dating profile, match cards swipe/pass/like, and match chat.
 */

class ZukaDatingEngine {
    constructor() {
        this.initDatingProfiles();
    }

    initDatingProfiles() {
        let profiles = window.ZukaDB.get('dating_profiles');
        if (profiles.length === 0) {
            profiles = [
                {
                    id: 'date_01',
                    name: 'Amina Rashid',
                    age: 24,
                    location: 'Mikocheni, Dar es Salaam',
                    bio: 'Napenda kusafiri, muziki wa acoustic na kujifunza vitu vipya kila siku. Tafadhali uwe mcheshi na mstaarabu!',
                    photos: [
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
                        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600'
                    ],
                    interests: ['Muziki', 'Kusafiri', 'Kusoma Vitabu', 'Kahawa'],
                    work: 'Graphic Designer'
                },
                {
                    id: 'date_02',
                    name: 'Neema Mwangi',
                    age: 26,
                    location: 'Sinza, Dar es Salaam',
                    bio: 'Mjasiriamali, mpenzi wa afya na fitness. Natafuta rafiki wa kweli mwenye malengo ya maisha.',
                    photos: [
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'
                    ],
                    interests: ['Fitness', 'Biashara', 'Kupika', 'Movies'],
                    work: 'Fitness Instructor'
                }
            ];
            window.ZukaDB.set('dating_profiles', profiles);
        }
    }

    getProfiles() {
        return window.ZukaDB.get('dating_profiles');
    }

    likeProfile(profileId) {
        const profiles = this.getProfiles();
        const p = profiles.find(item => item.id === profileId);
        if (p) {
            alert(`🎉 Ni Match na ${p.name}! Unaweza kuanza kupiga soga naye kwenye ZUKA Messenger.`);
            if (window.ZukaChat) {
                window.ZukaChat.sendMessage({
                    contactId: p.id,
                    text: `Habari ${p.name}! Tumelingana (Match) kwenye ZUKA Dating! Habari yako? ✨`
                });
            }
        }
    }

    passProfile(profileId) {
        // Just swipe next
        console.log("Passed profile:", profileId);
    }
}

window.ZukaDating = new ZukaDatingEngine();
