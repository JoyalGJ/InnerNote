// components/Navbar.jsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '../providers/AuthProvider'; 

export function Navbar() {
  const { user, signOut, loading } = useAuth(); 
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              InnerNote
            </Link>
            <span className="ml-2 text-sm font-semibold text-gray-500 dark:text-gray-400">AI Diary</span>
          </div>
          <div className="flex items-center">
            {!loading && user && ( 
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}