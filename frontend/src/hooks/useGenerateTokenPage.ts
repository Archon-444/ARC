'use client';

import { useMutation } from '@tanstack/react-query';
import type { GenerateTokenPageRequest, GenerateTokenPageResponse } from '@/types';

export function useGenerateTokenPage() {
  const mutation = useMutation({
    mutationFn: async (input: GenerateTokenPageRequest): Promise<GenerateTokenPageResponse> => {
      const response = await fetch('/api/ai/generate-token-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Failed to generate token page');
      }

      return response.json();
    },
  });

  return {
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
    data: mutation.data ?? null,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
