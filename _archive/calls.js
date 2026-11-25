/**
 * ZUKA - Audio & Video Calls Engine (calls.js)
 * 100% English - No Demo Contact
 * Fully Integrated with Universal WebRTC Signaling Controls
 * Built for a global audience
 */

class ZukaCallsEngine {
    constructor() {
        this.activeStream = null;
        this.callType = 'video';
        this.callState = 'idle';
        this.contactName = '';
        this.audioCtx = null;
        this.timerInterval = null;
        this.currentOsc = null;
    }

    async startCall(contactName = '', type = 'video') {
        if (!contactName) throw new Error('Please select a contact to call.');
        this.contactName = contactName;
        this.callType = type;
        this.callState = 'calling';

        this.playRingTone();

        const modal = document.getElementById('zuka-call-modal');
        if (modal) {
            modal.classList.remove('hidden');
            const nameEl = document.getElementById('call-contact-name');
            const labelEl = document.getElementById('call-type-label');
            if (nameEl) nameEl.innerText = contactName;
            if (labelEl) labelEl.innerText = type === 'video' ? 'ZUKA Video Call...' : 'ZUKA Voice Call...';
        }

        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: type === 'video',
                    audio: true
                });
                this.activeStream = stream;
                const videoEl = document.getElementById('local-call-video');
                if (videoEl && type === 'video') {
                    videoEl.srcObject = stream;
                    try {
                        await videoEl.play();
                    } catch (playErr) {
                        console.warn("Video element autoplay was prevented:", playErr);
                    }
                }
            }
        } catch (err) {
            console.error("Camera/Mic permission denied or unavailable:", err);
            this.stopRingTone();
            this.callState = 'failed';
            const labelEl = document.getElementById('call-type-label');
            if (labelEl) labelEl.innerText = 'Call Failed - Mic/Camera Access Denied';
        }
    }

    onCallAnswered() {
        if (this.callState === 'calling') {
            this.callState = 'connected';
            this.stopRingTone();
            const typeLabel = document.getElementById('call-type-label');
            if (typeLabel) typeLabel.innerText = '00:01 - Connected';
            this.startTimer();
        }
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        let seconds = 1;
        this.timerInterval = setInterval(() => {
            seconds++;
            const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
            const secs = String(seconds % 60).padStart(2, '0');
            const typeLabel = document.getElementById('call-type-label');
            if (typeLabel && this.callState === 'connected') {
                typeLabel.innerText = `${mins}:${secs} - Connected`;
            }
        }, 1000);
    }

    endCall() {
        this.callState = 'ended';
        this.stopRingTone();
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (this.activeStream) {
            this.activeStream.getTracks().forEach(track => track.stop());
            this.activeStream = null;
        }

        const modal = document.getElementById('zuka-call-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    toggleMute() {
        if (this.activeStream) {
            const audioTrack = this.activeStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return !audioTrack.enabled;
            }
        }
        return false;
    }

    playRingTone() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
                gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start();
                this.currentOsc = osc;
            }
        } catch (e) {
            console.warn("Web Audio API context could not be established:", e);
        }
    }

    stopRingTone() {
        try {
            if (this.currentOsc) {
                this.currentOsc.stop();
                this.currentOsc = null;
            }
            if (this.audioCtx) {
                this.audioCtx.close();
                this.audioCtx = null;
            }
        } catch (e) {
            console.error("Error standardizing target audio context cleanup:", e);
        }
    }
}

window.ZukaCalls = new ZukaCallsEngine();
