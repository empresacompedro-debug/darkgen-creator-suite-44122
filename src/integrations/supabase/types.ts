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
  public: {
    Tables: {
      api_usage_logs: {
        Row: {
          function_name: string
          id: string
          provider: string
          timestamp: string
          user_id: string
        }
        Insert: {
          function_name: string
          id?: string
          provider: string
          timestamp?: string
          user_id: string
        }
        Update: {
          function_name?: string
          id?: string
          provider?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      brainstorm_ideas: {
        Row: {
          ai_model: string | null
          created_at: string | null
          id: string
          ideas: Json
          language: string
          niche: string
          sub_niche: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string | null
          id?: string
          ideas: Json
          language: string
          niche: string
          sub_niche?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string | null
          id?: string
          ideas?: Json
          language?: string
          niche?: string
          sub_niche?: string | null
          user_id?: string
        }
        Relationships: []
      }
      competitor_alert_settings: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          max_days: number | null
          min_views: number | null
          min_vph: number | null
          monitor_id: string | null
          notify_email: boolean | null
          notify_in_app: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          max_days?: number | null
          min_views?: number | null
          min_vph?: number | null
          monitor_id?: string | null
          notify_email?: boolean | null
          notify_in_app?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          max_days?: number | null
          min_views?: number | null
          min_vph?: number | null
          monitor_id?: string | null
          notify_email?: boolean | null
          notify_in_app?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_alert_settings_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_alerts: {
        Row: {
          alert_message: string
          alert_type: string
          created_at: string
          id: string
          is_read: boolean | null
          monitor_id: string | null
          user_id: string
          video_data: Json
          video_id: string
        }
        Insert: {
          alert_message: string
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          monitor_id?: string | null
          user_id: string
          video_data: Json
          video_id: string
        }
        Update: {
          alert_message?: string
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          monitor_id?: string | null
          user_id?: string
          video_data?: Json
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_alerts_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_monitors: {
        Row: {
          channel_id: string
          channel_thumbnail: string | null
          channel_title: string
          channel_url: string
          created_at: string | null
          id: string
          last_updated_at: string | null
          niche_id: string | null
          subscriber_count: number | null
          user_id: string
          video_count: number | null
        }
        Insert: {
          channel_id: string
          channel_thumbnail?: string | null
          channel_title: string
          channel_url: string
          created_at?: string | null
          id?: string
          last_updated_at?: string | null
          niche_id?: string | null
          subscriber_count?: number | null
          user_id: string
          video_count?: number | null
        }
        Update: {
          channel_id?: string
          channel_thumbnail?: string | null
          channel_title?: string
          channel_url?: string
          created_at?: string | null
          id?: string
          last_updated_at?: string | null
          niche_id?: string | null
          subscriber_count?: number | null
          user_id?: string
          video_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_monitors_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "competitor_niches"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_niches: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      description_optimizations: {
        Row: {
          ai_model: string | null
          created_at: string
          id: string
          include_cta: boolean | null
          language: string | null
          optimized_description: string
          original_description: string
          title: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          id?: string
          include_cta?: boolean | null
          language?: string | null
          optimized_description: string
          original_description: string
          title?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          id?: string
          include_cta?: boolean | null
          language?: string | null
          optimized_description?: string
          original_description?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      editing_guides: {
        Row: {
          ai_model: string | null
          created_at: string
          guide_content: string
          id: string
          images_per_scene: number | null
          narration_speed: number | null
          scene_prompts: string | null
          script: string | null
          srt_content: string | null
          total_duration_seconds: number | null
          user_id: string
          validation_status: Json | null
          video_topic: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          guide_content: string
          id?: string
          images_per_scene?: number | null
          narration_speed?: number | null
          scene_prompts?: string | null
          script?: string | null
          srt_content?: string | null
          total_duration_seconds?: number | null
          user_id: string
          validation_status?: Json | null
          video_topic: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          guide_content?: string
          id?: string
          images_per_scene?: number | null
          narration_speed?: number | null
          scene_prompts?: string | null
          script?: string | null
          srt_content?: string | null
          total_duration_seconds?: number | null
          user_id?: string
          validation_status?: Json | null
          video_topic?: string
        }
        Relationships: []
      }
      extracted_thumbnails: {
        Row: {
          extracted_at: string | null
          id: string
          resolution: string
          thumbnail_url: string
          user_id: string
          video_id: string
          video_title: string
          video_url: string
        }
        Insert: {
          extracted_at?: string | null
          id?: string
          resolution: string
          thumbnail_url: string
          user_id: string
          video_id: string
          video_title: string
          video_url: string
        }
        Update: {
          extracted_at?: string | null
          id?: string
          resolution?: string
          thumbnail_url?: string
          user_id?: string
          video_id?: string
          video_title?: string
          video_url?: string
        }
        Relationships: []
      }
      filter_presets: {
        Row: {
          created_at: string | null
          filters: Json
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters: Json
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          ai_model: string | null
          aspect_ratio: string | null
          created_at: string
          id: string
          image_url: string
          prompt: string
          settings: Json | null
          style: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          aspect_ratio?: string | null
          created_at?: string
          id?: string
          image_url: string
          prompt: string
          settings?: Json | null
          style?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          aspect_ratio?: string | null
          created_at?: string
          id?: string
          image_url?: string
          prompt?: string
          settings?: Json | null
          style?: string | null
          user_id?: string
        }
        Relationships: []
      }
      monitored_videos: {
        Row: {
          comment_count: number | null
          created_at: string | null
          days_since_upload: number
          explosive_reason: string | null
          id: string
          is_explosive: boolean | null
          like_count: number | null
          monitor_id: string | null
          published_at: string
          thumbnail_url: string
          title: string
          updated_at: string | null
          user_id: string
          video_id: string
          view_count: number
          vph: number
        }
        Insert: {
          comment_count?: number | null
          created_at?: string | null
          days_since_upload: number
          explosive_reason?: string | null
          id?: string
          is_explosive?: boolean | null
          like_count?: number | null
          monitor_id?: string | null
          published_at: string
          thumbnail_url: string
          title: string
          updated_at?: string | null
          user_id: string
          video_id: string
          view_count: number
          vph: number
        }
        Update: {
          comment_count?: number | null
          created_at?: string | null
          days_since_upload?: number
          explosive_reason?: string | null
          id?: string
          is_explosive?: boolean | null
          like_count?: number | null
          monitor_id?: string | null
          published_at?: string
          thumbnail_url?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          video_id?: string
          view_count?: number
          vph?: number
        }
        Relationships: [
          {
            foreignKeyName: "monitored_videos_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_analyses: {
        Row: {
          created_at: string | null
          id: string
          keywords: Json | null
          metrics: Json
          niche_description: string | null
          niche_name: string
          search_id: string | null
          specificity: string | null
          user_id: string
          video_ids: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          keywords?: Json | null
          metrics: Json
          niche_description?: string | null
          niche_name: string
          search_id?: string | null
          specificity?: string | null
          user_id: string
          video_ids: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          keywords?: Json | null
          metrics?: Json
          niche_description?: string | null
          niche_name?: string
          search_id?: string | null
          specificity?: string | null
          user_id?: string
          video_ids?: Json
        }
        Relationships: [
          {
            foreignKeyName: "niche_analyses_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "niche_finder_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_batch_searches: {
        Row: {
          created_at: string
          id: string
          niches_list: string[]
          processed_count: number
          quota_used: number | null
          results: Json
          status: string
          total_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          niches_list: string[]
          processed_count?: number
          quota_used?: number | null
          results?: Json
          status?: string
          total_count: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          niches_list?: string[]
          processed_count?: number
          quota_used?: number | null
          results?: Json
          status?: string
          total_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      niche_expansions: {
        Row: {
          ai_model: string | null
          created_at: string
          id: string
          language: string | null
          lista_1: Json
          lista_2: Json
          main_niche: string
          nivel_detectado: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          id?: string
          language?: string | null
          lista_1: Json
          lista_2: Json
          main_niche: string
          nivel_detectado?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          id?: string
          language?: string | null
          lista_1?: Json
          lista_2?: Json
          main_niche?: string
          nivel_detectado?: string | null
          user_id?: string
        }
        Relationships: []
      }
      niche_finder_searches: {
        Row: {
          created_at: string
          id: string
          quota_info: Json | null
          results: Json
          search_name: string
          search_params: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quota_info?: Json | null
          results: Json
          search_name: string
          search_params: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quota_info?: Json | null
          results?: Json
          search_name?: string
          search_params?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      niche_lists: {
        Row: {
          content: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          abacatepay_api_key: string | null
          created_at: string | null
          id: string
          pix_key: string
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          abacatepay_api_key?: string | null
          created_at?: string | null
          id?: string
          pix_key: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          abacatepay_api_key?: string | null
          created_at?: string | null
          id?: string
          pix_key?: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      pix_payments: {
        Row: {
          abacatepay_id: string | null
          amount: number
          correlation_id: string | null
          created_at: string | null
          customer_cpf: string | null
          customer_name: string | null
          customer_phone: string | null
          expires_at: string | null
          id: string
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status_detail: string | null
          plan_id: string
          qr_code_image: string | null
          qr_code_text: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          abacatepay_id?: string | null
          amount: number
          correlation_id?: string | null
          created_at?: string | null
          customer_cpf?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status_detail?: string | null
          plan_id: string
          qr_code_image?: string | null
          qr_code_text?: string | null
          status: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          abacatepay_id?: string | null
          amount?: number
          correlation_id?: string | null
          created_at?: string | null
          customer_cpf?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status_detail?: string | null
          plan_id?: string
          qr_code_image?: string | null
          qr_code_text?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      quota_usage: {
        Row: {
          created_at: string | null
          feature: string
          id: string
          quota_used: number
          timestamp: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature: string
          id?: string
          quota_used: number
          timestamp?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature?: string
          id?: string
          quota_used?: number
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scene_prompts: {
        Row: {
          ai_model: string | null
          characters: Json | null
          created_at: string
          generation_mode: string | null
          id: string
          include_text: boolean | null
          language: string | null
          optimize_for: string | null
          prompts: string
          scene_style: string | null
          script_content: string
          title: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          characters?: Json | null
          created_at?: string
          generation_mode?: string | null
          id?: string
          include_text?: boolean | null
          language?: string | null
          optimize_for?: string | null
          prompts: string
          scene_style?: string | null
          script_content: string
          title?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          characters?: Json | null
          created_at?: string
          generation_mode?: string | null
          id?: string
          include_text?: boolean | null
          language?: string | null
          optimize_for?: string | null
          prompts?: string
          scene_style?: string | null
          script_content?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scripts: {
        Row: {
          ai_model: string | null
          content: string
          created_at: string
          id: string
          is_draft: boolean | null
          niche: string | null
          theme: string | null
          title: string
          tone: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          content: string
          created_at?: string
          id?: string
          is_draft?: boolean | null
          niche?: string | null
          theme?: string | null
          title: string
          tone?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          content?: string
          created_at?: string
          id?: string
          is_draft?: boolean | null
          niche?: string | null
          theme?: string | null
          title?: string
          tone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      similar_channels: {
        Row: {
          channel_thumbnail: string | null
          channel_url: string
          channels_found: Json | null
          created_at: string | null
          days_filter: number
          id: string
          subscribers_filter: number
          target_channel_name: string | null
          target_channel_thumbnail: string | null
          user_id: string
        }
        Insert: {
          channel_thumbnail?: string | null
          channel_url: string
          channels_found?: Json | null
          created_at?: string | null
          days_filter: number
          id?: string
          subscribers_filter: number
          target_channel_name?: string | null
          target_channel_thumbnail?: string | null
          user_id: string
        }
        Update: {
          channel_thumbnail?: string | null
          channel_url?: string
          channels_found?: Json | null
          created_at?: string | null
          days_filter?: number
          id?: string
          subscribers_filter?: number
          target_channel_name?: string | null
          target_channel_thumbnail?: string | null
          user_id?: string
        }
        Relationships: []
      }
      srt_conversions: {
        Row: {
          created_at: string
          id: string
          script_original: string
          srt_result: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          script_original: string
          srt_result: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          script_original?: string
          srt_result?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          interval: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      thumbnail_modelings: {
        Row: {
          ai_analysis: string | null
          ai_model: string | null
          created_at: string | null
          custom_instructions: string | null
          generated_images: Json
          id: string
          image_generator: string
          include_text: boolean | null
          modeling_level: string
          original_image_url: string
          provider: string | null
          quantity: number | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_model?: string | null
          created_at?: string | null
          custom_instructions?: string | null
          generated_images?: Json
          id?: string
          image_generator: string
          include_text?: boolean | null
          modeling_level: string
          original_image_url: string
          provider?: string | null
          quantity?: number | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          ai_model?: string | null
          created_at?: string | null
          custom_instructions?: string | null
          generated_images?: Json
          id?: string
          image_generator?: string
          include_text?: boolean | null
          modeling_level?: string
          original_image_url?: string
          provider?: string | null
          quantity?: number | null
          user_id?: string
        }
        Relationships: []
      }
      thumbnail_prompts: {
        Row: {
          ai_model: string | null
          created_at: string
          id: string
          prompt: string
          user_id: string
          video_title: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          id?: string
          prompt: string
          user_id: string
          video_title: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          id?: string
          prompt?: string
          user_id?: string
          video_title?: string
        }
        Relationships: []
      }
      title_analyses: {
        Row: {
          ai_model: string
          analysis_result: Json
          created_at: string | null
          id: string
          raw_data: string
          user_id: string
          videos_count: number
        }
        Insert: {
          ai_model: string
          analysis_result: Json
          created_at?: string | null
          id?: string
          raw_data: string
          user_id: string
          videos_count: number
        }
        Update: {
          ai_model?: string
          analysis_result?: Json
          created_at?: string | null
          id?: string
          raw_data?: string
          user_id?: string
          videos_count?: number
        }
        Relationships: []
      }
      translations: {
        Row: {
          ai_model: string | null
          created_at: string
          id: string
          original_script: string
          target_languages: string[]
          translated_content: string
          translations: Json | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          id?: string
          original_script: string
          target_languages: string[]
          translated_content: string
          translations?: Json | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          id?: string
          original_script?: string
          target_languages?: string[]
          translated_content?: string
          translations?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          api_key_encrypted: string | null
          api_provider: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_current: boolean | null
          key_hash: string | null
          last_used_at: string | null
          priority: number | null
          quota_status: Json | null
          updated_at: string | null
          user_id: string
          vertex_config: Json | null
        }
        Insert: {
          api_key_encrypted?: string | null
          api_provider: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          key_hash?: string | null
          last_used_at?: string | null
          priority?: number | null
          quota_status?: Json | null
          updated_at?: string | null
          user_id: string
          vertex_config?: Json | null
        }
        Update: {
          api_key_encrypted?: string | null
          api_provider?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          key_hash?: string | null
          last_used_at?: string | null
          priority?: number | null
          quota_status?: Json | null
          updated_at?: string | null
          user_id?: string
          vertex_config?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_service_cookies: {
        Row: {
          created_at: string
          encrypted_cookie: string
          expires_at: string | null
          id: string
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_cookie: string
          expires_at?: string | null
          id?: string
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_cookie?: string
          expires_at?: string | null
          id?: string
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vertex_ai_keys: {
        Row: {
          api_key_encrypted: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          priority: number | null
          quota_status: Json | null
          updated_at: string | null
          user_id: string
          vertex_config: Json
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          priority?: number | null
          quota_status?: Json | null
          updated_at?: string | null
          user_id: string
          vertex_config: Json
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          priority?: number | null
          quota_status?: Json | null
          updated_at?: string | null
          user_id?: string
          vertex_config?: Json
        }
        Relationships: []
      }
      video_optimizations: {
        Row: {
          ai_model: string | null
          created_at: string
          id: string
          new_score: number | null
          optimized_data: Json | null
          optimized_description: string
          optimized_tags: string[]
          optimized_title: string
          original_data: Json | null
          original_description: string | null
          original_score: number | null
          original_tags: string[] | null
          original_title: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          id?: string
          new_score?: number | null
          optimized_data?: Json | null
          optimized_description: string
          optimized_tags: string[]
          optimized_title: string
          original_data?: Json | null
          original_description?: string | null
          original_score?: number | null
          original_tags?: string[] | null
          original_title?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          id?: string
          new_score?: number | null
          optimized_data?: Json | null
          optimized_description?: string
          optimized_tags?: string[]
          optimized_title?: string
          original_data?: Json | null
          original_description?: string | null
          original_score?: number | null
          original_tags?: string[] | null
          original_title?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      video_snapshots: {
        Row: {
          comment_count: number | null
          created_at: string
          id: string
          like_count: number | null
          monitor_id: string | null
          snapshot_at: string
          user_id: string
          video_id: string
          view_count: number
          vph: number
        }
        Insert: {
          comment_count?: number | null
          created_at?: string
          id?: string
          like_count?: number | null
          monitor_id?: string | null
          snapshot_at?: string
          user_id: string
          video_id: string
          view_count: number
          vph: number
        }
        Update: {
          comment_count?: number | null
          created_at?: string
          id?: string
          like_count?: number | null
          monitor_id?: string | null
          snapshot_at?: string
          user_id?: string
          video_id?: string
          view_count?: number
          vph?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_snapshots_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      viral_titles: {
        Row: {
          ai_model: string | null
          created_at: string | null
          generation_type: string
          id: string
          language: string
          theme: string
          titles: Json
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string | null
          generation_type: string
          id?: string
          language: string
          theme: string
          titles: Json
          user_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string | null
          generation_type?: string
          id?: string
          language?: string
          theme?: string
          titles?: Json
          user_id?: string
        }
        Relationships: []
      }
      webhook_rate_limits: {
        Row: {
          endpoint: string
          id: string
          identifier: string
          last_request_at: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          endpoint: string
          id?: string
          identifier: string
          last_request_at?: string
          request_count?: number | null
          window_start?: string
        }
        Update: {
          endpoint?: string
          id?: string
          identifier?: string
          last_request_at?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_webhook_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      decrypt_api_key: {
        Args: { p_encrypted: string; p_user_id: string }
        Returns: string
      }
      decrypt_service_cookie: {
        Args: { p_encrypted: string; p_user_id: string }
        Returns: string
      }
      encrypt_api_key: {
        Args: { p_key: string; p_user_id: string }
        Returns: string
      }
      encrypt_service_cookie: {
        Args: { p_cookie: string; p_user_id: string }
        Returns: string
      }
      get_active_api_key: {
        Args: { p_provider: string; p_user_id: string }
        Returns: string
      }
      get_and_update_next_key: {
        Args: { p_provider: string; p_user_id: string }
        Returns: {
          encrypted_key: string
          key_id: string
          key_number: number
          priority: number
          total_keys: number
        }[]
      }
      get_and_update_next_vertex_key: {
        Args: { p_user_id: string }
        Returns: {
          encrypted_key: string
          key_id: string
          key_number: number
          priority: number
          total_keys: number
          vertex_config: Json
        }[]
      }
      get_usage_stats_24h: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: string
          p_resource_id?: string
          p_resource_type: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "premium"
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
  public: {
    Enums: {
      app_role: ["admin", "user", "premium"],
    },
  },
} as const
