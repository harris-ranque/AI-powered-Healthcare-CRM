'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  registerStaffSchema,
  type RegisterStaffFormValues,
} from '../schemas/register.schema';
import { Role } from '../types/role.type';

type Props = {
  loading?: boolean;
  apiError?: string | null;
  onSubmit: (values: RegisterStaffFormValues) => void | Promise<void>;
};

export function RegisterStaffForm({ loading, apiError, onSubmit }: Props) {
  const form = useForm<RegisterStaffFormValues>({
    resolver: zodResolver(registerStaffSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      clinicSlug: '',
      role: Role.DOCTOR,
    },
  });

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
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
