export interface Stream {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  hls_url: string;
  viewer_count: number;
  category: string;
  source_url: string;
  is_live: boolean;
  created_at: string;
  updated_at: string;
  duration?: string | null;
  status?: string;
  uploader?: string;
  webpage_url?: string;
  last_updated?: string;
  is_processing?: boolean;
  narration_enabled?: boolean;
} 