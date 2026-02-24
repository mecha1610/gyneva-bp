import { redirect } from 'next/navigation';

// Root "/" redirects to the (app) overview
export default function RootPage() {
  redirect('/overview');
}
