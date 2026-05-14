'use client';

import { ProfileGateway } from '@/components/profile/ProfileGateway';
import { useProfileGateway } from '@/hooks/useProfileGateway';

export default function ProfilePage() {
  const gateway = useProfileGateway();
  return <ProfileGateway {...gateway} />;
}
