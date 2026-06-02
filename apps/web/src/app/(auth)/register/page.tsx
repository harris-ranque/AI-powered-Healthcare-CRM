import Link from 'next/link';
import { Building2, Stethoscope, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const options = [
  {
    title: 'Clinic owner',
    description: 'Create a new clinic workspace and manage your team.',
    href: '/register/clinic',
    icon: Building2,
  },
  {
    title: 'Staff',
    description: 'Join an existing clinic with your clinic slug (owner approval required).',
    href: '/register/staff',
    icon: Stethoscope,
  },
  {
    title: 'Patient',
    description: 'Access your health records and appointments in the patient portal.',
    href: '/register/patient',
    icon: UserRound,
  },
];

export default function RegisterChooserPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Choose how you want to use Healthcare SaaS
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.href} className="flex flex-col">
                <CardHeader>
                  <Icon className="text-primary mb-2 h-8 w-8" />
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild className="w-full">
                    <Link href={option.href}>Continue</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-black underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
