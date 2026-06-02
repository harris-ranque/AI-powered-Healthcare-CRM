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
  registerClinicSchema,
  suggestSlug,
  type RegisterClinicFormValues,
} from '../schemas/register.schema';

type Props = {
  loading?: boolean;
  apiError?: string | null;
  onSubmit: (values: RegisterClinicFormValues) => void | Promise<void>;
};

export function RegisterClinicForm({ loading, apiError, onSubmit }: Props) {
  const form = useForm<RegisterClinicFormValues>({
    resolver: zodResolver(registerClinicSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      clinicName: '',
      clinicSlug: '',
    },
  });

  const clinicName = form.watch('clinicName');

  useEffect(() => {
    const slug = form.getValues('clinicSlug');
    if (!slug && clinicName) {
      form.setValue('clinicSlug', suggestSlug(clinicName));
    }
  }, [clinicName, form]);

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
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                <Input placeholder="sunrise-medical" {...field} />
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
