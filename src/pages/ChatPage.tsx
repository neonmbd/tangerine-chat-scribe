
import React, { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { supabase, User } from '@/lib/supabase';
import ChatContainer from '@/components/chat/ChatContainer';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/layout/Sidebar';

const ChatPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { conversationId } = useParams<{ conversationId: string }>();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user as unknown as User | null);
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
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user as unknown as User || null);
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

  if (!conversationId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - visible on desktop, hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar user={user} onSignOut={handleSignOut} />
      </div>
      
      {/* Chat container */}
      <div className="flex-1">
        <ChatContainer user={user} />
      </div>
    </div>
  );
};

export default ChatPage;
