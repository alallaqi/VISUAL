import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { Stream } from '../types/stream.js';
import './video-player.js';

@customElement('wildlife-app')
export class WildlifeApp extends LitElement {
  @state()
  private currentView = 'home';

  @state()
  private selectedRegion = '';

  @state()
  private selectedProfile = 'adult';

  @state()
  private selectedNarrationStyle = 'safari-adventurer';

  @state()
  private isNarrating = false;

  @state()
  private playbackSpeed = 1;

  @state()
  private streams: Stream[] = [];

  @state()
  private currentStream: Stream | null = null;

  @state()
  private isLoadingStreams = false;

  static override styles = css`
    @import url('https://fonts.googleapis.com/css2?family=Dosis:wght@400;500;600;700;800&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      font-family: 'Dosis', sans-serif;
      overflow: hidden;
    }

    .page {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    /* Homepage Styles - Exact Figma Match */
    .hero-home {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      box-sizing: border-box;
      padding: 0 20px;
    }

    .hero-content {
      max-width: 945px;
      width: 100%;
      text-align: center;
      margin-right: 2rem;
    }

    .hero-content h1 {
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: clamp(48px, 6vw, 96px);
      line-height: 1.26;
      letter-spacing: -3.84px;
      color: #000000;
      margin-bottom: 2rem;
      text-align: center;
    }

    .hero-description {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: clamp(20px, 2.5vw, 40px);
      line-height: 1.2;
      letter-spacing: 0px;
      color: #000000;
      margin-bottom: 3rem;
      text-align: center;
      max-width: 863px;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-tagline {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: clamp(20px, 2.5vw, 40px);
      line-height: 1.2;
      color: #000000;
      margin-bottom: 4rem;
      text-align: center;
    }

    .hero-buttons {
      display: flex;
      gap: 2rem;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }

    .hero-image {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      max-width: 729px;
      height: 824px;
    }

    .hero-image img {
      width: 100%;
      height: 100%;
      max-width: 729px;
      max-height: 824px;
      object-fit: contain;
    }

    /* Destinations Page Styles - Exact Figma Match */
    .destinations-page {
      width: 100vw;
      height: 100vh;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      padding: 40px;
      position: relative;
    }

    .destinations-title {
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: clamp(30px, 4vw, 60px);
      line-height: 1.264;
      letter-spacing: -2.4px;
      color: #000000;
      text-align: center;
      margin-bottom: clamp(2rem, 4vw, 4rem);
      width: 100%;
      max-width: 1490px;
    }

    .destinations-grid {
      display: grid;
      grid-template-columns: repeat(4, 180px);
      grid-template-rows: repeat(2, 150px);
      gap: clamp(1rem, 2vw, 2rem);
      justify-content: center;
      align-content: center;
      width: 100%;
      max-width: 838px;
      height: auto;
      margin: 0 auto;
    }

    .destination-card {
      position: relative;
      width: 180px;
      height: 150px; /* Increased to accommodate floating animal */
      cursor: pointer;
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .destination-card:hover {
      transform: translateY(-2px);
    }

    .destination-icon {
      width: 60px;
      height: 60px;
      object-fit: contain;
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
    }

    .destination-button {
      background: #ff7426;
      border-radius: 30px;
      width: 180px;
      height: 114px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 36px; /* Space for the floating animal */
      border: none;
      cursor: pointer;
      transition: box-shadow 0.3s ease;
    }

    .destination-card:hover .destination-button {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .destination-name {
      font-family: 'Dosis', sans-serif;
      font-weight: 700;
      font-size: clamp(14px, 2.2vw, 28px);
      line-height: 1.1;
      letter-spacing: -0.8px;
      color: #000000;
      text-align: center;
      margin: 0;
      width: 100%;
    }

    /* Responsive Grid Layout */
    @media (max-width: 1024px) {
      .destinations-grid {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(4, 1fr);
        gap: 1.5rem;
        max-width: 400px;
        height: auto;
      }
      
      .destination-card {
        width: 160px;
        height: 100px;
      }
    }

    @media (max-width: 640px) {
      .destinations-grid {
        grid-template-columns: 1fr;
        grid-template-rows: repeat(8, 1fr);
        gap: 1rem;
        max-width: 200px;
      }
      
      .destination-card {
        width: 180px;
        height: 90px;
      }
    }

    /* Africa Page Styles - Exact Figma Match */
    .africa-page {
      width: 100vw;
      height: 100vh;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 40px;
      position: relative;
    }

    .africa-container {
      width: 100%;
      max-width: 1339px;
      height: 624px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }

    .africa-content {
      width: 770px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .africa-title {
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: clamp(30px, 4vw, 60px);
      line-height: 1.264;
      letter-spacing: -2.4px;
      color: #000000;
      text-align: center;
      margin-bottom: 2rem;
      width: 541px;
      height: 76px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .africa-description {
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: clamp(18px, 2.5vw, 32px);
      line-height: 1.3;
      letter-spacing: -0.8px;
      color: #000000;
      text-align: center;
      margin-bottom: 3rem;
      width: 770px;
      height: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .africa-buttons {
      display: flex;
      gap: 2rem;
      justify-content: center;
      align-items: center;
    }

    .africa-btn {
      background: #ff7426;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: clamp(16px, 2vw, 24px);
      line-height: 1.2;
      letter-spacing: -0.5px;
      color: #000000;
      text-align: center;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .africa-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .africa-btn.search {
      width: 271px;
      height: 71px;
    }

    .africa-btn.safari {
      width: 290px;
      height: 71px;
    }

    .africa-image {
      width: 531px;
      height: 562px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .africa-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .back-button {
      position: absolute;
      bottom: 40px;
      left: 40px;
      background: #ff7426;
      border-radius: 10px;
      border: none;
      width: 66px;
      height: 70px;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      z-index: 10;
    }

    .back-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .back-arrow {
      width: 32px;
      height: 20px;
      stroke: #000000;
      stroke-width: 2;
      fill: none;
    }

    /* Responsive back button */
    @media (max-width: 768px) {
      .back-button {
        bottom: 20px;
        left: 20px;
        width: 50px;
        height: 50px;
      }
      
      .back-arrow {
        width: 24px;
        height: 16px;
      }
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .africa-container {
        flex-direction: column;
        height: auto;
        gap: 2rem;
      }
      
      .africa-content {
        width: 100%;
        max-width: 600px;
      }
      
      .africa-title {
        width: 100%;
        height: auto;
      }
      
      .africa-description {
        width: 100%;
        height: auto;
      }
      
      .africa-image {
        width: 400px;
        height: 400px;
      }
    }

    /* Safari Page Styles - 3 Column Layout */
    .safari-page {
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      width: 100vw;
      height: 100vh;
      box-sizing: border-box;
      padding: 40px;
    }

    .safari-header {
      text-align: center;
      width: 100%;
      margin-bottom: 40px;
    }

    .safari-header h1 {
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: 55px;
      line-height: 69.52px;
      letter-spacing: -2.2px;
      color: #000000;
      margin: 0;
    }

    .safari-grid {
      display: grid;
      grid-template-columns: 284px 284px 569px;
      gap: 40px;
      max-width: 1490px;
      width: 100%;
      align-items: start;
      justify-content: center;
    }

    .safari-column-1 {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .safari-column-2 {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .safari-column-3 {
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .control-group h3 {
      font-family: 'Dosis', sans-serif;
      font-weight: 700;
      font-size: 40px;
      line-height: 50.56px;
      letter-spacing: -1.6px;
      color: #000000;
      margin: 0;
    }

    .profile-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 280px;
    }

    .narration-style-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 259px;
    }

    .speed-buttons {
      display: flex;
      gap: 12px;
      width: 248px;
    }

    .narration-action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 284px;
    }

    .control-btn {
      background: #FF7426;
      color: #000000;
      border: none;
      border-radius: 10px;
      font-family: 'Dosis', sans-serif;
      font-weight: 700;
      font-size: 20px;
      line-height: 24px;
      letter-spacing: -0.8px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }

    .profile-btn {
      width: 280px;
      height: 48px;
    }

    .style-btn {
      width: 259px;
      height: 48px;
    }

    .speed-btn {
      height: 51px;
      min-width: 34px;
      flex: 1;
    }

    .action-btn {
      width: 284px;
      height: 63px;
    }

    .control-btn:hover {
      background: #F97400;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(249, 116, 0, 0.3);
    }

    .control-btn.active {
      background: #F97400;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .video-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }

    .video-player {
      width: 569px;
      height: 429px;
      border-radius: 30px;
      overflow: hidden;
      position: relative;
    }

    .video-background {
      width: 100%;
      height: 100%;
      background: #FFC69B;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .video-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .play-icon {
      font-size: 80px;
      color: #000000;
      opacity: 0.7;
    }

    .loading-streams {
      width: 569px;
      height: 429px;
      border-radius: 30px;
      background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .no-streams {
      width: 569px;
      height: 429px;
      border-radius: 30px;
      background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
    }

    .no-streams-icon {
      font-size: 60px;
      margin-bottom: 16px;
      opacity: 0.8;
    }

    .test-api-btn {
      margin-top: 16px;
      padding: 8px 16px;
      background: #FF7426;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.3s;
    }

    .test-api-btn:hover {
      background: #e6651f;
    }

    /* Responsive adjustments */
    @media (max-width: 1600px) {
      .safari-grid {
        grid-template-columns: 260px 260px 450px;
        gap: 30px;
      }
      
      .video-player {
        width: 450px;
        height: 340px;
      }
      
      .profile-buttons,
      .narration-action-buttons {
        width: 260px;
      }
      
      .narration-style-buttons {
        width: 240px;
      }
      
      .speed-buttons {
        width: 220px;
      }
      
      .action-btn {
        width: 260px;
      }
    }

    @media (max-width: 1200px) {
      .safari-grid {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
        gap: 30px;
        justify-items: center;
      }
      
      .safari-column-1,
      .safari-column-2,
      .safari-column-3 {
        width: 100%;
        max-width: 400px;
        justify-content: center;
        align-items: center;
      }
      
      .video-player {
        width: 400px;
        height: 300px;
      }
    }

    /* Button Styles - Exact Figma Match */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 20px 30px;
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: clamp(28px, 3.5vw, 48px);
      line-height: 1.2;
      letter-spacing: -1.5px;
      border-radius: 15px;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      text-align: center;
      background-color: #F97400;
      color: #000000;
      min-width: 200px;
      width: auto;
      height: auto;
      min-height: 70px;
      box-shadow: 0 4px 15px rgba(249, 116, 0, 0.25);
      white-space: nowrap;
    }

    .btn:hover {
      background-color: #E06600;
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(249, 116, 0, 0.35);
    }

    .btn:active {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(249, 116, 0, 0.4);
    }

    /* Second button variant */
    .hero-buttons .btn:nth-child(2) {
      background-color: #FF7426;
      margin-left: 10px;
    }

    .hero-buttons .btn:nth-child(2):hover {
      background-color: #E06600;
    }

    .btn-small {
      padding: 10px;
      font-size: 1rem;
      width: auto;
      min-width: 120px;
    }

    /* How It Works Page Styles */
    .how-it-works-page {
      background: #ffffff;
      color: #000000;
      padding: 60px 40px 80px 40px;
      min-height: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    .how-it-works-container {
      max-width: 1335px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 40px;
    }

    .how-it-works-title {
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: clamp(40px, 4vw, 60px);
      line-height: clamp(50px, 5vw, 76px);
      letter-spacing: -2.4px;
      text-align: center;
      color: #000000;
      margin: 0;
    }

    .how-it-works-subtitle {
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: clamp(24px, 2.7vw, 40px);
      line-height: clamp(30px, 3.4vw, 51px);
      letter-spacing: -1.6px;
      text-align: center;
      color: #000000;
      margin: 0;
      max-width: 1335px;
    }

    .how-it-works-content {
      width: 100%;
      max-width: 1335px;
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .step-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .step-section h3 {
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: clamp(24px, 2.7vw, 40px);
      line-height: clamp(30px, 3.4vw, 51px);
      letter-spacing: -1.6px;
      text-align: left;
      color: #000000;
      margin: 0;
    }

    .step-section p {
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: clamp(24px, 2.7vw, 40px);
      line-height: clamp(30px, 3.4vw, 51px);
      letter-spacing: -1.6px;
      text-align: left;
      color: #000000;
      margin: 0;
    }

    .how-it-works-button-container {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }

    .how-it-works-btn {
      background: #FF7426;
      color: #000000;
      border: none;
      border-radius: 10px;
      padding: 10px;
      font-family: 'Dosis', sans-serif;
      font-weight: 600;
      font-size: clamp(32px, 3.2vw, 48px);
      line-height: clamp(40px, 4vw, 61px);
      letter-spacing: -1.92px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 278px;
      height: 81px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .how-it-works-btn:hover {
      background: #F97400;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 116, 0, 0.3);
    }

    .how-it-works-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 10px rgba(249, 116, 0, 0.4);
    }

    /* Responsive adjustments for How It Works */
    @media (max-width: 768px) {
      .how-it-works-page {
        padding: 40px 20px;
      }
      
      .how-it-works-container {
        gap: 30px;
      }
      
      .how-it-works-content {
        gap: 20px;
      }
      
      .step-section {
        gap: 8px;
      }
    }
      height: 60px;
    }

    .btn-active {
      background-color: #E06600;
      transform: translateY(-1px);
    }

    .speed-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .speed-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
    }

    /* Responsive adjustments */
    @media (max-width: 1200px) {
      .hero-home {
        flex-direction: column;
        text-align: center;
        padding: 40px 20px;
      }
      
      .hero-content {
        margin-right: 0;
        margin-bottom: 2rem;
      }
      
      .hero-image {
        max-width: 400px;
        height: auto;
      }
      
      .destinations-page {
        padding: 40px;
      }
      
      .destinations-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .safari-page {
        flex-direction: column;
        padding: 20px;
      }
      
      .safari-controls {
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .hero-buttons {
        flex-direction: column;
        gap: 1rem;
      }
      
      .destinations-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .destinations-title {
        font-size: 2rem;
      }
      
      .btn {
        width: 100%;
        max-width: 300px;
      }
    }
  `;

  private handleDestinationSelect(region: string) {
    this.selectedRegion = region;
    this.currentView = region.toLowerCase();
  }

  private handleProfileSelect(profile: string) {
    this.selectedProfile = profile;
  }

  private handleNarrationStyleSelect(style: string) {
    this.selectedNarrationStyle = style;
  }

  private handlePlaybackSpeed(speed: number) {
    this.playbackSpeed = speed;
  }

  private handleNarrationToggle() {
    this.isNarrating = !this.isNarrating;
  }

  private async loadStreams() {
    if (this.isLoadingStreams) return;
    
    this.isLoadingStreams = true;
    console.log('🎬 Loading wildlife streams...');
    
    try {
      const response = await fetch('http://localhost:8001/api/v1/streams/');
      const data = await response.json();
      
      if (data.streams && data.streams.length > 0) {
        this.streams = data.streams;
        this.currentStream = data.streams[0]; // Load the first stream by default
        console.log('✅ Loaded streams:', this.streams.length);
        console.log('📺 Current stream:', this.currentStream?.title);
      } else {
        console.log('⚠️ No streams found');
      }
    } catch (error) {
      console.error('❌ Failed to load streams:', error);
    } finally {
      this.isLoadingStreams = false;
    }
  }

  private async handleSafariStart() {
    this.currentView = 'safari';
    // Load streams when entering safari page
    await this.loadStreams();
  }

  override render() {
    // Home Page
    if (this.currentView === 'home') {
      return html`
        <div class="page">
          <section class="hero-home">
            <div class="hero-content">
              <h1>WELCOME TO VISUAL</h1>
              <p class="hero-description">
                Welcome to a world where the wild comes alive through sound. Explore vast savannas and lush jungles with narration crafted for curious, listening ears.
              </p>
              <p class="hero-tagline">
                Your Virtual Inclusive Safari for Unique Adventurers.
              </p>
              <div class="hero-buttons">
                <button 
                  class="btn"
                  @click=${() => this.currentView = 'how-it-works'}
                >
                  How it works
                </button>
                <button 
                  class="btn"
                  @click=${() => this.currentView = 'destinations'}
                >
                  Start Exploring
                </button>
              </div>
            </div>
            <div class="hero-image">
              <img src="/src/assets/lion.png" alt="Majestic lion roaring">
            </div>
          </section>
        </div>
      `;
    }

    // Destinations Page
    if (this.currentView === 'destinations') {
      return html`
        <div class="page destinations-page">
          <button class="back-button" @click=${() => this.currentView = 'home'}>
            <svg class="back-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h1 class="destinations-title">Choose your destination — where does your adventure begin?</h1>
          <div class="destinations-grid">
            <!-- First Row: South America, Australia, Asia, Africa -->
            <div class="destination-card" @click=${() => this.handleDestinationSelect('South America')}>
              <img src="/src/assets/Jaguar.png" alt="Jaguar" class="destination-icon">
              <button class="destination-button">
                <div class="destination-name">South<br>America</div>
              </button>
            </div>
            <div class="destination-card" @click=${() => this.handleDestinationSelect('Australia')}>
              <img src="/src/assets/Alligator.png" alt="Alligator" class="destination-icon">
              <button class="destination-button">
                <div class="destination-name">Australia</div>
              </button>
            </div>
            <div class="destination-card" @click=${() => this.handleDestinationSelect('Asia')}>
              <img src="/src/assets/Monkey.png" alt="Monkey" class="destination-icon">
              <button class="destination-button">
                <div class="destination-name">Asia</div>
              </button>
            </div>
            <div class="destination-card" @click=${() => this.handleDestinationSelect('Africa')}>
              <img src="/src/assets/Antilope.png" alt="Antelope" class="destination-icon">
              <button class="destination-button">
                <div class="destination-name">Africa</div>
              </button>
            </div>
            <!-- Second Row: Oceans, Polar Zones, Europa, North America -->
            <div class="destination-card" @click=${() => this.handleDestinationSelect('Oceans')}>
              <img src="/src/assets/Fish.png" alt="Fish" class="destination-icon">
              <button class="destination-button">
                <div class="destination-name">Oceans</div>
              </button>
            </div>
            <div class="destination-card" @click=${() => this.handleDestinationSelect('Polar Zones')}>
              <img src="/src/assets/Polar Bear.png" alt="Polar Bear" class="destination-icon">
              <button class="destination-button">
                <div class="destination-name">Polar Zones</div>
              </button>
            </div>
            <div class="destination-card" @click=${() => this.handleDestinationSelect('Europa')}>
              <img src="/src/assets/Wildschwein.png" alt="Wild Boar" class="destination-icon">
              <button class="destination-button">
                <div class="destination-name">Europa</div>
              </button>
            </div>
            <div class="destination-card" @click=${() => this.handleDestinationSelect('North America')}>
              <img src="/src/assets/Bison.png" alt="Bison" class="destination-icon">
              <button class="destination-button">
                <div class="destination-name">North America</div>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // Africa Page
    if (this.currentView === 'africa') {
      return html`
        <div class="page africa-page">
          <div class="africa-container">
            <div class="africa-content">
              <h1 class="africa-title">You have arrived in Africa</h1>
              <p class="africa-description">
                Choose your path:<br>
                Search for an animal you are curious about,<br>
                or follow a guided journey through the wildlife of Africa.<br><br>
                Confirm with the buttons below:
              </p>
              <div class="africa-buttons">
                <button 
                  class="africa-btn search"
                  @click=${() => this.currentView = 'search'}
                >
                  Search by<br>Animal
                </button>
                <button 
                  class="africa-btn safari"
                  @click=${this.handleSafariStart}
                >
                  Start Guided<br>Safari
                </button>
              </div>
            </div>
            <div class="africa-image">
              <img src="/src/assets/africa.png" alt="Africa continent map with wildlife silhouettes">
            </div>
          </div>
          <button class="back-button" @click=${() => this.currentView = 'destinations'}>
            <svg class="back-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      `;
    }

    // Safari Page
    if (this.currentView === 'safari') {
      return html`
        <div class="safari-page">
          <!-- Header -->
          <div class="safari-header">
            <h1>Let the Safari Begin</h1>
          </div>

          <!-- 3 Column Layout -->
          <div class="safari-grid">
            <!-- Column 1 - Profile & Narration Styles -->
            <div class="safari-column-1">
              <!-- Profile Selection -->
              <div class="control-group">
                <h3>Select your Profile</h3>
                <div class="profile-buttons">
                  <button class="control-btn profile-btn ${this.selectedProfile === 'adult' ? 'active' : ''}" 
                          @click="${() => this.handleProfileSelect('adult')}">Adult</button>
                  <button class="control-btn profile-btn ${this.selectedProfile === 'child' ? 'active' : ''}" 
                          @click="${() => this.handleProfileSelect('child')}">Child</button>
                </div>
              </div>

              <!-- Narration Styles -->
              <div class="control-group">
                <h3>Narration Styles</h3>
                <div class="narration-style-buttons">
                  <button class="control-btn style-btn ${this.selectedNarrationStyle === 'safari-adventurer' ? 'active' : ''}" 
                          @click="${() => this.handleNarrationStyleSelect('safari-adventurer')}">Safari Adventurer</button>
                  <button class="control-btn style-btn ${this.selectedNarrationStyle === 'field-scientist' ? 'active' : ''}" 
                          @click="${() => this.handleNarrationStyleSelect('field-scientist')}">Field Scientist</button>
                  <button class="control-btn style-btn ${this.selectedNarrationStyle === 'calm-observer' ? 'active' : ''}" 
                          @click="${() => this.handleNarrationStyleSelect('calm-observer')}">Calm Observer</button>
                </div>
              </div>
            </div>

            <!-- Column 2 - Playback Speed & Narration Actions -->
            <div class="safari-column-2">
              <!-- Playback Speed -->
              <div class="control-group">
                <h3>Playback Speed</h3>
                <div class="speed-buttons">
                  <button class="control-btn speed-btn ${this.playbackSpeed === 0.75 ? 'active' : ''}" 
                          @click="${() => this.handlePlaybackSpeed(0.75)}">0.75</button>
                  <button class="control-btn speed-btn ${this.playbackSpeed === 1 ? 'active' : ''}" 
                          @click="${() => this.handlePlaybackSpeed(1)}">1</button>
                  <button class="control-btn speed-btn ${this.playbackSpeed === 1.25 ? 'active' : ''}" 
                          @click="${() => this.handlePlaybackSpeed(1.25)}">1.25</button>
                </div>
              </div>

              <!-- Narration Actions -->
              <div class="control-group">
                <h3>Narration Actions</h3>
                <div class="narration-action-buttons">
                  <button class="control-btn action-btn ${!this.isNarrating ? 'active' : ''}" 
                          @click="${this.handleNarrationToggle}">Start Narration</button>
                  <button class="control-btn action-btn ${this.isNarrating ? 'active' : ''}" 
                          @click="${this.handleNarrationToggle}">Pause Narration</button>
                  <button class="control-btn action-btn" @click="${this.nextAnimal}">Go to next Animal</button>
                  <button class="control-btn action-btn" @click="${this.endSafariTour}">End Safari Tour</button>
                </div>
              </div>
            </div>

            <!-- Column 3 - Video Player -->
            <div class="safari-column-3">
              <div class="video-container">
                ${this.isLoadingStreams ? html`
                  <div class="loading-streams">
                    <div class="loading-spinner"></div>
                    <p>Loading wildlife streams...</p>
                  </div>
                ` : this.currentStream ? html`
                  <video-player 
                    .stream=${this.currentStream}
                    .autoplay=${true}
                  ></video-player>
                ` : html`
                  <div class="no-streams">
                    <div class="no-streams-icon">📡</div>
                    <p>No wildlife streams available</p>
                    <button class="test-api-btn" @click="${this.testApiConnection}">Test API Connection</button>
                  </div>
                `}
              </div>
            </div>
          </div>

          <!-- Back Button at Bottom -->
          <button class="back-button" @click="${() => this.currentView = 'africa'}">
            <svg class="back-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      `;
    }

    // How It Works Page
    if (this.currentView === 'how-it-works') {
      return html`
        <div class="page how-it-works-page">
          <button class="back-button" @click=${() => this.currentView = 'home'}>
            <svg class="back-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <div class="how-it-works-container">
            <h1 class="how-it-works-title">How it works</h1>
            
            <p class="how-it-works-subtitle">
              VISUAL is a virtual safari experience specially created for blind and visually impaired adventurers. It brings the wild to life through rich, vivid audio narration, making wildlife accessible to all.
            </p>
            
            <div class="how-it-works-content">
              <div class="step-section">
                <h3>Start Your Journey</h3>
                <p>From the welcome screen, choose "Start Exploring." You'll be guided by audio prompts every step of the way.</p>
              </div>

              <div class="step-section">
                <h3>Choose Your Destination</h3>
                <p>You'll hear a list of regions like Africa, Asia, or the Oceans. Each destination is paired with unique animal sounds or descriptions. Simply select the region you want to explore.</p>
              </div>

              <div class="step-section">
                <h3>Pick Your Path</h3>
                <p>Once you arrive, decide how to continue:</p>
                <p>Search by Animal if you're curious about a specific creature (like "elephant" or "shark").</p>
                <p>Or choose Start Guided Safari to enjoy a narrated journey through the region.</p>
              </div>

              <div class="step-section">
                <h3>Customize Your Experience</h3>
                <p>Before the safari begins, you can:</p>
                <p>Select a user profile: Adult or Child</p>
                <p>Pick a narration style: Safari Adventurer (dynamic), Field Scientist (factual), or Calm Observer (relaxing)</p>
                <p>When you are ready, you can start the narration by clicking on the designated button</p>
              </div>

              <div class="step-section">
                <h3>Further Narration Actions</h3>
                <p>You're in control with four main buttons:</p>
                <p>Start Narration – Begin listening</p>
                <p>Pause Narration – Stop temporarily</p>
                <p>Go to Next Animal – Skip forward</p>
                <p>End Safari Tour – Exit the experience</p>
              </div>

              <div class="step-section">
                <p>Even if no animals are present, you'll hear either the last snapshot or educational info about the area. That means the experience is always active—never silent, never empty.</p>
                <p>VISUAL is designed to be easy, immersive, and fully sound-driven—because everyone deserves to explore the wild.</p>
              </div>
            </div>

            <div class="how-it-works-button-container">
              <button class="how-it-works-btn" @click=${() => this.currentView = 'destinations'}>
                Start Exploring
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // Default fallback
    return html`<div>Loading...</div>`;
  }

  // Safari page additional methods
  private nextAnimal() {
    // Logic for next animal
    console.log('Going to next animal');
  }

  private endSafariTour() {
    // Logic to end safari tour
    this.currentView = 'africa';
    this.requestUpdate();
  }

  private async testApiConnection() {
    console.log('🧪 Testing API connection...');
    try {
      const response = await fetch('http://localhost:8001/health');
      const data = await response.json();
      console.log('✅ API Health:', data);
      
      const streamsResponse = await fetch('http://localhost:8001/api/v1/streams/');
      const streamsData = await streamsResponse.json();
      console.log('✅ Streams:', streamsData);
      
      alert(`API Connected! Found ${streamsData.streams.length} streams`);
    } catch (error) {
      console.error('❌ API Connection failed:', error);
      alert('API Connection failed - check console');
    }
  }
} 