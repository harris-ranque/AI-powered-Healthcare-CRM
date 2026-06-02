'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  patientFormSchema,
  type PatientFormValues,
} from '../schemas/patient.schema';
import type { Patient } from '../types/patient.type';

const defaultValues: PatientFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  notes: '',
};

type Props = {
  initialPatient?: Patient | null;
  loading?: boolean;
  submitLabel: string;
  apiError?: string | null;
  onSubmit: (values: PatientFormValues) => void | Promise<void>;
};

function toFormValues(patient?: Patient | null): PatientFormValues {
  if (!patient) {
    return defaultValues;
  }
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email ?? '',
    phone: patient.phone ?? '',
    dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '',
    gender: patient.gender ?? '',
    address: patient.address ?? '',
    notes: patient.notes ?? '',
  };
}

export function patientValuesToPayload(values: PatientFormValues) {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email || undefined,
    phone: values.phone || undefined,
    dateOfBirth: values.dateOfBirth || undefined,
    gender: values.gender || undefined,
    address: values.address || undefined,
    notes: values.notes || undefined,
  };
}

export function PatientForm({
  initialPatient,
  loading,
  submitLabel,
  apiError,
  onSubmit,
}: Props) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(toFormValues(initialPatient));
  }, [form, initialPatient]);

  useEffect(() => {
    if (!apiError) return;
    if (apiError.toLowerCase().includes('email already exists')) {
      form.setError('email', {
        type: 'server',
        message: 'A patient with this email already exists in this organization',
      });
    }
  }, [apiError, form]);

  return (
    <Form {...form}>
      <form className="space-y-3" onSubmit={form.handleSubmit((values) => onSubmit(values))}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of birth</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} />
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
