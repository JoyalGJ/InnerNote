'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { supabase } from '../../../lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); 

  const handleSignup = async ({ email, password }) => {
    setIsLoading(true);
    setError('');
    setMessage('');
    console.log('Attempting Supabase signup with:', email);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      console.log('Supabase signup successful:', data);
       if (data.user && !data.session) {
         setMessage('Signup successful! Please check your email to confirm your account.');        
       } else if (data.user && data.session) {
           setMessage('Signup successful! Redirecting...');
           router.push('/'); 
           router.refresh(); 
       } else {
            setMessage('Signup process initiated. Please follow any instructions sent to your email.');
       }


    } catch (signUpError) {
      console.error('Supabase signup error:', signUpError);
      setError(signUpError.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthForm
        formType="signup"
        onSubmit={handleSignup}
        isLoading={isLoading}
      />
       {message && (
         <p className="text-center text-sm font-medium text-green-600 dark:text-green-400 mt-3">
           {message}
         </p>
       )}
      {error && (
         <p className="text-center text-sm font-medium text-red-600 dark:text-red-400 mt-3">
           {error}
         </p>
      )}
    </>
  );
}