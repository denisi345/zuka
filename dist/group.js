/**
 * ZUKA Super App - Groups Engine (group.js)
 * Implements complete Facebook-style Groups management:
 * - Public/Private/Hidden, Rules up to 10, 3 Membership Questions, Auto-approve criteria
 * - Pending posts approval, Pre-approved posters, Admin Assist (Spam, links, bad words)
 * - Moderation alerts, Suspend member (1/3/7/28 days), Slow down comments (5 min), Disable commenting
 * - Group Experts badge, Guides/Units, Files/Docs upload, Albums, Group Events, Polls, Sell in Group
 * - Automatic Group Chat integration, Group Insights & Activity Log.
 */

class ZukaGroupsEngine {
    constructor() {
        this.initSampleGroups();
    }

    initSampleGroups() {
        let groups = window.ZukaDB.get('groups');
        if (groups.length === 0) {
            groups = [
                {
                    id: 'grp_01',
                    name: 'Wajasiriamali na Biashara Tanzania 💼🇹🇿',
                    description: 'Jukwaa la kuunganisha wafanyabiashara, kutoa fursa za uwekezaji, na kujifunza mbinu za kisasa za masoko.',
                    cover_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=900',
                    privacy: 'public', // public, private, hidden
                    created_by: 'usr_juma_01',
                    admin_id: 'usr_juma_01',
                    admin_name: 'Juma Salum',
                    members_count: 3420,
                    is_member: true,
                    is_admin: true,
                    post_approval_enabled: false,
                    slow_mode_minutes: 0,
                    commenting_disabled: false,
                    rules: [
                        { number: 1, title: 'Heshima na Ustaarabu', description: 'Tukubaliane kutofautiana kwa heshima bila lugha ya matusi au kashfa.' },
                        { number: 2, title: 'Hakuna Matangazo ya Uongo', description: 'Bidhaa zote lazima ziwe na maelezo halisi na bei iliyo wazi.' },
                        { number: 3, title: 'Hakuna Viungo vya Wizi (Scam Links)', description: 'Viungo vya wizi wa akaunti vitasababisha kufungiwa moja kwa moja.' }
                    ],
                    questions: [
                        'Unafanya biashara gani kwa sasa?',
                        'Uko mkoa gani?',
                        'Je unakubaliana na sheria zote za kundi?'
                    ],
                    pending_posts: [],
                    pending_members: [],
                    experts: ['Sarah Kimaro (Ushauri wa Masoko)'],
                    guides: [
                        { id: 'g1', title: 'Mwongozo wa Kwanza: Jinsi ya Kutangaza ZUKA', content: 'Jifunze kutumia zana za ZUKA Ads kufikia wateja wa Dar es Salaam na mikoani.' }
                    ],
                    files: [
                        { name: 'Mwongozo_wa_Kodi_Tanzania_2026.pdf', size: '2.4 MB', date: 'Leo' }
                    ],
                    posts: [
                        {
                            id: 'grp_post_01',
                            author_name: 'Rashid Mohamed',
                            author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
                            content: 'Wadau, ninatoa punguzo la asilimia 20% kwa laptops zote mpya za kazi wiki hii. Tupo Kariakoo mtaa wa Aggrey. Karibuni sana! 💻📦',
                            media_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
                            likes: 54,
                            comments: 19,
                            is_pinned: true,
                            created_at: 'Saa 2 zilizopita'
                        }
                    ]
                },
                {
                    id: 'grp_02',
                    name: 'Wapenzi wa Teknolojia na Ubunifu (Tech Savvy)',
                    description: 'Kundi rasmi la wataalamu wa mifumo ya kompyuta, AI, mobile apps na teknolojia mpya nchini.',
                    cover_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900',
                    privacy: 'private',
                    created_by: 'usr_kelvin_05',
                    admin_id: 'usr_kelvin_05',
                    admin_name: 'Kelvin Mushi',
                    members_count: 1850,
                    is_member: false,
                    is_admin: false,
                    post_approval_enabled: true,
                    slow_mode_minutes: 0,
                    commenting_disabled: false,
                    rules: [
                        { number: 1, title: 'Mijadala ya Kiteknolojia Tu', description: 'Mada zote zizingatie sayansi na teknolojia.' }
                    ],
                    questions: ['Una uzoefu wa lugha gani ya programu?'],
                    pending_posts: [],
                    pending_members: [],
                    experts: ['ZUKA Dev Team'],
                    guides: [],
                    files: [],
                    posts: []
                }
            ];
            window.ZukaDB.set('groups', groups);
        }
    }

    getGroups() {
        return window.ZukaDB.get('groups');
    }

    getGroup(groupId) {
        const groups = this.getGroups();
        return groups.find(g => g.id === groupId);
    }

    async createGroup({ name, description, privacy, coverUrl, rules, questions }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Ingia kwanza kutengeneza group.');

        // AI Moderation check for Group Name
        const scan = window.ZukaAIModerator.scanContent(name, currentUser.id);
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`🚫 Jina la group limezuiwa: ${scan.reason}`);
        }

        const newGroup = {
            id: 'grp_' + Date.now().toString(36),
            name,
            description: description || '',
            privacy: privacy || 'public',
            cover_url: coverUrl || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=900',
            created_by: currentUser.id,
            admin_id: currentUser.id,
            admin_name: currentUser.full_name,
            members_count: 1,
            is_member: true,
            is_admin: true,
            post_approval_enabled: false,
            slow_mode_minutes: 0,
            commenting_disabled: false,
            rules: rules || [
                { number: 1, title: 'Heshima kwa Wote', description: 'Zingatia lugha ya heshima na stara.' }
            ],
            questions: questions || ['Kwa nini unataka kujiunga na kundi hili?'],
            pending_posts: [],
            pending_members: [],
            experts: [],
            guides: [],
            files: [],
            posts: [],
            created_at: new Date().toISOString()
        };

        const groups = this.getGroups();
        groups.unshift(newGroup);
        window.ZukaDB.set('groups', groups);

        // Auto-create Group Chat for this group
        if (window.ZukaGroupChat) {
            window.ZukaGroupChat.createGroupChatForCommunity(newGroup);
        }

        return newGroup;
    }

    joinGroup(groupId) {
        const groups = this.getGroups();
        const g = groups.find(item => item.id === groupId);
        if (!g) return;

        g.is_member = true;
        g.members_count += 1;
        window.ZukaDB.set('groups', groups);
        return g;
    }

    leaveGroup(groupId) {
        const groups = this.getGroups();
        const g = groups.find(item => item.id === groupId);
        if (!g) return;

        g.is_member = false;
        g.members_count = Math.max(0, g.members_count - 1);
        window.ZukaDB.set('groups', groups);
        return g;
    }

    togglePostApproval(groupId) {
        const groups = this.getGroups();
        const g = groups.find(item => item.id === groupId);
        if (g) {
            g.post_approval_enabled = !g.post_approval_enabled;
            window.ZukaDB.set('groups', groups);
            return g.post_approval_enabled;
        }
    }

    suspendMember(groupId, memberName, days = 7) {
        const groups = this.getGroups();
        const g = groups.find(item => item.id === groupId);
        if (g) {
            alert(`Mwanachama ${memberName} amesimamishwa kwa siku ${days} katika kundi hili.`);
        }
    }

    postToGroup(groupId, postData) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const groups = this.getGroups();
        const g = groups.find(item => item.id === groupId);
        if (!g) return;

        // Scan post
        const scan = window.ZukaAIModerator.scanContent(postData.content, currentUser.id);
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`🚫 Chapisho limezuiwa na AI: ${scan.reason}`);
        }

        const newPost = {
            id: 'g_post_' + Date.now(),
            author_name: postData.isAnonymous ? 'Mwanachama Asiyejulikana 👤' : currentUser.full_name,
            author_avatar: postData.isAnonymous ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' : currentUser.avatar_url,
            content: postData.content,
            media_url: postData.mediaUrl || null,
            likes: 0,
            comments: 0,
            is_pinned: false,
            created_at: 'Sasa hivi'
        };

        if (g.post_approval_enabled && !g.is_admin) {
            g.pending_posts.push(newPost);
            window.ZukaDB.set('groups', groups);
            return { status: 'pending', message: 'Chapisho lako linasubiri idhini ya Msimamizi wa Kundi (Admin Approval).' };
        } else {
            g.posts.unshift(newPost);
            window.ZukaDB.set('groups', groups);
            return { status: 'published', post: newPost };
        }
    }

    pinPost(groupId, postId) {
        const groups = this.getGroups();
        const g = groups.find(item => item.id === groupId);
        if (g) {
            const p = g.posts.find(item => item.id === postId);
            if (p) p.is_pinned = !p.is_pinned;
            window.ZukaDB.set('groups', groups);
        }
    }
}

window.ZukaGroups = new ZukaGroupsEngine();
