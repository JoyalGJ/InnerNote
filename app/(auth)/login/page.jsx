'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); 

  const handleLogin = async ({ email, password }) => {
    setIsLoading(true);
    setError(''); 
    console.log('[LoginPage] Attempting Supabase login with:', email);
    console.log('[LoginPage] Imported supabase object:', supabase);

    try {
      if (!supabase) {
        throw new Error("Supabase client is not available.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      console.log('[LoginPage] Supabase login successful');
      router.push('/');
      router.refresh();

    } catch (signInError) {
      console.error('[LoginPage] Supabase login error:', signInError);
      setError(signInError.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearErrorHandler = () => {
      setError('');
  };

  return (
    <>
      <AuthForm
        formType="login"
        onSubmit={handleLogin}
        isLoading={isLoading}
        hasError={!!error} 
        clearError={clearErrorHandler} 
      />
      {error && (
         <p className="text-center text-sm font-medium text-red-600 dark:text-red-400 -mt-4 mb-4 px-4 relative z-10">
             {error} 
         </p>
      )}
    </>
  );
}