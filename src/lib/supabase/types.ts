// Database types for Roam Companion — matches ROAMCOMPANION_IMPLEMENTATION.md schema
// Format matches @supabase/supabase-js v2 GenericTable (Row + Insert + Update + Relationships required)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─── Row types ───────────────────────────────────────────────────────────────────

export type City = {
  id: string
  slug: 'boston' | 'tampa' | 'miami'
  name: 'Boston' | 'Tampa' | 'Miami'
  is_active: boolean
}

export type Profile = {
  id: string
  email: string | null
  display_name: string | null
  role: 'guest' | 'driver' | 'admin'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type DriverSignupProgress = {
  id: string
  user_id: string
  current_step: number
  is_complete: boolean
  created_at: string
  updated_at: string
}

export type DriverProfile = {
  id: string
  user_id: string
  city_id: string
  display_name: string | null
  headline: string | null
  bio: string | null
  vehicle_type: 'sedan' | 'suv' | 'van' | 'luxury' | 'other' | null
  years_driving: number | null
  languages: string[] | null
  service_area: string | null
  hero_image_url: string | null
  avatar_url: string | null
  tip_cashapp: string | null
  tip_venmo: string | null
  tip_paypal: string | null
  public_url_slug: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export type DriverApplication = {
  id: string
  user_id: string
  city_id: string
  status: 'pending_submission' | 'in_review' | 'approved' | 'rejected'
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
}

export type DocumentType =
  | 'license_front'
  | 'license_back'
  | 'uber_driver_screenshot'
  | 'lyft_driver_screenshot'
  | 'insurance'

export type DriverDocument = {
  id: string
  application_id: string
  user_id: string
  document_type: DocumentType
  file_url: string
  file_path: string
  status: 'uploaded' | 'reviewed' | 'rejected'
  uploaded_at: string
}

export type CityPick = {
  id: string
  city_id: string
  created_by: string | null
  title: string
  category: 'food' | 'nightlife' | 'stay' | 'activity' | 'transport'
  description: string | null
  external_url: string | null
  image_url: string | null
  is_featured: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

export type TravelHelpLink = {
  id: string
  city_id: string
  title: string
  category: 'stay' | 'booking' | 'transport' | 'tourism' | 'emergency'
  description: string | null
  url: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export type CuratedExperience = {
  id: string
  city_id: string
  created_by: string | null
  title: string
  description: string | null
  duration_label: string | null
  category: 'nightlife' | 'date' | 'chill' | 'before-flight' | null
  price_note: string | null
  is_free: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

export type AiGeneration = {
  id: string
  user_id: string
  city_id: string
  driver_profile_id: string | null
  prompt: string
  response_json: Json
  preview_text: string | null
  is_saved: boolean
  created_at: string
}

export type AppSubscription = {
  id: string
  user_id: string
  plan_code: 'free' | 'plus'
  status: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled'
  ai_generation_limit: number | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  updated_at: string
}

// ─── Database type (required by @supabase/supabase-js v2) ────────────────────────

export type Database = {
  public: {
    Tables: {
      cities: {
        Row: City
        Insert: Omit<City, 'id' | 'is_active'> & { id?: string; is_active?: boolean }
        Update: Partial<City>
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Pick<Profile, 'id'> & Partial<Omit<Profile, 'id'>>
        Update: Partial<Omit<Profile, 'id'>>
        Relationships: []
      }
      driver_signup_progress: {
        Row: DriverSignupProgress
        Insert: Pick<DriverSignupProgress, 'user_id'> & Partial<Omit<DriverSignupProgress, 'id' | 'user_id'>>
        Update: Partial<Omit<DriverSignupProgress, 'id'>>
        Relationships: []
      }
      driver_profiles: {
        Row: DriverProfile
        Insert: Pick<DriverProfile, 'user_id' | 'city_id'> & Partial<Omit<DriverProfile, 'id' | 'user_id' | 'city_id'>>
        Update: Partial<Omit<DriverProfile, 'id'>>
        Relationships: []
      }
      driver_applications: {
        Row: DriverApplication
        Insert: Pick<DriverApplication, 'user_id' | 'city_id'> & Partial<Omit<DriverApplication, 'id' | 'user_id' | 'city_id'>>
        Update: Partial<Omit<DriverApplication, 'id'>>
        Relationships: []
      }
      driver_documents: {
        Row: DriverDocument
        Insert: Pick<DriverDocument, 'application_id' | 'user_id' | 'document_type' | 'file_url' | 'file_path'> & Partial<Omit<DriverDocument, 'id'>>
        Update: Partial<Omit<DriverDocument, 'id'>>
        Relationships: []
      }
      city_picks: {
        Row: CityPick
        Insert: Pick<CityPick, 'city_id' | 'title' | 'category'> & Partial<Omit<CityPick, 'id'>>
        Update: Partial<Omit<CityPick, 'id'>>
        Relationships: []
      }
      travel_help_links: {
        Row: TravelHelpLink
        Insert: Pick<TravelHelpLink, 'city_id' | 'title' | 'category' | 'url'> & Partial<Omit<TravelHelpLink, 'id'>>
        Update: Partial<Omit<TravelHelpLink, 'id'>>
        Relationships: []
      }
      curated_experiences: {
        Row: CuratedExperience
        Insert: Pick<CuratedExperience, 'city_id' | 'title'> & Partial<Omit<CuratedExperience, 'id'>>
        Update: Partial<Omit<CuratedExperience, 'id'>>
        Relationships: []
      }
      ai_generations: {
        Row: AiGeneration
        Insert: Pick<AiGeneration, 'user_id' | 'city_id' | 'prompt' | 'response_json'> & Partial<Omit<AiGeneration, 'id'>>
        Update: Partial<Omit<AiGeneration, 'id'>>
        Relationships: []
      }
      subscriptions: {
        Row: AppSubscription
        Insert: Pick<AppSubscription, 'user_id'> & Partial<Omit<AppSubscription, 'id' | 'user_id'>>
        Update: Partial<Omit<AppSubscription, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
