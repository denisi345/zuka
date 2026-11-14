/**
 * ZUKA Super App - Blue Tick Verification (verification.js)
 * Implements verification requests submission, status tracking, and badge rendering.
 * 100% English - Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

window.ZukaVerification = {
    /**
     * Submit a new Blue Tick verification request directly to Supabase
     */
    async submitRequest({ category, reason, documentFile }) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) throw new Error('You must log in first.');

        let uploadedDocUrl = '';

        // Upload verification ID document to Supabase Storage if a file object is provided
        if (documentFile && typeof documentFile !== 'string') {
            if (window.ZukaSupabase && window.ZukaSupabase.uploadFile) {
                uploadedDocUrl = await window.ZukaSupabase.uploadFile('verifications', documentFile);
            } else {
                uploadedDocUrl = documentFile.name || 'uploaded_document';
            }
        } else if (typeof documentFile === 'string') {
            uploadedDocUrl = documentFile;
        }

        const newReq = {
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            category: category || 'Creator',
            reason: reason || 'Verify official identity',
            document_url: uploadedDocUrl,
            document_name: documentFile && documentFile.name ? documentFile.name : uploadedDocUrl,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const { data, error } = await window.supabaseClient
            .from('verification_requests')
            .insert([newReq])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Fetch all pending verification requests for the Owner review dashboard
     */
    async getPendingRequests() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const { data, error } = await window.supabaseClient
            .from('verification_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching pending verification requests:", error);
            return [];
        }

        return data || [];
    },

    /**
     * Check the current verification request status of a specific user
     */
    async getUserRequest(userId) {
        if (!window.supabaseClient || !userId) return null;

        const { data, error } = await window.supabaseClient
            .from('verification_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Error fetching user verification status:", error);
            return null;
        }

        return data;
    },

    /**
     * Approve a verification request and automatically grant Blue Tick status on the user's profile
     */
    async approveRequest(requestId) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        // 1. Fetch the request to get the target user_id
        const { data: req, error: fetchError } = await window.supabaseClient
            .from('verification_requests')
            .select('user_id')
            .eq('id', requestId)
            .maybeSingle();

        if (fetchError || !req) {
            throw new Error('Verification request not found.');
        }

        // 2. Update request status to 'approved'
        const { error: reqUpdateError } = await window.supabaseClient
            .from('verification_requests')
            .update({ status: 'approved' })
            .eq('id', requestId);

        if (reqUpdateError) throw reqUpdateError;

        // 3. Grant verified status (Blue Tick) in the 'users' table
        const { error: userUpdateError } = await window.supabaseClient
            .from('profiles')
            .update({ is_verified: true })
            .eq('id', req.user_id);

        if (userUpdateError) throw userUpdateError;

        return true;
    },

    /**
     * Reject a verification request
     */
    async rejectRequest(requestId) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const { error } = await window.supabaseClient
            .from('verification_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);

        if (error) throw error;
        return true;
    },

    /**
     * Render the verified Blue Tick HTML badge if the user is verified
     */
    renderBadge(user) {
        if (!user || !user.is_verified) return '';
        return '<span class="blue-tick-badge" title="Verified">✓</span>';
    }
};
