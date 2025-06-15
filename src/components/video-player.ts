import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { StreamInfo } from './stream-discovery.js';
import Hls from 'hls.js';

@customElement('video-player')
export class VideoPlayer extends LitElement {
  @property({ type: Object }) stream: StreamInfo | null = null;
  @property({ type: Boolean }) autoplay = false;
  @property({ type: Boolean }) muted = false;
  
  @state() private isPlaying = false;
  @state() private currentTime = 0;
  @state() private duration = 0;
  @state() private volume = 1;
  @state() private isFullscreen = false;
  @state() private showControls = true;
  @state() private isLoading = false;
  @state() private hasError = false;
  @state() private errorMessage = '';

  @query('video') private videoElement!: HTMLVideoElement;

  private controlsTimeout: number | null = null;
  private hls: Hls | null = null;

  static override styles = css`
    :host {
      display: block;
      position: relative;
      background: #000;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .video-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 300px;
    }

    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }

    .controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
      padding: 1rem;
      transform: translateY(0);
      transition: transform 0.3s ease;
    }

    .controls.hidden {
      transform: translateY(100%);
    }

    .controls-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .progress-container {
      flex: 1;
      position: relative;
      height: 6px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
      cursor: pointer;
    }

    .progress-bar {
      height: 100%;
      background: var(--color-primary);
      border-radius: 3px;
      transition: width 0.1s ease;
    }

    .progress-handle {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      background: var(--color-primary);
      border: 2px solid white;
      border-radius: 50%;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .progress-container:hover .progress-handle,
    .progress-container:focus-within .progress-handle {
      opacity: 1;
    }

    .control-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.25rem;
      min-width: 44px;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    }

    .control-button:hover,
    .control-button:focus {
      background: rgba(255, 255, 255, 0.2);
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .control-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .volume-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .volume-slider {
      width: 80px;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    }

    .volume-slider::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      background: var(--color-primary);
      border-radius: 50%;
      cursor: pointer;
    }

    .time-display {
      color: white;
      font-size: 0.875rem;
      font-family: monospace;
      min-width: 100px;
      text-align: center;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.125rem;
    }

    .error-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 2rem;
    }

    .error-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--color-error);
    }

    .error-message {
      margin-bottom: 1rem;
      opacity: 0.8;
    }

    .stream-info-overlay {
      position: absolute;
      top: 1rem;
      left: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      transform: translateY(-100%);
      transition: transform 0.3s ease;
    }

    .stream-info-overlay.visible {
      transform: translateY(0);
    }

    .stream-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .stream-description {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--color-success);
      font-weight: 600;
      font-size: 0.75rem;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background: var(--color-success);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (max-width: 768px) {
      .controls-row {
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      .volume-container {
        order: 3;
        flex-basis: 100%;
        justify-content: center;
      }
    }
  `;

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private handlePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  private async play() {
    try {
      await this.videoElement.play();
      this.isPlaying = true;
      this.dispatchEvent(new CustomEvent('video-play', { bubbles: true }));
    } catch (error) {
      this.handleError('Failed to play video');
    }
  }

  private pause() {
    this.videoElement.pause();
    this.isPlaying = false;
    this.dispatchEvent(new CustomEvent('video-pause', { bubbles: true }));
  }

  private handleVolumeChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const volume = parseFloat(input.value);
    this.volume = volume;
    this.videoElement.volume = volume;
    this.videoElement.muted = volume === 0;
  }

  private toggleMute() {
    if (this.videoElement.muted) {
      this.videoElement.muted = false;
      this.videoElement.volume = this.volume;
    } else {
      this.videoElement.muted = true;
    }
  }

  private handleProgressClick(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * this.duration;
    this.videoElement.currentTime = newTime;
  }

  private toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.requestFullscreen();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  }

  private showControlsTemporarily() {
    this.showControls = true;
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    this.controlsTimeout = window.setTimeout(() => {
      if (this.isPlaying) {
        this.showControls = false;
      }
    }, 3000);
  }

  private handleError(message: string) {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
    this.dispatchEvent(new CustomEvent('video-error', {
      detail: { message },
      bubbles: true
    }));
  }

  private setupHlsStream(streamUrl: string) {
    const video = this.videoElement;
    
    // Clean up existing HLS instance
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    // Check if HLS is supported
    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      this.hls.loadSource(streamUrl);
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed, ready to play');
        this.isLoading = false;
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              this.handleError('Network error loading stream');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.handleError('Media error playing stream');
              break;
            default:
              this.handleError('Fatal error loading stream');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = streamUrl;
    } else {
      this.handleError('HLS streams not supported in this browser');
    }
  }

  private handleVideoEvents() {
    const video = this.videoElement;
    
    video.addEventListener('loadstart', () => {
      this.isLoading = true;
      this.hasError = false;
    });

    video.addEventListener('loadedmetadata', () => {
      this.duration = video.duration;
      this.isLoading = false;
    });

    video.addEventListener('timeupdate', () => {
      this.currentTime = video.currentTime;
    });

    video.addEventListener('play', () => {
      this.isPlaying = true;
    });

    video.addEventListener('pause', () => {
      this.isPlaying = false;
    });

    video.addEventListener('ended', () => {
      this.isPlaying = false;
      this.dispatchEvent(new CustomEvent('video-ended', { bubbles: true }));
    });

    video.addEventListener('error', () => {
      this.handleError('Video failed to load');
    });

    video.addEventListener('volumechange', () => {
      this.volume = video.volume;
    });
  }

  override firstUpdated() {
    this.handleVideoEvents();
    
    // Show/hide controls on mouse movement
    this.addEventListener('mousemove', this.showControlsTemporarily);
    this.addEventListener('mouseleave', () => {
      if (this.isPlaying) {
        this.showControls = false;
      }
    });

    // Set up stream if available
    if (this.stream?.streamUrl) {
      this.setupStream();
    }
  }

  private setupStream() {
    if (!this.stream?.streamUrl) {
      console.warn('No stream URL available for stream:', this.stream);
      return;
    }

    const streamUrl = this.stream.streamUrl;
    console.log('Setting up stream with URL:', streamUrl);
    
    // Check if it's an HLS stream (m3u8)
    if (streamUrl.includes('.m3u8') || streamUrl.includes('manifest')) {
      console.log('Detected HLS stream, using HLS.js');
      this.setupHlsStream(streamUrl);
    } else {
      console.log('Using regular video element');
      // Regular video file
      this.videoElement.src = streamUrl;
    }
  }

  override updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    
    // If stream changed, set up new stream
    if (changedProperties.has('stream') && this.stream?.streamUrl) {
      this.setupStream();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    
    // Clean up HLS instance
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  override render() {
    if (!this.stream) {
      return html`
        <div class="video-container">
          <div class="error-overlay">
            <div class="error-title">No Stream Selected</div>
            <div class="error-message">Please select a wildlife stream to watch.</div>
          </div>
        </div>
      `;
    }

    const progressPercent = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    const volumePercent = this.volume * 100;

    return html`
      <div class="video-container">
        <video
          .autoplay=${this.autoplay}
          .muted=${this.muted}
          preload="metadata"
          aria-label="Wildlife stream: ${this.stream.title}"
          crossorigin="anonymous"
        ></video>

        ${this.stream ? html`
          <div class="stream-info-overlay ${this.showControls ? 'visible' : ''}">
            <div class="stream-title">${this.stream.title}</div>
            <div class="stream-description">${this.stream.description}</div>
            ${this.stream.isLive ? html`
              <div class="live-indicator">
                <span class="live-dot"></span>
                LIVE
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="controls ${this.showControls ? '' : 'hidden'}">
          <div class="controls-row">
            <button
              class="control-button"
              @click=${this.handlePlayPause}
              aria-label=${this.isPlaying ? 'Pause video' : 'Play video'}
            >
              ${this.isPlaying ? '⏸️' : '▶️'}
            </button>

            <div class="time-display" aria-live="polite">
              ${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}
            </div>

            <div
              class="progress-container"
              @click=${this.handleProgressClick}
              role="slider"
              aria-label="Video progress"
              aria-valuemin="0"
              aria-valuemax=${this.duration}
              aria-valuenow=${this.currentTime}
              tabindex="0"
            >
              <div class="progress-bar" style="width: ${progressPercent}%"></div>
              <div class="progress-handle" style="left: ${progressPercent}%"></div>
            </div>

            <div class="volume-container">
              <button
                class="control-button"
                @click=${this.toggleMute}
                aria-label=${this.videoElement?.muted ? 'Unmute' : 'Mute'}
              >
                ${this.videoElement?.muted || this.volume === 0 ? '🔇' : this.volume < 0.5 ? '🔉' : '🔊'}
              </button>
              
              <input
                type="range"
                class="volume-slider"
                min="0"
                max="1"
                step="0.1"
                .value=${this.volume.toString()}
                @input=${this.handleVolumeChange}
                aria-label="Volume control"
              />
            </div>

            <button
              class="control-button"
              @click=${this.toggleFullscreen}
              aria-label=${this.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              ${this.isFullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>

        ${this.isLoading ? html`
          <div class="loading-overlay" role="status" aria-live="polite">
            Loading video...
          </div>
        ` : ''}

        ${this.hasError ? html`
          <div class="error-overlay" role="alert">
            <div class="error-title">Video Error</div>
            <div class="error-message">${this.errorMessage}</div>
            <button class="control-button" @click=${() => location.reload()}>
              Reload Page
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'video-player': VideoPlayer;
  }
} 