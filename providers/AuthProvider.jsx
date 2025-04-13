'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation'; 

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true, 
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); 

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      setSession(null); 
      setUser(null);
      router.push('/login'); 
    }
    setLoading(false); 
  };

  useEffect(() => {
    setLoading(true); 

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); 

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("Auth State Change Detected:", _event, session);
        setSession(session);
        setUser(session?.user ?? null);
      
      });

      return () => {
        subscription?.unsubscribe();
      };
    }).catch(error => {
        console.error("Error getting initial session:", error);
        setLoading(false);
    });

  }, []); 


  useEffect(() => {

    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!session && !isAuthPage) {
      router.push('/login');
    }
    else if (session && isAuthPage) {
      router.push('/'); 
    }

  }, [session, loading, pathname, router]); 

  const value = {
    session,
    user,
    loading,
    signOut, 
  };

  if (loading) {
     return null;
  }


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};