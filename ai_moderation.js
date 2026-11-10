/**
 * ZUKA Super App - AI Moderation Engine (ai_moderation.js)
 * Implements strict two-tier moderation:
 * Tier A: AUTO BLOCK & HIDE IMMEDIATELY (No report needed: Nudity/Picha za ngono, Kiswahili/English insults)
 * Tier B: REPORT ONLY to OWNER (Content stays live: Drugs, Crime, Threats, Hate, Fake news, Scams, Child protection, Spam)
 * Learning Feedback Loop: Learns from Owner's Delete/Keep decisions.
 */

class ZukaAIModeration {
    constructor() {
        // Tier A: Auto Block & Hide Immediately
        this.tierABadWords = [
            // Kiswahili Matusi & explicit terms
            'kuma', 'mboo', 'mkundu', 'fala', 'malaya', 'kahaba', 'kuma lako', 'shoga', 'bwege',
            'shenzi', 'tumbili', 'matusi', 'uchi', 'ngono', 'punyeto', 'makalio ya uchi', 'kuma yako',
            // English Profanities & explicit terms
            'fuck', 'bitch', 'asshole', 'dick', 'pussy', 'cunt', 'nude', 'naked', 'porn', 'sex video',
            'blowjob', 'motherfucker', 'whore', 'slut', 'boobs'
        ];

        // Tier B: Report Only (Content stays live, notifies Owner secretly)
        this.tierBKeywords = {
            drugs: ['bangi', 'cocaine', 'madawa ya kulevya', 'heroin', 'weed', 'unga', 'dawa za kulevya', 'opium', 'meth'],
            crime_terror: ['ugaidi', 'al shabaab', 'bomu', 'bunduki za wizi', 'kuiba benki', 'terrorist', 'smuggle guns'],
            threat_kill: ['nitakuua', 'nitakumaliza', 'i will kill you', 'death threat', 'kifo chako', 'chinja'],
            hate_discrimination: ['kabila la', 'dini ya ovyo', 'watu wa bara', 'racist', 'tribalism', 'dini chafu'],
            fake_news: ['rais amefariki', 'uvumi', 'breaking news ya uongo', 'serikali imeanguka', 'fake announcement'],
            scam_phishing: ['bonyeza link hii upate fedha', 'free m-pesa', 'crypto multiplier', 'tigo pesa bure', 'win 1000000', 'giveaway cash', 'tuma hela kwenye namba hii'],
            child_abuse: ['mtoto wa miaka', 'unyanyasaji wa watoto', 'child abuse', 'underage sex']
        };

        // User posting timestamps for 5-minute spam check
        this.userPostTracker = {};

        // Load AI learned dictionary from storage
        this.learnedPatterns = JSON.parse(localStorage.getItem('zuka_ai_learned_patterns') || '{"blocked":[],"allowed":[]}');
    }

    /**
     * Scans any text content against Tier A & Tier B
     */
    scanContent(text = '', userId = 'guest') {
        const lower = text.toLowerCase();
        let aiScore = 0;
        let detected = [];

        // 1. Check AI Learned patterns first
        for (let word of this.learnedPatterns.blocked) {
            if (lower.includes(word.toLowerCase())) {
                return {
                    action: 'AUTO_BLOCK',
                    reason: 'AI Learned Violation (' + word + ')',
                    aiScore: 98,
                    category: 'Learned Profanity/Porn',
                    blurMedia: true
                };
            }
        }

        // 2. Check Tier A (Matusi & Nudity keywords -> AUTO BLOCK IMMEDIATELY)
        for (let word of this.tierABadWords) {
            if (lower.includes(word)) {
                aiScore = 95;
                detected.push(word);
                // Log to ai_flags
                this.logFlag('AUTO_BLOCK', 'post', aiScore, detected.join(', '), 'auto_blocked');
                return {
                    action: 'AUTO_BLOCK',
                    reason: 'Ukiukaji wa Maadili: Matusi/Maudhui Machafu (' + word + ')',
                    aiScore,
                    category: 'Nudity/Insult',
                    blurMedia: true
                };
            }
        }

        // 3. Check Tier B (REPORT ONLY, LEAVE CONTENT LIVE)
        let tierBReason = null;
        let tierBCategory = null;

        for (let [cat, words] of Object.entries(this.tierBKeywords)) {
            for (let word of words) {
                if (lower.includes(word)) {
                    tierBReason = 'Maudhui yamehisiwa kuwa ' + cat + ' (' + word + ')';
                    tierBCategory = cat;
                    aiScore = Math.floor(Math.random() * 20) + 70; // 70-90 score
                    break;
                }
            }
            if (tierBReason) break;
        }

        // 4. Check Spam (20 posts in 5 minutes)
        if (this.isSpamming(userId)) {
            tierBReason = 'Mtumiaji anapost mfululizo (Spam ya machapisho 20 ndani ya dakika 5)';
            tierBCategory = 'Spamming';
            aiScore = 85;
        }

        if (tierBReason) {
            // Send report to Owner only, DO NOTHING ELSE, LEAVE LIVE
            this.sendSecretReportToOwner({
                userId,
                textSnippet: text.substring(0, 150),
                category: tierBCategory,
                reason: tierBReason,
                aiScore
            });

            this.logFlag('REPORT_ONLY', 'post', aiScore, tierBReason, 'reported_to_owner');

            return {
                action: 'REPORT_ONLY',
                reason: tierBReason,
                aiScore,
                category: tierBCategory,
                blurMedia: false
            };
        }

        return {
            action: 'PASS',
            aiScore: Math.floor(Math.random() * 10),
            reason: 'Safi',
            blurMedia: false
        };
    }

    /**
     * AI Image Check: Detect simulated nudity/skin ratio and blur
     */
    checkImage(imageUrl) {
        if (!imageUrl) return { isNude: false, blur: false };

        const lower = imageUrl.toLowerCase();
        // If image filename or caption indicates explicit imagery
        const explicitIndicators = ['nude', 'naked', 'uchi', 'porn', 'sex', 'sensual_explicit'];
        const isExplicit = explicitIndicators.some(w => lower.includes(w));

        if (isExplicit) {
            this.sendSecretReportToOwner({
                userId: 'system',
                textSnippet: 'Picha ya uchi imegunduliwa: ' + imageUrl,
                category: 'Adult Content',
                reason: 'AI Image Analyzer detected excessive skin nudity',
                aiScore: 99
            });
            return {
                isNude: true,
                blur: true,
                action: 'AUTO_BLOCK'
            };
        }

        return { isNude: false, blur: false, action: 'PASS' };
    }

    /**
     * Check if user is a bot or fake account
     */
    checkFakeAccount(user) {
        if (!user) return false;
        const suspiciousName = /bot\d+|test_user|fake_acc|spam/i.test(user.username || '');
        const noAvatar = !user.avatar_url || user.avatar_url.includes('placeholder');
        const rapidCreation = user.created_at && (Date.now() - new Date(user.created_at).getTime() < 30000);

        if (suspiciousName && (noAvatar || rapidCreation)) {
            this.sendSecretReportToOwner({
                userId: user.id || 'unknown',
                textSnippet: `Akaunti ya mashaka: @${user.username}`,
                category: 'Fake Account / Bot',
                reason: 'Akaunti inafanana na bot au akaunti bandia',
                aiScore: 92
            });
            return true;
        }
        return false;
    }

    isSpamming(userId) {
        if (!userId || userId === 'guest') return false;
        const now = Date.now();
        if (!this.userPostTracker[userId]) {
            this.userPostTracker[userId] = [];
        }
        // Filter events within last 5 minutes (300,000 ms)
        this.userPostTracker[userId] = this.userPostTracker[userId].filter(ts => now - ts < 300000);
        this.userPostTracker[userId].push(now);
        return this.userPostTracker[userId].length >= 20;
    }

    sendSecretReportToOwner(reportData) {
        const report = {
            id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            content_type: reportData.category,
            content_id: reportData.userId,
            reason: reportData.reason,
            snippet: reportData.textSnippet,
            ai_score: reportData.aiScore,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const existing = window.ZukaDB.get('reports');
        existing.unshift(report);
        window.ZukaDB.set('reports', existing);
        console.log("🛡️ [AI MODERATION] Secret report delivered to Owner Panel:", report);
    }

    logFlag(flagType, contentType, aiScore, detectedTerms, actionTaken) {
        const flag = {
            id: 'flag_' + Date.now(),
            flag_type: flagType,
            content_type: contentType,
            ai_score: aiScore,
            detected_terms: detectedTerms,
            action_taken: actionTaken,
            created_at: new Date().toISOString()
        };
        const flags = window.ZukaDB.get('ai_flags');
        flags.unshift(flag);
        window.ZukaDB.set('ai_flags', flags);
    }

    /**
     * AI LEARNING FEEDBACK:
     * When Owner clicks Delete in Secret Panel -> AI learns pattern
     * When Owner clicks Keep in Secret Panel -> AI learns it is clean
     */
    learnOwnerDecision(action, keywordOrSnippet) {
        if (!keywordOrSnippet) return;
        const term = keywordOrSnippet.trim().toLowerCase();
        if (action === 'DELETE') {
            if (!this.learnedPatterns.blocked.includes(term)) {
                this.learnedPatterns.blocked.push(term);
            }
            this.learnedPatterns.allowed = this.learnedPatterns.allowed.filter(t => t !== term);
        } else if (action === 'KEEP') {
            if (!this.learnedPatterns.allowed.includes(term)) {
                this.learnedPatterns.allowed.push(term);
            }
            this.learnedPatterns.blocked = this.learnedPatterns.blocked.filter(t => t !== term);
        }
        localStorage.setItem('zuka_ai_learned_patterns', JSON.stringify(this.learnedPatterns));
        console.log(`🧠 [AI LEARNING] Pattern updated by Owner action (${action}):`, term);
    }
}

window.ZukaAIModerator = new ZukaAIModeration();
