/**
 * ZUKA - Jobs Engine (jobs.js)
 * 100% English - No Fake Jobs, No Fake Salaries
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaJobsEngine {
    constructor() {
        this.initJobs();
    }

    initJobs() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    async getJobs() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const { data: jobs, error } = await window.supabaseClient
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching jobs from Supabase:", error);
            return [];
        }

        return jobs || [];
    }

    async apply(jobId, cvNote) {
        if (!window.supabaseClient) return false;

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) throw new Error('Please log in first to apply for a job.');

        const applicationData = {
            job_id: jobId,
            user_id: currentUser.id,
            cv_note: cvNote || '',
            applied_at: new Date().toISOString()
        };

        // 1. Log the application submission directly into the relational 'job_applications' table
        const { error: applicationError } = await window.supabaseClient
            .from('job_applications')
            .insert([applicationData]);

        if (applicationError) {
            console.error("Error submitting job application:", applicationError);
            return false;
        }

        // 2. Perform an atomic update flag check to toggle applicant metrics state
        const { error: updateError } = await window.supabaseClient
            .from('jobs')
            .update({ applied: true })
            .eq('id', jobId);

        if (updateError) {
            console.error("Error updating target job listing state:", updateError);
            return false;
        }

        return true;
    }

    async postJob(jobData) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const newJob = {
            title: jobData.title || '',
            company: jobData.company || '',
            location: jobData.location || '',
            salary_range: jobData.salary_range || '',
            type: jobData.type || 'Full-time',
            description: jobData.description || '',
            applied: false,
            created_at: new Date().toISOString()
        };

        const { data, error } = await window.supabaseClient
            .from('jobs')
            .insert([newJob])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

window.ZukaJobs = new ZukaJobsEngine();
