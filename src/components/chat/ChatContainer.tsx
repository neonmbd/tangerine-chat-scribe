
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, User, Message, Conversation } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ArrowLeft, Save, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatContainerProps {
  user: User | null;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ user }) => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (conversationId && user) {
      fetchConversation();
      fetchMessages();
      subscribeToMessages();
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    if (!conversationId || !user) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setConversation(data);
      setTitle(data.title);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast({
        title: "Error fetching conversation",
        description: "Please try again later.",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error fetching messages",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const subscription = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const handleSendMessage = async (content: string) => {
    if (!conversationId || !user || !content.trim()) return;

    try {
      setIsSending(true);

      // Insert user message
      const { error: insertError } = await supabase.from("messages").insert([
        {
          conversation_id: conversationId,
          role: "user",
          content,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      // If this is first message, update title
      if (messages.length === 0 || conversation?.title === "New Conversation") {
        const newTitle = content.length > 30 
          ? content.substring(0, 30) + "..." 
          : content;
        
        await supabase
          .from("conversations")
          .update({ title: newTitle })
          .eq("id", conversationId);
        
        setTitle(newTitle);
        setConversation(prev => prev ? {...prev, title: newTitle} : null);
      }

      // Send to AI endpoint
      const aiResponse = await fetch("https://7dzvr1i5.rpcl.app/webhook/mandaleen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          conversationId,
          userId: user.id,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error("Failed to get AI response");
      }

      const aiData = await aiResponse.json();

      // Insert AI response
      const { error: assistantError } = await supabase.from("messages").insert([
        {
          conversation_id: conversationId,
          role: "assistant",
          content: aiData.response || "I'm sorry, I couldn't process that request.",
          created_at: new Date().toISOString(),
        },
      ]);

      if (assistantError) throw assistantError;

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "Please try again later.",
        variant: "destructive",
      });

      // Insert error message from assistant
      await supabase.from("messages").insert([
        {
          conversation_id: conversationId,
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again later.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const updateConversationTitle = async () => {
    if (!conversationId || !title.trim()) return;

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ title })
        .eq("id", conversationId);

      if (error) throw error;
      setEditTitle(false);
      setConversation(prev => prev ? {...prev, title} : null);
    } catch (error) {
      console.error("Error updating title:", error);
      toast({
        title: "Error updating title",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const deleteConversation = async () => {
    if (!conversationId || !window.confirm("Are you sure you want to delete this conversation?")) 
      return;

    try {
      // Delete all messages first (cascade doesn't work with Supabase)
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId);

      if (messagesError) throw messagesError;

      // Then delete the conversation
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      toast({
        title: "Conversation deleted",
        description: "Your conversation has been deleted successfully.",
      });

      navigate("/");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error deleting conversation",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-medium mb-4">Select a conversation</h2>
        <p className="text-muted-foreground mb-6">
          Choose an existing conversation or start a new one.
        </p>
        <Button onClick={() => navigate("/")}>New Conversation</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Chat header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {editTitle ? (
            <div className="flex items-center">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border rounded px-2 py-1 text-sm font-medium"
                autoFocus
                onBlur={updateConversationTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateConversationTitle();
                  if (e.key === "Escape") {
                    setEditTitle(false);
                    setTitle(conversation?.title || "");
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={updateConversationTitle}
                className="ml-1"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h2
              className="text-lg font-medium cursor-pointer hover:text-accent transition-colors"
              onClick={() => setEditTitle(true)}
            >
              {isLoading ? (
                <Skeleton className="h-6 w-[200px]" />
              ) : (
                conversation?.title || "Chat"
              )}
            </h2>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={deleteConversation}
          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4 max-w-3xl mx-auto">
            <Skeleton className="h-20 w-4/5 rounded-2xl" />
            <Skeleton className="h-14 w-3/5 ml-auto rounded-2xl" />
            <Skeleton className="h-28 w-4/5 rounded-2xl" />
            <Skeleton className="h-16 w-4/5 ml-auto rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto pb-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start a conversation by sending a message below.
                </p>
              </div>
            ) : (
              <MessageList messages={messages} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message input */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <MessageInput onSendMessage={handleSendMessage} isLoading={isSending} />
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
