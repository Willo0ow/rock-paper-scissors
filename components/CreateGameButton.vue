<template>
  <button @click="startGame">Start game</button>
</template>
<script setup lang="ts">
const props = defineProps<{
  isFromFinishedGame?: boolean;
}>();
const router = useRouter();

const gameStore = useGameStore();
const { currentGame } = storeToRefs(gameStore);

const startGame = async () => {
  await gameStore.getOrCreateGame(
    props.isFromFinishedGame ? currentGame.value?.uuid || '' : ''
  );
  if (currentGame.value?.uuid) {
    router.push(`/${currentGame.value?.uuid}`);
  }
};
</script>
