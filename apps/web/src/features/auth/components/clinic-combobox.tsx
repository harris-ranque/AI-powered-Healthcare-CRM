'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { organizationsApi, type ClinicSearchResult } from '@/features/organizations/api/organizations.api';

type Props = {
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
  label?: string;
  selectedName?: string;
};

export function ClinicCombobox({
  value,
  onChange,
  disabled,
  label = 'Clinic',
  selectedName,
}: Props) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(selectedName ?? value);
  const [results, setResults] = useState<ClinicSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (selectedName) {
      setQuery(selectedName);
    } else if (value && !selectedName) {
      setQuery(value);
    }
  }, [selectedName, value]);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const clinics = await organizationsApi.search(q);
      setResults(clinics);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (disabled) {
      return;
    }
    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, runSearch, disabled]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const selectClinic = (clinic: ClinicSearchResult) => {
    onChange(clinic.slug);
    setQuery(clinic.name);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label htmlFor={listId}>{label}</Label>
      <Input
        id={listId}
        value={query}
        disabled={disabled}
        placeholder="Search by clinic name or slug"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setOpen(true);
          if (!next.trim()) {
            onChange('');
          }
        }}
        onBlur={() => {
          if (!value && query.trim()) {
            onChange(
              query
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-'),
            );
          }
        }}
      />
      {open && !disabled && results.length > 0 ? (
        <ul
          className="bg-background absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border shadow-md"
          role="listbox"
        >
          {results.map((clinic) => (
            <li key={clinic.slug}>
              <button
                type="button"
                className="hover:bg-muted w-full px-3 py-2 text-left text-sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectClinic(clinic)}
              >
                <span className="font-medium">{clinic.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">{clinic.slug}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {searching ? (
        <p className="text-muted-foreground text-xs">Searching clinics...</p>
      ) : null}
      {value ? (
        <p className="text-muted-foreground text-xs">
          Selected slug: <span className="font-mono">{value}</span>
        </p>
      ) : null}
    </div>
  );
}
