<template>
  <div>
    <button
      v-for="choice in choices"
      :key="choice"
      :disabled="isChoicesDisabled"
      @click="makeChoice(choice)"
    >
      {{ choice }}
    </button>
  </div>
</template>
<script setup lang="ts">
import type { Enums } from '~/database.types';

const gameStore = useGameStore();
const { currentGame, userPlayerKeys } = storeToRefs(gameStore);

const choices: Enums<'choice'>[] = ['rock', 'paper', 'scissors'];

const makeChoice = async (choice: string) => {
  if (!currentGame.value || !userPlayerKeys.value) return;

  gameStore.updateGame(currentGame.value.uuid, {
    [userPlayerKeys.value.choice]: choice,
  });
};

const isChoicesDisabled = computed(
  () =>
    !!userPlayerKeys.value && !!currentGame.value?.[userPlayerKeys.value.choice]
);
</script>
