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
import { ClinicCombobox } from './clinic-combobox';
import {
  registerPatientSchema,
  type RegisterPatientFormValues,
} from '../schemas/register.schema';

type Props = {
  loading?: boolean;
  apiError?: string | null;
  googleToken?: string | null;
  hidePassword?: boolean;
  emailLocked?: boolean;
  clinicLocked?: boolean;
  clinicDisplayName?: string;
  initialValues?: Partial<RegisterPatientFormValues>;
  onSubmit: (values: RegisterPatientFormValues) => void | Promise<void>;
};

export function RegisterPatientForm({
  loading,
  apiError,
  googleToken,
  hidePassword,
  emailLocked,
  clinicLocked,
  clinicDisplayName,
  initialValues,
  onSubmit,
}: Props) {
  const form = useForm<RegisterPatientFormValues>({
    resolver: zodResolver(registerPatientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      clinicSlug: '',
      phone: '',
      dateOfBirth: '',
      googleToken: undefined,
      inviteToken: undefined,
      ...initialValues,
    },
  });

  useEffect(() => {
    if (googleToken) {
      form.setValue('googleToken', googleToken);
    }
  }, [googleToken, form]);

  useEffect(() => {
    if (initialValues) {
      form.reset({
        firstName: initialValues.firstName ?? '',
        lastName: initialValues.lastName ?? '',
        email: initialValues.email ?? '',
        password: '',
        clinicSlug: initialValues.clinicSlug ?? '',
        phone: initialValues.phone ?? '',
        dateOfBirth: initialValues.dateOfBirth ?? '',
        googleToken: googleToken ?? undefined,
        inviteToken: initialValues.inviteToken,
      });
    }
  }, [initialValues, googleToken, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {googleToken ? (
          <p className="text-muted-foreground rounded-md border bg-zinc-50 px-3 py-2 text-sm">
            Completing registration with Google
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input autoComplete="given-name" {...field} />
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
                  <Input autoComplete="family-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  readOnly={emailLocked}
                  className={emailLocked ? 'bg-muted' : undefined}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!hidePassword ? (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          name="clinicSlug"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ClinicCombobox
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  disabled={clinicLocked}
                  selectedName={clinicDisplayName}
                  label="Clinic"
                />
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
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input type="tel" autoComplete="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of birth (optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create client account'}
        </Button>
      </form>
    </Form>
  );
}
