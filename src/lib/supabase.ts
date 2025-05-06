
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
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
