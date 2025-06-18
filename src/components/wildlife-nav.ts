import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('wildlife-nav')
export class WildlifeNav extends LitElement {
  static override styles = css`
    :host {
      display: block;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 1rem 0;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: #0ea5e9;
      text-decoration: none;
    }

    .nav-links {
      display: flex;
      gap: 2rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .nav-link {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      transition: all 0.2s;
      min-height: 44px;
      display: flex;
      align-items: center;
    }

    .nav-link:hover {
      background: #f3f4f6;
      color: #0ea5e9;
    }

    .nav-link:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.3);
    }

    /* High contrast mode */
    :host(.high-contrast) {
      background: black;
      border-color: white;
    }

    :host(.high-contrast) .logo {
      color: white;
    }

    :host(.high-contrast) .nav-link {
      color: white;
    }

    :host(.high-contrast) .nav-link:hover {
      background: white;
      color: black;
    }

    :host(.high-contrast) .nav-link:focus {
      box-shadow: 0 0 0 3px yellow;
    }
  `;

  override render() {
    return html`
      <nav class="nav-container" role="navigation" aria-label="Main navigation">
        <a href="#" class="logo" aria-label="Wildlife Narration Home">
          🦁 Wildlife Narration
        </a>
        
        <ul class="nav-links">
          <li>
            <a href="#" class="nav-link" aria-current="page">
              Home
            </a>
          </li>
          <li>
            <a href="#" class="nav-link">
              Streams
            </a>
          </li>
          <li>
            <a href="#" class="nav-link">
              Settings
            </a>
          </li>
          <li>
            <a href="#" class="nav-link">
              Help
            </a>
          </li>
        </ul>
      </nav>
    `;
  }
} 