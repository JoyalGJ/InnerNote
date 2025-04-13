// components/DiaryEntryCard.jsx
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from 'date-fns'; 

const getMoodEmoji = (mood) => {
    const lowerMood = mood?.toLowerCase() || 'neutral';
    if (lowerMood.includes('happy') || lowerMood.includes('joyful') || lowerMood.includes('excited')) return '😊';
    if (lowerMood.includes('sad') || lowerMood.includes('down') || lowerMood.includes('depressed')) return '😢';
    if (lowerMood.includes('angry') || lowerMood.includes('frustrated')) return '😠';
    if (lowerMood.includes('anxious') || lowerMood.includes('worried')) return '😟';
    if (lowerMood.includes('calm') || lowerMood.includes('relaxed') || lowerMood.includes('peaceful')) return '😌';
    if (lowerMood.includes('surprised')) return '😮';
    if (lowerMood.includes('tired') || lowerMood.includes('exhausted')) return '😴';
    return '😐'; 
};


export function DiaryEntryCard({ entry }) {
  if (!entry) return null;

  const displayDate = entry.timestamp
    ? format(new Date(entry.timestamp), 'MMMM d, yyyy')
    : 'No Date';
  const moodEmoji = getMoodEmoji(entry.mood || 'neutral'); 

  return (
    <Card className="mb-4 break-inside-avoid"> 
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
           <CardTitle className="text-lg font-semibold">{displayDate}</CardTitle>
           <span className="text-2xl" title={`Mood: ${entry.mood || 'Neutral'}`}>{moodEmoji}</span> {/* Add title for accessibility */}
        </div>
        <CardDescription>{entry.timestamp ? format(new Date(entry.timestamp), 'p') : ''}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.summary || 'No summary available.'}</p>
      </CardContent>
    </Card>
  );
}

