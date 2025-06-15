import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './stream-discovery.js';
import './video-player.js';
import './narration-controls.js';
import type { StreamInfo } from './stream-discovery.js';
import { apiService } from '../services/api.js';
import type { VoiceSettings } from './narration-controls.js';

@customElement('wildlife-app')
export class WildlifeApp extends LitElement {
  @state()
  private isLoading = false;

  @state()
  private currentView = 'home';

  @state()
  private selectedStream: StreamInfo | null = null;

  @state()
  private isNarrating = false;

  @state()
  private narrationStyle = 'field-scientist';

  @state()
  private voiceSettings: VoiceSettings = {
    rate: 1,
    pitch: 1,
    volume: 0.8,
    voice: 'default'
  };

  @state()
  private streams: StreamInfo[] = [];

  @state()
  private apiError: string | null = null;

  // Fallback mock stream data for demonstration (if API fails)
  private mockStreams: StreamInfo[] = [
    {
      id: 'safari-live-1',
      title: 'African Safari Live - Kruger National Park',
      description: 'Live wildlife viewing from South Africa\'s famous Kruger National Park. Watch elephants, lions, and other African wildlife in their natural habitat.',
      thumbnail: 'https://via.placeholder.com/400x200/4ade80/ffffff?text=Safari+Live',
      viewerCount: 15420,
      isLive: true,
      category: 'safari'
    },
    {
      id: 'aquarium-cam-1',
      title: 'Monterey Bay Aquarium - Kelp Forest Cam',
      description: 'Dive into the underwater world of the Monterey Bay Aquarium\'s kelp forest exhibit. Watch sea otters, sharks, and colorful fish.',
      thumbnail: 'https://via.placeholder.com/400x200/0ea5e9/ffffff?text=Aquarium+Cam',
      viewerCount: 8750,
      isLive: true,
      category: 'aquarium'
    },
    {
      id: 'bird-nest-1',
      title: 'Eagle Nest Cam - Yellowstone National Park',
      description: 'Watch a family of bald eagles in their nest high above Yellowstone. Perfect for observing nesting behavior and chick development.',
      thumbnail: 'https://via.placeholder.com/400x200/f59e0b/ffffff?text=Eagle+Nest',
      viewerCount: 12300,
      isLive: true,
      category: 'birds'
    },
    {
      id: 'zoo-live-1',
      title: 'San Diego Zoo - Panda Cam',
      description: 'Live feed from the San Diego Zoo\'s panda habitat. Watch these beloved bears play, eat bamboo, and interact with their environment.',
      thumbnail: 'https://via.placeholder.com/400x200/ec4899/ffffff?text=Panda+Cam',
      viewerCount: 22100,
      isLive: true,
      category: 'zoo'
    },
    {
      id: 'nature-reserve-1',
      title: 'Yellowstone Wolf Pack Tracking',
      description: 'Follow wolf packs through Yellowstone\'s wilderness. Observe pack behavior, hunting patterns, and social interactions.',
      thumbnail: 'https://via.placeholder.com/400x200/8b5cf6/ffffff?text=Wolf+Pack',
      viewerCount: 6890,
      isLive: true,
      category: 'wildlife'
    },
    {
      id: 'ocean-cam-1',
      title: 'Great Barrier Reef Live Dive',
      description: 'Explore the vibrant underwater ecosystem of the Great Barrier Reef. See tropical fish, coral formations, and marine life.',
      thumbnail: 'https://via.placeholder.com/400x200/06b6d4/ffffff?text=Reef+Dive',
      viewerCount: 9450,
      isLive: true,
      category: 'marine'
    }
  ];

  static override styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }

    .hero {
      text-align: center;
      padding: 3rem 0;
      background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
      color: white;
      margin-bottom: 2rem;
    }

    .hero h1 {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .hero p {
      font-size: 1.25rem;
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .feature-card {
      background: white;
      border-radius: 0.5rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .feature-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #1f2937;
    }

    .feature-card p {
      color: #6b7280;
      line-height: 1.6;
    }

    .cta-section {
      text-align: center;
      padding: 3rem 0;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 0.375rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      min-height: 44px;
      min-width: 44px;
    }

    .btn-primary {
      background: #0ea5e9;
      color: white;
    }

    .btn-primary:hover {
      background: #0284c7;
    }

    .btn-primary:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.3);
    }

    /* High contrast mode */
    :host(.high-contrast) .hero {
      background: black;
      color: white;
    }

    :host(.high-contrast) .feature-card {
      background: black;
      color: white;
      border-color: white;
    }

    :host(.high-contrast) .btn-primary {
      background: white;
      color: black;
      border: 2px solid white;
    }

    :host(.high-contrast) .btn-primary:hover {
      background: black;
      color: white;
    }

    :host(.high-contrast) .btn-primary:focus {
      box-shadow: 0 0 0 3px yellow;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .btn {
        transition: none;
      }
    }

    /* New layout styles */
    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--color-border);
    }

    .app-header h1 {
      margin: 0;
      color: var(--color-text);
      font-size: 1.875rem;
      font-weight: 700;
    }

    .btn-secondary {
      background: var(--color-gray-100);
      color: var(--color-text);
      border: 2px solid var(--color-border);
    }

    .btn-secondary:hover,
    .btn-secondary:focus {
      background: var(--color-gray-200);
      border-color: var(--color-primary);
    }

    .player-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
      margin-top: 2rem;
    }

    .video-section {
      background: #000;
      border-radius: 0.75rem;
      overflow: hidden;
      aspect-ratio: 16/9;
    }

    .controls-section {
      /* Styles handled by narration-controls component */
    }

    @media (min-width: 1024px) {
      .player-layout {
        grid-template-columns: 2fr 1fr;
        align-items: start;
      }
    }

    /* High contrast updates for new elements */
    :host(.high-contrast) .app-header {
      border-color: white;
    }

    :host(.high-contrast) .app-header h1 {
      color: white;
    }

    :host(.high-contrast) .btn-secondary {
      background: black;
      color: white;
      border-color: white;
    }

    :host(.high-contrast) .btn-secondary:hover,
    :host(.high-contrast) .btn-secondary:focus {
      background: white;
      color: black;
    }

    /* Loading and error message styles */
    .loading-message {
      text-align: center;
      padding: 2rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
      border: 1px solid #e5e7eb;
    }

    .loading-message p {
      color: #6b7280;
      font-size: 1.125rem;
      margin: 0;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 2rem;
    }

    .error-message p {
      color: #dc2626;
      margin: 0.5rem 0;
    }

    .error-message p:first-child {
      font-weight: 600;
    }

    /* High contrast for loading and error messages */
    :host(.high-contrast) .loading-message {
      background: black;
      color: white;
      border-color: white;
    }

    :host(.high-contrast) .loading-message p {
      color: white;
    }

    :host(.high-contrast) .error-message {
      background: black;
      border-color: yellow;
    }

    :host(.high-contrast) .error-message p {
      color: yellow;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.setupAccessibility();
    this.loadStreams();
  }

  private async loadStreams() {
    this.isLoading = true;
    this.apiError = null;

    try {
      const response = await apiService.getStreams();
      
      if (response.success && response.data) {
        // Convert backend streams to frontend format
        this.streams = response.data.streams.map(stream => 
          apiService.convertStreamInfo(stream)
        );
        console.log('Loaded streams from API:', this.streams);
      } else {
        throw new Error(response.error || 'Failed to load streams');
      }
    } catch (error) {
      console.error('Error loading streams:', error);
      this.apiError = error instanceof Error ? error.message : 'Unknown error';
      // Fallback to mock data
      this.streams = this.mockStreams;
      console.log('Using fallback mock streams');
    } finally {
      this.isLoading = false;
    }
  }

  private setupAccessibility() {
    // Listen for high contrast mode changes
    document.addEventListener('contrastchange', (event: any) => {
      if (event.detail.highContrast) {
        this.classList.add('high-contrast');
      } else {
        this.classList.remove('high-contrast');
      }
    });

    // Set initial high contrast state
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.classList.add('high-contrast');
    }
  }

  private handleGetStarted() {
    this.currentView = 'streams';
    this.dispatchEvent(new CustomEvent('view-change', {
      detail: { view: 'streams' },
      bubbles: true
    }));
  }

  private handleStreamSelected(e: CustomEvent) {
    this.selectedStream = e.detail.stream;
    this.currentView = 'player';
  }

  private handleBackToStreams() {
    this.currentView = 'streams';
    this.selectedStream = null;
    this.isNarrating = false;
  }

  private handleNarrationStart(e: CustomEvent) {
    this.isNarrating = true;
    this.narrationStyle = e.detail.style;
    this.voiceSettings = e.detail.voiceSettings;
    
    // Here you would integrate with the actual AI narration service
    console.log('Starting narration with style:', e.detail.style);
    console.log('Voice settings:', e.detail.voiceSettings);
  }

  private handleNarrationStop() {
    this.isNarrating = false;
    console.log('Stopping narration');
  }

  private handleStyleChanged(e: CustomEvent) {
    this.narrationStyle = e.detail.style;
    console.log('Narration style changed to:', e.detail.style);
  }

  private handleVoiceSettingsChanged(e: CustomEvent) {
    this.voiceSettings = e.detail.settings;
    console.log('Voice settings updated:', e.detail.settings);
  }

  override render() {
    if (this.currentView === 'streams') {
      return html`
        <div class="container">
          <header class="app-header">
            <h1>Wildlife Streams</h1>
            <button 
              class="btn btn-secondary"
              @click=${() => this.currentView = 'home'}
              aria-label="Back to home page"
            >
              ← Back to Home
            </button>
          </header>
          
          ${this.isLoading ? html`
            <div class="loading-message" role="status" aria-live="polite">
              <p>Loading wildlife streams...</p>
            </div>
          ` : ''}
          
          ${this.apiError ? html`
            <div class="error-message" role="alert">
              <p>⚠️ API Error: ${this.apiError}</p>
              <p>Using fallback demo streams.</p>
            </div>
          ` : ''}
          
          <stream-discovery
            .streams=${this.streams}
            @stream-selected=${this.handleStreamSelected}
          ></stream-discovery>
        </div>
      `;
    }

    if (this.currentView === 'player' && this.selectedStream) {
      return html`
        <div class="container">
          <header class="app-header">
            <h1>${this.selectedStream.title}</h1>
            <button 
              class="btn btn-secondary"
              @click=${this.handleBackToStreams}
              aria-label="Back to stream selection"
            >
              ← Back to Streams
            </button>
          </header>

          <div class="player-layout">
            <div class="video-section">
              <video-player
                .stream=${this.selectedStream}
                .autoplay=${false}
                .muted=${true}
              ></video-player>
            </div>

            <div class="controls-section">
              <narration-controls
                .isNarrating=${this.isNarrating}
                .selectedStyle=${this.narrationStyle}
                .voiceSettings=${this.voiceSettings}
                @narration-start=${this.handleNarrationStart}
                @narration-stop=${this.handleNarrationStop}
                @style-changed=${this.handleStyleChanged}
                @voice-settings-changed=${this.handleVoiceSettingsChanged}
              ></narration-controls>
            </div>
          </div>
        </div>
      `;
    }

    // Default home view
    return html`
      <div class="container">
        <!-- Hero Section -->
        <section class="hero" role="banner">
          <h1>Wildlife Narration</h1>
          <p>
            Experience wildlife through AI-powered narration designed for accessibility.
            Real-time descriptions of animal behavior from live streams.
          </p>
        </section>

        <!-- Features Section -->
        <section class="features" role="main" aria-labelledby="features-heading">
          <h2 id="features-heading" class="sr-only">Key Features</h2>
          
          <div class="feature-card">
            <h3>🎯 Real-time AI Narration</h3>
            <p>
              Advanced AI analyzes live wildlife streams and provides detailed, 
              real-time narration of animal behavior and interactions.
            </p>
          </div>

          <div class="feature-card">
            <h3>♿ Accessibility First</h3>
            <p>
              Designed specifically for blind and visually impaired users with 
              full screen reader support and WCAG 2.1 AA compliance.
            </p>
          </div>

          <div class="feature-card">
            <h3>🔊 Multiple Narration Styles</h3>
            <p>
              Choose from different narration styles: Field Scientist, Safari Adventurer, 
              or Calm Observer to match your preference.
            </p>
          </div>

          <div class="feature-card">
            <h3>🌍 Live Wildlife Streams</h3>
            <p>
              Connect to live YouTube wildlife streams from around the world, 
              including safaris, aquariums, and nature reserves.
            </p>
          </div>

          <div class="feature-card">
            <h3>⌨️ Keyboard Navigation</h3>
            <p>
              Full keyboard navigation support with intuitive shortcuts 
              and focus management for seamless interaction.
            </p>
          </div>

          <div class="feature-card">
            <h3>🎨 High Contrast Mode</h3>
            <p>
              Automatic high contrast mode detection and support for users 
              with visual impairments or specific display preferences.
            </p>
          </div>
        </section>

        <!-- Call to Action -->
        <section class="cta-section" role="complementary">
          <h2>Ready to Experience Wildlife?</h2>
          <p style="margin-bottom: 2rem; color: #6b7280;">
            Start exploring live wildlife streams with AI-powered narration
          </p>
          <button 
            class="btn btn-primary"
            @click=${this.handleGetStarted}
            aria-describedby="get-started-description"
          >
            Get Started
          </button>
          <div id="get-started-description" class="sr-only">
            Navigate to wildlife streams with AI narration
          </div>
        </section>
      </div>
    `;
  }
} 