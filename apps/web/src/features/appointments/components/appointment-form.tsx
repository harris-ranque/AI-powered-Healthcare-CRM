'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Role } from '@/features/auth/types/role.type';
import { useMembersList } from '@/features/organizations/hooks/use-members';
import { usePatientsList } from '@/features/patients/hooks/use-patients-list';

import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from '../schemas/appointment.schema';
import type { Appointment } from '../types/appointment.type';
import { appointmentStatuses } from '../types/appointment.type';
import {
  datetimeLocalToIso,
  isoToDatetimeLocal,
} from '../utils/appointment-format';
import type { CreateAppointmentInput, UpdateAppointmentInput } from '../types/appointment.type';

const emptyValues: AppointmentFormValues = {
  patientId: '',
  providerId: '',
  startsAt: '',
  endsAt: '',
  status: 'SCHEDULED',
  title: '',
  reason: '',
  notes: '',
};

type Props = {
  initialAppointment?: Appointment | null;
  defaultStart?: Date;
  defaultEnd?: Date;
  loading?: boolean;
  submitLabel: string;
  apiError?: string | null;
  onSubmit: (values: AppointmentFormValues) => void | Promise<void>;
};

function toFormValues(
  appointment?: Appointment | null,
  defaultStart?: Date,
  defaultEnd?: Date,
): AppointmentFormValues {
  if (appointment) {
    return {
      patientId: appointment.patientId,
      providerId: appointment.providerId ?? '',
      startsAt: isoToDatetimeLocal(appointment.startsAt),
      endsAt: isoToDatetimeLocal(appointment.endsAt),
      status: appointment.status,
      title: appointment.title ?? '',
      reason: appointment.reason ?? '',
      notes: appointment.notes ?? '',
    };
  }

  return {
    ...emptyValues,
    startsAt: defaultStart ? isoToDatetimeLocal(defaultStart.toISOString()) : '',
    endsAt: defaultEnd ? isoToDatetimeLocal(defaultEnd.toISOString()) : '',
  };
}

export function appointmentValuesToCreatePayload(
  values: AppointmentFormValues,
): CreateAppointmentInput {
  return {
    patientId: values.patientId,
    providerId: values.providerId || undefined,
    startsAt: datetimeLocalToIso(values.startsAt),
    endsAt: datetimeLocalToIso(values.endsAt),
    status: values.status,
    title: values.title || undefined,
    reason: values.reason || undefined,
    notes: values.notes || undefined,
  };
}

export function appointmentValuesToUpdatePayload(
  values: AppointmentFormValues,
): UpdateAppointmentInput {
  return appointmentValuesToCreatePayload(values);
}

export function AppointmentForm({
  initialAppointment,
  defaultStart,
  defaultEnd,
  loading,
  submitLabel,
  apiError,
  onSubmit,
}: Props) {
  const { data: patientsData, isLoading: patientsLoading } = usePatientsList({
    page: 1,
    limit: 100,
    sortBy: 'lastName',
    order: 'asc',
  });
  const { data: members, isLoading: membersLoading } = useMembersList();

  const providers = useMemo(
    () =>
      (members ?? []).filter(
        (m) => m.role === Role.DOCTOR || m.role === Role.NURSE,
      ),
    [members],
  );

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: toFormValues(initialAppointment, defaultStart, defaultEnd),
  });

  useEffect(() => {
    form.reset(toFormValues(initialAppointment, defaultStart, defaultEnd));
  }, [initialAppointment, defaultStart, defaultEnd, form]);

  const patients = patientsData?.data ?? [];

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
      >
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={patientsLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.lastName}, {patient.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="providerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider (optional)</FormLabel>
              <Select
                value={field.value || '__none__'}
                onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                disabled={membersLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {providers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.name ?? member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startsAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endsAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {appointmentStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replaceAll('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Annual checkup" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Visit reason" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Internal notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {apiError ? (
          <p className="text-destructive text-sm" role="alert">
            {apiError}
          </p>
        ) : null}

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
