import { html, css, LitElement } from 'lit';

class WildlifeNarrationApp extends LitElement {
  static properties = {
    category: { type: String },
    voiceEnabled: { type: Boolean },
    userType: { type: String },
    streams: { type: Array },
  };

  constructor() {
    super();
    this.category = 'africa';
    this.voiceEnabled = true;
    this.userType = 'adult';
    this.streams = [
      { id: 1, title: 'Elephant Cam', src: 'https://www.youtube.com/embed/Ihr_nwydXi0', category: 'africa' },
      { id: 2, title: 'Penguin Cam', src: 'https://www.youtube.com/embed/some-other-id', category: 'arctic' },
      // Add more as needed
    ];
  }

  static styles = css`
    header, nav, section {
      padding: 1rem;
    }
    header {
      background: #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    nav button {
      margin-right: 0.5rem;
    }
    .stream-card {
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    iframe {
      width: 100%;
      height: 200px;
      border: none;
    }
  `;

  setCategory(cat) {
    this.category = cat;
  }

  toggleVoice(e) {
    this.voiceEnabled = e.target.checked;
  }

  setUserType(type) {
    this.userType = type;
  }

  narrate(title) {
    const message = `${title} narration started for ${this.userType}.`;
    if (this.voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(message);
      speechSynthesis.speak(utterance);
    }
  }

  render() {
    return html`
      <header>
        <div>
          <h1>Hello, welcome!</h1>
          <label><input type="checkbox" .checked=${this.voiceEnabled} @change=${this.toggleVoice}/> Enable Voice-over</label>
        </div>
        <div>
          <button @click=${() => this.setUserType('adult')}>Adult</button>
          <button @click=${() => this.setUserType('minor')}>Minor</button>
        </div>
      </header>

      <nav>
        ${['africa', 'ocean', 'farm', 'forest', 'arctic', 'backyard'].map(cat => html`
          <button @click=${() => this.setCategory(cat)}>${cat}</button>
        `)}
      </nav>

      <section>
        ${this.streams.filter(s => s.category === this.category).map(s => html`
          <div class="stream-card">
            <iframe src=${s.src} allowfullscreen></iframe>
            <button @click=${() => this.narrate(s.title)}>▶ Narrate</button>
            <p>${s.title}</p>
          </div>
        `)}
      </section>
    `;
  }
}

customElements.define('wildlife-narration-app', WildlifeNarrationApp);
