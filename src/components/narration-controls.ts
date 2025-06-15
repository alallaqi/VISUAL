import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface NarrationStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: string;
}

@customElement('narration-controls')
export class NarrationControls extends LitElement {
  @property({ type: Boolean }) isNarrating = false;
  @property({ type: Boolean }) isLoading = false;
  @property({ type: String }) selectedStyle = 'field-scientist';
  @property({ type: Object }) voiceSettings: VoiceSettings = {
    rate: 1,
    pitch: 1,
    volume: 0.8,
    voice: 'default'
  };

  @state() private availableVoices: SpeechSynthesisVoice[] = [];
  @state() private showAdvancedSettings = false;
  @state() private lastNarrationText = '';

  private readonly narrationStyles: NarrationStyle[] = [
    {
      id: 'field-scientist',
      name: 'Field Scientist',
      description: 'Educational and informative, focusing on scientific facts and behaviors',
      icon: '🔬'
    },
    {
      id: 'safari-adventurer',
      name: 'Safari Adventurer',
      description: 'Exciting and engaging, with enthusiasm for wildlife encounters',
      icon: '🦁'
    },
    {
      id: 'calm-observer',
      name: 'Calm Observer',
      description: 'Peaceful and meditative, perfect for relaxation and mindfulness',
      icon: '🧘'
    }
  ];

  static override styles = css`
    :host {
      display: block;
      background: var(--color-background);
      border: 2px solid var(--color-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin: 1rem 0;
    }

    .controls-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .controls-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .main-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .narration-button {
      background: var(--color-primary);
      color: var(--color-primary-contrast);
      border: none;
      border-radius: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      min-height: 44px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .narration-button:hover,
    .narration-button:focus {
      background: var(--color-primary-dark);
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .narration-button:disabled {
      background: var(--color-gray-400);
      cursor: not-allowed;
      opacity: 0.6;
    }

    .narration-button.stop {
      background: var(--color-error);
    }

    .narration-button.stop:hover,
    .narration-button.stop:focus {
      background: var(--color-error-dark);
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .style-selector {
      margin-bottom: 1.5rem;
    }

    .style-label {
      display: block;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 0.75rem;
    }

    .style-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    .style-option {
      border: 2px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--color-background);
    }

    .style-option:hover,
    .style-option:focus {
      border-color: var(--color-primary);
      outline: none;
    }

    .style-option.selected {
      border-color: var(--color-primary);
      background: var(--color-primary-light);
    }

    .style-option-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .style-icon {
      font-size: 1.25rem;
    }

    .style-name {
      font-weight: 600;
      color: var(--color-text);
    }

    .style-description {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      line-height: 1.4;
    }

    .advanced-toggle {
      background: none;
      border: 2px solid var(--color-border);
      color: var(--color-text);
      border-radius: 0.25rem;
      padding: 0.5rem 1rem;
      cursor: pointer;
      font-size: 0.875rem;
      min-height: 44px;
      transition: all 0.2s ease;
    }

    .advanced-toggle:hover,
    .advanced-toggle:focus {
      border-color: var(--color-primary);
      background: var(--color-primary-light);
      outline: none;
    }

    .advanced-settings {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .setting-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .setting-label {
      font-weight: 600;
      color: var(--color-text);
      font-size: 0.875rem;
    }

    .setting-control {
      padding: 0.5rem;
      border: 2px solid var(--color-border);
      border-radius: 0.25rem;
      background: var(--color-background);
      color: var(--color-text);
      font-size: 0.875rem;
    }

    .setting-control:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-alpha);
    }

    .range-input {
      width: 100%;
      height: 6px;
      background: var(--color-gray-200);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    }

    .range-input::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      background: var(--color-primary);
      border-radius: 50%;
      cursor: pointer;
    }

    .range-value {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      text-align: center;
      margin-top: 0.25rem;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      margin-top: 1rem;
    }

    .status-indicator.active {
      background: var(--color-success-light);
      color: var(--color-success-dark);
      border: 1px solid var(--color-success);
    }

    .status-indicator.inactive {
      background: var(--color-gray-100);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .status-dot.active {
      animation: pulse 2s infinite;
    }

    @media (max-width: 768px) {
      .main-controls {
        flex-direction: column;
        align-items: stretch;
      }
      
      .style-options {
        grid-template-columns: 1fr;
      }
      
      .settings-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.loadAvailableVoices();
  }

  private loadAvailableVoices() {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        this.availableVoices = speechSynthesis.getVoices();
        this.requestUpdate();
      };

      updateVoices();
      speechSynthesis.addEventListener('voiceschanged', updateVoices);
    }
  }

  private handleNarrationToggle() {
    if (this.isNarrating) {
      this.stopNarration();
    } else {
      this.startNarration();
    }
  }

  private startNarration() {
    this.dispatchEvent(new CustomEvent('narration-start', {
      detail: {
        style: this.selectedStyle,
        voiceSettings: this.voiceSettings
      },
      bubbles: true
    }));
  }

  private stopNarration() {
    this.dispatchEvent(new CustomEvent('narration-stop', {
      bubbles: true
    }));
  }

  private handleStyleChange(styleId: string) {
    this.selectedStyle = styleId;
    this.dispatchEvent(new CustomEvent('style-changed', {
      detail: { style: styleId },
      bubbles: true
    }));
  }

  private handleVoiceSettingChange(setting: keyof VoiceSettings, value: string | number) {
    this.voiceSettings = {
      ...this.voiceSettings,
      [setting]: value
    };
    
    this.dispatchEvent(new CustomEvent('voice-settings-changed', {
      detail: { settings: this.voiceSettings },
      bubbles: true
    }));
  }

  private handleKeyDown(e: KeyboardEvent, styleId: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleStyleChange(styleId);
    }
  }

  override render() {
    const selectedStyleData = this.narrationStyles.find(s => s.id === this.selectedStyle);

    return html`
      <div class="controls-header">
        <h2 class="controls-title">AI Narration Controls</h2>
        <button
          class="advanced-toggle"
          @click=${() => this.showAdvancedSettings = !this.showAdvancedSettings}
          aria-expanded=${this.showAdvancedSettings}
          aria-controls="advanced-settings"
        >
          ${this.showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
        </button>
      </div>

      <div class="main-controls">
        <button
          class="narration-button ${this.isNarrating ? 'stop' : ''}"
          @click=${this.handleNarrationToggle}
          .disabled=${this.isLoading}
          aria-label=${this.isNarrating ? 'Stop narration' : 'Start narration'}
        >
          ${this.isLoading ? html`
            <span class="loading-spinner" aria-hidden="true"></span>
            Processing...
          ` : this.isNarrating ? html`
            ⏹️ Stop Narration
          ` : html`
            ▶️ Start Narration
          `}
        </button>
      </div>

      <div class="style-selector">
        <label class="style-label">Narration Style</label>
        <div class="style-options" role="radiogroup" aria-label="Narration style selection">
          ${this.narrationStyles.map(style => html`
            <div
              class="style-option ${this.selectedStyle === style.id ? 'selected' : ''}"
              role="radio"
              aria-checked=${this.selectedStyle === style.id}
              tabindex=${this.selectedStyle === style.id ? '0' : '-1'}
              @click=${() => this.handleStyleChange(style.id)}
              @keydown=${(e: KeyboardEvent) => this.handleKeyDown(e, style.id)}
            >
              <div class="style-option-header">
                <span class="style-icon" aria-hidden="true">${style.icon}</span>
                <span class="style-name">${style.name}</span>
              </div>
              <p class="style-description">${style.description}</p>
            </div>
          `)}
        </div>
      </div>

      ${this.showAdvancedSettings ? html`
        <div id="advanced-settings" class="advanced-settings">
          <div class="settings-grid">
            <div class="setting-group">
              <label class="setting-label" for="voice-select">Voice</label>
              <select
                id="voice-select"
                class="setting-control"
                .value=${this.voiceSettings.voice}
                @change=${(e: Event) => this.handleVoiceSettingChange('voice', (e.target as HTMLSelectElement).value)}
              >
                <option value="default">Default Voice</option>
                ${this.availableVoices.map(voice => html`
                  <option value=${voice.name}>${voice.name} (${voice.lang})</option>
                `)}
              </select>
            </div>

            <div class="setting-group">
              <label class="setting-label" for="rate-slider">Speech Rate</label>
              <input
                id="rate-slider"
                type="range"
                class="range-input"
                min="0.5"
                max="2"
                step="0.1"
                .value=${this.voiceSettings.rate.toString()}
                @input=${(e: Event) => this.handleVoiceSettingChange('rate', parseFloat((e.target as HTMLInputElement).value))}
                aria-describedby="rate-value"
              />
              <div id="rate-value" class="range-value">${this.voiceSettings.rate}x</div>
            </div>

            <div class="setting-group">
              <label class="setting-label" for="pitch-slider">Voice Pitch</label>
              <input
                id="pitch-slider"
                type="range"
                class="range-input"
                min="0.5"
                max="2"
                step="0.1"
                .value=${this.voiceSettings.pitch.toString()}
                @input=${(e: Event) => this.handleVoiceSettingChange('pitch', parseFloat((e.target as HTMLInputElement).value))}
                aria-describedby="pitch-value"
              />
              <div id="pitch-value" class="range-value">${this.voiceSettings.pitch}</div>
            </div>

            <div class="setting-group">
              <label class="setting-label" for="volume-slider">Narration Volume</label>
              <input
                id="volume-slider"
                type="range"
                class="range-input"
                min="0"
                max="1"
                step="0.1"
                .value=${this.voiceSettings.volume.toString()}
                @input=${(e: Event) => this.handleVoiceSettingChange('volume', parseFloat((e.target as HTMLInputElement).value))}
                aria-describedby="volume-value"
              />
              <div id="volume-value" class="range-value">${Math.round(this.voiceSettings.volume * 100)}%</div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="status-indicator ${this.isNarrating ? 'active' : 'inactive'}" role="status" aria-live="polite">
        <span class="status-dot ${this.isNarrating ? 'active' : ''}" aria-hidden="true"></span>
        ${this.isNarrating ? html`
          Narration active with ${selectedStyleData?.name} style
        ` : html`
          Narration inactive
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'narration-controls': NarrationControls;
  }
} 