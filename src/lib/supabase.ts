import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type FamilySide = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

export type FamilySideMember = {
  id: string;
  family_side_id: string;
  user_id: string;
  role: string;
  created_at: string;
};

export type GalleryImage = {
  id: string;
  family_side_id?: string;
  uploaded_by: string;
  image_url: string;
  caption?: string;
  created_at: string;
};

export type CalendarEvent = {
  id: string;
  family_side_id?: string;
  created_by: string;
  title: string;
  description?: string;
  event_date: string;
  created_at: string;
};

export type TimelineEntry = {
  id: string;
  family_side_id: string;
  created_by: string;
  title: string;
  description: string;
  event_year: number;
  event_date?: string;
  created_at: string;
};

export type FamilyBookEntry = {
  id: string;
  family_side_id: string;
  created_by: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
};
