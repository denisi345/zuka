/**
 * ZUKA Super App - Jobs Engine (jobs.js)
 * Implements Facebook-style Jobs: Post job, Apply job, CV submission, and applications list.
 */

class ZukaJobsEngine {
    constructor() {
        this.initJobs();
    }

    initJobs() {
        let jobs = window.ZukaDB.get('jobs');
        if (jobs.length === 0) {
            jobs = [
                {
                    id: 'job_01',
                    title: 'Senior Frontend Developer (React / JavaScript)',
                    company: 'ZUKA Technologies Ltd',
                    location: 'Dar es Salaam (Inawezekana Remote)',
                    salary_range: 'TZS 3,500,000 - 5,000,000 kwa mwezi',
                    type: 'Full-time',
                    description: 'Tunatafuta msanidi programu mbunifu wa kuendeleza vipengele vipya vya mtandao wetu wa ZUKA.',
                    applied: false
                },
                {
                    id: 'job_02',
                    title: 'Digital Marketing & Community Manager',
                    company: 'Swahili Media Group',
                    location: 'Mikocheni, Dar es Salaam',
                    salary_range: 'TZS 1,800,000 - 2,500,000',
                    type: 'Full-time',
                    description: 'Kusimamia kurasa za kijamii na kukuza jamii ya watumiaji kwa maudhui yenye mvuto.',
                    applied: false
                }
            ];
            window.ZukaDB.set('jobs', jobs);
        }
    }

    getJobs() {
        return window.ZukaDB.get('jobs');
    }

    apply(jobId, cvNote) {
        const jobs = this.getJobs();
        const job = jobs.find(j => j.id === jobId);
        if (job) {
            job.applied = true;
            window.ZukaDB.set('jobs', jobs);
            return true;
        }
    }

    postJob(jobData) {
        const newJob = {
            id: 'job_' + Date.now(),
            ...jobData,
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
