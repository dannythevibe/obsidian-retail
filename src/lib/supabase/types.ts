export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      merchants: {
        Row: {
          id: string;
          user_id: string;
          handle: string;
          store_name: string;
          phone: string | null;
          custom_domain: string | null;
          logo_url: string | null;
          banner_url: string | null;
          description: string | null;
          is_live: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          handle: string;
          store_name: string;
          phone?: string | null;
          custom_domain?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          description?: string | null;
          is_live?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          handle?: string;
          store_name?: string;
          phone?: string | null;
          custom_domain?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          description?: string | null;
          is_live?: boolean;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          merchant_id: string;
          name: string;
          description: string | null;
          price: number;
          sale_price: number | null;
          category: string | null;
          image_url: string | null;
          in_stock: boolean;
          is_best_seller: boolean;
          source: string;
          ai_confidence: number | null;
          sales_count: number;
          position: number;
          approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          name: string;
          description?: string | null;
          price: number;
          sale_price?: number | null;
          category?: string | null;
          image_url?: string | null;
          in_stock?: boolean;
          is_best_seller?: boolean;
          source?: string;
          ai_confidence?: number | null;
          sales_count?: number;
          position?: number;
          approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          sale_price?: number | null;
          category?: string | null;
          image_url?: string | null;
          in_stock?: boolean;
          is_best_seller?: boolean;
          source?: string;
          ai_confidence?: number | null;
          sales_count?: number;
          position?: number;
          approved?: boolean;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          body: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          body: string;
          source?: string;
          created_at?: string;
        };
        Update: {
          body?: string;
          source?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          merchant_id: string;
          product_id: string | null;
          reference: string;
          customer_name: string | null;
          customer_phone: string | null;
          customer_email: string | null;
          amount: number;
          status: "pending" | "paid" | "fulfilled" | "cancelled";
          payaza_account_no: string | null;
          payaza_bank_name: string | null;
          payaza_account_ref: string | null;
          expires_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          product_id?: string | null;
          reference: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          amount: number;
          status?: "pending" | "paid" | "fulfilled" | "cancelled";
          payaza_account_no?: string | null;
          payaza_bank_name?: string | null;
          payaza_account_ref?: string | null;
          expires_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          product_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          amount?: number;
          status?: "pending" | "paid" | "fulfilled" | "cancelled";
          payaza_account_no?: string | null;
          payaza_bank_name?: string | null;
          payaza_account_ref?: string | null;
          expires_at?: string | null;
          paid_at?: string | null;
          updated_at?: string;
        };
      };
      payaza_transactions: {
        Row: {
          id: string;
          order_id: string | null;
          merchant_id: string;
          payaza_ref: string;
          amount: number;
          status: string;
          raw_payload: Json;
          processed_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          merchant_id: string;
          payaza_ref: string;
          amount: number;
          status: string;
          raw_payload: Json;
          processed_at?: string;
        };
        Update: {
          status?: string;
          raw_payload?: Json;
        };
      };
      ingestion_jobs: {
        Row: {
          id: string;
          merchant_id: string;
          source: "instagram" | "whatsapp" | "upload";
          source_url: string | null;
          status: "processing" | "done" | "failed";
          total: number;
          processed: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          source: "instagram" | "whatsapp" | "upload";
          source_url?: string | null;
          status?: "processing" | "done" | "failed";
          total?: number;
          processed?: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: "processing" | "done" | "failed";
          total?: number;
          processed?: number;
          completed_at?: string | null;
        };
      };
    };
  };
}

// Convenience types
export type Merchant = Database["public"]["Tables"]["merchants"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type PayazaTransaction = Database["public"]["Tables"]["payaza_transactions"]["Row"];
export type IngestionJob = Database["public"]["Tables"]["ingestion_jobs"]["Row"];

export interface ParsedProduct {
  name: string;
  price: number;
  sale_price?: number;
  category: string;
  description: string;
  in_stock: boolean;
  variants?: string[];
  reviews?: string[];
  image_url?: string;
  ai_confidence: number;
  source: "instagram" | "whatsapp" | "upload";
}
