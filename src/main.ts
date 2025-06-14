import './styles/main.css';

// Import all web components
import './components/wildlife-app';
import './components/wildlife-nav';
import './components/wildlife-footer';

// Import services
import { AnnouncementService } from './services/announcement-service';
import { AccessibilityService } from './services/accessibility-service';

// Initialize services
const announcementService = new AnnouncementService();
const accessibilityService = new AccessibilityService();

// Application initialization
class WildlifeNarrationApp {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize accessibility features
      await accessibilityService.initialize();
      
      // Announce app loading completion
      announcementService.announce('Wildlife Narration App loaded successfully. Use Tab to navigate.');
      
      // Show the main app and hide loading
      this.showApp();
      
      // Set up global keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      // Set up error handling
      this.setupErrorHandling();
      
      this.isInitialized = true;
      
      console.log('Wildlife Narration App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize the application. Please refresh the page.');
    }
  }

  private showApp(): void {
    const loading = document.getElementById('loading');
    const app = document.getElementById('app');
    
    if (loading) loading.style.display = 'none';
    if (app) app.style.display = 'block';
    
    // Focus the main content for screen readers
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
    }
  }

  private showError(message: string): void {
    const loading = document.getElementById('loading');
    const app = document.getElementById('app');
    const errorBoundary = document.getElementById('error-boundary');
    
    if (loading) loading.style.display = 'none';
    if (app) app.style.display = 'none';
    if (errorBoundary) {
      errorBoundary.style.display = 'block';
      const errorMessage = errorBoundary.querySelector('p');
      if (errorMessage) errorMessage.textContent = message;
    }
    
    announcementService.announce(`Error: ${message}`);
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Alt + M: Focus main content
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
          announcementService.announce('Focused main content');
        }
      }
      
      // Alt + N: Focus navigation
      if (event.altKey && event.key === 'n') {
        event.preventDefault();
        const nav = document.querySelector('wildlife-nav');
        if (nav) {
          (nav as HTMLElement).focus();
          announcementService.announce('Focused navigation');
        }
      }
      
      // Escape: Stop any ongoing narration
      if (event.key === 'Escape') {
        // This will be implemented when TTS service is added
        announcementService.announce('Narration stopped');
      }
    });
  }

  private setupErrorHandling(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      announcementService.announce('An error occurred. Please check the console for details.');
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
      console.error('Application error:', event.error);
      announcementService.announce('An application error occurred.');
    });
  }
}

// Initialize the application when DOM is ready
const app = new WildlifeNarrationApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
  app.initialize();
}

// Export for potential external access
export { app as wildlifeApp }; 