'use client';

import React from 'react';
import { Poll } from '@/types/database';
import { CheckCircle2, Circle } from 'lucide-react';

interface PollCardProps {
  poll: Poll;
  currentUserId: string;
  onVote: (pollId: string, optionId: string) => void;
}

export function PollCard({ poll, currentUserId, onVote }: PollCardProps) {
  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.vote_count || 0), 0);

  return (
    <div className="w-full min-w-[260px] max-w-sm bg-white dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700 select-none">
      <div className="mb-2">
        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-snug">
          {poll.question}
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          {poll.is_multiple_choice ? 'Select one or more options' : 'Select one option'}
        </p>
      </div>

      <div className="space-y-2 my-3">
        {poll.options.map((option) => {
          const votes = option.vote_count || 0;
          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const hasVoted = option.has_voted;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onVote(poll.id, option.id)}
              className="w-full text-left relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 transition-all hover:border-emerald-500 group"
            >
              {/* Progress background bar */}
              <div
                className="absolute inset-0 bg-emerald-100/70 dark:bg-emerald-950/40 transition-all duration-500 pointer-events-none"
                style={{ width: `${percentage}%` }}
              />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                  {hasVoted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-emerald-500" />
                  )}
                  <span className="font-medium text-xs sm:text-sm">{option.option_text}</span>
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-2">
                  {percentage}%
                </div>
              </div>

              <div className="relative z-10 text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-6 flex items-center justify-between">
                <span>{votes} {votes === 1 ? 'vote' : 'votes'}</span>
                {(option as any).voters && (option as any).voters.length > 0 && (
                  <span className="truncate max-w-[150px] text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {(option as any).voters.join(', ')}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-right text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
        {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
      </div>
    </div>
  );
}
