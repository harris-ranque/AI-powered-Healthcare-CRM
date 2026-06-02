import Link from 'next/link';
import {
  Activity,
  CalendarCheck,
  HeartPulse,
  Lock,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Users,
    title: 'Patient management',
    description:
      'Maintain a clean, searchable patient registry with secure records and audit trails.',
  },
  {
    icon: CalendarCheck,
    title: 'Appointments',
    description: 'Schedule visits and let patients self-book through the portal.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description:
      'Clinic owners, doctors, nurses, receptionists, and patients — each get the right view.',
  },
  {
    icon: Lock,
    title: 'HIPAA-ready by design',
    description: 'Encrypted secrets, scoped tokens, and audit logging out of the box.',
  },
];

const personas = [
  {
    icon: Stethoscope,
    title: 'For clinics',
    body: 'Run your practice with a single source of truth for patients, staff and billing.',
    cta: 'Register your clinic',
    href: '/register/clinic',
  },
  {
    icon: HeartPulse,
    title: 'For patients',
    body: 'View your records, manage appointments, and message your provider securely.',
    cta: 'Sign up as a patient',
    href: '/register/patient',
  },
];

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="bg-primary text-primary-foreground inline-flex h-8 w-8 items-center justify-center rounded-md">
              <Activity className="h-4 w-4" />
            </span>
            Healthcare SaaS
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section
          className="relative isolate overflow-hidden border-b bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-healthcare-ai.svg')" }}
        >
          <div
            aria-hidden
            className="from-background/80 via-background/55 to-background/80 dark:from-background/90 dark:via-background/75 dark:to-background/90 absolute inset-0 bg-linear-to-br"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2">
            <div className="space-y-6">
              <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
                AI-powered healthcare CRM
              </span>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Modern care, organized.
              </h1>
              <p className="text-muted-foreground max-w-xl text-lg">
                Bring your patients, providers and operations into one secure workspace —
                with role-based access for every member of your clinic.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/register">Create your account</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Free to try. No credit card required.
              </p>
            </div>

            <div className="bg-card rounded-2xl border p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary inline-flex h-10 w-10 items-center justify-center rounded-full">
                    <HeartPulse className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Today&apos;s overview</p>
                    <p className="text-muted-foreground text-xs">Live dashboard preview</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Patients', value: '1,284' },
                    { label: 'Visits', value: '38' },
                    { label: 'Pending', value: '6' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border p-3">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-muted-foreground text-xs">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Aisha Khan', time: '09:30', tag: 'Follow-up' },
                    { name: 'Marco Silva', time: '10:15', tag: 'New patient' },
                    { name: 'Priya Shah', time: '11:00', tag: 'Lab review' },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-muted-foreground text-xs">{row.tag}</p>
                      </div>
                      <span className="text-muted-foreground text-xs">{row.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Everything your clinic needs</h2>
              <p className="text-muted-foreground mt-3">
                Built for small and growing practices that care about security, speed and
                simplicity.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="bg-card rounded-xl border p-6">
                    <span className="bg-primary/10 text-primary mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground mt-2 text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-20 md:grid-cols-2">
            {personas.map((persona) => {
              const Icon = persona.icon;
              return (
                <div key={persona.title} className="bg-card flex flex-col rounded-2xl border p-8">
                  <span className="bg-primary/10 text-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-xl font-semibold">{persona.title}</h3>
                  <p className="text-muted-foreground mt-2 flex-1 text-sm">{persona.body}</p>
                  <Button asChild className="mt-6 w-fit">
                    <Link href={persona.href}>{persona.cta}</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Ready to get started?</h2>
            <p className="text-muted-foreground mt-3">
              Set up your clinic in minutes, or sign in if you already have an account.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/register">Create an account</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm sm:flex-row">
          <p>© {new Date().getFullYear()} Healthcare SaaS. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
