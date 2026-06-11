'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import { useOrganization, useUpdateOrganization } from '../hooks/use-organization';
import {
  organizationSettingsSchema,
  type OrganizationSettingsFormValues,
} from '../schemas/organization-settings.schema';

export function OrganizationSettingsForm() {
  const notify = useNotificationStore((state) => state.notify);
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();

  const form = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        description: organization.description ?? '',
      });
    }
  }, [organization, form]);

  const onSubmit = async (values: OrganizationSettingsFormValues) => {
    try {
      await updateOrganization.mutateAsync({
        name: values.name,
        description: values.description?.trim() || undefined,
      });
      notify({ type: 'success', message: 'Organization updated' });
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Could not update organization'),
      });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Update your clinic name and description.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinic name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Sunrise Medical Clinic" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Clinic URL slug</FormLabel>
              <Input value={organization?.slug ?? ''} disabled readOnly />
              <p className="text-muted-foreground text-xs">
                Slug cannot be changed after creation.
              </p>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Optional description of your clinic"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={updateOrganization.isPending}>
              {updateOrganization.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
