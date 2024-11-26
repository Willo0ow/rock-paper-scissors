<template>
  <div>
    <h1>Game</h1>
    <div v-if="!isGameReady">
      <h2>Share this link with your friend:</h2>
      <p>{{ gameLink }}</p>
    </div>
    <div v-else-if="!isFinished">
      <button :disabled="disableChoice" @click="makeChoice('rock')">
        Rock
      </button>
      <button :disabled="disableChoice" @click="makeChoice('paper')">
        Paper
      </button>
      <button :disabled="disableChoice" @click="makeChoice('scissors')">
        Scissors
      </button>
      <div>
        <h3>Score</h3>
        <p>Turn: {{ currentTurn }}</p>
        <p>You: {{ yourScore || 0 }}</p>
        <p>Opponent: {{ opponentScore || 0 }}</p>
      </div>
    </div>
    <div v-else>
      <h2>Game finished</h2>
      <h3>{{ winner }}</h3>
      <p>You: {{ yourScore || 0 }}</p>
      <p>Opponent: {{ opponentScore || 0 }}</p>
      <CreateGameButton
        v-if="!showNewGameLink"
        :current-game-uuid="currentGame?.uuid"
        :second-player-id="
          isPlayer1
            ? currentGame?.player_2_id || ''
            : currentGame?.player_1_id || ''
        "
      />
      <nuxt-link v-else :to="newGameLink">Join new game</nuxt-link>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Database, Tables } from '~/database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const route = useRoute();
const config = useRuntimeConfig();

const { joinGame, currentGame } = useJoinGame();

const gameLink = computed(() => `${config.public.baseUrl}${route.fullPath}`);
const { currentUser, createAnonymousUser } = useAnonymousUser();

const supabase = useSupabaseClient<Database>();

const subscription = ref<RealtimeChannel | null>(null);

const subscribeToGameChanges = () => {
  subscription.value = supabase
    .channel('public:game')
    .on<Tables<'game'>>(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'game' },
      (payload) => {
        if (
          payload.new?.uuid === route.params.uuid ||
          payload.old?.uuid === route.params.uuid
        ) {
          console.log('Change detected for row:', payload);
          currentGame.value = payload.new;
        }
      }
    )
    .subscribe();
};

const isPlayer1 = computed(
  () => currentGame.value?.player_1_id === currentUser.value?.id
);
const isPlayer2 = computed(
  () => currentGame.value?.player_2_id === currentUser.value?.id
);

const newGameLink = computed(() => {
  return `/${currentGame.value?.new_game}`;
});

const showNewGameLink = computed(() => {
  return !!currentGame.value?.new_game && isFinished.value;
});

const isGameReady = computed(() => {
  if (!currentGame.value) return false;
  const { player_1_id, player_2_id } = currentGame.value;
  return player_1_id && player_2_id && (isPlayer1.value || isPlayer2.value);
});

const { updateGame } = useUpdateGame();

const makeChoice = async (choice: string) => {
  if (!currentGame.value) return;
  if (isPlayer1.value) {
    updateGame(currentGame.value.uuid, { player_1_choice: choice });
  } else if (isPlayer2.value) {
    updateGame(currentGame.value.uuid, { player_2_choice: choice });
  }
};

const disableChoice = computed(() => {
  if (isPlayer1.value) {
    return !!currentGame.value?.player_1_choice;
  }
  if (isPlayer2.value) {
    return !!currentGame.value?.player_2_choice;
  }
  return true;
});

const yourScore = computed(() => {
  return (
    (isPlayer1.value
      ? currentGame.value?.player_1_score
      : currentGame.value?.player_2_score) || 0
  );
});
const opponentScore = computed(() => {
  return (
    (isPlayer1.value
      ? currentGame.value?.player_2_score
      : currentGame.value?.player_1_score) || 0
  );
});

const winner = computed(() => {
  if (!isFinished.value) return '';

  if (yourScore.value > opponentScore.value) {
    return 'You win!';
  } else {
    return 'You lose!';
  }
});

const currentTurn = computed(() => {
  return currentGame.value?.turn;
});
const isFinished = computed(() => {
  return currentGame.value?.is_finished;
});

watch(currentTurn, (newValue) => {
  console.log(`It's ${newValue}'s turn!`);
});
watch(isFinished, (newValue) => {
  if (!newValue) return;
  console.log('Game is finished!');
});

onMounted(async () => {
  if (!currentUser.value) {
    await createAnonymousUser();
  }
  await joinGame(route.params.uuid as string);
  subscribeToGameChanges();
});

onUnmounted(() => {
  subscription.value?.unsubscribe();
});
</script>
