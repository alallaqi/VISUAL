import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Stream } from '../types/stream.js';

export type SortOption = 'title' | 'viewer_count' | 'category' | 'recent';
export type ViewMode = 'grid' | 'list';

@customElement('stream-discovery')
export class StreamDiscovery extends LitElement {
  @property({ type: Array }) streams: Stream[] = [];
  @property({ type: String }) selectedCategory = 'all';
  @state() private searchQuery = '';
  @state() private isLoading = false;
  @state() private sortBy: SortOption = 'viewer_count';
  @state() private sortDirection: 'asc' | 'desc' = 'desc';
  @state() private viewMode: ViewMode = 'grid';
  @state() private showLiveOnly = false;
  @state() private minViewers = 0;
  @state() private showFilters = false;

  static override styles = css`
    :host {
      display: block;
      padding: var(--spacing-lg);
      background: var(--color-background);
      min-height: 100vh;
    }

    .header {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-3xl);
    }

    .title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
      margin: 0;
    }

    .subtitle {
      font-size: var(--font-size-lg);
      color: var(--color-text-secondary);
      margin: 0;
      line-height: var(--line-height-relaxed);
    }

    .search-and-controls {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .search-container {
      position: relative;
      max-width: 500px;
    }

    .search-input {
      width: 100%;
      padding: var(--spacing-lg) var(--spacing-xl);
      padding-left: 3rem;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-xl);
      font-size: var(--font-size-base);
      background: var(--color-surface);
      color: var(--color-text);
      transition: all var(--transition-fast);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: var(--focus-ring);
    }

    .search-icon {
      position: absolute;
      left: var(--spacing-lg);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-secondary);
      pointer-events: none;
    }

    .controls-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-lg);
      align-items: center;
      justify-content: space-between;
    }

    .filters-section {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-md);
      align-items: center;
    }

    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      align-items: center;
    }

    .filter-label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      margin-right: var(--spacing-sm);
    }

    .category-filters {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .filter-button {
      padding: var(--spacing-sm) var(--spacing-lg);
      border: 2px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      border-radius: var(--radius-full);
      cursor: pointer;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      min-height: var(--min-touch-target);
      transition: all var(--transition-fast);
      text-transform: capitalize;
    }

    .filter-button:hover:not(:disabled) {
      background: var(--color-primary-alpha);
      border-color: var(--color-primary);
    }

    .filter-button:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .filter-button.active {
      background: var(--color-primary);
      color: var(--color-primary-contrast);
      border-color: var(--color-primary);
    }

    .sort-controls {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
    }

    .sort-select {
      padding: var(--spacing-sm) var(--spacing-lg);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--font-size-sm);
      min-height: var(--min-touch-target);
      cursor: pointer;
    }

    .sort-select:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .view-toggle {
      display: flex;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .view-button {
      padding: var(--spacing-sm) var(--spacing-lg);
      border: none;
      background: var(--color-surface);
      color: var(--color-text);
      cursor: pointer;
      font-size: var(--font-size-sm);
      min-height: var(--min-touch-target);
      transition: all var(--transition-fast);
    }

    .view-button:hover:not(.active) {
      background: var(--color-primary-alpha);
    }

    .view-button:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }

    .view-button.active {
      background: var(--color-primary);
      color: var(--color-primary-contrast);
    }

    .advanced-filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
      background: var(--color-background-secondary);
      border-radius: var(--radius-xl);
      margin-top: var(--spacing-lg);
    }

    .filter-toggle {
      background: none;
      border: none;
      color: var(--color-primary);
      cursor: pointer;
      font-size: var(--font-size-sm);
      text-decoration: underline;
      padding: var(--spacing-sm);
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .range-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .range-input {
      width: 150px;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
      padding-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);
    }

    .results-count {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-medium);
      color: var(--color-text);
    }

    .streams-container {
      min-height: 400px;
    }

    .streams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-xl);
    }

    .streams-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .stream-card {
      background: var(--color-surface);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-xl);
      overflow: hidden;
      transition: all var(--transition-normal);
      cursor: pointer;
      position: relative;
    }

    .stream-card:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }

    .stream-card:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .stream-card.list-view {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .stream-thumbnail {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: var(--color-background-secondary);
    }

    .stream-card.list-view .stream-thumbnail {
      width: 200px;
      height: 120px;
      flex-shrink: 0;
    }

    .stream-info {
      padding: var(--spacing-xl);
      flex: 1;
    }

    .stream-card.list-view .stream-info {
      padding: var(--spacing-lg);
    }

    .stream-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-md);
    }

    .stream-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
      line-height: var(--line-height-tight);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .stream-card.list-view .stream-title {
      font-size: var(--font-size-base);
    }

    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      background: var(--color-error);
      color: white;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      background: currentColor;
      border-radius: 50%;
      animation: pulse-slow 2s infinite;
    }

    @keyframes pulse-slow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .stream-description {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-relaxed);
      margin-bottom: var(--spacing-lg);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .stream-card.list-view .stream-description {
      -webkit-line-clamp: 1;
      margin-bottom: var(--spacing-sm);
    }

    .stream-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .stream-category {
      background: var(--color-background-tertiary);
      color: var(--color-text);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      text-transform: capitalize;
    }

    .viewer-count {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-weight: var(--font-weight-medium);
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-5xl);
      color: var(--color-text-secondary);
    }

    .loading-spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid var(--color-border);
      border-top: 2px solid var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: var(--spacing-lg);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .no-results {
      text-align: center;
      padding: var(--spacing-5xl);
      color: var(--color-text-secondary);
    }

    .no-results-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      margin-bottom: var(--spacing-lg);
    }

    .no-results-message {
      font-size: var(--font-size-base);
      line-height: var(--line-height-relaxed);
    }

    /* Responsive design */
    @media (max-width: 768px) {
      :host {
        padding: var(--spacing-md);
      }
      
      .streams-grid {
        grid-template-columns: 1fr;
      }
      
      .controls-row {
        flex-direction: column;
        align-items: stretch;
      }
      
      .filters-section {
        justify-content: center;
      }

      .stream-card.list-view {
        flex-direction: column;
      }

      .stream-card.list-view .stream-thumbnail {
        width: 100%;
        height: 200px;
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .filter-button:focus-visible,
      .sort-select:focus-visible,
      .view-button:focus-visible {
        outline: 3px solid #ffff00;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .stream-card,
      .filter-button,
      .view-button,
      .loading-spinner {
        transition: none;
        animation: none;
      }
      
      .stream-card:hover {
        transform: none;
      }
    }
  `;

  private get filteredAndSortedStreams() {
    let filtered = [...this.streams];

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(stream => stream.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(stream => 
        stream.title.toLowerCase().includes(query) ||
        stream.description.toLowerCase().includes(query) ||
        stream.category.toLowerCase().includes(query)
      );
    }

          // Filter by live status
      if (this.showLiveOnly) {
        filtered = filtered.filter(stream => stream.is_live);
      }

    // Filter by minimum viewers
    if (this.minViewers > 0) {
      filtered = filtered.filter(stream => stream.viewer_count >= this.minViewers);
    }

    // Sort streams
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'viewer_count':
          comparison = a.viewer_count - b.viewer_count;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'recent':
          // For now, sort by viewer count as proxy for recent activity
          comparison = a.viewer_count - b.viewer_count;
          break;
      }
      
      return this.sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }

  private get categories() {
    const cats = new Set(this.streams.map(stream => stream.category));
    return ['all', ...Array.from(cats).sort()];
  }

  private handleSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.announceResults();
  }

  private handleCategoryFilter(category: string) {
    this.selectedCategory = category;
    this.announceResults();
    this.dispatchEvent(new CustomEvent('category-changed', {
      detail: { category },
      bubbles: true
    }));
  }

  private handleSortChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    const [sortBy, direction] = select.value.split('-') as [SortOption, 'asc' | 'desc'];
    this.sortBy = sortBy;
    this.sortDirection = direction;
    this.announceResults();
  }

  private handleViewModeChange(mode: ViewMode) {
    this.viewMode = mode;
    this.announceToScreenReader(`View mode changed to ${mode}`);
  }

  private toggleAdvancedFilters() {
    this.showFilters = !this.showFilters;
  }

  private handleLiveOnlyChange(e: Event) {
    this.showLiveOnly = (e.target as HTMLInputElement).checked;
    this.announceResults();
  }

  private handleMinViewersChange(e: Event) {
    this.minViewers = parseInt((e.target as HTMLInputElement).value) || 0;
    this.announceResults();
  }

  private announceResults() {
    const count = this.filteredAndSortedStreams.length;
    const message = `${count} stream${count !== 1 ? 's' : ''} found`;
    this.announceToScreenReader(message);
  }

  private announceToScreenReader(message: string) {
    // Create a temporary element for screen reader announcements
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    this.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (this.contains(announcement)) {
        this.removeChild(announcement);
      }
    }, 1000);
  }

  private handleStreamSelect(stream: Stream) {
    this.announceToScreenReader(`Selected ${stream.title}`);
    this.dispatchEvent(new CustomEvent('stream-selected', {
      detail: { stream },
      bubbles: true
    }));
  }

  private handleKeyDown(e: KeyboardEvent, stream: Stream) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleStreamSelect(stream);
    }
  }

  private formatViewerCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  override render() {
    const filteredStreams = this.filteredAndSortedStreams;

    return html`
      <div class="header">
        <h1 class="title">Wildlife Stream Discovery</h1>
        <p class="subtitle">
          Discover live wildlife streams and recorded nature content from around the world. 
          All streams include AI-powered narration for enhanced accessibility.
        </p>
      </div>

      <div class="search-and-controls">
        <!-- Search -->
        <div class="search-container">
          <span class="search-icon" aria-hidden="true">🔍</span>
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
            Search through available wildlife streams by title, description, or category
          </div>
        </div>

        <!-- Controls Row -->
        <div class="controls-row">
          <!-- Category Filters -->
          <div class="filters-section">
            <div class="filter-group">
              <span class="filter-label">Category:</span>
              <div class="category-filters" role="tablist" aria-label="Stream categories">
                ${this.categories.map(category => html`
                  <button
                    class="filter-button ${this.selectedCategory === category ? 'active' : ''}"
                    role="tab"
                    aria-selected=${this.selectedCategory === category}
                    aria-controls="streams-container"
                    @click=${() => this.handleCategoryFilter(category)}
                  >
                    ${category === 'all' ? 'All Streams' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                `)}
              </div>
            </div>
          </div>

          <!-- Sort and View Controls -->
          <div class="filters-section">
            <div class="sort-controls">
              <label for="sort-select" class="filter-label">Sort by:</label>
              <select
                id="sort-select"
                class="sort-select"
                .value=${`${this.sortBy}-${this.sortDirection}`}
                @change=${this.handleSortChange}
                aria-label="Sort streams"
              >
                <option value="viewer_count-desc">Most Viewers</option>
                <option value="viewer_count-asc">Least Viewers</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="category-asc">Category A-Z</option>
                <option value="recent-desc">Most Recent</option>
              </select>
            </div>

            <div class="view-toggle" role="group" aria-label="View mode">
              <button
                class="view-button ${this.viewMode === 'grid' ? 'active' : ''}"
                @click=${() => this.handleViewModeChange('grid')}
                aria-label="Grid view"
                aria-pressed=${this.viewMode === 'grid'}
              >
                <span aria-hidden="true">⊞</span>
              </button>
              <button
                class="view-button ${this.viewMode === 'list' ? 'active' : ''}"
                @click=${() => this.handleViewModeChange('list')}
                aria-label="List view"
                aria-pressed=${this.viewMode === 'list'}
              >
                <span aria-hidden="true">☰</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Advanced Filters Toggle -->
        <button
          class="filter-toggle"
          @click=${this.toggleAdvancedFilters}
          aria-expanded=${this.showFilters}
          aria-controls="advanced-filters"
        >
          ${this.showFilters ? 'Hide' : 'Show'} Advanced Filters
        </button>

        <!-- Advanced Filters -->
        ${this.showFilters ? html`
          <div id="advanced-filters" class="advanced-filters">
            <div class="checkbox-group">
              <input
                type="checkbox"
                id="live-only"
                class="checkbox"
                .checked=${this.showLiveOnly}
                @change=${this.handleLiveOnlyChange}
              />
              <label for="live-only">Live streams only</label>
            </div>

            <div class="range-group">
              <label for="min-viewers">Minimum viewers:</label>
              <input
                type="range"
                id="min-viewers"
                class="range-input"
                min="0"
                max="10000"
                step="100"
                .value=${this.minViewers.toString()}
                @input=${this.handleMinViewersChange}
                aria-valuetext="${this.minViewers} viewers"
              />
              <span>${this.minViewers.toLocaleString()} viewers</span>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Results Header -->
      <div class="results-header">
        <div class="results-count" role="status" aria-live="polite">
          ${filteredStreams.length} stream${filteredStreams.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <!-- Loading State -->
      ${this.isLoading ? html`
        <div class="loading" role="status" aria-live="polite">
          <div class="loading-spinner" aria-hidden="true"></div>
          Loading wildlife streams...
        </div>
      ` : ''}

      <!-- Streams Container -->
      <div class="streams-container">
        <div 
          id="streams-container"
          class="${this.viewMode === 'grid' ? 'streams-grid' : 'streams-list'}" 
          role="grid" 
          aria-label="Wildlife streams"
          aria-live="polite"
          aria-atomic="false"
        >
          ${filteredStreams.length === 0 && !this.isLoading ? html`
            <div class="no-results" role="status">
              <div class="no-results-title">No streams found</div>
              <div class="no-results-message">
                Try adjusting your search terms or filters to find more wildlife streams.
              </div>
            </div>
          ` : ''}

          ${filteredStreams.map((stream: Stream) => html`
            <div
              class="stream-card ${this.viewMode === 'list' ? 'list-view' : ''}"
              role="gridcell"
              tabindex="0"
                             aria-label="Stream: ${stream.title}. ${stream.is_live ? 'Live' : 'Recorded'}. ${this.formatViewerCount(stream.viewer_count)} viewers."
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
                <div class="stream-header">
                  <h3 class="stream-title">${stream.title}</h3>
                  ${stream.is_live ? html`
                    <div class="live-indicator" aria-label="Live stream">
                      <span class="live-dot" aria-hidden="true"></span>
                      LIVE
                    </div>
                  ` : ''}
                </div>
                <p class="stream-description">${stream.description}</p>
                <div class="stream-meta">
                  <div class="stream-category">${stream.category}</div>
                  <div class="viewer-count" aria-label="${this.formatViewerCount(stream.viewer_count)} viewers">
                    <span aria-hidden="true">👁</span>
                    ${this.formatViewerCount(stream.viewer_count)}
                  </div>
                </div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'stream-discovery': StreamDiscovery;
  }
} 