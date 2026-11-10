/**
 * ZUKA - Dating Engine (dating.js)
 * 100% English - No Fake Profiles, No Fake Matches
 */

class ZukaDatingEngine {
    constructor() {
        this.initDatingProfiles();
    }

    initDatingProfiles() {
        let profiles = window.ZukaDB.get('dating_profiles');
        if (!profiles) {
            profiles = [];
            window.ZukaDB.set('dating_profiles', profiles);
        }
    }

    getProfiles() {
        return window.ZukaDB.get('dating_profiles') || [];
    }

    likeProfile(profileId) {
        const profiles = this.getProfiles();
        const p = profiles.find(item => item.id === profileId);
        if (!p) return null;

        const matches = window.ZukaDB.get('dating_matches') || [];
        const existing = matches.find(m => m.profile_id === profileId);
        if (existing) return existing;

        const newMatch = {
            id: 'match_' + Date.now().toString(36),
            profile_id: profileId,
            name: p.name || '',
            created_at: new Date().toISOString()
        };
        matches.unshift(newMatch);
        window.ZukaDB.set('dating_matches', matches);
        return newMatch;
    }

    passProfile(profileId) {
        const passed = window.ZukaDB.get('dating_passed') || [];
        if (!passed.includes(profileId)) {
            passed.push(profileId);
            window.ZukaDB.set('dating_passed', passed);
        }
    }
}

window.ZukaDating = new ZukaDatingEngine();
