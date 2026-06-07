'use client';

import {
  CalendarClock,
  FileText,
  NotebookPen,
  Search,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { useDebounce } from '@/lib/hooks/use-debounce';

import { useGlobalSearch } from '../hooks/use-global-search';
import {
  getAppointmentSearchHref,
  getFileSearchHref,
  getNoteSearchHref,
  getPatientSearchHref,
} from '../utils/search-navigation';

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function formatAppointmentTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function GlobalSearch({ open: controlledOpen, onOpenChange }: Props) {
  const router = useRouter();
  const user = useAuth().user;
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data, isLoading, isFetching } = useGlobalSearch(debouncedQuery);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const canReadPatients = hasPermission(user?.role, Permission.PATIENT_READ);
  const canReadAppointments = hasPermission(user?.role, Permission.APPOINTMENT_READ);
  const canReadFiles = hasPermission(user?.role, Permission.FILE_READ);

  const handleNavigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router, setOpen],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setOpen]);

  const patients = canReadPatients ? (data?.patients ?? []) : [];
  const appointments = canReadAppointments ? (data?.appointments ?? []) : [];
  const notes = canReadPatients ? (data?.notes ?? []) : [];
  const files = canReadFiles ? (data?.files ?? []) : [];
  const hasResults =
    patients.length > 0 ||
    appointments.length > 0 ||
    notes.length > 0 ||
    files.length > 0;
  const showLoading =
    debouncedQuery.length >= 2 && (isLoading || isFetching) && !hasResults;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="text-muted-foreground hidden h-9 w-56 justify-start gap-2 px-3 sm:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left text-sm">Search CRM...</span>
        <CommandShortcut>⌘K</CommandShortcut>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="sm:hidden"
        aria-label="Search CRM"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setQuery('');
          }
        }}
        title="Search CRM"
        description="Search patients, appointments, notes, and files across your organization."
      >
        <CommandInput
          placeholder="Search patients, appointments, notes, files..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {debouncedQuery.length < 2 ? (
            <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
          ) : showLoading ? (
            <CommandEmpty>Searching...</CommandEmpty>
          ) : !hasResults ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : null}

          {patients.length > 0 ? (
            <CommandGroup heading="Patients">
              {patients.map((patient) => (
                <CommandItem
                  key={`patient-${patient.id}`}
                  value={`patient ${patient.firstName} ${patient.lastName} ${patient.email ?? ''}`}
                  onSelect={() => handleNavigate(getPatientSearchHref(patient))}
                >
                  <UserRound className="size-4" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {patient.firstName} {patient.lastName}
                    </p>
                    {patient.email ? (
                      <p className="text-muted-foreground truncate text-xs">
                        {patient.email}
                      </p>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {appointments.length > 0 ? (
            <>
              {patients.length > 0 ? <CommandSeparator /> : null}
              <CommandGroup heading="Appointments">
                {appointments.map((appointment) => (
                  <CommandItem
                    key={`appointment-${appointment.id}`}
                    value={`appointment ${appointment.title ?? ''} ${appointment.patientName}`}
                    onSelect={() =>
                      handleNavigate(getAppointmentSearchHref(appointment))
                    }
                  >
                    <CalendarClock className="size-4" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {appointment.title ?? 'Appointment'} · {appointment.patientName}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {formatAppointmentTime(appointment.startsAt)}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          {notes.length > 0 ? (
            <>
              {patients.length > 0 || appointments.length > 0 ? (
                <CommandSeparator />
              ) : null}
              <CommandGroup heading="Clinical notes">
                {notes.map((note) => (
                  <CommandItem
                    key={`note-${note.id}`}
                    value={`note ${note.title ?? ''} ${note.snippet}`}
                    onSelect={() => handleNavigate(getNoteSearchHref(note))}
                  >
                    <NotebookPen className="size-4" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {note.title ?? 'Clinical note'}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {note.snippet}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          {files.length > 0 ? (
            <>
              {patients.length > 0 ||
              appointments.length > 0 ||
              notes.length > 0 ? (
                <CommandSeparator />
              ) : null}
              <CommandGroup heading="Files">
                {files.map((file) => (
                  <CommandItem
                    key={`file-${file.id}`}
                    value={`file ${file.originalName}`}
                    onSelect={() => handleNavigate(getFileSearchHref(file))}
                  >
                    <FileText className="size-4" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{file.originalName}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {file.mimeType}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
