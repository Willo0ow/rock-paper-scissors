import type { Database, Tables } from '~/database.types';

export const useJoinGame = () => {
  const currentGame = ref<Tables<'game'> | null>(null);
  const joinGame = async (gameUuid: string) => {
    const { currentUser } = useAnonymousUser();
    const supabase = useSupabaseClient<Database>();

    const { data: game, error: gameError } = await supabase
      .from('game')
      .select('*') // Retrieve all columns, or specify the columns you need
      .eq('uuid', gameUuid) // Match the game by UUID
      .single(); // Expect exactly one row

    if (gameError) {
      console.error('Error fetching current game:', gameError);
      return;
    }

    if (game) {
      console.log('GAME', game);

      if (
        game.player_1_id === currentUser.value?.id ||
        game.player_2_id === currentUser.value?.id
      ) {
        currentGame.value = game;
        return;
      }
    }

    const { data, error } = await supabase
      .from('game')
      .update({ player_2_id: currentUser.value?.id })
      .eq('uuid', gameUuid) // Ensure you match the correct game by UUID
      .is('player_2_id', null)
      .select(); // Ensure it only updates games where player_2_id is still null

    if (error) {
      console.error('Error joining game as player 2:', error);
    } else {
      currentGame.value = data[0];
      console.log('Successfully joined game:', data);
    }
  };

  return {
    joinGame,
    currentGame,
  };
};
