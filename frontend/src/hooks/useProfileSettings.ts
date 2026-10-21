import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getCurrentUserProfile, updateUserProfile } from '../services/auth.service';

export function useProfileQuery() {
  return useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: getCurrentUserProfile,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProfileUpdate() {
  const { updateUserSession } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (user) => {
      updateUserSession(user);
      queryClient.setQueryData(['currentUserProfile'], user);
      for (const key of ['currentUserProfile', 'active-goal', 'preview-goal', 'mealStats', 'todayMeals']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
