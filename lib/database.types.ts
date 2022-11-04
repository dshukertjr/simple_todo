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
          id: string
          user_id: string
          content: string
          is_done: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          content: string
          is_done?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
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
