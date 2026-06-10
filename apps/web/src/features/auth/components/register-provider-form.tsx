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
import {
  registerProviderSchema,
  type RegisterProviderFormValues,
} from '../schemas/register.schema';

type Props = {
  loading?: boolean;
  apiError?: string | null;
  googleToken?: string | null;
  hidePassword?: boolean;
  emailLocked?: boolean;
  initialValues?: Partial<RegisterProviderFormValues>;
  submitLabel?: string;
  onSubmit: (values: RegisterProviderFormValues) => void | Promise<void>;
};

export function RegisterProviderForm({
  loading,
  apiError,
  googleToken,
  hidePassword,
  emailLocked,
  initialValues,
  submitLabel = 'Create account',
  onSubmit,
}: Props) {
  const form = useForm<RegisterProviderFormValues>({
    resolver: zodResolver(registerProviderSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
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
        {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
