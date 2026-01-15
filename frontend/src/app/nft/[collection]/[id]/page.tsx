import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    collection: string;
    id: string;
  };
}

export default function LegacyNftRedirect({ params }: PageProps) {
  redirect(`/nft/${params.collection}/${params.id}`);
}
