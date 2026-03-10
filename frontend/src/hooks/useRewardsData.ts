'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { Gift, Sparkles, Star, Target, Zap } from 'lucide-react';
import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_USER } from '@/graphql/queries';
import { getLevelTier } from '@/lib/gamification';
import {
  buildRewardSnapshot,
  type TabType,
} from '@/lib/rewards';

export function useRewardsData() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  useEffect(() => {
    const loadRewardsUser = async () => {
      if (!address || !isConnected) {
        setUser(null);
        return;
      }

      setIsLoadingUser(true);
      try {
        const data: any = await fetchGraphQL(GET_USER, { id: address.toLowerCase() });
        setUser(data.user || null);
      } catch (error) {
        console.error('Error loading rewards user:', error);
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadRewardsUser();
  }, [address, isConnected]);

  const snapshot = useMemo(() => buildRewardSnapshot(user, isConnected), [user, isConnected]);
  const tier = getLevelTier(snapshot.level);
  const netFlow = snapshot.totalEarned - snapshot.totalSpent;

  const quests = useMemo(
    () => [
      {
        id: 1,
        title: 'Complete your first purchase',
        xp: 50,
        completed: snapshot.purchaseCount > 0,
        progress: Math.min(snapshot.purchaseCount, 1),
        total: 1,
        icon: Gift,
      },
      {
        id: 2,
        title: 'Create 3 listings',
        xp: 60,
        completed: snapshot.listingsCount >= 3,
        progress: Math.min(snapshot.listingsCount, 3),
        total: 3,
        icon: Target,
      },
      {
        id: 3,
        title: 'Publish your first creation',
        xp: 75,
        completed: snapshot.createdCount > 0,
        progress: Math.min(snapshot.createdCount, 1),
        total: 1,
        icon: Sparkles,
      },
      {
        id: 4,
        title: 'Reach 5 total trades',
        xp: 100,
        completed: snapshot.purchaseCount + snapshot.saleCount >= 5,
        progress: Math.min(snapshot.purchaseCount + snapshot.saleCount, 5),
        total: 5,
        icon: Zap,
      },
      {
        id: 5,
        title: 'Hold 5 wallet assets',
        xp: 80,
        completed: snapshot.ownedCount >= 5,
        progress: Math.min(snapshot.ownedCount, 5),
        total: 5,
        icon: Star,
      },
    ],
    [snapshot]
  );

  const completedQuests = useMemo(() => quests.filter((quest) => quest.completed).length, [quests]);

  return {
    address,
    isConnected,
    user,
    isLoadingUser,
    snapshot,
    tier,
    netFlow,
    quests,
    completedQuests,
    activeTab,
    setActiveTab,
  };
}
