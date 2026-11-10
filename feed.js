/**
 * ZUKA Super App - Feed & Posts Engine (feed.js)
 * Implements rich Facebook-style Feed: Post creation, AI moderation check, reactions (Like/Love/Haha/Wow/Sad/Angry),
 * comments, sharing, poll voting, interleaved news posts, hashtags, and privacy controls.
 * DEFAULT Language: English (US)
 */

class ZukaFeedEngine {
    constructor() {
        this.initSamplePosts();
    }

    initSamplePosts() {
        let posts = window.ZukaDB.get('posts');
        if (posts.length === 0) {
            posts = [
                {
                    id: 'post_init_01',
                    user_id: 'usr_sarah_02',
                    author_name: 'Sarah Jenkins',
                    author_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
                    is_verified: true,
                    content: 'Excited to announce the official opening of our new creative design studio today! 🎨 Huge thanks to everyone who supported this vision from day one. The best is yet to come! ✨🚀 #ZukaCreatives #Design #Innovation',
                    media_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900',
                    media_type: 'image',
                    feeling: '😊 feeling blessed and excited',
                    location_tag: 'San Francisco, California',
                    privacy: 'public',
                    likes_count: 342,
                    comments_count: 58,
                    shares_count: 14,
                    user_reaction: null,
                    comments_list: [
                        { id: 'c1', user_name: 'Emily Davis', user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', text: 'Huge congratulations Sarah! Well deserved! 🔥👏', created_at: '20m ago' },
                        { id: 'c2', user_name: 'Michael Brown', user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', text: 'Awesome milestone! Visiting the studio this Friday!', created_at: '10m ago' }
                    ],
                    created_at: new Date(Date.now() - 7200000).toISOString()
                },
                {
                    id: 'post_init_02',
                    user_id: 'usr_baraka_03',
                    author_name: 'Alex Rivera',
                    author_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
                    is_verified: false,
                    content: 'Sports fans, who do you think takes the championship title this season? Drop your predictions in the poll below! 🏆👇',
                    media_type: 'poll',
                    poll_data: {
                        question: 'Who will win the Championship this year?',
                        options: [
                            { text: 'Golden State 🏀', votes: 412 },
                            { text: 'Boston Celtics ☘️', votes: 530 },
                            { text: 'Denver Nuggets 🏔️', votes: 88 }
                        ],
                        total_votes: 1030
                    },
                    location_tag: 'Chase Center',
                    privacy: 'public',
                    likes_count: 620,
                    comments_count: 142,
                    shares_count: 35,
                    user_reaction: null,
                    comments_list: [],
                    created_at: new Date(Date.now() - 14400000).toISOString()
                }
            ];
            window.ZukaDB.set('posts', posts);
        }
    }

    getFeedPosts() {
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        let posts = window.ZukaDB.get('posts');

        // Filter out hidden or blocked posts
        posts = posts.filter(p => !p.is_hidden);

        if (currentUser && currentUser.blocked_users && currentUser.blocked_users.length) {
            posts = posts.filter(p => !currentUser.blocked_users.includes(p.user_id));
        }

        // Sanitize any legacy cached Chanzo to Source
        posts.forEach(p => {
            if (p.source_attribution && p.source_attribution.includes('Chanzo:')) {
                p.source_attribution = p.source_attribution.replace(/Chanzo:/g, 'Source:');
            }
            if (p.content && p.content.includes('Chanzo:')) {
                p.content = p.content.replace(/Chanzo:/g, 'Source:');
            }
        });

        // Sort: Friends first, high likes, then newest
        posts.sort((a, b) => {
            const isAFriend = currentUser && currentUser.close_friends && currentUser.close_friends.includes(a.user_id);
            const isBFriend = currentUser && currentUser.close_friends && currentUser.close_friends.includes(b.user_id);

            if (isAFriend && !isBFriend) return -1;
            if (!isAFriend && isBFriend) return 1;

            const scoreA = (a.likes_count || 0) * 0.4 + new Date(a.created_at).getTime() / 100000000000;
            const scoreB = (b.likes_count || 0) * 0.4 + new Date(b.created_at).getTime() / 100000000000;
            return scoreB - scoreA;
        });

        return posts;
    }

    async createPost({ content, mediaUrl, mediaType, feeling, locationTag, musicTitle, privacy, isAnonymous, pollData, groupId }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const isSwahili = window.ZukaI18n && window.ZukaI18n.getLanguage() === 'sw';
        if (!currentUser) throw new Error(isSwahili ? 'Unatakiwa kuingia kwanza.' : 'Please log in first.');

        // 1. Strict AI Moderation Check
        const scanResult = window.ZukaAIModerator.scanContent(content, currentUser.id);

        if (scanResult.action === 'AUTO_BLOCK') {
            const blockMsg = isSwahili 
                ? `🚫 Chapisho limezuiwa mara moja na AI Moderation: ${scanResult.reason}`
                : `🚫 Post immediately blocked by ZUKA Community AI: ${scanResult.reason}`;
            throw new Error(blockMsg);
        }

        // 2. Check Image if attached
        if (mediaUrl) {
            const imgCheck = window.ZukaAIModerator.checkImage(mediaUrl);
            if (imgCheck.action === 'AUTO_BLOCK') {
                const imgMsg = isSwahili 
                    ? '🚫 Picha imezuiwa kutokana na viashiria vya uchi au picha za ngono.'
                    : '🚫 Image blocked due to adult content or nudity violations.';
                throw new Error(imgMsg);
            }
        }

        const anonymousLabel = (window.ZukaI18n ? window.ZukaI18n.t('posting_anonymous') : 'Anonymous Member 👤');

        const newPost = {
            id: 'post_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            user_id: currentUser.id,
            author_name: isAnonymous ? anonymousLabel : currentUser.full_name,
            author_avatar: isAnonymous ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' : currentUser.avatar_url,
            is_verified: isAnonymous ? false : currentUser.is_verified,
            content,
            media_url: mediaUrl || null,
            media_type: mediaType || (mediaUrl ? 'image' : (pollData ? 'poll' : 'text')),
            feeling: feeling || null,
            location_tag: locationTag || null,
            music_title: musicTitle || null,
            privacy: privacy || 'public',
            is_anonymous: !!isAnonymous,
            group_id: groupId || null,
            poll_data: pollData || null,
            ai_score: scanResult.aiScore,
            ai_action: scanResult.action,
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            user_reaction: null,
            comments_list: [],
            created_at: new Date().toISOString()
        };

        const posts = window.ZukaDB.get('posts');
        posts.unshift(newPost);
        window.ZukaDB.set('posts', posts);

        // Realtime broadcast to peers
        window.ZukaSupabase.broadcast('feed_new_post', newPost);

        return newPost;
    }

    reactToPost(postId, reactionType = 'like') {
        const posts = window.ZukaDB.get('posts');
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        if (post.user_reaction === reactionType) {
            post.user_reaction = null;
            post.likes_count = Math.max(0, (post.likes_count || 1) - 1);
        } else {
            if (!post.user_reaction) {
                post.likes_count = (post.likes_count || 0) + 1;
            }
            post.user_reaction = reactionType;
        }

        window.ZukaDB.set('posts', posts);
        return post;
    }

    addComment(postId, commentText, mediaUrl = null) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const isSwahili = window.ZukaI18n && window.ZukaI18n.getLanguage() === 'sw';
        if (!currentUser) return;

        // Check comment for Tier A Auto Block
        const scan = window.ZukaAIModerator.scanContent(commentText, currentUser.id);
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`🚫 Comment blocked by AI: ${scan.reason}`);
        }

        const posts = window.ZukaDB.get('posts');
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        if (!post.comments_list) post.comments_list = [];

        const comment = {
            id: 'c_' + Date.now(),
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            user_avatar: currentUser.avatar_url,
            text: commentText,
            media_url: mediaUrl,
            created_at: isSwahili ? 'Sasa hivi' : 'Just now'
        };

        post.comments_list.push(comment);
        post.comments_count = (post.comments_count || 0) + 1;

        window.ZukaDB.set('posts', posts);

        if (post.user_id !== currentUser.id && window.ZukaNotifications) {
            window.ZukaNotifications.send({
                userId: post.user_id,
                actorName: currentUser.full_name,
                actorAvatar: currentUser.avatar_url,
                type: 'comment',
                content: isSwahili ? 'ametoa maoni kwenye chapisho lako' : 'commented on your post'
            });
        }

        return comment;
    }

    votePoll(postId, optionIndex) {
        const posts = window.ZukaDB.get('posts');
        const post = posts.find(p => p.id === postId);
        if (!post || !post.poll_data) return;

        if (post.poll_data.user_voted !== undefined) return;

        post.poll_data.options[optionIndex].votes += 1;
        post.poll_data.total_votes += 1;
        post.poll_data.user_voted = optionIndex;

        window.ZukaDB.set('posts', posts);
        return post.poll_data;
    }

    deletePost(postId) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const isSwahili = window.ZukaI18n && window.ZukaI18n.getLanguage() === 'sw';
        let posts = window.ZukaDB.get('posts');
        const post = posts.find(p => p.id === postId);
        if (!post) return false;

        if (post.user_id !== currentUser.id) {
            throw new Error(isSwahili ? 'Huna mamlaka ya kufuta chapisho hili.' : 'You do not have permission to delete this post.');
        }

        posts = posts.filter(p => p.id !== postId);
        window.ZukaDB.set('posts', posts);
        return true;
    }

    savePost(postId) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) return;
        const saved = window.ZukaDB.get('saved_items');
        if (!saved.some(s => s.item_id === postId && s.user_id === currentUser.id)) {
            saved.unshift({
                id: 'save_' + Date.now(),
                user_id: currentUser.id,
                item_type: 'post',
                item_id: postId,
                created_at: new Date().toISOString()
            });
            window.ZukaDB.set('saved_items', saved);
            return true;
        }
        return false;
    }

    reportPost(postId, reason) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const posts = window.ZukaDB.get('posts');
        const post = posts.find(p => p.id === postId);

        const reports = window.ZukaDB.get('reports');
        reports.unshift({
            id: 'rep_' + Date.now(),
            reporter_id: currentUser ? currentUser.id : 'anonymous',
            content_type: 'post',
            content_id: postId,
            reason: reason || 'Inappropriate or harmful content',
            snippet: post ? post.content : '',
            status: 'pending',
            created_at: new Date().toISOString()
        });
        window.ZukaDB.set('reports', reports);
        return true;
    }
}

window.ZukaFeed = new ZukaFeedEngine();
