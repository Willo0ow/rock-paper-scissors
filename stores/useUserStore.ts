import { defineStore } from 'pinia';
import type { Database } from '~/database.types';

export const useUserStore = defineStore('user', () => {
  const user = useSupabaseUser();
  const isUserReady = computed(() => !!user.value);

  const supabase = useSupabaseClient<Database>();

  const initUser = async () => {
    if (!user.value) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        throw new Error(error.message);
      }
      user.value = data.user;
    }
  };

  return {
    user,
    isUserReady,
    initUser,
  };
});
