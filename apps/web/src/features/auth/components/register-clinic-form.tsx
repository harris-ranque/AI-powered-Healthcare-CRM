'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
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
  registerClinicSchema,
  suggestSlug,
  type RegisterClinicFormValues,
} from '../schemas/register.schema';

type Props = {
  loading?: boolean;
  apiError?: string | null;
  googleToken?: string | null;
  hidePassword?: boolean;
  emailLocked?: boolean;
  initialValues?: Partial<RegisterClinicFormValues>;
  onSubmit: (values: RegisterClinicFormValues) => void | Promise<void>;
};

export function RegisterClinicForm({
  loading,
  apiError,
  googleToken,
  hidePassword,
  emailLocked,
  initialValues,
  onSubmit,
}: Props) {
  const form = useForm<RegisterClinicFormValues>({
    resolver: zodResolver(registerClinicSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      clinicName: '',
      clinicSlug: '',
      googleToken: undefined,
      ...initialValues,
    },
  });

  const clinicName = form.watch('clinicName');
  const slugManuallyEdited = useRef(false);

  useEffect(() => {
    if (googleToken) {
      form.setValue('googleToken', googleToken);
    }
  }, [googleToken, form]);

  useEffect(() => {
    if (slugManuallyEdited.current) {
      return;
    }
    form.setValue('clinicSlug', suggestSlug(clinicName), {
      shouldValidate: true,
    });
  }, [clinicName, form]);

  useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name ?? '',
        email: initialValues.email ?? '',
        password: '',
        clinicName: initialValues.clinicName ?? '',
        clinicSlug: initialValues.clinicSlug ?? '',
        googleToken: googleToken ?? undefined,
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
                <Input placeholder="Jane Doe" autoComplete="name" {...field} />
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
          name="clinicName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clinic name</FormLabel>
              <FormControl>
                <Input placeholder="Sunrise Medical" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clinicSlug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clinic slug</FormLabel>
              <FormControl>
                <Input
                  placeholder="sunrise-medical"
                  {...field}
                  onChange={(event) => {
                    slugManuallyEdited.current = true;
                    field.onChange(event);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating clinic...' : 'Create clinic account'}
        </Button>
      </form>
    </Form>
  );
}
