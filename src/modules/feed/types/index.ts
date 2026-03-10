export interface FeedPost {
  id: string;
  author_id: string | null;
  author_name: string;
  author_username?: string | null;
  author_avatar_url?: string | null;
  content: string;
  image_urls: string[];
  created_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
}

export interface FeedComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_username?: string | null;
  author_avatar_url?: string | null;
  like_count: number;
  user_has_liked: boolean;
}
