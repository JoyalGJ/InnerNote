// components/AuthForm.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from "@/lib/utils"; 

export function AuthForm({ formType, onSubmit, isLoading, hasError, clearError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (hasError && clearError) {
      clearError(); 
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
     if (hasError && clearError) {
       clearError(); 
     }
  };


  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ email, password });
  };

  const inputErrorClasses = hasError
    ? "border-red-500 focus-visible:ring-red-500"
    : "";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 p-4">
      <Card className={cn("w-full max-w-sm", hasError ? "animate-shake" : "")}> 
        <CardHeader>
          <CardTitle className="text-2xl">
            {formType === 'login' ? 'Login to InnerNote' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {formType === 'login'
              ? 'Enter your email below to login to your account.'
              : 'Enter your email and password to sign up.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={handleEmailChange} 
                disabled={isLoading}
                className={cn(inputErrorClasses)} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
                className={cn(inputErrorClasses)} 
              />
            </div>
            <div className="grid gap-2">
            <Button type="submit" className="w-full gap" disabled={isLoading}>
              {isLoading
                ? 'Processing...'
                : formType === 'login'
                ? 'Sign in'
                : 'Sign up'}
            </Button>
            </div>
            </CardContent>
        </form>
         <CardFooter className="flex justify-center text-sm pt-4">
           {formType === 'login' ? (
             <p>
               Don't have an account?{' '}
               <a href="/signup" className="underline text-blue-600 hover:text-blue-800">
                 Sign up
               </a>
             </p>
           ) : (
             <p>
               Already have an account?{' '}
               <a href="/login" className="underline text-blue-600 hover:text-blue-800">
                 Sign in
               </a>
             </p>
           )}
         </CardFooter>
      </Card>
    </div>
  );
}
