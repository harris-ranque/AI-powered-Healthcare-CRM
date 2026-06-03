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
import { ClinicCombobox } from './clinic-combobox';
import {
  registerStaffSchema,
  type RegisterStaffFormValues,
} from '../schemas/register.schema';
import { Role } from '../types/role.type';

type Props = {
  loading?: boolean;
  apiError?: string | null;
  googleToken?: string | null;
  hidePassword?: boolean;
  emailLocked?: boolean;
  clinicLocked?: boolean;
  roleLocked?: boolean;
  clinicDisplayName?: string;
  initialValues?: Partial<RegisterStaffFormValues>;
  onSubmit: (values: RegisterStaffFormValues) => void | Promise<void>;
};

export function RegisterStaffForm({
  loading,
  apiError,
  googleToken,
  hidePassword,
  emailLocked,
  clinicLocked,
  roleLocked,
  clinicDisplayName,
  initialValues,
  onSubmit,
}: Props) {
  const form = useForm<RegisterStaffFormValues>({
    resolver: zodResolver(registerStaffSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      clinicSlug: '',
      role: Role.DOCTOR,
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
        name: initialValues.name ?? '',
        email: initialValues.email ?? '',
        password: '',
        clinicSlug: initialValues.clinicSlug ?? '',
        role: initialValues.role ?? Role.DOCTOR,
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? Role.DOCTOR}
                disabled={roleLocked}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={Role.DOCTOR}>Doctor</SelectItem>
                  <SelectItem value={Role.NURSE}>Nurse</SelectItem>
                  <SelectItem value={Role.RECEPTIONIST}>Receptionist</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Submitting request...' : 'Request to join clinic'}
        </Button>
      </form>
    </Form>
  );
}
