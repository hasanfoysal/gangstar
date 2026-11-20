export const ALL_BATCHES = [
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th',
  '12th',
  '13th',
  '14th',
] as const;

export const DEFAULT_ALUMNI_BATCHES = ['5th', '6th', '7th', '8th', '9th', '10th', '11th'] as const;
export const DEFAULT_RUNNING_BATCHES = ['12th', '13th', '14th'] as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type BatchType = string;

export interface BatchRecord {
  name: string;
  display_order: number;
  is_alumni_default: boolean;
}
export type BloodGroupType = (typeof BLOOD_GROUPS)[number];

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  batch: BatchType;
  department: string;
  blood_group: BloodGroupType;
  phone: string;
  profession: string;
  company: string;
  current_city: string;
  social_link: string;
  avatar_url: string;
  is_alumni: boolean;
  role: 'member' | 'admin';
  status: 'pending' | 'approved';
  created_at: string;
  updated_at: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  batch_label: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface EventAlbum {
  id: string;
  title: string;
  description: string;
  event_date: string | null;
  cover_url: string;
  created_by: string | null;
  created_at: string;
}

export interface AlbumPhoto {
  id: string;
  album_id: string;
  image_url: string;
  media_type?: 'image' | 'video';
  caption: string;
  uploaded_at: string;
}

export interface SiteSettings {
  id: number;
  room_name: string;
  motto: string;
  about_text: string;
  notice_title: string;
  notice_body: string;
  updated_at: string;
}

export interface BatchCover {
  batch: BatchType;
  cover_url: string;
  title: string;
  subtitle: string;
  updated_at: string;
}
