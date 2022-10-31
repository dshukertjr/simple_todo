export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          user_id: string
          content: string
          image_url: string | null
          id: string
          is_done: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          content: string
          image_url?: string | null
          id?: string
          is_done?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          content?: string
          image_url?: string | null
          id?: string
          is_done?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
