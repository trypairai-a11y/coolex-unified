import { useQuery } from '@tanstack/react-query';
import type { User } from '@/types/user';

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/mock/users');
      return res.json();
    },
  });
}
