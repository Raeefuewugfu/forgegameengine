import { Mesh } from '../Scene';
import { vec3 } from '../../types';

type Logger = (message: string, type?: 'log' | 'warn' | 'error') => void;

interface AudioSource {
    panner: PannerNode;
    gain: GainNode;
    buffer: AudioBuffer | null;
}

export class AudioSystem {
    private audioContext: AudioContext | null = null;
    private logger: Logger;
    private sources: Map<string, AudioSource> = new Map();
    private playingSources: Map<string, AudioBufferSourceNode[]> = new Map();
    private thudBuffer: AudioBuffer | null = null;
    private masterGain: GainNode | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
        // The AudioContext will be created on the first user interaction (e.g., play button)
    }

    public resumeContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                this.masterGain = this.audioContext.createGain();
                this.masterGain.connect(this.audioContext.destination);
                this.createThudSound();
                this.logger("AudioContext created and resumed successfully.");
            } catch(e) {
                this.logger("WebAudio API is not supported in this browser.", "error");
            }
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    public setMasterVolume(volume: number) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(volume, this.audioContext!.currentTime);
        }
    }

    private createThudSound() {
        if (!this.audioContext) return;
        const context = this.audioContext;
        const sampleRate = context.sampleRate;
        const duration = 0.1;
        const frameCount = sampleRate * duration;
        const buffer = context.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < frameCount; i++) {
            const time = i / sampleRate;
            // A simple decaying sine wave for a "thud"
            data[i] = Math.sin(2 * Math.PI * 100 * time) * Math.exp(-time * 20);
        }
        this.thudBuffer = buffer;
    }

    public updateListener(position: vec3) {
        if (!this.audioContext) return;
        const listener = this.audioContext.listener;
        listener.positionX.setValueAtTime(position[0], this.audioContext.currentTime);
        listener.positionY.setValueAtTime(position[1], this.audioContext.currentTime);
        listener.positionZ.setValueAtTime(position[2], this.audioContext.currentTime);
    }
    
    public playCollisionSound(position: vec3, impulse: number) {
        if (!this.audioContext || !this.thudBuffer || !this.masterGain) return;

        const volume = Math.min(Math.log1p(impulse) / 5, 1.0); // Logarithmic volume scaling
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.thudBuffer;

        const panner = this.audioContext.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 100;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        panner.positionX.setValueAtTime(position[0], this.audioContext.currentTime);
        panner.positionY.setValueAtTime(position[1], this.audioContext.currentTime);
        panner.positionZ.setValueAtTime(position[2], this.audioContext.currentTime);
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

        source.connect(panner).connect(gainNode).connect(this.masterGain);
        source.start();
    }

    private getOrCreateSource(mesh: Mesh): AudioSource {
        if (this.sources.has(mesh.id)) {
            return this.sources.get(mesh.id)!;
        }
        if (!this.audioContext || !this.masterGain) this.resumeContext();
        if (!this.audioContext || !this.masterGain) throw new Error("AudioContext not available");

        const gain = this.audioContext.createGain();
        gain.gain.value = mesh.audio?.volume ?? 1.0;
        
        const panner = this.audioContext.createPanner();
        panner.panningModel = 'HRTF';
        panner.connect(gain);
        gain.connect(this.masterGain);

        const newSource: AudioSource = { panner, gain, buffer: null };
        this.sources.set(mesh.id, newSource);
        return newSource;
    }

    public removeSource(meshId: string) {
        if (this.playingSources.has(meshId)) {
            this.playingSources.get(meshId)?.forEach(node => {
                try { node.stop(); } catch(e) {}
            });
            this.playingSources.delete(meshId);
        }
        this.sources.delete(meshId);
    }

    public updateSourcePosition(mesh: Mesh) {
        if (!this.audioContext || !this.sources.has(mesh.id)) return;
        
        const source = this.sources.get(mesh.id)!;
        const pos = mesh.transform.position;
        source.panner.positionX.linearRampToValueAtTime(pos[0], this.audioContext.currentTime + 0.05);
        source.panner.positionY.linearRampToValueAtTime(pos[1], this.audioContext.currentTime + 0.05);
        source.panner.positionZ.linearRampToValueAtTime(pos[2], this.audioContext.currentTime + 0.05);
    }
    
    public updateSourceProperties(mesh: Mesh) {
        if (!this.audioContext || !mesh.audio) return;
        const source = this.getOrCreateSource(mesh);
        source.gain.gain.setValueAtTime(mesh.audio.volume, this.audioContext.currentTime);
        
        // Handle looping changes
        const playing = this.playingSources.get(mesh.id);
        if (playing) {
            playing.forEach(node => node.loop = mesh.audio!.loop);
        }
    }

    public stopAll() {
        if (!this.audioContext) return;
        this.playingSources.forEach((nodes) => {
            nodes.forEach(node => {
                try { node.stop(); } catch(e) {/* already stopped */}
            });
        });
        this.playingSources.clear();
    }
}
