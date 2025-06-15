/**
 * AnnouncementService - Manages screen reader announcements via ARIA live regions
 * Provides accessible feedback for dynamic content changes and user interactions
 */
export class AnnouncementService {
  private announcementRegion: HTMLElement | null = null;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Get existing announcement regions or create them
    this.announcementRegion = document.getElementById('announcements');
    
    if (!this.announcementRegion) {
      this.createAnnouncementRegions();
    } else {
      this.setupRegions();
    }
  }

  private createAnnouncementRegions(): void {
    // Create main announcement container
    this.announcementRegion = document.createElement('div');
    this.announcementRegion.id = 'announcements';
    this.announcementRegion.className = 'sr-only';
    this.announcementRegion.setAttribute('aria-live', 'polite');
    this.announcementRegion.setAttribute('aria-atomic', 'true');
    
    document.body.appendChild(this.announcementRegion);
    this.setupRegions();
  }

  private setupRegions(): void {
    if (!this.announcementRegion) return;

    // Create polite announcement region (non-interrupting)
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    
    // Create assertive announcement region (interrupting)
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    
    this.announcementRegion.appendChild(this.politeRegion);
    this.announcementRegion.appendChild(this.assertiveRegion);
  }

  /**
   * Announce a message to screen readers (polite - won't interrupt current speech)
   * @param message - The message to announce
   * @param delay - Optional delay before announcement (default: 100ms)
   */
  announce(message: string, delay: number = 100): void {
    if (!this.politeRegion || !message.trim()) return;

    // Clear previous announcement
    this.politeRegion.textContent = '';
    
    // Add new announcement after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      if (this.politeRegion) {
        this.politeRegion.textContent = message;
      }
    }, delay);
  }

  /**
   * Announce an urgent message to screen readers (assertive - will interrupt current speech)
   * @param message - The urgent message to announce
   * @param delay - Optional delay before announcement (default: 50ms)
   */
  announceUrgent(message: string, delay: number = 50): void {
    if (!this.assertiveRegion || !message.trim()) return;

    // Clear previous announcement
    this.assertiveRegion.textContent = '';
    
    // Add new announcement after a brief delay
    setTimeout(() => {
      if (this.assertiveRegion) {
        this.assertiveRegion.textContent = message;
      }
    }, delay);
  }

  /**
   * Announce status changes (e.g., loading, error, success states)
   * @param status - The status to announce
   * @param context - Optional context for the status
   */
  announceStatus(status: 'loading' | 'success' | 'error' | 'warning', context?: string): void {
    const statusMessages = {
      loading: 'Loading',
      success: 'Success',
      error: 'Error',
      warning: 'Warning'
    };

    const message = context 
      ? `${statusMessages[status]}: ${context}`
      : statusMessages[status];

    if (status === 'error') {
      this.announceUrgent(message);
    } else {
      this.announce(message);
    }
  }

  /**
   * Announce navigation changes
   * @param location - The new location or page
   * @param additionalInfo - Optional additional context
   */
  announceNavigation(location: string, additionalInfo?: string): void {
    const message = additionalInfo 
      ? `Navigated to ${location}. ${additionalInfo}`
      : `Navigated to ${location}`;
    
    this.announce(message);
  }

  /**
   * Announce form validation results
   * @param isValid - Whether the form is valid
   * @param errors - Array of error messages if invalid
   */
  announceFormValidation(isValid: boolean, errors?: string[]): void {
    if (isValid) {
      this.announce('Form is valid and ready to submit');
    } else if (errors && errors.length > 0) {
      const errorMessage = `Form has ${errors.length} error${errors.length > 1 ? 's' : ''}: ${errors.join(', ')}`;
      this.announceUrgent(errorMessage);
    }
  }

  /**
   * Clear all announcements
   */
  clear(): void {
    if (this.politeRegion) {
      this.politeRegion.textContent = '';
    }
    if (this.assertiveRegion) {
      this.assertiveRegion.textContent = '';
    }
  }

  /**
   * Destroy the announcement service and clean up DOM elements
   */
  destroy(): void {
    if (this.announcementRegion && this.announcementRegion.parentNode) {
      this.announcementRegion.parentNode.removeChild(this.announcementRegion);
    }
    
    this.announcementRegion = null;
    this.politeRegion = null;
    this.assertiveRegion = null;
  }
} 