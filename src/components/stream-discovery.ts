import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface StreamInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  viewerCount: number;
  isLive: boolean;
  category: string;
  duration?: string;
  streamUrl?: string;
  webpageUrl?: string;
}

@customElement('stream-discovery')
export class StreamDiscovery extends LitElement {
  @property({ type: Array }) streams: StreamInfo[] = [];
  @property({ type: String }) selectedCategory = 'all';
  @state() private searchQuery = '';
  @state() private isLoading = false;

  static override styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    .search-container {
      margin-bottom: 2rem;
    }

    .search-input {
      width: 100%;
      max-width: 400px;
      padding: 0.75rem;
      border: 2px solid var(--color-border);
      border-radius: 0.5rem;
      font-size: 1rem;
      background: var(--color-background);
      color: var(--color-text);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-alpha);
    }

    .filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .filter-button {
      padding: 0.5rem 1rem;
      border: 2px solid var(--color-border);
      background: var(--color-background);
      color: var(--color-text);
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 0.875rem;
      min-height: 44px;
      transition: all 0.2s ease;
    }

    .filter-button:hover,
    .filter-button:focus {
      background: var(--color-primary-light);
      border-color: var(--color-primary);
      outline: none;
    }

    .filter-button.active {
      background: var(--color-primary);
      color: var(--color-primary-contrast);
      border-color: var(--color-primary);
    }

    .streams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .stream-card {
      border: 2px solid var(--color-border);
      border-radius: 0.5rem;
      overflow: hidden;
      background: var(--color-background);
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .stream-card:hover,
    .stream-card:focus {
      border-color: var(--color-primary);
      box-shadow: 0 4px 12px var(--color-shadow);
      outline: none;
    }

    .stream-thumbnail {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: var(--color-gray-200);
    }

    .stream-info {
      padding: 1rem;
    }

    .stream-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--color-text);
      line-height: 1.4;
    }

    .stream-description {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .stream-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }

    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--color-success);
      font-weight: 600;
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

    .loading {
      text-align: center;
      padding: 2rem;
      color: var(--color-text-secondary);
    }

    .no-results {
      text-align: center;
      padding: 2rem;
      color: var(--color-text-secondary);
    }

    @media (max-width: 768px) {
      .streams-grid {
        grid-template-columns: 1fr;
      }
      
      .filters {
        justify-content: center;
      }
    }
  `;

  private get filteredStreams() {
    let filtered = this.streams;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(stream => stream.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(stream => 
        stream.title.toLowerCase().includes(query) ||
        stream.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  private get categories() {
    const cats = new Set(this.streams.map(stream => stream.category));
    return ['all', ...Array.from(cats)];
  }

  private handleSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchQuery = input.value;
  }

  private handleCategoryFilter(category: string) {
    this.selectedCategory = category;
    this.dispatchEvent(new CustomEvent('category-changed', {
      detail: { category },
      bubbles: true
    }));
  }

  private handleStreamSelect(stream: StreamInfo) {
    this.dispatchEvent(new CustomEvent('stream-selected', {
      detail: { stream },
      bubbles: true
    }));
  }

  private handleKeyDown(e: KeyboardEvent, stream: StreamInfo) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleStreamSelect(stream);
    }
  }

  override render() {
    const filteredStreams = this.filteredStreams;

    return html`
      <div class="search-container">
        <label for="stream-search" class="sr-only">Search wildlife streams</label>
        <input
          id="stream-search"
          type="search"
          class="search-input"
          placeholder="Search wildlife streams..."
          .value=${this.searchQuery}
          @input=${this.handleSearch}
          aria-describedby="search-help"
        />
        <div id="search-help" class="sr-only">
          Search through available wildlife streams by title or description
        </div>
      </div>

      <div class="filters" role="tablist" aria-label="Stream categories">
        ${this.categories.map(category => html`
          <button
            class="filter-button ${this.selectedCategory === category ? 'active' : ''}"
            role="tab"
            aria-selected=${this.selectedCategory === category}
            aria-controls="streams-grid"
            @click=${() => this.handleCategoryFilter(category)}
          >
            ${category === 'all' ? 'All Streams' : category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        `)}
      </div>

      ${this.isLoading ? html`
        <div class="loading" role="status" aria-live="polite">
          Loading wildlife streams...
        </div>
      ` : ''}

      <div 
        id="streams-grid"
        class="streams-grid" 
        role="grid" 
        aria-label="Wildlife streams"
        aria-live="polite"
        aria-atomic="false"
      >
        ${filteredStreams.length === 0 && !this.isLoading ? html`
          <div class="no-results" role="status">
            No streams found matching your criteria.
          </div>
        ` : ''}

        ${filteredStreams.map(stream => html`
          <div
            class="stream-card"
            role="gridcell"
            tabindex="0"
            aria-label="Stream: ${stream.title}"
            @click=${() => this.handleStreamSelect(stream)}
            @keydown=${(e: KeyboardEvent) => this.handleKeyDown(e, stream)}
          >
            <img
              class="stream-thumbnail"
              src=${stream.thumbnail}
              alt="Thumbnail for ${stream.title}"
              loading="lazy"
            />
            <div class="stream-info">
              <h3 class="stream-title">${stream.title}</h3>
              <p class="stream-description">${stream.description}</p>
              <div class="stream-meta">
                <span class="viewer-count" aria-label="Viewer count">
                  ${stream.viewerCount.toLocaleString()} viewers
                </span>
                ${stream.isLive ? html`
                  <span class="live-indicator" aria-label="Live stream">
                    <span class="live-dot"></span>
                    LIVE
                  </span>
                ` : html`
                  <span aria-label="Stream duration">${stream.duration || 'Recorded'}</span>
                `}
              </div>
            </div>
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'stream-discovery': StreamDiscovery;
  }
} 