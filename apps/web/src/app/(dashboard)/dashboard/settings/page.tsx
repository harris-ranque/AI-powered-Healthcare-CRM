import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <ul className="list-inside list-disc text-sm">
        <li>
          <Link href="/dashboard/settings/members" className="underline">
            Team members
          </Link>
        </li>
      </ul>
    </div>
  );
}
