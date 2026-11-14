/**
 * ZUKA Super App - Owner Secret Panel Engine (admin.js)
 * Implements Supreme Owner super-admin control across all ZUKA.
 * Validates role = 'owner' against `zuka_owners` table on Supabase.
 * Controls moderation queue with AI Learning feedback, user bans/verification/deletion, posts, groups, live streams, and audit logs.
 * 100% English - Fully Integrated with Supabase Client
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
     * Authenticate Owner against remote `zuka_owners` table
     */
    async loginOwner(username, password) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const { data: owner, error } = await window.supabaseClient
            .from('ceo_settings')
            .select('*')
            .eq('owner_username', username)
            .eq('role', 'owner')
            .maybeSingle();

        if (error || !owner) {
            await this.logOwnerAction('FAILED_LOGIN', null, `Failed login attempt with invalid username: ${username}`);
            throw new Error('ZUKA Owner account not found or lacks "owner" privileges.');
        }

        if (owner.password_hash !== password) {
            await this.logOwnerAction('FAILED_LOGIN', owner.id, 'Incorrect password entered.');
            throw new Error('Invalid ZUKA Owner password.');
        }

        const nowIso = new Date().toISOString();
        await window.supabaseClient
            .from('ceo_settings')
            .update({ last_login: nowIso })
            .eq('id', owner.id);

        owner.last_login = nowIso;
        this.currentOwner = owner;
        sessionStorage.setItem('zuka_owner_session', JSON.stringify(owner));
        await this.logOwnerAction('OWNER_LOGIN', owner.id, 'ZUKA Owner signed into the Secret Panel.');

        return owner;
    }

    async logoutOwner() {
        if (this.currentOwner) {
            await this.logOwnerAction('OWNER_LOGOUT', this.currentOwner.id, 'ZUKA Owner signed out.');
        }
        this.currentOwner = null;
        sessionStorage.removeItem('zuka_owner_session');
        window.location.reload();
    }

    async getStats() {
        if (!window.supabaseClient) {
            return {
                totalUsers: 0,
                totalPosts: 0,
                totalReports: 0,
                totalGroups: 0,
                activeLives: 0,
                aiFlagsCount: 0,
                storageUsedMb: '0.0'
            };
        }

        const [
            usersRes,
            postsRes,
            reportsRes,
            groupsRes,
            livesRes,
            flagsRes
        ] = await Promise.all([
            window.supabaseClient.from('profiles').select('*', { count: 'exact', head: true }),
            window.supabaseClient.from('posts').select('*', { count: 'exact', head: true }),
            window.supabaseClient.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            window.supabaseClient.from('groups').select('*', { count: 'exact', head: true }),
            window.supabaseClient.from('lives').select('*', { count: 'exact', head: true }).eq('is_active', true),
            window.supabaseClient.from('ai_flags').select('*', { count: 'exact', head: true })
        ]);

        const totalUsers = usersRes.count || 0;
        const totalPosts = postsRes.count || 0;

        return {
            totalUsers,
            totalPosts,
            totalReports: reportsRes.count || 0,
            totalGroups: groupsRes.count || 0,
            activeLives: livesRes.count || 0,
            aiFlagsCount: flagsRes.count || 0,
            storageUsedMb: (totalUsers * 1.5 + totalPosts * 2.8).toFixed(1)
        };
    }

    async getReports() {
        if (!window.supabaseClient) return [];
        const { data } = await window.supabaseClient
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });
        return data || [];
    }

    async getUsers() {
        if (!window.supabaseClient) return [];
        const { data } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        return data || [];
    }

    async getPosts() {
        if (!window.supabaseClient) return [];
        const { data } = await window.supabaseClient
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        return data || [];
    }

    async getGroups() {
        if (!window.supabaseClient) return [];
        const { data } = await window.supabaseClient
            .from('groups')
            .select('*')
            .order('created_at', { ascending: false });
        return data || [];
    }

    async getPages() {
        if (!window.supabaseClient) return [];
        const { data } = await window.supabaseClient
            .from('pages')
            .select('*')
            .order('created_at', { ascending: false });
        return data || [];
    }

    async getLives() {
        if (!window.supabaseClient) return [];
        const { data } = await window.supabaseClient
            .from('lives')
            .select('*')
            .order('started_at', { ascending: false });
        return data || [];
    }

    async getVerificationRequests() {
        if (!window.supabaseClient) return [];
        const { data } = await window.supabaseClient
            .from('verification_requests')
            .select('*')
            .order('created_at', { ascending: false });
        return data || [];
    }

    async getActionLogs() {
        if (!window.supabaseClient) return [];
        const { data } = await window.supabaseClient
            .from('ceo_panel')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        return data || [];
    }

    // Owner Moderation Actions with AI Learning
    async ownerResolveReport(reportId, action, termToLearn = '') {
        if (!window.supabaseClient) return;

        const { data: rep } = await window.supabaseClient
            .from('reports')
            .select('*')
            .eq('id', reportId)
            .maybeSingle();

        if (!rep) return;

        await window.supabaseClient
            .from('reports')
            .update({ status: 'resolved', action_taken: action })
            .eq('id', reportId);

        if (window.ZukaAIModerator) {
            window.ZukaAIModerator.learnOwnerDecision(action, termToLearn || rep.snippet || rep.reason);
        }

        if (action === 'DELETE' && rep.content_id) {
            await window.supabaseClient
                .from('posts')
                .delete()
                .eq('id', rep.content_id);
        }

        await this.logOwnerAction(`RESOLVE_REPORT_${action}`, rep.id, `Report #${reportId} resolved as ${action}.`);
    }

    // User Controls
    async toggleBanUser(userId) {
        if (!window.supabaseClient) return false;

        const { data: u } = await window.supabaseClient
            .from('profiles')
            .select('username, is_banned')
            .eq('id', userId)
            .maybeSingle();

        if (!u) return false;

        const nextBanStatus = !u.is_banned;
        await window.supabaseClient
            .from('profiles')
            .update({ is_banned: nextBanStatus })
            .eq('id', userId);

        await this.logOwnerAction(
            nextBanStatus ? 'BAN_USER' : 'UNBAN_USER',
            userId,
            `User @${u.username} ban status updated to: ${nextBanStatus}`
        );
        return nextBanStatus;
    }

    async toggleVerifyUser(userId) {
        if (!window.supabaseClient) return false;

        const { data: u } = await window.supabaseClient
            .from('profiles')
            .select('username, is_verified')
            .eq('id', userId)
            .maybeSingle();

        if (!u) return false;

        const nextVerifyStatus = !u.is_verified;
        await window.supabaseClient
            .from('profiles')
            .update({ is_verified: nextVerifyStatus })
            .eq('id', userId);

        await this.logOwnerAction(
            'VERIFY_USER',
            userId,
            `User @${u.username} Blue Tick status updated to: ${nextVerifyStatus}`
        );
        return nextVerifyStatus;
    }

    async deleteUserAccount(userId) {
        if (!window.supabaseClient) return;
        if (!confirm('Are you sure you want to permanently delete this user account from ZUKA?')) return;

        await window.supabaseClient
            .from('profiles')
            .delete()
            .eq('id', userId);

        await this.logOwnerAction('DELETE_USER_PERMANENT', userId, 'User account permanently deleted by Owner.');
    }

    // Content Controls
    async ownerDeletePost(postId) {
        if (!window.supabaseClient) return;

        await window.supabaseClient
            .from('posts')
            .delete()
            .eq('id', postId);

        await this.logOwnerAction('OWNER_DELETE_POST', postId, 'Post deleted by ZUKA Owner.');
    }

    async ownerHidePost(postId) {
        if (!window.supabaseClient) return;

        const { data: p } = await window.supabaseClient
            .from('posts')
            .select('is_hidden')
            .eq('id', postId)
            .maybeSingle();

        if (p) {
            const nextHidden = !p.is_hidden;
            await window.supabaseClient
                .from('posts')
                .update({ is_hidden: nextHidden })
                .eq('id', postId);

            await this.logOwnerAction('OWNER_HIDE_POST', postId, `Post visibility hidden status set to: ${nextHidden}`);
        }
    }

    // Group Controls
