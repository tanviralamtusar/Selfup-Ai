'use client';

// ═══════════════════════════════════════════════════════════
// Rest countdown timer (workout-cool port, phase 3)
// Adapts workout-cool's bottom-pill session timer into an
// auto-starting rest countdown that fires after each logged set.
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Plus, X, Timer as TimerIcon } from 'lucide-react';

interface RestTimerProps {
  // The rest duration to count down from; changing this (re)starts the timer.
  seconds: number;
  // A key that changes each time a set is logged, to re-trigger the countdown.
  triggerKey: number;
  onDone?: () => void;
}

export function RestTimer({ seconds, triggerKey, onDone }: RestTimerProps) {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [visible, setVisible] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // (Re)start countdown whenever a new set is logged.
  useEffect(() => {
    if (triggerKey === 0) return; // no set logged yet
    setRemaining(seconds);
    setRunning(true);
    setVisible(true);
  }, [triggerKey, seconds]);

  // Tick.
  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          doneRef.current?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  const format = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const pct = seconds > 0 ? (remaining / seconds) * 100 : 0;
  const isDone = remaining <= 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]"
        >
          <div className="relative flex items-center gap-3 bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-full pl-5 pr-3 py-2.5 shadow-2xl">
            {/* progress ring background bar */}
            <div className="absolute left-0 bottom-0 h-0.5 bg-blue-500/70 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />

            <TimerIcon size={16} className={isDone ? 'text-emerald-400' : 'text-blue-400'} />
            <span className={`font-mono text-lg font-bold tabular-nums ${isDone ? 'text-emerald-400' : 'text-white'}`}>
              {isDone ? 'REST DONE' : format(remaining)}
            </span>

            {!isDone && (
              <>
                <button
                  onClick={() => setRunning((r) => !r)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                  title={running ? 'Pause' : 'Resume'}
                >
                  {running ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={() => setRemaining((r) => r + 15)}
                  className="h-8 px-2.5 rounded-full flex items-center gap-0.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-xs font-semibold"
                  title="Add 15 seconds"
                >
                  <Plus size={12} />
                  15s
                </button>
              </>
            )}

            <button
              onClick={() => {
                setRunning(false);
                setVisible(false);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
