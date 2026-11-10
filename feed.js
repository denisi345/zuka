/**
 * ZUKA - Feed & Posts Engine (feed.js)
 * 100% English - No Fake Posts, No Fake Likes
 */

class ZukaFeedEngine {
    constructor() {
        this.initPosts();
    }

    initPosts() {
        let posts = window.ZukaDB.get('posts');
        if (!posts) {
            posts = [];
            window.ZukaDB.set('posts', posts);
        }
    }

    getFeedPosts() {
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        let posts = window.ZukaDB.get('posts') || [];

        posts = posts.filter(p => !p.is_hidden);

        if (currentUser && currentUser.blocked_users && currentUser.blocked_users.length) {
            posts = posts.filter(p => !currentUser.blocked_users.includes(p.user_id));
        }

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
        if (!currentUser) throw new Error('Please log in first.');

        const scanResult = window.ZukaAIModerator.scanContent(content, currentUser.id);

        if (scanResult.action === 'AUTO_BLOCK') {
            throw new Error(`Post immediately blocked by ZUKA Community AI: ${scanResult.reason}`);
        }

        if (mediaUrl) {
            const imgCheck = window.ZukaAIModerator.checkImage(mediaUrl);
            if (imgCheck.action === 'AUTO_BLOCK') {
                throw new Error('Image blocked due to adult content or nudity violations.');
            }
        }

        const newPost = {
            id: 'post_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            user_id: currentUser.id,
            author_name: isAnonymous ? 'Anonymous Member' : currentUser.full_name,
            author_avatar: isAnonymous ? '' : currentUser.avatar_url,
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

        const posts = window.ZukaDB.get('posts') || [];
        posts.unshift(newPost);
        window.ZukaDB.set('posts', posts);

        window.ZukaSupabase.broadcast('feed_new_post', newPost);

        return newPost;
    }

    reactToPost(postId, reactionType = 'like') {
        const posts = window.ZukaDB.get('posts') || [];
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
        if (!currentUser) return;

        const scan = window.ZukaAIModerator.scanContent(commentText, currentUser.id);
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`Comment blocked by AI: ${scan.reason}`);
        }

        const posts = window.ZukaDB.get('posts') || [];
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
            created_at: 'Just now'
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
                content: 'commented on your post'
            });
        }

        return comment;
    }

    votePoll(postId, optionIndex) {
        const posts = window.ZukaDB.get('posts') || [];
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
        let posts = window.ZukaDB.get('posts') || [];
        const post = posts.find(p => p.id === postId);
        if (!post) return false;

        if (post.user_id !== currentUser.id) {
            throw new Error('You do not have permission to delete this post.');
        }

        posts = posts.filter(p => p.id !== postId);
        window.ZukaDB.set('posts', posts);
        return true;
    }

    savePost(postId) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) return;
        const saved = window.ZukaDB.get('saved_items') || [];
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
        const posts = window.ZukaDB.get('posts') || [];
        const post = posts.find(p => p.id === postId);

        const reports = window.ZukaDB.get('reports') || [];
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
