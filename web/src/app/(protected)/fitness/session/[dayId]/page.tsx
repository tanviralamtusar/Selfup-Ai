import React from 'react';
import { createServerClient } from '@/lib/supabase-server-user';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SessionView } from '@/components/fitness/SessionView';

export const dynamic = 'force-dynamic';

export default async function FitnessSessionPage({ params }: { params: { dayId: string } }) {
  const { dayId } = await params;
  const supabase = await createServerClient();
  
  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession) redirect('/login');

  const userId = authSession.user.id;

  // 1. Fetch Workout Day and Exercises
  const { data: workoutDay, error: dayError } = await supabase
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

  if (dayError || !workoutDay) {
    return (
      <div className="p-8 text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Workout Day Not Found</h1>
        <p className="text-gray-400">Unable to load the requested workout session.</p>
      </div>
    );
  }

  // 2. Fetch or Create Session Log (simulate via a server-side API call or direct DB logic here)
  // For simplicity, we query the latest session log for this day, or pass empty sets if new
  const today = new Date().toISOString().split('T')[0];
  const { data: sessionLog } = await supabase
    .from('workout_session_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('workout_day_id', workoutDay.id)
    .eq('logged_date', today)
    .maybeSingle();

  // If no session log exists, we'd normally create one. The SessionView component
  // will just use a temporary ID or call the API on mount to initialize if needed.
  // For this page, we assume the user clicked "Start Session" which already created the log.

  if (!sessionLog) {
    return (
      <div className="p-8 text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Session Not Initialized</h1>
        <p className="text-gray-400">Please start the session from your fitness dashboard.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-dark-bg text-white">
      <SessionView 
        sessionId={sessionLog.id}
        workoutDay={workoutDay as any}
        initialSetsDone={sessionLog.sets_done || {}}
        onClose={() => {
           // This requires client-side navigation in real app, handled differently
           // For a server component wrapper, the onClose prop in SessionView should use next/navigation router.back()
        }}
        onComplete={() => {}}
      />
    </div>
  );
}
