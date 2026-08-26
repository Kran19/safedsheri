import { redirect } from 'next/navigation';

export default function OrderRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/?pay=${params.id}`);
}
