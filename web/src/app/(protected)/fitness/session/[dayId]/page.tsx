'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { SessionView } from '@/components/fitness/SessionView';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function FitnessSessionPage({ params }: { params: Promise<{ dayId: string }> }) {
  const resolvedParams = use(params);
  const dayId = resolvedParams.dayId;
  
  const router = useRouter();
  const { session, user } = useAuthStore();
  
  const [workoutDay, setWorkoutDay] = useState<any>(null);
  const [sessionLog, setSessionLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initSession() {
      if (!session || !user) return;

      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Workout Day Details
        const { data: dayData, error: dayError } = await supabase
          .from('workout_days')
          .select(`
            *,
            workout_day_exercises (
              *,
              exercises (*)
            )
          `)
          .eq('id', dayId)
          .single();

        if (dayError || !dayData) {
          throw new Error('Workout protocol not found.');
        }

        setWorkoutDay(dayData);

        // 2. Initialize or Get Session via API
        const res = await fetch('/api/fitness/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            workout_day_id: dayId,
            plan_id: dayData.plan_id
          })
        });

        const sessionResult = await res.json();
        
        if (!res.ok) {
          throw new Error(sessionResult.error || 'Failed to initialize session.');
        }

        setSessionLog(sessionResult.data);
      } catch (err: any) {
        console.error('[SessionPage Error]', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [dayId, session, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-primary/60 text-xs ">Synchronizing Protocol...</p>
      </div>
    );
  }

  if (error || !workoutDay || !sessionLog) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500/50 mb-4" />
        <h1 className="text-xl  text-primary-foreground tracking-tighter mb-2">Protocol Error</h1>
        <p className="text-muted-foreground text-sm text-center max-w-md mb-8">{error || 'Unable to load workout session.'}</p>
        <button 
          onClick={() => router.back()}
          className="px-6 py-2 bg-primary/10 border border-border text-primary text-xs  rounded-lg hover:bg-primary/15 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background text-primary-foreground">
      <SessionView 
        sessionId={sessionLog.id}
        workoutDay={workoutDay}
        initialSetsDone={sessionLog.sets_done || {}}
        onClose={() => router.back()}
        onComplete={() => router.push('/fitness')}
      />
    </div>
  );
}
