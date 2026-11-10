/**
 * ZUKA Super App - Owner Secret Panel Engine (admin.js)
 * Implements Mark Zuckerberg-level super-admin control across all ZUKA.
 * Validates role = 'owner' against `zuka_owners` table.
 * Controls moderation queue with AI Learning feedback, users ban/verify/delete, posts, groups, live streams, and logs.
 */

class ZukaOwnerAdminEngine {
    constructor() {
        this.currentOwner = null;
        this.currentTab = 'dashboard';
        this.checkExistingSession();
    }

    checkExistingSession() {
        const raw = sessionStorage.getItem('zuka_owner_session');
        if (raw) {
            try {
                this.currentOwner = JSON.parse(raw);
            } catch (e) {
                this.currentOwner = null;
            }
        }
    }

    /**
     * Authenticate Owner against table `zuka_owners`
     */
    async loginOwner(username, password) {
        const owners = window.ZukaDB.get('zuka_owners');
        const owner = owners.find(o => o.owner_username === username && o.role === 'owner');

        if (!owner) {
            this.logOwnerAction('FAILED_LOGIN', null, `Jaribio la kuingia kwa jina lisilo sahihi: ${username}`);
            throw new Error('Akaunti ya Mmiliki wa ZUKA haijapatikana au huna mamlaka ya "owner".');
        }

        // Verify password against stored hash/credential
        if (owner.password_hash !== password) {
            this.logOwnerAction('FAILED_LOGIN', owner.id, 'Nenosiri lisilo sahihi.');
            throw new Error('Nenosiri la Mmiliki wa ZUKA si sahihi.');
        }

        // Record successful login
        owner.last_login = new Date().toISOString();
        window.ZukaDB.update('zuka_owners', owner.id, owner);

        this.currentOwner = owner;
        sessionStorage.setItem('zuka_owner_session', JSON.stringify(owner));
        this.logOwnerAction('OWNER_LOGIN', owner.id, 'Mmiliki wa ZUKA ameingia kwenye Secret Panel');

        return owner;
    }

    logoutOwner() {
        if (this.currentOwner) {
            this.logOwnerAction('OWNER_LOGOUT', this.currentOwner.id, 'Mmiliki wa ZUKA ametoka');
        }
        this.currentOwner = null;
        sessionStorage.removeItem('zuka_owner_session');
        window.location.reload();
    }

    getStats() {
        const users = window.ZukaDB.get('users');
        const posts = window.ZukaDB.get('posts');
        const reports = window.ZukaDB.get('reports');
        const groups = window.ZukaDB.get('groups');
        const lives = window.ZukaDB.get('lives');
        const aiFlags = window.ZukaDB.get('ai_flags');

        return {
            totalUsers: users.length,
            totalPosts: posts.length,
            totalReports: reports.filter(r => r.status === 'pending').length,
            totalGroups: groups.length,
            activeLives: lives.filter(l => l.is_active).length,
            aiFlagsCount: aiFlags.length,
            storageUsedMb: (users.length * 1.5 + posts.length * 2.8).toFixed(1)
        };
    }

    getReports() {
        return window.ZukaDB.get('reports');
    }

    getUsers() {
        return window.ZukaDB.get('users');
    }

    getPosts() {
        return window.ZukaDB.get('posts');
    }

    getGroups() {
        return window.ZukaDB.get('groups');
    }

    getPages() {
        return window.ZukaDB.get('pages');
    }

    getLives() {
        return window.ZukaDB.get('lives');
    }

    getVerificationRequests() {
        return window.ZukaDB.get('verification_requests') || [];
    }

    getActionLogs() {
        return window.ZukaDB.get('owner_actions') || [];
    }

    // Owner Moderation Actions with AI Learning
    ownerResolveReport(reportId, action, termToLearn = '') {
        const reports = window.ZukaDB.get('reports');
        const rep = reports.find(r => r.id === reportId);
        if (!rep) return;

        rep.status = 'resolved';
        rep.action_taken = action;
        window.ZukaDB.set('reports', reports);

        // AI Feedback Learning
        if (window.ZukaAIModerator) {
            window.ZukaAIModerator.learnOwnerDecision(action, termToLearn || rep.snippet);
        }

        // If action was DELETE, delete the underlying content
        if (action === 'DELETE' && rep.content_id) {
            let posts = window.ZukaDB.get('posts');
            posts = posts.filter(p => p.id !== rep.content_id);
            window.ZukaDB.set('posts', posts);
        }

        this.logOwnerAction(`RESOLVE_REPORT_${action}`, rep.id, `Report #${reportId} iliamuliwa kuwa ${action}`);
    }

    // User Controls
    toggleBanUser(userId) {
        const users = window.ZukaDB.get('users');
        const u = users.find(user => user.id === userId);
        if (!u) return;

        u.is_banned = !u.is_banned;
        window.ZukaDB.set('users', users);
        this.logOwnerAction(u.is_banned ? 'BAN_USER' : 'UNBAN_USER', userId, `Mtumiaji @${u.username} amewekewa marufuku: ${u.is_banned}`);
        return u.is_banned;
    }

    toggleVerifyUser(userId) {
        const users = window.ZukaDB.get('users');
        const u = users.find(user => user.id === userId);
        if (!u) return;

        u.is_verified = !u.is_verified;
        window.ZukaDB.set('users', users);
        this.logOwnerAction('VERIFY_USER', userId, `Mtumiaji @${u.username} amepewa Blue Tick: ${u.is_verified}`);
        return u.is_verified;
    }

    deleteUserAccount(userId) {
        if (!confirm('Je, una uhakika wa kumfuta mtumiaji huyu kabisa kutoka mfumo mzima wa ZUKA?')) return;
        window.ZukaDB.delete('users', userId);
        this.logOwnerAction('DELETE_USER_PERMANENT', userId, 'Akaunti ya mtumiaji imefutwa kabisa na Mmiliki');
    }

    // Content Controls
    ownerDeletePost(postId) {
        let posts = window.ZukaDB.get('posts');
        posts = posts.filter(p => p.id !== postId);
        window.ZukaDB.set('posts', posts);
        this.logOwnerAction('OWNER_DELETE_POST', postId, 'Chapisho limefutwa na Mmiliki wa ZUKA');
    }

    ownerHidePost(postId) {
        const posts = window.ZukaDB.get('posts');
        const p = posts.find(post => post.id === postId);
        if (p) {
            p.is_hidden = !p.is_hidden;
            window.ZukaDB.set('posts', posts);
            this.logOwnerAction('OWNER_HIDE_POST', postId, `Chapisho limefichwa: ${p.is_hidden}`);
        }
    }

    // Group Controls
    ownerDeleteGroup(groupId) {
        if (!confirm('Je, una uhakika wa kufuta kundi hili kabisa kutoka ZUKA?')) return;
        window.ZukaDB.delete('groups', groupId);
        this.logOwnerAction('OWNER_DELETE_GROUP', groupId, 'Kundi limefutwa kabisa na Mmiliki wa ZUKA');
    }

    ownerWarnGroupAdmin(groupId, warningText) {
        alert(`Onyo rasmi limetumwa kwa Msimamizi wa Kundi: "${warningText}"`);
        this.logOwnerAction('WARN_GROUP_ADMIN', groupId, `Onyo kwa admin: ${warningText}`);
    }

    // Live Controls
    ownerEndLive(liveId) {
        const lives = window.ZukaDB.get('lives');
        const live = lives.find(l => l.id === liveId);
        if (live) {
            live.is_active = false;
            window.ZukaDB.set('lives', lives);
            this.logOwnerAction('OWNER_SHUTDOWN_LIVE', liveId, 'Mubashara umesitishwa mara moja na Mmiliki wa ZUKA');
        }
    }

    // Verification Approval
    approveVerification(requestId) {
        const reqs = window.ZukaDB.get('verification_requests') || [];
        const req = reqs.find(r => r.id === requestId);
        if (req) {
            req.status = 'approved';
            window.ZukaDB.set('verification_requests', reqs);
            this.toggleVerifyUser(req.user_id);
            this.logOwnerAction('APPROVE_VERIFICATION', req.id, `Maombi ya uthibitisho kwa @${req.user_name} yamekubaliwa`);
        }
    }

    rejectVerification(requestId) {
        const reqs = window.ZukaDB.get('verification_requests') || [];
        const req = reqs.find(r => r.id === requestId);
        if (req) {
            req.status = 'rejected';
            window.ZukaDB.set('verification_requests', reqs);
            this.logOwnerAction('REJECT_VERIFICATION', req.id, `Maombi ya uthibitisho kwa @${req.user_name} yamekataliwa`);
        }
    }

    changeOwnerPassword(newPassword) {
        if (!this.currentOwner) return;
        this.currentOwner.password_hash = newPassword;
        window.ZukaDB.update('zuka_owners', this.currentOwner.id, this.currentOwner);
        sessionStorage.setItem('zuka_owner_session', JSON.stringify(this.currentOwner));
        alert('Nenosiri la siri la Mmiliki wa ZUKA limebadilishwa kikamilifu!');
        this.logOwnerAction('CHANGE_OWNER_PASSWORD', this.currentOwner.id, 'Nenosiri la Mmiliki limebadilishwa');
    }

    logOwnerAction(actionType, targetId, notes) {
        const logs = window.ZukaDB.get('owner_actions') || [];
        logs.unshift({
            id: 'act_' + Date.now(),
            owner_id: this.currentOwner ? this.currentOwner.owner_username : 'system',
            action_type: actionType,
            target_id: targetId,
            notes,
            created_at: new Date().toISOString()
        });
        window.ZukaDB.set('owner_actions', logs);
    }
}

window.ZukaOwnerAdmin = new ZukaOwnerAdminEngine();
