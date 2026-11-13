/**
 * ZUKA - Feed & Posts Engine (feed.js)
 * 100% English - No Fake Posts, No Fake Likes
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaFeedEngine {
    constructor() {
        this.initPosts();
    }

    initPosts() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    async getFeedPosts() {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;

        // 1. Fetch active posts from Supabase that are not hidden
        let query = window.supabase
            .from('posts')
            .select('*')
            .eq('is_hidden', false);

        const { data: posts, error } = await query;
        if (error) {
            console.error("Error fetching feed posts:", error);
            return [];
        }

        let cleanPosts = posts || [];

        // 2. Client-side relationship filters based on current user account state
        if (currentUser) {
            if (currentUser.blocked_users && currentUser.blocked_users.length) {
                cleanPosts = cleanPosts.filter(p => !currentUser.blocked_users.includes(p.user_id));
            }
        }

        // 3. Global sorting algorithm (Prioritizing Close Friends, then trending scores)
        cleanPosts.sort((a, b) => {
            const isAFriend = currentUser && currentUser.close_friends && currentUser.close_friends.includes(a.user_id);
            const isBFriend = currentUser && currentUser.close_friends && currentUser.close_friends.includes(b.user_id);

            if (isAFriend && !isBFriend) return -1;
            if (!isAFriend && isBFriend) return 1;

            const scoreA = (a.likes_count || 0) * 0.4 + new Date(a.created_at).getTime() / 100000000000;
            const scoreB = (b.likes_count || 0) * 0.4 + new Date(b.created_at).getTime() / 100000000000;
            return scoreB - scoreA;
        });

        return cleanPosts;
    }

    async createPost({ content, mediaUrl, mediaType, feeling, locationTag, musicTitle, privacy, isAnonymous, pollData, groupId }) {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first.');

        if (window.ZukaAIModerator) {
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
        }

        const newPost = {
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
            ai_score: window.ZukaAIModerator?.scanContent(content, currentUser.id)?.aiScore || 0,
            ai_action: window.ZukaAIModerator?.scanContent(content, currentUser.id)?.action || 'ALLOW',
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            user_reaction: null,
            comments_list: [],
            is_hidden: false,
            created_at: new Date().toISOString()
        };

        const { data, error } = await window.supabase
            .from('posts')
            .insert([newPost])
            .select()
            .single();

        if (error) throw error;

        if (window.ZukaSupabase && window.ZukaSupabase.broadcast) {
            window.ZukaSupabase.broadcast('feed_new_post', data);
        }

        return data;
    }

    async reactToPost(postId, reactionType = 'like') {
        if (!window.supabase) return;

        const { data: post, error: fetchError } = await window.supabase
            .from('posts')
            .select('user_reaction, likes_count')
            .eq('id', postId)
            .maybeSingle();

        if (fetchError || !post) return;

        let nextReaction = reactionType;
        let nextLikes = post.likes_count;

        if (post.user_reaction === reactionType) {
            nextReaction = null;
            nextLikes = Math.max(0, (post.likes_count || 1) - 1);
        } else {
            if (!post.user_reaction) {
                nextLikes = (post.likes_count || 0) + 1;
            }
            nextReaction = reactionType;
        }

        const { data: updatedPost, error: updateError } = await window.supabase
            .from('posts')
            .update({ user_reaction: nextReaction, likes_count: nextLikes })
            .eq('id', postId)
            .select()
            .single();

        if (updateError) throw updateError;
        return updatedPost;
    }

    async addComment(postId, commentText, mediaUrl = null) {
        if (!window.supabase) return;

        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) return;

        if (window.ZukaAIModerator) {
            const scan = window.ZukaAIModerator.scanContent(commentText, currentUser.id);
            if (scan.action === 'AUTO_BLOCK') {
                throw new Error(`Comment blocked by AI: ${scan.reason}`);
            }
        }

        const { data: post, error: postError } = await window.supabase
            .from('posts')
            .select('comments_list, comments_count, user_id')
            .eq('id', postId)
            .maybeSingle();

        if (postError || !post) return;

        const currentComments = post.comments_list || [];
        const comment = {
            id: 'c_' + Date.now(),
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            user_avatar: currentUser.avatar_url,
            text: commentText,
            media_url: mediaUrl,
            created_at: new Date().toISOString()
        };

        currentComments.push(comment);
        const nextCommentsCount = (post.comments_count || 0) + 1;

        const { error: updateError } = await window.supabase
            .from('posts')
            .update({ comments_list: currentComments, comments_count: nextCommentsCount })
            .eq('id', postId);

        if (updateError) throw updateError;

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

    async votePoll(postId, optionIndex) {
        if (!window.supabase) return;

        const { data: post, error: fetchError } = await window.supabase
            .from('posts')
            .select('poll_data')
            .eq('id', postId)
            .maybeSingle();

        if (fetchError || !post || !post.poll_data) return;

        const poll = post.poll_data;
        if (poll.user_voted !== undefined) return;

        poll.options[optionIndex].votes += 1;
        poll.total_votes += 1;
        poll.user_voted = optionIndex;

        const { data: updatedPost, error: updateError } = await window.supabase
            .from('posts')
            .update({ poll_data: poll })
            .eq('id', postId)
            .select()
            .single();

        if (updateError) throw updateError;
        return updatedPost.poll_data;
    }

    async deletePost(postId) {
        if (!window.supabase) return false;

        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) return false;

        const { data: post, error: fetchError } = await window.supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .maybeSingle();

        if (fetchError || !post) return false;

        if (post.user_id !== currentUser.id) {
            throw new Error('You do not have permission to delete this post.');
        }

        const { error: deleteError } = await window.supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (deleteError) throw deleteError;
        return true;
    }

    async savePost(postId) {
        if (!window.supabase) return false;

        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) return false;

        const { data: existingSave, error: fetchError } = await window.supabase
            .from('saved_items')
            .select('id')
            .eq('item_id', postId)
            .eq('user_id', currentUser.id)
            .maybeSingle();

        if (fetchError) return false;

        if (!existingSave) {
            const newSave = {
                user_id: currentUser.id,
                item_type: 'post',
                item_id: postId,
                created_at: new Date().toISOString()
            };

            const { error: insertError } = await window.supabase
