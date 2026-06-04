import { redirect } from 'next/navigation';

export default function RegisterPatientRedirectPage() {
  redirect('/register/client');
}
