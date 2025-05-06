
import { createClient } from "@supabase/supabase-js";

// Use the values from our Supabase integration
const supabaseUrl = "https://xcemvfoydpuzbdqxajnj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZW12Zm95ZHB1emJkcXhham5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTE5MTcsImV4cCI6MjA2MjA2NzkxN30.sUQpILOFoOp-NqbR_ZuMNzeggGrQL7HGIaxntaIMjLg";

// Initialize the Supabase client with auth configuration for consistent behavior
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

export type User = {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  settings?: Record<string, any>;
};

export type Conversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  pinned?: boolean;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type Database = {
  users: User;
  conversations: Conversation;
  messages: Message;
};
