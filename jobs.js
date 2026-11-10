/**
 * ZUKA - Jobs Engine (jobs.js)
 * 100% English - No Fake Jobs, No Fake Salaries
 */

class ZukaJobsEngine {
    constructor() {
        this.initJobs();
    }

    initJobs() {
        let jobs = window.ZukaDB.get('jobs');
        if (!jobs) {
            jobs = [];
            window.ZukaDB.set('jobs', jobs);
        }
    }

    getJobs() {
        return window.ZukaDB.get('jobs') || [];
    }

    apply(jobId, cvNote) {
        const jobs = this.getJobs();
        const job = jobs.find(j => j.id === jobId);
        if (job) {
            job.applied = true;
            job.cv_note = cvNote || '';
            job.applied_at = new Date().toISOString();
            window.ZukaDB.set('jobs', jobs);
            return true;
        }
        return false;
    }

    postJob(jobData) {
        const newJob = {
            id: 'job_' + Date.now(),
            title: jobData.title || '',
            company: jobData.company || '',
            location: jobData.location || '',
            salary_range: jobData.salary_range || '',
            type: jobData.type || 'Full-time',
            description: jobData.description || '',
            applied: false,
            created_at: new Date().toISOString()
        };
        const jobs = this.getJobs();
        jobs.unshift(newJob);
        window.ZukaDB.set('jobs', jobs);
        return newJob;
    }
}

window.ZukaJobs = new ZukaJobsEngine();
