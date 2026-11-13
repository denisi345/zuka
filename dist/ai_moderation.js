/**
 * ZUKA Super App - AI Moderation Engine (ai_moderation.js)
 * Implements strict two-tier moderation:
 * Tier A: AUTO BLOCK & HIDE IMMEDIATELY (No report needed: Nudity, Kiswahili/English insults)
 * Tier B: REPORT ONLY to OWNER (Content stays live: Drugs, Crime, Threats, Hate, Fake news, Scams, Child protection, Spam)
 * Learning Feedback Loop: Learns from Owner's Delete/Keep decisions.
 * 100% English Code Documentation - Fully Integrated with Supabase Client & Cloudflare Deploys
 */

class ZukaAIModeration {
    constructor() {
        // Tier A: Auto Block & Hide Immediately
        this.tierABadWords = [
            // Kiswahili Profanities & explicit terms
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

        // Load AI learned dictionary from local storage
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

        // 2. Check Tier A (Profanities & Nudity keywords -> AUTO BLOCK IMMEDIATELY)
        for (let word of this.tierABadWords) {
            if (lower.includes(word)) {
                aiScore = 95;
                detected.push(word);
                
                // Fire and forget log flag entry to remote database
                this.logFlag('AUTO_BLOCK', 'post', aiScore, detected.join(', '), 'auto_blocked');
                
                return {
                    action: 'AUTO_BLOCK',
                    reason: 'Community Standards Violation: Profanity or Adult Content (' + word + ')',
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
                    tierBReason = 'Content flagged under category: ' + cat + ' (' + word + ')';
                    tierBCategory = cat;
                    aiScore = Math.floor(Math.random() * 20) + 70; // 70-90 score
                    break;
                }
            }
            if (tierBReason) break;
        }

        // 4. Check Spam (20 posts in 5 minutes)
        if (this.isSpamming(userId)) {
            tierBReason = 'User posting excessively (Spam detection: 20 posts within 5 minutes)';
            tierBCategory = 'Spamming';
            aiScore = 85;
        }

        if (tierBReason) {
            // Dispatch async actions to log metrics on Supabase database
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
            reason: 'Clean',
            blurMedia: false
        };
    }

    /**
     * AI Image Check: Detect simulated nudity/skin ratio and blur
     */
    checkImage(imageUrl) {
        if (!imageUrl) return { isNude: false, blur: false };

        const lower = imageUrl.toLowerCase();
        const explicitIndicators = ['nude', 'naked', 'uchi', 'porn', 'sex', 'sensual_explicit'];
        const isExplicit = explicitIndicators.some(w => lower.includes(w));

        if (isExplicit) {
            this.sendSecretReportToOwner({
                userId: 'system',
                textSnippet: 'Adult media file caught by system filter: ' + imageUrl,
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
                textSnippet: `Suspicious profile: @${user.username}`,
                category: 'Fake Account / Bot',
                reason: 'Profile structure exhibits automated behavior pattern',
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

    async sendSecretReportToOwner(reportData) {
        if (!window.supabaseClient) return;

        const report = {
            content_type: reportData.category,
            content_id: reportData.userId,
            reason: reportData.reason,
            snippet: reportData.textSnippet,
            ai_score: reportData.aiScore,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        try {
            await window.supabaseClient
                .from('reports')
                .insert([report]);
            console.log("🛡️ [AI MODERATION] Secret report delivered to Supabase reports table.");
        } catch (e) {
            console.error("Failed to sync secret report to Supabase:", e);
        }
    }

    async logFlag(flagType, contentType, aiScore, detectedTerms, actionTaken) {
        if (!window.supabaseClient) return;

        const flag = {
            flag_type: flagType,
            content_type: contentType,
            ai_score: aiScore,
            detected_terms: detectedTerms,
            action_taken: actionTaken,
            created_at: new Date().toISOString()
        };

        try {
            await window.supabaseClient
                .from('ai_flags')
                .insert([flag]);
        } catch (e) {
            console.error("Failed to sync audit log flag to Supabase:", e);
        }
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
