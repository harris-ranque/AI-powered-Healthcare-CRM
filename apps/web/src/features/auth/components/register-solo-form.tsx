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
import { registerSoloSchema, type RegisterSoloFormValues } from '../schemas/register.schema';

type Props = {
  loading?: boolean;
  apiError?: string | null;
  googleToken?: string | null;
  hidePassword?: boolean;
  emailLocked?: boolean;
  initialValues?: Partial<RegisterSoloFormValues>;
  onSubmit: (values: RegisterSoloFormValues) => void | Promise<void>;
};

export function RegisterSoloForm({
  loading,
  apiError,
  googleToken,
  hidePassword,
  emailLocked,
  initialValues,
  onSubmit,
}: Props) {
  const form = useForm<RegisterSoloFormValues>({
    resolver: zodResolver(registerSoloSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      practiceName: '',
      googleToken: undefined,
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
        practiceName: initialValues.practiceName ?? '',
        googleToken: initialValues.googleToken,
      });
    }
  }, [initialValues, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your name</FormLabel>
              <FormControl>
                <Input placeholder="Dr. Jane Smith" {...field} />
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
                  placeholder="you@example.com"
                  disabled={emailLocked}
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
          name="practiceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Practice name (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Sunrise Family Medicine" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create solo practice'}
        </Button>
      </form>
    </Form>
  );
}
