import { redirect } from 'next/navigation';
import { use } from 'react';

interface PageProps {
  params: Promise<{
    collection: string;
    id: string;
  }>;
}

export default function LegacyNftRedirect({ params }: PageProps) {
  const { collection, id } = use(params);
  redirect(`/nft/${collection}/${id}`);
}
