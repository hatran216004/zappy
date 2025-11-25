export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      attachments: {
        Row: {
          byte_size: number;
          created_at: string;
          duration_ms: number | null;
          height: number | null;
          id: string;
          kind: Database['public']['Enums']['attach_type'];
          message_id: string;
          mime_type: string;
          storage_path: string;
          uploader_id: string;
          width: number | null;
        };
        Insert: {
          byte_size: number;
          created_at?: string;
          duration_ms?: number | null;
          height?: number | null;
          id?: string;
          kind: Database['public']['Enums']['attach_type'];
          message_id: string;
          mime_type: string;
          storage_path: string;
          uploader_id: string;
          width?: number | null;
        };
        Update: {
          byte_size?: number;
          created_at?: string;
          duration_ms?: number | null;
          height?: number | null;
          id?: string;
          kind?: Database['public']['Enums']['attach_type'];
          message_id?: string;
          mime_type?: string;
          storage_path?: string;
          uploader_id?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'attachments_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attachments_uploader_id_fkey';
            columns: ['uploader_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blocks_blocked_id_fkey';
            columns: ['blocked_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocks_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      call_participants: {
        Row: {
          call_id: string;
          joined_at: string | null;
          left_at: string | null;
          token: string;
          url: string;
          user_id: string;
        };
        Insert: {
          call_id: string;
          joined_at?: string | null;
          left_at?: string | null;
          token?: string;
          url?: string;
          user_id: string;
        };
        Update: {
          call_id?: string;
          joined_at?: string | null;
          left_at?: string | null;
          token?: string;
          url?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'call_participants_call_id_fkey';
            columns: ['call_id'];
            isOneToOne: false;
            referencedRelation: 'calls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'call_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      calls: {
        Row: {
          conversation_id: string;
          ended_at: string | null;
          id: string;
          participants: string[];
          started_at: string;
          started_by: string;
          type: Database['public']['Enums']['call_type'];
        };
        Insert: {
          conversation_id: string;
          ended_at?: string | null;
          id?: string;
          participants: string[];
          started_at?: string;
          started_by: string;
          type: Database['public']['Enums']['call_type'];
        };
        Update: {
          conversation_id?: string;
          ended_at?: string | null;
          id?: string;
          participants?: string[];
          started_at?: string;
          started_by?: string;
          type?: Database['public']['Enums']['call_type'];
        };
        Relationships: [
          {
            foreignKeyName: 'calls_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calls_started_by_fkey';
            columns: ['started_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      contact_label_map: {
        Row: {
          friend_id: string;
          label_id: string;
        };
        Insert: {
          friend_id: string;
          label_id: string;
        };
        Update: {
          friend_id?: string;
          label_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_label_map_friend_id_fkey';
            columns: ['friend_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contact_label_map_label_id_fkey';
            columns: ['label_id'];
            isOneToOne: false;
            referencedRelation: 'contact_labels';
            referencedColumns: ['id'];
          }
        ];
      };
      contact_labels: {
        Row: {
          color: number;
          id: string;
          name: string;
          owner_id: string;
        };
        Insert: {
          color: number;
          id?: string;
          name: string;
          owner_id: string;
        };
        Update: {
          color?: number;
          id?: string;
          name?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_labels_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      conversation_label_map: {
        Row: {
          conversation_id: string;
          label_id: string;
        };
        Insert: {
          conversation_id: string;
          label_id: string;
        };
        Update: {
          conversation_id?: string;
          label_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_label_map_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_label_map_label_id_fkey';
            columns: ['label_id'];
            isOneToOne: false;
            referencedRelation: 'conversation_labels';
            referencedColumns: ['id'];
          }
        ];
      };
      conversation_labels: {
        Row: {
          color: number;
          id: string;
          name: string;
          owner_id: string;
        };
        Insert: {
          color: number;
          id?: string;
          name: string;
          owner_id: string;
        };
        Update: {
          color?: number;
          id?: string;
          name?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_labels_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          joined_at: string;
          last_read_at: string | null;
          left_at: string | null;
          mute_until: string | null;
          notif_level: Database['public']['Enums']['notif_level'];
          role: Database['public']['Enums']['role_type'];
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          joined_at?: string;
          last_read_at?: string | null;
          left_at?: string | null;
          mute_until?: string | null;
          notif_level?: Database['public']['Enums']['notif_level'];
          role?: Database['public']['Enums']['role_type'];
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          joined_at?: string;
          last_read_at?: string | null;
          left_at?: string | null;
          mute_until?: string | null;
          notif_level?: Database['public']['Enums']['notif_level'];
          role?: Database['public']['Enums']['role_type'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_participants_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      conversation_reports: {
        Row: {
          conversation_id: string;
          created_at: string;
          description: string | null;
          id: string;
          read_at: string | null;
          reason: Database['public']['Enums']['report_reason'];
          reported_by: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string | null;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          read_at?: string | null;
          reason: Database['public']['Enums']['report_reason'];
          reported_by: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          read_at?: string | null;
          reason?: Database['public']['Enums']['report_reason'];
          reported_by?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_reports_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_reports_reported_by_fkey';
            columns: ['reported_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_reports_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      conversations: {
        Row: {
          background_type: string | null;
          background_value: string | null;
          chat_enabled: boolean;
          created_at: string;
          created_by: string;
          id: string;
          is_deleted: boolean | null;
          last_message_id: string | null;
          photo_url: string;
          title: string | null;
          type: Database['public']['Enums']['convo_type'];
          updated_at: string | null;
        };
        Insert: {
          background_type?: string | null;
          background_value?: string | null;
          chat_enabled?: boolean;
          created_at?: string;
          created_by: string;
          id?: string;
          is_deleted?: boolean | null;
          last_message_id?: string | null;
          photo_url?: string;
          title?: string | null;
          type: Database['public']['Enums']['convo_type'];
          updated_at?: string | null;
        };
        Update: {
          background_type?: string | null;
          background_value?: string | null;
          chat_enabled?: boolean;
          created_at?: string;
          created_by?: string;
          id?: string;
          is_deleted?: boolean | null;
          last_message_id?: string | null;
          photo_url?: string;
          title?: string | null;
          type?: Database['public']['Enums']['convo_type'];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_last_message_id_fkey';
            columns: ['last_message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          }
        ];
      };
      deleted_messages: {
        Row: {
          deleted_at: string;
          message_id: string;
          user_id: string;
        };
        Insert: {
          deleted_at?: string;
          message_id: string;
          user_id: string;
        };
        Update: {
          deleted_at?: string;
          message_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'deleted_messages_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deleted_messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      direct_pairs: {
        Row: {
          conversation_id: string;
          created_at: string;
          user_a: string;
          user_b: string;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          user_a: string;
          user_b: string;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          user_a?: string;
          user_b?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'direct_pairs_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: true;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'direct_pairs_user_a_fkey';
            columns: ['user_a'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'direct_pairs_user_b_fkey';
            columns: ['user_b'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      friend_requests: {
        Row: {
          created_at: string;
          from_user_id: string;
          id: string;
          message: string;
          responded_at: string | null;
          status: Database['public']['Enums']['friend_status'];
          to_user_id: string;
        };
        Insert: {
          created_at?: string;
          from_user_id: string;
          id?: string;
          message?: string;
          responded_at?: string | null;
          status?: Database['public']['Enums']['friend_status'];
          to_user_id: string;
        };
        Update: {
          created_at?: string;
          from_user_id?: string;
          id?: string;
          message?: string;
          responded_at?: string | null;
          status?: Database['public']['Enums']['friend_status'];
          to_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friend_requests_from_user_id_fkey';
            columns: ['from_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friend_requests_to_user_id_fkey';
            columns: ['to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      friends: {
        Row: {
          created_at: string;
          friend_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          friend_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          friend_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friends_friend_id_fkey';
            columns: ['friend_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friends_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      group_invites: {
        Row: {
          conversation_id: string;
          created_at: string;
          created_by: string;
          expires_at: string | null;
          id: string;
          invite_code: string;
          is_active: boolean;
          max_uses: number | null;
          used_count: number;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          created_by: string;
          expires_at?: string | null;
          id?: string;
          invite_code: string;
          is_active?: boolean;
          max_uses?: number | null;
          used_count?: number;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          created_by?: string;
          expires_at?: string | null;
          id?: string;
          invite_code?: string;
          is_active?: boolean;
          max_uses?: number | null;
          used_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'group_invites_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_invites_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      message_mentions: {
        Row: {
          created_at: string;
          id: string;
          mentioned_user_id: string;
          message_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          mentioned_user_id: string;
          message_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          mentioned_user_id?: string;
          message_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'message_mentions_mentioned_user_id_fkey';
            columns: ['mentioned_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_mentions_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          }
        ];
      };
      message_reactions: {
        Row: {
          created_at: string | null;
          emoji: string;
          message_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          emoji: string;
          message_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          emoji?: string;
          message_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'message_reactions_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_reactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      message_reports: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          message_id: string;
          read_at: string | null;
          reason: Database['public']['Enums']['report_reason'];
          reported_by: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          message_id: string;
          read_at?: string | null;
          reason: Database['public']['Enums']['report_reason'];
          reported_by: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          message_id?: string;
          read_at?: string | null;
          reason?: Database['public']['Enums']['report_reason'];
          reported_by?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'message_reports_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_reports_reported_by_fkey';
            columns: ['reported_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_reports_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      messages: {
        Row: {
          content_text: string | null;
          conversation_id: string;
          created_at: string;
          edited_at: string | null;
          effect: string | null;
          forwarded_from_user_id: string | null;
          fts: unknown;
          id: string;
          is_forwarded: boolean | null;
          location: unknown;
          location_address: string | null;
          location_display_mode: string | null;
          location_latitude: number | null;
          location_longitude: number | null;
          recalled_at: string | null;
          reply_to_id: string | null;
          sender_id: string;
          thread_id: string | null;
          type: Database['public']['Enums']['msg_type'];
        };
        Insert: {
          content_text?: string | null;
          conversation_id: string;
          created_at?: string;
          edited_at?: string | null;
          effect?: string | null;
          forwarded_from_user_id?: string | null;
          fts?: unknown;
          id?: string;
          is_forwarded?: boolean | null;
          location?: unknown;
          location_address?: string | null;
          location_display_mode?: string | null;
          location_latitude?: number | null;
          location_longitude?: number | null;
          recalled_at?: string | null;
          reply_to_id?: string | null;
          sender_id: string;
          thread_id?: string | null;
          type?: Database['public']['Enums']['msg_type'];
        };
        Update: {
          content_text?: string | null;
          conversation_id?: string;
          created_at?: string;
          edited_at?: string | null;
          effect?: string | null;
          forwarded_from_user_id?: string | null;
          fts?: unknown;
          id?: string;
          is_forwarded?: boolean | null;
          location?: unknown;
          location_address?: string | null;
          location_display_mode?: string | null;
          location_latitude?: number | null;
          location_longitude?: number | null;
          recalled_at?: string | null;
          reply_to_id?: string | null;
          sender_id?: string;
          thread_id?: string | null;
          type?: Database['public']['Enums']['msg_type'];
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_forwarded_from_user_id_fkey';
            columns: ['forwarded_from_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_reply_to_id_fkey';
            columns: ['reply_to_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_thread_id_fkey';
            columns: ['thread_id'];
            isOneToOne: false;
            referencedRelation: 'threads';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          data: Json;
          id: string;
          read_at: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data?: Json;
          id?: string;
          read_at?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          id?: string;
          read_at?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      pinned_messages: {
        Row: {
          conversation_id: string;
          created_at: string;
          id: string;
          message_id: string;
          pinned_by: string;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          id?: string;
          message_id: string;
          pinned_by: string;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          id?: string;
          message_id?: string;
          pinned_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pinned_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pinned_messages_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pinned_messages_pinned_by_fkey';
            columns: ['pinned_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      poll_options: {
        Row: {
          id: string;
          idx: number;
          option_text: string;
          poll_id: string;
        };
        Insert: {
          id?: string;
          idx: number;
          option_text: string;
          poll_id: string;
        };
        Update: {
          id?: string;
          idx?: number;
          option_text?: string;
          poll_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'poll_options_poll_id_fkey';
            columns: ['poll_id'];
            isOneToOne: false;
            referencedRelation: 'polls';
            referencedColumns: ['id'];
          }
        ];
      };
      poll_participants: {
        Row: {
          created_at: string;
          poll_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          poll_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          poll_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'poll_participants_poll_id_fkey';
            columns: ['poll_id'];
            isOneToOne: false;
            referencedRelation: 'polls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'poll_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      poll_votes: {
        Row: {
          created_at: string;
          option_id: string;
          poll_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          option_id: string;
          poll_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          option_id?: string;
          poll_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'poll_votes_option_id_fkey';
            columns: ['option_id'];
            isOneToOne: false;
            referencedRelation: 'poll_options';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'poll_votes_poll_id_fkey';
            columns: ['poll_id'];
            isOneToOne: false;
            referencedRelation: 'polls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'poll_votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      polls: {
        Row: {
          conversation_id: string;
          created_at: string;
          created_by: string;
          id: string;
          message_id: string;
          multiple: boolean;
          question: string;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          message_id: string;
          multiple?: boolean;
          question: string;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          message_id?: string;
          multiple?: boolean;
          question?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'polls_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'polls_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'polls_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: true;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          }
        ];
      };
      post_comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          post_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          post_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          post_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      post_reactions: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          reaction_type: Database['public']['Enums']['post_reaction_type'];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          reaction_type?: Database['public']['Enums']['post_reaction_type'];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          reaction_type?: Database['public']['Enums']['post_reaction_type'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_reactions_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_reactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      post_reports: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          post_id: string;
          read_at: string | null;
          reason: Database['public']['Enums']['report_reason'];
          reported_by: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          post_id: string;
          read_at?: string | null;
          reason: Database['public']['Enums']['report_reason'];
          reported_by: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          post_id?: string;
          read_at?: string | null;
          reason?: Database['public']['Enums']['report_reason'];
          reported_by?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'post_reports_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_reports_reported_by_fkey';
            columns: ['reported_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_reports_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      posts: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          id: string;
          image_url: string | null;
          image_urls: Json | null;
          is_deleted: boolean | null;
          updated_at: string | null;
          video_url: string | null;
        };
        Insert: {
          author_id: string;
          content: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          image_urls?: Json | null;
          is_deleted?: boolean | null;
          updated_at?: string | null;
          video_url?: string | null;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          image_urls?: Json | null;
          is_deleted?: boolean | null;
          updated_at?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string;
          bio: string;
          block_messages_from_strangers: boolean | null;
          created_at: string;
          display_name: string;
          gender: boolean;
          id: string;
          is_deleted: boolean | null;
          is_disabled: boolean;
          is_onboarded: boolean | null;
          is_private: boolean | null;
          last_seen_at: string | null;
          status: Database['public']['Enums']['user_status'];
          status_updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string;
          bio?: string;
          block_messages_from_strangers?: boolean | null;
          created_at: string;
          display_name: string;
          gender: boolean;
          id: string;
          is_deleted?: boolean | null;
          is_disabled?: boolean;
          is_onboarded?: boolean | null;
          is_private?: boolean | null;
          last_seen_at?: string | null;
          status?: Database['public']['Enums']['user_status'];
          status_updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string;
          bio?: string;
          block_messages_from_strangers?: boolean | null;
          created_at?: string;
          display_name?: string;
          gender?: boolean;
          id?: string;
          is_deleted?: boolean | null;
          is_disabled?: boolean;
          is_onboarded?: boolean | null;
          is_private?: boolean | null;
          last_seen_at?: string | null;
          status?: Database['public']['Enums']['user_status'];
          status_updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      read_receipts: {
        Row: {
          message_id: string;
          read_at: string;
          user_id: string;
        };
        Insert: {
          message_id: string;
          read_at?: string;
          user_id: string;
        };
        Update: {
          message_id?: string;
          read_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'read_receipts_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'read_receipts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      thread_participants: {
        Row: {
          joined_at: string;
          last_read_at: string | null;
          thread_id: string;
          user_id: string;
        };
        Insert: {
          joined_at?: string;
          last_read_at?: string | null;
          thread_id: string;
          user_id: string;
        };
        Update: {
          joined_at?: string;
          last_read_at?: string | null;
          thread_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'thread_participants_thread_id_fkey';
            columns: ['thread_id'];
            isOneToOne: false;
            referencedRelation: 'threads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'thread_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      threads: {
        Row: {
          closed_at: string | null;
          closed_by: string | null;
          conversation_id: string;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          is_closed: boolean;
          is_pinned: boolean;
          last_message_id: string | null;
          message_count: number;
          participant_count: number;
          root_message_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          closed_at?: string | null;
          closed_by?: string | null;
          conversation_id: string;
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          is_closed?: boolean;
          is_pinned?: boolean;
          last_message_id?: string | null;
          message_count?: number;
          participant_count?: number;
          root_message_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          closed_at?: string | null;
          closed_by?: string | null;
          conversation_id?: string;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_closed?: boolean;
          is_pinned?: boolean;
          last_message_id?: string | null;
          message_count?: number;
          participant_count?: number;
          root_message_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'threads_closed_by_fkey';
            columns: ['closed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'threads_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'threads_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'threads_last_message_id_fkey';
            columns: ['last_message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'threads_root_message_id_fkey';
            columns: ['root_message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          }
        ];
      };
      user_reports: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          read_at: string | null;
          reason: Database['public']['Enums']['report_reason'];
          reported_by: string;
          reported_user_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          read_at?: string | null;
          reason: Database['public']['Enums']['report_reason'];
          reported_by: string;
          reported_user_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          read_at?: string | null;
          reason?: Database['public']['Enums']['report_reason'];
          reported_by?: string;
          reported_user_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_reports_reported_by_fkey';
            columns: ['reported_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_reports_reported_user_id_fkey';
            columns: ['reported_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_reports_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      user_settings: {
        Row: {
          user_id: string;
        };
        Insert: {
          user_id: string;
        };
        Update: {
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_friend_request: { Args: { _user_id: string }; Returns: boolean };
      add_members: {
        Args: { _conversation_id: string; _user_ids: string[] };
        Returns: undefined;
      };
      auto_set_offline_users: { Args: never; Returns: undefined };
      block_user: { Args: { _user_id: string }; Returns: boolean };
      bulk_assign_contact_labels: {
        Args: { _contact_label: string; _user_ids: string[] };
        Returns: undefined;
      };
      bulk_assign_conversation_labels: {
        Args: { _conversation_ids: string[]; _conversation_label: string };
        Returns: undefined;
      };
      bulk_unassign_contact_labels: {
        Args: { _contact_label: string; _user_ids: string[] };
        Returns: undefined;
      };
      bulk_unassign_conversation_labels: {
        Args: { _conversation_ids: string[]; _conversation_label: string };
        Returns: undefined;
      };
      cancel_friend_request: { Args: { _user_id: string }; Returns: boolean };
      clear_chat: { Args: { _conversation_id: string }; Returns: boolean };
      count_members_in_group: {
        Args: { _conversation_id: string };
        Returns: number;
      };
      create_call: {
        Args: {
          _conversation_id: string;
          _is_video_enabled: boolean;
          _participants: string[];
        };
        Returns: undefined;
      };
      create_contact_label: {
        Args: { _color: number; _name: string; _user_ids: string[] };
        Returns: boolean;
      };
      create_conversation_label: {
        Args: { _color: number; _conversation_ids: string[]; _name: string };
        Returns: boolean;
      };
      create_direct_call: {
        Args: { _is_video_enabled: boolean; _user_id: string };
        Returns: undefined;
      };
      create_direct_call_with_livekit: {
        Args: { _is_video_enabled: boolean; _user_id: string };
        Returns: undefined;
      };
      create_group: {
        Args: { _title: string; _user_ids: string[] };
        Returns: undefined;
      };
      create_group_call: {
        Args: { _conversation_id: string; _is_video_enabled: boolean };
        Returns: undefined;
      };
      create_invite_link: {
        Args: {
          _conversation_id: string;
          _expires_at: string;
          _max_uses: number;
        };
        Returns: boolean;
      };
      disband_group: { Args: { _conversation_id: string }; Returns: boolean };
      generate_livekit_token: {
        Args: { participant_identity: string; room_name: string };
        Returns: {
          token: string;
          url: string;
        }[];
      };
      generate_room_name: { Args: { _call_id: string }; Returns: string };
      get_blocks: {
        Args: never;
        Returns: {
          avatar_url: string;
          created_at: string;
          display_name: string;
          id: string;
          username: string;
        }[];
      };
      get_call_info: {
        Args: { _call_id: string };
        Returns: {
          avatar_url: string;
          conversation_id: string;
          display_name: string;
          is_video_enabled: boolean;
          photo_url: string;
          title: string;
          type: string;
          username: string;
        }[];
      };
      get_call_info_web: {
        Args: { _call_id: string };
        Returns: {
          avatar_url: string;
          conversation_id: string;
          display_name: string;
          is_video_enabled: boolean;
          photo_url: string;
          title: string;
          type: string;
          username: string;
        }[];
      };
      get_contact_labels: {
        Args: never;
        Returns: {
          color: number;
          id: string;
          name: string;
        }[];
      };
      get_conversation: {
        Args: { _conversation_id: string };
        Returns: {
          content_text: string;
          display_name: string;
          id: string;
          is_hidden: boolean;
          is_recalled: boolean;
          message_type: string;
          msg_id: string;
          photo_url: string;
          sender_id: string;
          title: string;
          type: string;
          unread_count: number;
          updated_at: string;
        }[];
      };
      get_conversation_labels: {
        Args: never;
        Returns: {
          color: number;
          id: string;
          name: string;
        }[];
      };
      get_conversations: {
        Args: never;
        Returns: {
          content_text: string;
          display_name: string;
          id: string;
          is_hidden: boolean;
          is_recalled: boolean;
          message_type: string;
          msg_id: string;
          photo_url: string;
          sender_id: string;
          title: string;
          type: string;
          unread_count: number;
          updated_at: string;
        }[];
      };
      get_direct_conversation: {
        Args: { _user_id: string };
        Returns: {
          id: string;
          photo_url: string;
          title: string;
          type: string;
        }[];
      };
      get_friends: {
        Args: never;
        Returns: {
          avatar_url: string;
          display_name: string;
          id: string;
          label_id: string[];
          last_seen_at: string;
          status: string;
          username: string;
        }[];
      };
      get_friends_mobile: {
        Args: never;
        Returns: {
          avatar_url: string;
          conversation_id: string;
          display_name: string;
          id: string;
          label_id: string[];
          status: string;
          username: string;
        }[];
      };
      get_friends_status: {
        Args: never;
        Returns: {
          conversation_id: string;
          status: string;
          user_id: string;
        }[];
      };
      get_group_members: {
        Args: { _conversation_id: string };
        Returns: {
          avatar_url: string;
          display_name: string;
          id: string;
          is_admin: boolean;
          joined_at: string;
          username: string;
        }[];
      };
      get_groups: {
        Args: never;
        Returns: {
          created_at: string;
          id: string;
          is_admin: boolean;
          label_id: string[];
          photo_url: string;
          title: string;
          updated_at: string;
        }[];
      };
      get_invite_links: {
        Args: { _conversation_id: string };
        Returns: {
          created_at: string;
          created_by: string;
          expires_at: string;
          id: string;
          invite_code: string;
          is_active: boolean;
          max_uses: number;
          used_count: number;
        }[];
      };
      get_latest_message_conversation: {
        Args: { _conversation_id: string };
        Returns: {
          content: string;
          display_name: string;
          id: string;
          sender_id: string;
          type: string;
        }[];
      };
      get_or_create_direct_conversation: {
        Args: { _user_id: string };
        Returns: {
          created_at: string;
          id: string;
          last_message_id: string;
          participants: string[];
          photo_url: string;
          title: string;
          type: string;
          updated_at: string;
        }[];
      };
      get_pinned_messages: {
        Args: { _conversation_id: string };
        Returns: {
          conversation_id: string;
          created_at: string;
          id: string;
          message_id: string;
          messages: Json;
          pinned_by: string;
        }[];
      };
      get_requests: {
        Args: never;
        Returns: {
          avatar_url: string;
          created_at: string;
          display_name: string;
          from_me: boolean;
          id: string;
          status: string;
          username: string;
        }[];
      };
      get_unread_count: { Args: { _conversation_id: string }; Returns: number };
      get_user_from_direct_conversation: {
        Args: { _direct_conversation_id: string };
        Returns: {
          avatar_url: string;
          display_name: string;
          id: string;
          username: string;
        }[];
      };
      initiate_direct_call: {
        Args: { _is_video_enabled: boolean; _user_id: string };
        Returns: undefined;
      };
      join_group_via_invite: {
        Args: { _invite_code: string };
        Returns: string;
      };
      join_group_with_code: { Args: { _code: string }; Returns: boolean };
      kick_group_member: {
        Args: { _conversation_id: string; _member_id: string };
        Returns: boolean;
      };
      leave_group: { Args: { _conversation_id: string }; Returns: boolean };
      livekit_event_participant_joined: {
        Args: { _room_id: string; _user_id: string };
        Returns: undefined;
      };
      livekit_event_participant_left: {
        Args: { _room_id: string; _user_id: string };
        Returns: undefined;
      };
      livekit_event_room_finished: {
        Args: { _room_id: string };
        Returns: undefined;
      };
      modify_contact_label: {
        Args: { _color: number; _label_id: string; _name: string };
        Returns: boolean;
      };
      modify_conversation_label: {
        Args: { _color: number; _label_id: string; _name: string };
        Returns: boolean;
      };
      recall_message: { Args: { _message_id: string }; Returns: undefined };
      reject_friend_request: { Args: { _user_id: string }; Returns: boolean };
      remove_block_user: { Args: { _user_id: string }; Returns: undefined };
      remove_contact_label: { Args: { _label_id: string }; Returns: boolean };
      remove_conversation_label: {
        Args: { _label_id: string };
        Returns: boolean;
      };
      remove_friend: { Args: { _user_id: string }; Returns: undefined };
      remove_message: { Args: { _message_id: string }; Returns: boolean };
      search_users: {
        Args: { _search: string };
        Returns: {
          avatar_url: string;
          created_at: string;
          display_name: string;
          from_me: boolean;
          id: string;
          status: string;
          username: string;
        }[];
      };
      search_users_by_email: {
        Args: { _current_user_id: string; _term: string };
        Returns: {
          avatar_url: string;
          bio: string;
          block_messages_from_strangers: boolean | null;
          created_at: string;
          display_name: string;
          gender: boolean;
          id: string;
          is_deleted: boolean | null;
          is_disabled: boolean;
          is_onboarded: boolean | null;
          is_private: boolean | null;
          last_seen_at: string | null;
          status: Database['public']['Enums']['user_status'];
          status_updated_at: string;
          username: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'profiles';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      send_friend_request: {
        Args: { _message: string; _user_id: string };
        Returns: boolean;
      };
      set_online_status: { Args: never; Returns: undefined };
      switch_group_admin: {
        Args: { _conversation_id: string; _member_id: string };
        Returns: boolean;
      };
      verify_user_password: { Args: { _password: string }; Returns: boolean };
    };
    Enums: {
      app_theme: 'light' | 'dark' | 'system';
      attach_type: 'image' | 'video' | 'file' | 'audio';
      call_type: 'audio' | 'video';
      convo_type: 'direct' | 'group';
      friend_status: 'pending' | 'accepted' | 'declined' | 'blocked';
      gender: 'male' | 'female';
      msg_type:
        | 'text'
        | 'image'
        | 'video'
        | 'file'
        | 'audio'
        | 'location'
        | 'system'
        | 'poll';
      notif_level: 'all' | 'mentions' | 'none';
      post_reaction_type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
      report_reason:
        | 'spam'
        | 'harassment'
        | 'inappropriate_content'
        | 'violence'
        | 'hate_speech'
        | 'fake_news'
        | 'other';
      role_type: 'admin' | 'member';
      user_status: 'online' | 'offline';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
      DefaultSchema['Views'])
  ? (DefaultSchema['Tables'] &
      DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
  ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {}
  },
  public: {
    Enums: {
      app_theme: ['light', 'dark', 'system'],
      attach_type: ['image', 'video', 'file', 'audio'],
      call_type: ['audio', 'video'],
      convo_type: ['direct', 'group'],
      friend_status: ['pending', 'accepted', 'declined', 'blocked'],
      gender: ['male', 'female'],
      msg_type: [
        'text',
        'image',
        'video',
        'file',
        'audio',
        'location',
        'system',
        'poll'
      ],
      notif_level: ['all', 'mentions', 'none'],
      post_reaction_type: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      report_reason: [
        'spam',
        'harassment',
        'inappropriate_content',
        'violence',
        'hate_speech',
        'fake_news',
        'other'
      ],
      role_type: ['admin', 'member'],
      user_status: ['online', 'offline']
    }
  }
} as const;
