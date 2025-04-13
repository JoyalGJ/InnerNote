'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { DiaryEntryCard } from '@/components/DiaryEntryCard';
import { ChatInterface } from '@/components/ChatInterface';
import { supabase } from '@/lib/supabaseClient';

const DIARY_TABLE = 'diary_summaries';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [isChatting, setIsChatting] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setIsLoadingEntries(false);
      setDiaryEntries([]);
      return;
    };

    setIsLoadingEntries(true);
    setError('');
    console.log("[DashboardPage] Fetching entries directly from Supabase for user:", user.id);

    try {
      const { data, error: fetchError } = await supabase
        .from(DIARY_TABLE)
        .select('id, summary, timestamp, mood')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (fetchError) throw fetchError;

      setDiaryEntries(data || []); 
      console.log("[DashboardPage] Entries fetched directly:", (data || []).length);

    } catch (fetchError) {
      console.error("[DashboardPage] Error fetching entries:", fetchError);
      setError(`Could not load entries: ${fetchError.message}`);
      setDiaryEntries([]);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [user]);


  useEffect(() => {
    if (!authLoading && user) {
      fetchEntries();
    } else if (!authLoading && !user) {
      setIsLoadingEntries(false);
      setDiaryEntries([]);
    }
  }, [user, authLoading, fetchEntries]);


  const handleStartChat = () => {
    setIsChatting(true);
    setError('');
  };

  const handleChatComplete = async ({ summary, mood }) => {
    if (!user) {
      setError("Cannot save entry. User not found.");
      setIsChatting(false);
      return;
    }

    const finalMood = (typeof mood === 'string' && mood.trim()) ? mood.trim() : 'Neutral'; 

    console.log(`[DashboardPage] Chat Complete! Summary: ${summary}, Mood: ${finalMood}`);
    setIsSaving(true);
    setError('');

    try {
      console.log(`[DashboardPage] Saving entry directly to Supabase for user ${user.id}...`);

      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayStart.getDate() + 1);

      const { data: existing, error: selectError } = await supabase
        .from(DIARY_TABLE)
        .select('id')
        .eq('user_id', user.id)
        .gte('timestamp', todayStart.toISOString())
        .lt('timestamp', todayEnd.toISOString())
        .maybeSingle();

      if (selectError) throw selectError;

      let savedEntry;
      if (existing) {
        console.log(`[DashboardPage] Updating existing entry ID: ${existing.id}`);
        const { data: updatedData, error: updateError } = await supabase
          .from(DIARY_TABLE)
          .update({
            summary: summary,
            mood: finalMood, 
            timestamp: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select('id, summary, timestamp, mood') 
          .single();
        if (updateError) throw updateError;
        savedEntry = updatedData;
        console.log("[DashboardPage] Entry updated directly.");
      } else {
        console.log(`[DashboardPage] Inserting new entry for user ${user.id}`);
        const { data: insertedData, error: insertError } = await supabase
          .from(DIARY_TABLE)
          .insert({
            user_id: user.id,
            summary: summary,
            mood: finalMood 
          })
          .select('id, summary, timestamp, mood') 
          .single();
        if (insertError) throw insertError;
        savedEntry = insertedData;
        console.log("[DashboardPage] Entry inserted directly.");
      }
      await fetchEntries();

    } catch (saveError) {
      console.error("[DashboardPage] Error saving entry directly:", saveError);
      setError(`Failed to save entry: ${saveError.message}`);
    } finally {
      setIsSaving(false);
      setIsChatting(false);
    }
  };

  const handleChatCancel = () => {
    console.log('[DashboardPage] Chat Cancelled');
    setIsChatting(false);
    setError('');
  };
   if (authLoading) {
       return <div className="flex justify-center items-center pt-20">Authenticating...</div>;
   }
   const showLoadingIndicator = isLoadingEntries && !isChatting;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ready to reflect on your day?
      </p>
      {isSaving && (
         <div className="mb-4 text-center text-blue-600 dark:text-blue-400">Saving your entry...</div>
      )}
      {error && (
         <div className="mb-4 text-center text-red-600 dark:text-red-400">{error}</div>
      )}
      {isChatting ? (
          <ChatInterface
            onComplete={handleChatComplete}
            onCancel={handleChatCancel}
           />
      ) : (
          <div className="mb-8">
              <Button size="lg" onClick={handleStartChat} disabled={isSaving || isLoadingEntries}>
                 {isSaving ? 'Saving...' : (isLoadingEntries ? 'Loading...' : "Write Today's Entry")}
              </Button>
          </div>
      )}
      <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-gray-700 dark:text-gray-200">
          Your Past Entries
      </h2>
       {showLoadingIndicator && (
           <div className="text-center text-gray-500 dark:text-gray-400 py-4">Loading entries...</div>
       )}


      {!showLoadingIndicator && diaryEntries.length > 0 ? (
        <div>
  
          {diaryEntries.map((entry) => (
            <DiaryEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
         !showLoadingIndicator && !isChatting && !authLoading && user && (
            <p className="text-gray-500 dark:text-gray-400">
                You haven't written any diary entries yet. Start by telling InnerNote about your day!
            </p>
         )
      )}
    </div>
  );
}
