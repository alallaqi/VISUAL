import './styles/main.css';

// Import main app component
import './components/wildlife-app';

// Application initialization - simplified for full-screen experience
class WildlifeNarrationApp {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Show the main app and hide loading
      this.showApp();
      
      // Set up basic error handling
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
  }

  private setupErrorHandling(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
      console.error('Application error:', event.error);
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