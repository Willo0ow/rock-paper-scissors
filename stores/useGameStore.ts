import { defineStore } from 'pinia';
import type { Database, Tables } from '~/database.types';

type PlayerKeys = {
  player: 'player_1_id' | 'player_2_id';
  score: 'player_1_score' | 'player_2_score';
  choice: 'player_1_choice' | 'player_2_choice';
};

const getPlayerKeys = (playerNumber: '1' | '2'): PlayerKeys => {
  return {
    player: `player_${playerNumber}_id`,
    score: `player_${playerNumber}_score`,
    choice: `player_${playerNumber}_choice`,
  };
};

export const useGameStore = defineStore('game', () => {
  const { user } = storeToRefs(useUserStore());
  const currentGame = ref<Tables<'game'> | null>(null);

  const userPlayerKeys = computed<PlayerKeys | null>(() => {
    if (currentGame.value?.player_1_id === user.value?.id) {
      return getPlayerKeys('1');
    } else if (currentGame.value?.player_2_id === user.value?.id) {
      return getPlayerKeys('2');
    }
    return null;
  });
  const opponentPlayerKeys = computed<PlayerKeys>(() => {
    if (currentGame.value?.player_1_id === user.value?.id) {
      return getPlayerKeys('2');
    }
    return getPlayerKeys('1');
  });

  const score = computed(() => ({
    user: userPlayerKeys.value
      ? currentGame.value?.[userPlayerKeys.value.score] || 0
      : 0,
    opponent: currentGame.value?.[opponentPlayerKeys.value.score] || 0,
  }));

  const currentTurn = computed(() => currentGame.value?.turn || 1);
  const isFinished = computed(() => currentGame.value?.is_finished);

  const supabase = useSupabaseClient<Database>();

  const setCurrentGame = (game: Tables<'game'>) => {
    currentGame.value = game;
  };

  const getUserUnfinishedGames = async () => {
    const { data: unfinishedGames, error: fetchError } = await supabase
      .from('game')
      .select('*')
      .or(`player_1_id.eq.${user.value?.id},player_2_id.eq.${user.value?.id}`)
      .eq('is_finished', false);

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Handle unexpected errors (PGRST116 = no row found, which is okay here)
      console.error('Error fetching unfinished game:', fetchError);
      return;
    }
    return unfinishedGames;
  };

  const createNewGame = async () => {
    const { data: newGame, error: newGameError } = await supabase
      .from('game')
      .insert({
        player_1_id: user.value?.id || '',
      })
      .select(); // check if single works

    if (newGameError) {
      console.error('Error creating game:', newGameError);
      return;
    }

    return newGame[0];
  };

  const updateGame = async (
    gameUuid: string,
    updateObject: Record<string, string>
  ) => {
    const { data, error } = await supabase
      .from('game')
      .update(updateObject)
      .eq('uuid', gameUuid)
      .select(); // check if single works
    if (error) {
      console.error('Error updating game:', error);
      return;
    }
    return data[0];
  };

  const getOrCreateGame = async (currentGameUuid = '') => {
    if (!currentGameUuid) {
      const unfinishedGames = await getUserUnfinishedGames();
      if (unfinishedGames?.length) {
        setCurrentGame(unfinishedGames[0]);
        return;
      }
    }

    const newGame = await createNewGame();

    if (!newGame) return;

    if (currentGameUuid) {
      await updateGame(currentGameUuid, { new_game: newGame?.uuid || '' });
    }

    setCurrentGame(newGame);
  };

  const getAGame = async (gameUuid: string) => {
    const { data: game, error: gameError } = await supabase
      .from('game')
      .select('*')
      .eq('uuid', gameUuid)
      .single();

    if (gameError) {
      console.error('Error fetching current game:', gameError);
      return;
    }
    return game;
  };

  const joinGame = async (gameUuid: string) => {
    const game = await getAGame(gameUuid);

    if (game) {
      if (
        game.player_1_id === user.value?.id ||
        game.player_2_id === user.value?.id
      ) {
        setCurrentGame(game);
        return;
      }
    }

    const joinedGame = await updateGame(gameUuid, {
      player_2_id: user.value?.id || '',
    });

    if (joinedGame) {
      setCurrentGame(joinedGame);
    }
  };

  return {
    currentGame,
    userPlayerKeys,
    score,
    currentTurn,
    isFinished,
    setCurrentGame,
    getOrCreateGame,
    joinGame,
    updateGame,
    getAGame,
  };
});
