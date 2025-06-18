import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Hls from 'hls.js';
import type { Stream } from '../types/stream.js';

@customElement('video-player')
export class VideoPlayer extends LitElement {
  @property({ type: Object }) stream: Stream | null = null;
  @property({ type: Boolean }) autoplay: boolean = false;

  @state() private isPlaying = false;
  @state() private isLoading = false;
  @state() private error: string | null = null;
  @state() private duration = 0;
  @state() private currentTime = 0;

  private hls: Hls | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private retryCount = 0;
  private maxRetries = 3;

  static override styles = css`
    :host {
      display: block;
      width: 100%;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
    }

    video {
      width: 100%;
      height: auto;
      display: block;
      background: #000;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.1rem;
      z-index: 10;
    }

    .error-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(139, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 20px;
      z-index: 10;
    }

    .error-message {
      font-size: 1.1rem;
      margin-bottom: 16px;
    }

    .retry-button {
      background: #ef4444;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .retry-button:hover {
      background: #dc2626;
    }

    .controls {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 5;
    }

    :host(:hover) .controls {
      opacity: 1;
    }

    .play-pause-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.8);
      color: white;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.2s;
    }

    .play-pause-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: white;
    }

    .time-info {
      color: white;
      font-size: 14px;
      min-width: 80px;
    }

    .progress-bar {
      flex: 1;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      overflow: hidden;
      cursor: pointer;
    }

    .progress-fill {
      height: 100%;
      background: #3b82f6;
      transition: width 0.1s;
    }

    .volume-control {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .volume-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 16px;
    }

    .volume-slider {
      width: 60px;
    }

    .quality-selector {
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
    }

    .fullscreen-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 16px;
    }
  `;

  override updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('stream') && this.stream) {
      this.loadStream();
    }
  }

  private async loadStream() {
    if (!this.stream) return;

    this.isLoading = true;
    this.error = null;
    this.retryCount = 0;

    console.log('🎬 Loading stream:', this.stream.title);
    console.log('📋 Full stream object:', this.stream);
    console.log('🔗 HLS URL:', this.stream.hls_url);
    console.log('🔗 HLS URL type:', typeof this.stream.hls_url);
    console.log('🔗 HLS URL length:', this.stream.hls_url?.length);

    try {
      await this.setupHlsStream();
    } catch (error) {
      console.error('❌ Failed to load stream:', error);
      this.error = error instanceof Error ? error.message : 'Unknown error occurred';
      this.isLoading = false;
    }
  }

  private async setupHlsStream() {
    if (!this.stream?.hls_url) {
      throw new Error('No HLS URL provided');
    }

    // Clean up existing HLS instance
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    await this.updateComplete;
    this.videoElement = this.shadowRoot?.querySelector('video') as HTMLVideoElement;
    
    if (!this.videoElement) {
      throw new Error('Video element not found');
    }

    // Check if browser supports HLS natively (Safari)
    if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('📱 Using native HLS support (Safari)');
      this.setupNativeHls();
    } else if (Hls.isSupported()) {
      console.log('🔧 Using HLS.js for MSE support');
      this.setupHlsJs();
    } else {
      throw new Error('HLS is not supported in this browser');
    }
  }

  private setupNativeHls() {
    if (!this.videoElement || !this.stream) return;

    this.videoElement.src = this.stream.hls_url;
    this.setupVideoEventListeners();
    
    if (this.autoplay) {
      this.play();
    }

    this.isLoading = false;
  }

  private setupHlsJs() {
    if (!this.videoElement || !this.stream) return;

    this.hls = new Hls({
      debug: true, // Enable debug to see what's happening
      enableWorker: true,
      lowLatencyMode: false, // Disable low latency for better compatibility
      backBufferLength: 30,
      maxBufferLength: 60,
      
      // Updated configuration using new policy syntax
      fragLoadPolicy: {
        default: {
          maxTimeToFirstByteMs: 10000,
          maxLoadTimeMs: 120000,
          timeoutRetry: {
            maxNumRetry: 3,
            retryDelayMs: 1000,
            maxRetryDelayMs: 0
          },
          errorRetry: {
            maxNumRetry: 3,
            retryDelayMs: 1000,
            maxRetryDelayMs: 8000
          }
        }
      },
      
      manifestLoadPolicy: {
        default: {
          maxTimeToFirstByteMs: 10000,
          maxLoadTimeMs: 20000,
          timeoutRetry: {
            maxNumRetry: 3,
            retryDelayMs: 1000,
            maxRetryDelayMs: 0
          },
          errorRetry: {
            maxNumRetry: 3,
            retryDelayMs: 1000,
            maxRetryDelayMs: 8000
          }
        }
      },
      
      // Enhanced loader configuration to proxy ALL content
      loader: class extends Hls.DefaultConfig.loader! {
        override load(context: any, config: any, callbacks: any) {
          const originalUrl = context.url;
          const originalOnSuccess = callbacks.onSuccess;
          const originalOnError = callbacks.onError;
          
          console.log(`📡 Loading ${context.type}: ${originalUrl}`);
          
          // Route ALL YouTube content through our proxy
          if (originalUrl && originalUrl.includes('googlevideo.com')) {
            console.log('🔄 Using proxy for YouTube content');
            context.url = `http://localhost:8001/api/v1/proxy/video/?url=${encodeURIComponent(originalUrl)}`;
          }

          callbacks.onSuccess = (response: any, stats: any, context: any) => {
            console.log(`✅ Successfully loaded ${context.type}`);
            originalOnSuccess(response, stats, context);
          };

          callbacks.onError = (error: any, context: any) => {
            console.error(`❌ Failed to load ${context.type}:`, error);
            
            // If proxy failed and it was a YouTube URL, don't try direct (will CORS)
            if (originalUrl.includes('googlevideo.com')) {
              console.error('🚫 Cannot fallback to direct YouTube URL due to CORS');
              originalOnError(error, context);
            } else {
              // For non-YouTube URLs, try direct as fallback
              console.log('🔄 Trying direct URL as fallback');
              context.url = originalUrl;
              super.load(context, config, {
                onSuccess: originalOnSuccess,
                onError: originalOnError,
                onTimeout: callbacks.onTimeout
              });
            }
          };

          super.load(context, config, callbacks);
        }
      }
    });

    this.setupHlsEventListeners();
    
    this.hls.loadSource(this.stream.hls_url);
    this.hls.attachMedia(this.videoElement);
    
    this.setupVideoEventListeners();
  }

  private setupHlsEventListeners() {
    if (!this.hls) return;

    // Manifest loaded successfully
    this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('✅ HLS manifest parsed successfully');
      this.isLoading = false;
      if (this.autoplay) {
        this.play();
      }
    });

    // Fragment loaded successfully
    this.hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
      console.log('📦 Fragment loaded:', data.frag.url);
    });

    // Level loaded (quality level)
    this.hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
      console.log('📊 Quality level loaded:', data.details.totalduration, 'seconds');
    });

    // Error handling with recovery
    this.hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('🚨 HLS Error:', data);
      this.handleHlsError(data);
    });

    // Media attached
    this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      console.log('📺 Media attached to HLS');
    });

    // Buffer events
    this.hls.on(Hls.Events.BUFFER_APPENDED, () => {
      console.log('📝 Buffer appended');
    });
  }

  private handleHlsError(data: any) {
    const { type, details, fatal, reason } = data;
    
    console.error(`HLS Error - Type: ${type}, Details: ${details}, Fatal: ${fatal}, Reason: ${reason || 'N/A'}`);

    // Handle specific non-fatal errors
    if (!fatal) {
      if (details === 'fragParsingError') {
        console.warn('⚠️ Fragment parsing error - attempting to continue playback');
        // Don't show error to user for parsing errors, they're usually recoverable
        return;
      } else if (details === 'fragLoadError') {
        console.warn('⚠️ Fragment load error - will retry automatically');
        return;
      } else {
        console.warn('⚠️ Non-fatal HLS error:', details);
        return;
      }
    }

    // Handle fatal errors
    switch (type) {
      case Hls.ErrorTypes.MEDIA_ERROR:
        console.log('🔄 Attempting to recover from media error...');
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          
          if (details === 'bufferStalledError' || details === 'bufferSeekOverHole') {
            // Try a different recovery method for buffer issues
            console.log('🔧 Attempting buffer recovery...');
            this.hls?.recoverMediaError();
          } else {
            // Standard media error recovery
            this.hls?.recoverMediaError();
          }
          
          // Set a timeout to retry if recovery doesn't work
          setTimeout(() => {
            if (this.videoElement?.error || this.videoElement?.readyState === 0) {
              console.log('🔄 Recovery may have failed, reloading stream...');
              this.loadStream();
            }
          }, 3000);
        } else {
          this.error = 'Media playback error. The stream may be temporarily unavailable.';
          this.isLoading = false;
        }
        break;

      case Hls.ErrorTypes.NETWORK_ERROR:
        console.error('🌐 Network error encountered');
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = Math.min(2000 * Math.pow(2, this.retryCount - 1), 10000); // Exponential backoff with cap
          setTimeout(() => {
            console.log(`🔄 Retrying stream load (attempt ${this.retryCount}/${this.maxRetries})`);
            this.loadStream();
          }, delay);
        } else {
          this.error = 'Network error. Please check your connection and try again.';
          this.isLoading = false;
        }
        break;

      case Hls.ErrorTypes.OTHER_ERROR:
        if (reason && reason.includes('demuxer')) {
          console.error('🔧 Transmuxer/demuxer error - stream format may be incompatible');
          this.error = 'Stream format not supported. Please try refreshing or use a different browser.';
        } else {
          console.error('💥 Other HLS error');
          this.error = 'Stream playback failed. Please try refreshing the page.';
        }
        this.isLoading = false;
        this.hls?.destroy();
        this.hls = null;
        break;

      default:
        console.error('💥 Unrecoverable HLS error');
        this.error = 'Stream playback failed. Please try refreshing the page.';
        this.isLoading = false;
        this.hls?.destroy();
        this.hls = null;
        break;
    }
  }

  private setupVideoEventListeners() {
    if (!this.videoElement) return;

    this.videoElement.addEventListener('loadstart', () => {
      console.log('📥 Video load started');
    });

    this.videoElement.addEventListener('loadedmetadata', () => {
      console.log('📋 Video metadata loaded');
      this.duration = this.videoElement?.duration || 0;
    });

    this.videoElement.addEventListener('canplay', () => {
      console.log('▶️ Video can start playing');
      this.isLoading = false;
    });

    this.videoElement.addEventListener('playing', () => {
      console.log('🎬 Video started playing');
      this.isPlaying = true;
    });

    this.videoElement.addEventListener('pause', () => {
      console.log('⏸️ Video paused');
      this.isPlaying = false;
    });

    this.videoElement.addEventListener('timeupdate', () => {
      this.currentTime = this.videoElement?.currentTime || 0;
    });

    this.videoElement.addEventListener('error', (e) => {
      const mediaError = this.videoElement?.error;
      if (mediaError) {
        console.error('📺 Video element error:', mediaError);
        
        if (mediaError.code === MediaError.MEDIA_ERR_DECODE) {
          if (this.hls && this.retryCount < this.maxRetries) {
            console.log('🔄 Attempting to recover from decode error...');
            this.retryCount++;
            this.hls.recoverMediaError();
          } else {
            this.error = 'Video decode error. Please try refreshing.';
            this.isLoading = false;
          }
        } else {
          this.error = `Video playback error: ${mediaError.message || 'Unknown error'}`;
          this.isLoading = false;
        }
      }
    });

    this.videoElement.addEventListener('waiting', () => {
      console.log('⏳ Video buffering...');
    });

    this.videoElement.addEventListener('stalled', () => {
      console.log('🔄 Video stalled, retrying...');
    });
  }

  private async play() {
    if (!this.videoElement) return;

    try {
      await this.videoElement.play();
      this.isPlaying = true;
    } catch (error) {
      console.error('▶️ Play failed:', error);
      this.error = 'Failed to start playback. Click play to try again.';
    }
  }

  private pause() {
    if (!this.videoElement) return;
    this.videoElement.pause();
    this.isPlaying = false;
  }

  private togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  private retry() {
    this.retryCount = 0;
    this.error = null;
    this.loadStream();
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  override render() {
    return html`
      <video 
        playsinline 
        controls
        ?autoplay=${this.autoplay}
        @click=${this.togglePlayPause}
      ></video>

      ${this.isLoading ? html`
        <div class="loading-overlay">
          <div>Buffering...</div>
        </div>
      ` : ''}

      ${this.error ? html`
        <div class="error-overlay">
          <div class="error-message">${this.error}</div>
          <button class="retry-button" @click=${this.retry}>
            Retry
          </button>
        </div>
      ` : ''}

      ${!this.isLoading && !this.error ? html`
        <div class="controls">
          <button class="play-pause-btn" @click=${this.togglePlayPause}>
            ${this.isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div class="time-info">
            ${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}
          </div>
          
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0}%"></div>
          </div>
          
          <div class="volume-control">
            <button class="volume-btn">🔊</button>
          </div>
          
          <button class="fullscreen-btn">⛶</button>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'video-player': VideoPlayer;
  }
}