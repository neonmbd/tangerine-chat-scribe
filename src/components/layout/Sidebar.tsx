
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase, User, Conversation } from "@/lib/supabase";
import { Calendar, LogOut, MessageSquare, Plus, Search, Settings, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConversationItem from "../chat/ConversationItem";
import { formatDistanceToNow } from "date-fns";

type SidebarProps = {
  user: User | null;
  onSignOut: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ user, onSignOut }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error fetching conversations",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToConversations = () => {
    if (!user) return;

    const subscription = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const createNewConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert([
          {
            user_id: user.id,
            title: "New Conversation",
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error creating conversation",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by date
  const groupedConversations = filteredConversations.reduce<
    Record<string, Conversation[]>
  >((groups, conversation) => {
    const date = new Date(conversation.updated_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(conversation);
    return groups;
  }, {});

  return (
    <div className="flex flex-col w-[280px] h-full bg-[hsl(var(--sidebar))] text-foreground border-r border-[hsl(var(--sidebar-border))]">
      <div className="p-4">
        <Button
          onClick={createNewConversation}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Plus size={16} />
          New Chat
        </Button>
      </div>

      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            className="pl-8 bg-[hsl(var(--sidebar-accent))]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-[hsl(var(--sidebar-accent))] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {Object.entries(groupedConversations).map(([date, convos]) => (
              <div key={date} className="mb-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-2">
                  {formatDistanceToNow(new Date(date), { addSuffix: true })}
                </h3>
                <div className="space-y-1">
                  {convos.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === conversationId}
                    />
                  ))}
                </div>
              </div>
            ))}
            {filteredConversations.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery
                  ? "No conversations found"
                  : "No conversations yet. Start a new chat!"}
              </div>
            )}
          </>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[hsl(var(--sidebar-accent))] flex items-center justify-center">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user?.name || "User"}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium truncate max-w-[160px]">
                {user?.name || user?.email?.split("@")[0] || "User"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() => navigate("/settings")}
          >
            <UserIcon className="h-4 w-4 mr-2" />
            <span className="text-xs">Profile</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="justify-start text-destructive hover:text-destructive" 
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
