import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('wildlife-footer')
export class WildlifeFooter extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: #1f2937;
      color: white;
      padding: 2rem 0;
      margin-top: 4rem;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      text-align: center;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .footer-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .footer-section p,
    .footer-section a {
      color: #d1d5db;
      text-decoration: none;
      line-height: 1.6;
    }

    .footer-section a:hover {
      color: white;
      text-decoration: underline;
    }

    .footer-section a:focus {
      outline: none;
      box-shadow: 0 0 0 2px #60a5fa;
      border-radius: 2px;
    }

    .footer-bottom {
      border-top: 1px solid #374151;
      padding-top: 1rem;
      font-size: 0.875rem;
      color: #9ca3af;
    }

    /* High contrast mode */
    :host(.high-contrast) {
      background: black;
      border-top: 2px solid white;
    }

    :host(.high-contrast) .footer-section a:focus {
      box-shadow: 0 0 0 2px yellow;
    }
  `;

  render() {
    return html`
      <footer class="footer-container" role="contentinfo">
        <div class="footer-content">
          <div class="footer-section">
            <h3>Accessibility</h3>
            <p>
              This application is designed with accessibility in mind, 
              following WCAG 2.1 AA guidelines for users with visual impairments.
            </p>
          </div>
          
          <div class="footer-section">
            <h3>Keyboard Shortcuts</h3>
            <p>
              Alt + M: Focus main content<br>
              Alt + N: Focus navigation<br>
              Escape: Stop narration
            </p>
          </div>
          
          <div class="footer-section">
            <h3>Support</h3>
            <p>
              <a href="#" aria-label="Contact support team">Contact Support</a><br>
              <a href="#" aria-label="View accessibility documentation">Accessibility Guide</a><br>
              <a href="#" aria-label="Report accessibility issues">Report Issues</a>
            </p>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>
            © 2024 Wildlife Narration. Built with accessibility and inclusion in mind.
          </p>
        </div>
      </footer>
    `;
  }
} 