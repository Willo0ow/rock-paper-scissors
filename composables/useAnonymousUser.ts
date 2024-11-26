import type { Database } from '~/database.types';
import type { User, Session } from '@supabase/supabase-js';

export type BaseSession = Omit<Session, 'user'>;

const currentSession = ref<null | BaseSession>(null);
const currentUser = ref<null | User>(null);
export const useAnonymousUser = () => {
  onMounted(() => {
    if (!currentUser.value) {
      const storedUser = sessionStorage.getItem('user');
      currentUser.value = storedUser ? JSON.parse(storedUser) : null;
    }
    if (!currentSession.value) {
      const storedSession = sessionStorage.getItem('session');
      currentSession.value = storedSession ? JSON.parse(storedSession) : null;
    }
  });

  const isUserDataReady = ref(false);
  const createAnonymousUser = async () => {
    isUserDataReady.value = false;
    const supabase = useSupabaseClient<Database>();
    if (!currentUser.value || !currentSession.value) {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (data?.session) {
        const { user, ...session } = data.session;
        sessionStorage.setItem('session', JSON.stringify(session));
        sessionStorage.setItem('user', JSON.stringify(user));
        currentSession.value = session;
        currentUser.value = user;
      }
      if (error) {
        console.error(error);
      }
    }
    isUserDataReady.value = true;
  };

  return {
    currentUser,
    currentSession,
    isUserDataReady,
    createAnonymousUser,
  };
};
