import type { Database } from '~/database.types';

export const useUpdateGame = () => {
  const supabase = useSupabaseClient<Database>();
  const updateGame = async (
    gameUuid: string,
    updateObject: Record<string, string>
  ) => {
    await supabase.from('game').update(updateObject).eq('uuid', gameUuid); // Ensure you match the correct game by UUID
  };
  return { updateGame };
};
