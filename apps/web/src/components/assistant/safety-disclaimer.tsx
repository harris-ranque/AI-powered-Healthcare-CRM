import { AlertTriangle } from 'lucide-react';

export function SafetyDisclaimer() {
  return (
    <div className="bg-amber-500/10 text-amber-950 dark:text-amber-100 flex items-start gap-2 rounded-lg border border-amber-500/30 px-3 py-2 text-xs">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>
        This assistant is not a substitute for professional medical advice, diagnosis,
        or treatment. For urgent symptoms, call emergency services immediately.
      </p>
    </div>
  );
}
