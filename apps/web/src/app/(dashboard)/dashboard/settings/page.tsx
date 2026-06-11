import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <ul className="list-inside list-disc text-sm">
        <li>
          <Link href="/dashboard/settings/team" className="underline">
            Team members
          </Link>
        </li>
        <li>
          <Link href="/dashboard/settings/billing" className="underline">
            Billing
          </Link>
        </li>
      </ul>
    </div>
  );
}
