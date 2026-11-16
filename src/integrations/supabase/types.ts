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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_history: {
        Row: {
          actor_id: string | null
          after_values: Json | null
          before_values: Json | null
          changed_fields: string[]
          entity: string
          id: number
          occurred_at: string
          operation: string
          record_id: string
        }
        Insert: {
          actor_id?: string | null
          after_values?: Json | null
          before_values?: Json | null
          changed_fields?: string[]
          entity: string
          id?: never
          occurred_at?: string
          operation: string
          record_id: string
        }
        Update: {
          actor_id?: string | null
          after_values?: Json | null
          before_values?: Json | null
          changed_fields?: string[]
          entity?: string
          id?: never
          occurred_at?: string
          operation?: string
          record_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          config: Json
          created_at: string
          id: string
          singleton_key: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          singleton_key?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          singleton_key?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      backup_runs: {
        Row: {
          backup_settings_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_names: string[]
          id: string
          started_at: string
          status: string
          summary: Json
          updated_at: string
        }
        Insert: {
          backup_settings_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_names?: string[]
          id?: string
          started_at?: string
          status?: string
          summary?: Json
          updated_at?: string
        }
        Update: {
          backup_settings_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_names?: string[]
          id?: string
          started_at?: string
          status?: string
          summary?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_runs_backup_settings_id_fkey"
            columns: ["backup_settings_id"]
            isOneToOne: false
            referencedRelation: "backup_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_settings: {
        Row: {
          created_at: string
          created_by: string | null
          data_scope: string
          destination_details: Json
          destination_type: string
          enabled: boolean
          formats: string[]
          id: string
          schedule_cron: string
          singleton_key: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_scope?: string
          destination_details?: Json
          destination_type?: string
          enabled?: boolean
          formats?: string[]
          id?: string
          schedule_cron?: string
          singleton_key?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_scope?: string
          destination_details?: Json
          destination_type?: string
          enabled?: boolean
          formats?: string[]
          id?: string
          schedule_cron?: string
          singleton_key?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          cliente: string
          contacto: string
          created_at: string
          direccion: string
          email: string
          id: string
          notas: string
          source_key: string | null
          telefono: string
          user_id: string
        }
        Insert: {
          cliente: string
          contacto?: string
          created_at?: string
          direccion?: string
          email?: string
          id?: string
          notas?: string
          source_key?: string | null
          telefono?: string
          user_id?: string
        }
        Update: {
          cliente?: string
          contacto?: string
          created_at?: string
          direccion?: string
          email?: string
          id?: string
          notas?: string
          source_key?: string | null
          telefono?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_account_links: {
        Row: {
          binding_id: string
          created_at: string
          destination_user_id: string
          enabled: boolean
          id: string
          user_id: string
        }
        Insert: {
          binding_id: string
          created_at?: string
          destination_user_id: string
          enabled?: boolean
          id?: string
          user_id: string
        }
        Update: {
          binding_id?: string
          created_at?: string
          destination_user_id?: string
          enabled?: boolean
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      repair_delete_attempts: {
        Row: {
          attempts: number
          user_id: string
          window_started_at: string
        }
        Insert: {
          attempts?: number
          user_id: string
          window_started_at?: string
        }
        Update: {
          attempts?: number
          user_id?: string
          window_started_at?: string
        }
        Relationships: []
      }
      repair_payments: {
        Row: {
          amount: number
          client_name: string
          client_phone: string | null
          created_at: string
          equipment: string
          id: string
          is_test: boolean
          method: string
          paid_on: string
          remote_movement_id: string | null
          repair_id: string
          sync_error: string | null
          sync_status: string
          synced_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          client_name: string
          client_phone?: string | null
          created_at?: string
          equipment: string
          id: string
          is_test?: boolean
          method: string
          paid_on: string
          remote_movement_id?: string | null
          repair_id: string
          sync_error?: string | null
          sync_status?: string
          synced_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          client_name?: string
          client_phone?: string | null
          created_at?: string
          equipment?: string
          id?: string
          is_test?: boolean
          method?: string
          paid_on?: string
          remote_movement_id?: string | null
          repair_id?: string
          sync_error?: string | null
          sync_status?: string
          synced_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      repairs: {
        Row: {
          accesorios: string
          cliente: string
          color: string
          consola: string
          costo_componente: number | null
          costo_diagnostico: number | null
          costo_reparacion: number | null
          created_at: string
          detalles: string
          email: string
          estado: string
          fecha: string
          historial: Json
          id: string
          imagenes: Json
          marca: string
          numero_serie: string
          problemas: string[]
          telefono: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accesorios?: string
          cliente?: string
          color?: string
          consola?: string
          costo_componente?: number | null
          costo_diagnostico?: number | null
          costo_reparacion?: number | null
          created_at?: string
          detalles?: string
          email?: string
          estado?: string
          fecha?: string
          historial?: Json
          id: string
          imagenes?: Json
          marca?: string
          numero_serie?: string
          problemas?: string[]
          telefono?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accesorios?: string
          cliente?: string
          color?: string
          consola?: string
          costo_componente?: number | null
          costo_diagnostico?: number | null
          costo_reparacion?: number | null
          created_at?: string
          detalles?: string
          email?: string
          estado?: string
          fecha?: string
          historial?: Json
          id?: string
          imagenes?: Json
          marca?: string
          numero_serie?: string
          problemas?: string[]
          telefono?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tech_repair_client_links: {
        Row: {
          code_hash: string | null
          created_at: string
          enabled: boolean
          expires_at: string | null
          id: string
          target_email: string
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          code_hash?: string | null
          created_at?: string
          enabled?: boolean
          expires_at?: string | null
          id?: string
          target_email?: string
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string | null
          created_at?: string
          enabled?: boolean
          expires_at?: string | null
          id?: string
          target_email?: string
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_repair_delete_attempt: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      delete_repairs_verified: {
        Args: { p_ids: string[]; p_user_id: string }
        Returns: string[]
      }
      disconnect_tech_client_link: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      prepare_tech_client_link: {
        Args: { p_hash: string; p_user: string }
        Returns: undefined
      }
      record_finance_test_payment: {
        Args: { p_confirm: boolean; p_paid_on: string }
        Returns: Json
      }
      record_repair_payment: {
        Args: {
          p_amount: number
          p_id: string
          p_method: string
          p_paid_on: string
          p_repair_id: string
        }
        Returns: Json
      }
      redeem_tech_client_link: {
        Args: { p_email: string; p_hash: string; p_target: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "tecnico"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "tecnico"],
    },
  },
} as const
