import { redirect } from 'next/navigation';

export default function MyPassNoHyphenRedirectPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const query = searchParams?.phone || searchParams?.q || searchParams?.mypass || '';
  if (typeof query === 'string' && query.trim()) {
    redirect(`/?mypass=${encodeURIComponent(query.trim())}`);
  }
  redirect('/?mypass=true');
}
