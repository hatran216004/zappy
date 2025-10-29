export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          byte_size: number
          created_at: string
          duration_ms: number | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["attach_type"]
          message_id: string
          mime_type: string
          storage_path: string
          uploader_id: string
          width: number | null
        }
        Insert: {
          byte_size: number
          created_at?: string
          duration_ms?: number | null
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["attach_type"]
          message_id: string
          mime_type: string
          storage_path: string
          uploader_id: string
          width?: number | null
        }
        Update: {
          byte_size?: number
          created_at?: string
          duration_ms?: number | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["attach_type"]
          message_id?: string
          mime_type?: string
          storage_path?: string
          uploader_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_participants: {
        Row: {
          call_id: string
          joined_at: string | null
          left_at: string | null
          token: string
          url: string
          user_id: string
        }
        Insert: {
          call_id: string
          joined_at?: string | null
          left_at?: string | null
          token?: string
          url?: string
          user_id: string
        }
        Update: {
          call_id?: string
          joined_at?: string | null
          left_at?: string | null
          token?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_participants_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          conversation_id: string
          ended_at: string | null
          id: string
          participants: string[]
          started_at: string
          started_by: string
          type: Database["public"]["Enums"]["call_type"]
        }
        Insert: {
          conversation_id: string
          ended_at?: string | null
          id?: string
          participants: string[]
          started_at?: string
          started_by: string
          type: Database["public"]["Enums"]["call_type"]
        }
        Update: {
          conversation_id?: string
          ended_at?: string | null
          id?: string
          participants?: string[]
          started_at?: string
          started_by?: string
          type?: Database["public"]["Enums"]["call_type"]
        }
        Relationships: [
          {
            foreignKeyName: "calls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_label_map: {
        Row: {
          friend_id: string
          label_id: string
        }
        Insert: {
          friend_id: string
          label_id: string
        }
        Update: {
          friend_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_label_map_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_label_map_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "contact_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_labels: {
        Row: {
          color: number
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          color: number
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          color?: number
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_labels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_label_map: {
        Row: {
          conversation_id: string
          label_id: string
        }
        Insert: {
          conversation_id: string
          label_id: string
        }
        Update: {
          conversation_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_label_map_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_label_map_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "conversation_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_labels: {
        Row: {
          color: number
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          color: number
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          color?: number
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_labels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          last_read_at: string | null
          left_at: string | null
          mute_until: string | null
          notif_level: Database["public"]["Enums"]["notif_level"]
          role: Database["public"]["Enums"]["role_type"]
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          mute_until?: string | null
          notif_level?: Database["public"]["Enums"]["notif_level"]
          role?: Database["public"]["Enums"]["role_type"]
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          mute_until?: string | null
          notif_level?: Database["public"]["Enums"]["notif_level"]
          role?: Database["public"]["Enums"]["role_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_messages: {
        Row: {
          message_id: string
          user_id: string
          deleted_at: string
        }
        Insert: {
          message_id: string
          user_id: string
          deleted_at?: string
        }
        Update: {
          message_id?: string
          user_id?: string
          deleted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deleted_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deleted_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          last_message_id: string | null
          photo_url: string
          title: string | null
          type: Database["public"]["Enums"]["convo_type"]
          updated_at: string | null
          background_type: string
          background_value: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          last_message_id?: string | null
          photo_url?: string
          title?: string | null
          type: Database["public"]["Enums"]["convo_type"]
          updated_at?: string | null
          background_type?: string
          background_value?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          last_message_id?: string | null
          photo_url?: string
          title?: string | null
          type?: Database["public"]["Enums"]["convo_type"]
          updated_at?: string | null
          background_type?: string
          background_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_last_message_id_fkey"
            columns: ["last_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_pairs: {
        Row: {
          conversation_id: string
          created_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_pairs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_pairs_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_pairs_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          message: string
          responded_at: string | null
          status: Database["public"]["Enums"]["friend_status"]
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          message?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["friend_status"]
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["friend_status"]
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content_text: string | null
          conversation_id: string
          created_at: string
          edited_at: string | null
          fts: unknown
          id: string
          location: unknown
          recalled_at: string | null
          reply_to_id: string | null
          sender_id: string
          type: Database["public"]["Enums"]["msg_type"]
          location_latitude: number | null
          location_longitude: number | null
          location_address: string | null
          location_display_mode: 'interactive' | 'static' | null
        }
        Insert: {
          content_text?: string | null
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          fts?: unknown
          id?: string
          location?: unknown
          recalled_at?: string | null
          reply_to_id?: string | null
          sender_id: string
          type?: Database["public"]["Enums"]["msg_type"]
          location_latitude?: number | null
          location_longitude?: number | null
          location_address?: string | null
          location_display_mode?: 'interactive' | 'static' | null
        }
        Update: {
          content_text?: string | null
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          fts?: unknown
          id?: string
          location?: unknown
          recalled_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
          type?: Database["public"]["Enums"]["msg_type"]
          location_latitude?: number | null
          location_longitude?: number | null
          location_address?: string | null
          location_display_mode?: 'interactive' | 'static' | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          gender: boolean
          id: string
          is_disabled: boolean
          last_seen_at: string | null
          status: Database["public"]["Enums"]["user_status"]
          status_updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string
          bio?: string
          created_at: string
          display_name: string
          gender: boolean
          id: string
          is_disabled?: boolean
          last_seen_at?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          status_updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string
          bio?: string
          created_at?: string
          display_name?: string
          gender?: boolean
          id?: string
          is_disabled?: boolean
          last_seen_at?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          status_updated_at?: string
          username?: string
        }
        Relationships: []
      }
      read_receipts: {
        Row: {
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_friend_request: { Args: { _user_id: string }; Returns: boolean }
      auto_set_offline_users: { Args: never; Returns: undefined }
      block_user: { Args: { _user_id: string }; Returns: boolean }
      bulk_assign_contact_labels: {
        Args: { _contact_label: string; _user_ids: string[] }
        Returns: undefined
      }
      bulk_unassign_contact_labels: {
        Args: { _contact_label: string; _user_ids: string[] }
        Returns: undefined
      }
      cancel_friend_request: { Args: { _user_id: string }; Returns: boolean }
      create_contact_label: {
        Args: { _color: number; _name: string; _user_ids: string[] }
        Returns: boolean
      }
      create_direct_call: {
        Args: { _is_video_enabled: boolean; _user_id: string }
        Returns: undefined
      }
      get_call_info: {
        Args: { _call_id: string }
        Returns: {
          avatar_url: string
          conversation_id: string
          display_name: string
          is_video_enabled: boolean
          photo_url: string
          title: string
          type: string
          username: string
        }[]
      }
      get_contact_labels: {
        Args: never
        Returns: {
          color: number
          id: string
          name: string
        }[]
      }
      get_direct_conversation: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          last_message_id: string | null
          photo_url: string
          title: string | null
          type: Database["public"]["Enums"]["convo_type"]
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "conversations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_friends: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          label_id: string[]
          status: string
          username: string
        }[]
      }
      get_requests: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          from_me: boolean
          id: string
          status: string
          username: string
        }[]
      }
      modify_contact_label: {
        Args: { _color: number; _label_id: string; _name: string }
        Returns: boolean
      }
      reject_friend_request: { Args: { _user_id: string }; Returns: boolean }
      remove_contact_label: { Args: { _label_id: string }; Returns: boolean }
      search_users: {
        Args: { _search: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          from_me: boolean
          id: string
          status: string
          username: string
        }[]
      }
      send_friend_request: {
        Args: { _message: string; _user_id: string }
        Returns: boolean
      }
      verify_user_password: { Args: { _password: string }; Returns: boolean }
    }
    Enums: {
      app_theme: "light" | "dark" | "system"
      attach_type: "image" | "video" | "file" | "audio"
      call_type: "audio" | "video"
      convo_type: "direct" | "group"
      friend_status: "pending" | "accepted" | "declined" | "blocked"
      gender: "male" | "female"
      msg_type:
        | "text"
        | "image"
        | "video"
        | "file"
        | "audio"
        | "location"
        | "system"
      notif_level: "all" | "mentions" | "none"
      role_type: "admin" | "member"
      user_status: "online" | "offline"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_theme: ["light", "dark", "system"],
      attach_type: ["image", "video", "file", "audio"],
      call_type: ["audio", "video"],
      convo_type: ["direct", "group"],
      friend_status: ["pending", "accepted", "declined", "blocked"],
      gender: ["male", "female"],
      msg_type: [
        "text",
        "image",
        "video",
        "file",
        "audio",
        "location",
        "system",
      ],
      notif_level: ["all", "mentions", "none"],
      role_type: ["admin", "member"],
      user_status: ["online", "offline"],
      user_status: ["online", "offline"],
    },
  },
} as const
