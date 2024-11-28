<template>
  <div>
    <h1>Game</h1>
    <div v-if="!isGameReady">
      <h2>Share this link with your friend:</h2>
      <p>{{ gameLink }}</p>
    </div>
    <div v-else-if="currentGame && !isFinished">
      <Choices />
      <Scores />
    </div>
    <div v-else>
      <h2>Game finished</h2>
      <h3>{{ winner }}</h3>
      <p>You: {{ score.user }}</p>
      <p>Opponent: {{ score.opponent }}</p>
      <CreateGameButton v-if="!showNewGameLink" is-from-finished-game />
      <nuxt-link v-else :to="newGameLink">Join new game</nuxt-link>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Database, Tables } from '~/database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const route = useRoute();
const config = useRuntimeConfig();

const gameStore = useGameStore();
const { currentGame, currentTurn, isFinished, score, userPlayerKeys } =
  storeToRefs(gameStore);

const gameLink = computed(() => `${config.public.baseUrl}${route.fullPath}`);
const newGameLink = computed(() => `/${currentGame.value?.new_game}`);
const showNewGameLink = computed(
  () => !!currentGame.value?.new_game && isFinished.value
);

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
          gameStore.setCurrentGame(payload.new);
        }
      }
    )
    .subscribe();
};

const isGameReady = computed(() => {
  if (!currentGame.value) return false;
  const { player_1_id, player_2_id } = currentGame.value;
  return !!player_1_id && !!player_2_id && !!userPlayerKeys.value;
});

const winner = computed(() => {
  if (!isFinished.value) return '';

  return score.value.user > score.value.opponent ? 'You win!' : 'You lose!';
});

watch(currentTurn, (newValue) => {
  console.log(`It's ${newValue}'s turn!`);
});
watch(isFinished, (newValue) => {
  if (!newValue) return;
  console.log('Game is finished!');
});

onMounted(async () => {
  await gameStore.joinGame(route.params.uuid as string);
  subscribeToGameChanges();
});

onUnmounted(() => {
  subscription.value?.unsubscribe();
});
</script>
