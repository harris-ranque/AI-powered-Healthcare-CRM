'use client';

import { cn } from '@/lib/utils';

import type { AuthPersona, ProviderType } from '../types/persona.type';

type Props = {
  persona: AuthPersona;
  onPersonaChange: (persona: AuthPersona) => void;
  providerType?: ProviderType;
  onProviderTypeChange?: (type: ProviderType) => void;
  showProviderSubType?: boolean;
  className?: string;
};

export function PersonaToggle({
  persona,
  onPersonaChange,
  providerType = 'organization',
  onProviderTypeChange,
  showProviderSubType = false,
  className,
}: Props) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="bg-muted grid grid-cols-2 gap-1 rounded-lg p-1">
        <button
          type="button"
          onClick={() => onPersonaChange('client')}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            persona === 'client'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Client
        </button>
        <button
          type="button"
          onClick={() => onPersonaChange('provider')}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            persona === 'provider'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Provider
        </button>
      </div>

      {showProviderSubType && persona === 'provider' && onProviderTypeChange ? (
        <div className="bg-muted grid grid-cols-2 gap-1 rounded-lg p-1">
          <button
            type="button"
            onClick={() => onProviderTypeChange('organization')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              providerType === 'organization'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Organization
          </button>
          <button
            type="button"
            onClick={() => onProviderTypeChange('individual')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              providerType === 'individual'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Individual
          </button>
        </div>
      ) : null}
    </div>
  );
}
