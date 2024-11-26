import type { Database, Tables } from '~/database.types';

export const useCreateGame = () => {
  const user = useSupabaseUser();

  const currentGame = ref<Tables<'game'> | null>(null);
  const createGame = async (currentGameUuid = '') => {
    const supabase = useSupabaseClient<Database>();

    const { data: unfinishedGame, error: fetchError } = await supabase
      .from('game')
      .select('*')
      .or(`player_1_id.eq.${user.value?.id},player_2_id.eq.${user.value?.id}`) // Match either player_1_id or player_2_id
      .eq('is_finished', false) // Check that the game is not finished
      .limit(1); // Fetch the first matching row

    if (unfinishedGame?.length) {
      currentGame.value = unfinishedGame[0];
      return;
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Handle unexpected errors (PGRST116 = no row found, which is okay here)
      console.error('Error fetching unfinished game:', fetchError);
      return;
    }

    const { data: newGame, error: newGameError } = await supabase
      .from('game')
      // @ts-ignore
      .insert({
        player_1_id: user.value?.id || '',
      })
      .select();

    if (newGameError) {
      // Handle unexpected errors
      console.error('Error creating game:', newGameError);
      return;
    }

    if (newGame?.length) {
      // Game created successfully
      console.log('Game created successfully:', newGame[0]);
      if (currentGameUuid) {
        await supabase
          .from('game')
          .update({ new_game: newGame[0].uuid })
          .eq('uuid', currentGameUuid);
      }
      currentGame.value = newGame[0];
    }
  };

  return {
    createGame,
    currentGame,
  };
};
