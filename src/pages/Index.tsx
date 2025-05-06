
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase, User } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Get user profile from our users table
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 is "No rows returned" - this might happen on first login before profile creation
            console.error('Error fetching user profile:', profileError);
          }

          setUser({
            id: user.id,
            email: user.email,
            name: profileData?.name || user.email?.split('@')[0] || 'User',
            avatar_url: profileData?.avatar_url,
            settings: profileData?.settings
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast({
          title: 'Authentication error',
          description: 'Failed to fetch user information.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            // Get user profile from our users table after signin
            const { data: profileData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: profileData?.name || session.user.email?.split('@')[0] || 'User',
              avatar_url: profileData?.avatar_url,
              settings: profileData?.settings
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const createNewConversation = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a conversation.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Creating conversation for user:", user.id);
      
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

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from insert");
      }

      console.log("Created conversation:", data);
      navigate(`/chat/${data.id}`);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error creating conversation",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar user={user} onSignOut={handleSignOut} />
      
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md text-center px-4">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Mandaleen AI Chat</h1>
          <p className="text-muted-foreground mb-6">
            Start a new conversation or select an existing one from the sidebar
          </p>
          <Button 
            onClick={createNewConversation}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus size={18} />
            New Conversation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
