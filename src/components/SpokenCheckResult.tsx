import React from 'react';
import { CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { SpokenCheck } from '../utils/speechCheck';

interface SpokenCheckResultProps {
  target: string;
  check: SpokenCheck | null;
  error: string | null;
}

// Shows what the browser heard and whether it matches, or why listening
// failed. Deliberately no percentage score: speech recognition can tell if
// the word was understood, not how good the accent is.
export const SpokenCheckResult: React.FC<SpokenCheckResultProps> = ({ target, check, error }) => {
  if (error) {
    return (
      <div role="alert" className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-left flex gap-2.5 animate-in fade-in">
        <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
        <p className="text-xs text-rose-900 leading-relaxed font-medium">{error}</p>
      </div>
    );
  }
  if (!check) return null;

  const styles = {
    match: { box: 'bg-emerald-50 border-emerald-200/80', icon: 'text-emerald-600', title: 'That matches' },
    partial: { box: 'bg-amber-50 border-amber-200/80', icon: 'text-amber-600', title: 'Nearly there' },
    different: { box: 'bg-stone-50 border-stone-200', icon: 'text-stone-500', title: 'Try again' },
  }[check.verdict];

  return (
    <div role="status" className={`p-3.5 border rounded-2xl text-left space-y-2 animate-in fade-in ${styles.box}`}>
      <div className="flex items-center gap-2">
        {check.verdict === 'different' ? (
          <RotateCcw className={`w-4.5 h-4.5 ${styles.icon}`} />
        ) : (
          <CheckCircle2 className={`w-4.5 h-4.5 ${styles.icon}`} />
        )}
        <span className="font-bold text-stone-900 text-sm">{styles.title}</span>
      </div>

      <div className="text-sm font-serif text-stone-900 bg-white/80 p-2.5 rounded-xl border border-stone-200/70">
        We heard: <span className="font-bold">"{check.heard || '…'}"</span>
      </div>

      <p className="text-[11px] text-stone-600 leading-relaxed">
        {check.verdict === 'match' && <>Your speech was understood as "{target}".</>}
        {check.verdict === 'partial' && (
          <>
            Close. We didn't catch: <span className="font-semibold">{check.missedWords.join(', ')}</span>. Listen
            again and say the whole phrase.
          </>
        )}
        {check.verdict === 'different' && <>That didn't sound like "{target}". Listen again, then try once more.</>}
      </p>
      <p className="text-[10px] text-stone-400 leading-relaxed">
        This checks that your words were understood. It can't grade your accent.
      </p>
    </div>
  );
};
