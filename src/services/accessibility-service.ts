/**
 * AccessibilityService - Manages WCAG compliance and accessibility features
 * Handles focus management, keyboard navigation, high contrast mode, and other a11y features
 */
export class AccessibilityService {
  private focusableElements: string = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  private trapFocusElements: HTMLElement[] = [];
  private lastFocusedElement: HTMLElement | null = null;
  private isHighContrastMode = false;
  private reducedMotion = false;

  constructor() {
    this.detectUserPreferences();
  }

  async initialize(): Promise<void> {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupHighContrastMode();
    this.setupReducedMotion();
    this.setupSkipLinks();
    this.monitorUserPreferences();
    
    console.log('AccessibilityService initialized');
  }

  private detectUserPreferences(): void {
    // Detect high contrast preference
    this.isHighContrastMode = window.matchMedia('(prefers-contrast: high)').matches;
    
    // Detect reduced motion preference
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (event) => {
      // Handle Tab navigation
      if (event.key === 'Tab') {
        this.handleTabNavigation(event);
      }
      
      // Handle Enter/Space on custom interactive elements
      if (event.key === 'Enter' || event.key === ' ') {
        this.handleActivation(event);
      }
      
      // Handle Escape key
      if (event.key === 'Escape') {
        this.handleEscape(event);
      }
      
      // Handle Arrow keys for custom navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.handleArrowNavigation(event);
      }
    });
  }

  private setupFocusManagement(): void {
    // Track focus changes
    document.addEventListener('focusin', (event) => {
      this.lastFocusedElement = event.target as HTMLElement;
      this.updateFocusIndicator(event.target as HTMLElement);
    });

    // Handle focus loss
    document.addEventListener('focusout', (event) => {
      this.clearFocusIndicator(event.target as HTMLElement);
    });
  }

  private setupHighContrastMode(): void {
    if (this.isHighContrastMode) {
      document.documentElement.classList.add('high-contrast');
    }

    // Listen for changes in contrast preference
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.isHighContrastMode = e.matches;
      if (e.matches) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    });
  }

  private setupReducedMotion(): void {
    if (this.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    }

    // Listen for changes in motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    });
  }

  private setupSkipLinks(): void {
    // Ensure skip links are properly handled
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    skipLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        const target = document.querySelector((event.target as HTMLAnchorElement).getAttribute('href') || '');
        if (target) {
          event.preventDefault();
          this.focusElement(target as HTMLElement);
        }
      });
    });
  }

  private monitorUserPreferences(): void {
    // Monitor for changes in user preferences
    const mediaQueries = [
      { query: '(prefers-contrast: high)', handler: this.handleContrastChange.bind(this) },
      { query: '(prefers-reduced-motion: reduce)', handler: this.handleMotionChange.bind(this) },
      { query: '(prefers-color-scheme: dark)', handler: this.handleColorSchemeChange.bind(this) }
    ];

    mediaQueries.forEach(({ query, handler }) => {
      window.matchMedia(query).addEventListener('change', handler);
    });
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    // If focus trap is active, handle it
    if (this.trapFocusElements.length > 0) {
      this.handleFocusTrap(event);
    }
  }

  private handleActivation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // Handle custom interactive elements
    if (target.hasAttribute('role') && 
        ['button', 'link', 'menuitem', 'tab'].includes(target.getAttribute('role') || '')) {
      event.preventDefault();
      target.click();
    }
  }

  private handleEscape(event: KeyboardEvent): void {
    // Close modals, dropdowns, etc.
    const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
    if (activeModal) {
      this.closeModal(activeModal as HTMLElement);
    }
    
    // Clear focus trap
    if (this.trapFocusElements.length > 0) {
      this.clearFocusTrap();
    }
  }

  private handleArrowNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const role = target.getAttribute('role');
    
    // Handle arrow navigation for specific roles
    if (role === 'tablist' || role === 'menubar' || role === 'listbox') {
      event.preventDefault();
      this.navigateWithArrows(target, event.key);
    }
  }

  private handleFocusTrap(event: KeyboardEvent): void {
    if (this.trapFocusElements.length === 0) return;

    const firstElement = this.trapFocusElements[0];
    const lastElement = this.trapFocusElements[this.trapFocusElements.length - 1];

    if (firstElement && lastElement) {
      if (event.shiftKey && event.target === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && event.target === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  private updateFocusIndicator(element: HTMLElement): void {
    // Add visual focus indicator for better visibility
    element.classList.add('focused');
  }

  private clearFocusIndicator(element: HTMLElement): void {
    element.classList.remove('focused');
  }

  private handleContrastChange(event: MediaQueryListEvent): void {
    this.isHighContrastMode = event.matches;
    // Trigger contrast mode update
    document.dispatchEvent(new CustomEvent('contrastchange', { 
      detail: { highContrast: event.matches } 
    }));
  }

  private handleMotionChange(event: MediaQueryListEvent): void {
    this.reducedMotion = event.matches;
    // Trigger motion preference update
    document.dispatchEvent(new CustomEvent('motionchange', { 
      detail: { reducedMotion: event.matches } 
    }));
  }

  private handleColorSchemeChange(event: MediaQueryListEvent): void {
    // Trigger color scheme update
    document.dispatchEvent(new CustomEvent('colorschemechange', { 
      detail: { darkMode: event.matches } 
    }));
  }

  private navigateWithArrows(container: HTMLElement, key: string): void {
    const items = Array.from(container.querySelectorAll(this.focusableElements));
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    
    let nextIndex = currentIndex;
    
    switch (key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
    }
    
    const nextItem = items[nextIndex];
    if (nextItem) {
      (nextItem as HTMLElement).focus();
    }
  }

  /**
   * Focus an element and ensure it's visible
   */
  focusElement(element: HTMLElement): void {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Set up focus trap for modals and dialogs
   */
  setupFocusTrap(container: HTMLElement): void {
    const focusableElements = Array.from(
      container.querySelectorAll(this.focusableElements)
    ) as HTMLElement[];
    
    this.trapFocusElements = focusableElements;
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  /**
   * Clear focus trap
   */
  clearFocusTrap(): void {
    this.trapFocusElements = [];
    
    // Return focus to last focused element
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
    }
  }

  /**
   * Close modal and manage focus
   */
  closeModal(modal: HTMLElement): void {
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    this.clearFocusTrap();
  }

  /**
   * Get user preferences
   */
  getUserPreferences() {
    return {
      highContrast: this.isHighContrastMode,
      reducedMotion: this.reducedMotion,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    };
  }

  /**
   * Announce to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Check if element is focusable
   */
  isFocusable(element: HTMLElement): boolean {
    return element.matches(this.focusableElements) && 
           !element.hasAttribute('disabled') &&
           element.tabIndex !== -1;
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableElements)) as HTMLElement[];
  }
} 