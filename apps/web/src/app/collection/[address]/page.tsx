import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    address: string;
  }>;
}

export default async function CollectionRedirect({ params }: PageProps) {
  const { address } = await params;
  redirect(`/collections/${address}`);
}
