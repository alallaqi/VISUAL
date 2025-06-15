/**
 * API service for communicating with the backend
 */

export interface StreamInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  viewer_count: number;
  is_live: boolean;
  category: string;
  duration?: string | null;
  status: string;
  uploader: string;
  stream_url: string;
  webpage_url: string;
  last_updated: string;
  is_processing: boolean;
  narration_enabled: boolean;
}

export interface StreamListResponse {
  streams: StreamInfo[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
  }

  /**
   * Fetch all streams with optional filtering
   */
  async getStreams(params?: {
    category?: string;
    status?: string;
    is_live?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<StreamListResponse>> {
    try {
      const url = new URL(`${this.baseUrl}/api/v1/streams/`);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching streams:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Fetch a specific stream by ID
   */
  async getStream(id: string): Promise<ApiResponse<StreamInfo>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/streams/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching stream:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<ApiResponse<string[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/streams/categories/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<ApiResponse<{ status: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error checking health:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Convert backend StreamInfo to frontend StreamInfo format
   */
  convertStreamInfo(backendStream: StreamInfo): import('../components/stream-discovery.js').StreamInfo {
    return {
      id: backendStream.id,
      title: backendStream.title,
      description: backendStream.description,
      thumbnail: backendStream.thumbnail,
      viewerCount: backendStream.viewer_count,
      isLive: backendStream.is_live,
      category: backendStream.category,
      ...(backendStream.duration && { duration: backendStream.duration }),
      streamUrl: backendStream.stream_url,
      webpageUrl: backendStream.webpage_url
    };
  }
}

// Export singleton instance
export const apiService = new ApiService(); 