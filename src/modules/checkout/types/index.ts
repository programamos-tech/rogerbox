export interface Course {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  thumbnail?: string;
  preview_image?: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category?: string;
  category_name?: string;
  rating?: number;
  students_count?: number;
  lessons_count?: number;
  duration?: string;
  level?: string;
  is_published?: boolean;
  created_at?: string;
  slug?: string;
  calories_burned?: number;
  mux_playback_id?: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url?: string;
  preview_image?: string;
  lesson_number: number;
  lesson_order: number;
  duration_minutes: number;
  is_preview: boolean;
  views_count: number;
  created_at: string;
}
