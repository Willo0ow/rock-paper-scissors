<template>
  <button @click="startGame">Start game</button>
</template>
<script setup lang="ts">
const props = defineProps<{
  secondPlayerId?: string;
  currentGameUuid?: string;
}>();
const router = useRouter();
const { createAnonymousUser } = useAnonymousUser();

const { createGame, currentGame } = useCreateGame();
const startGame = async () => {
  await createAnonymousUser();
  await createGame(props.currentGameUuid || '');
  if (currentGame.value?.uuid) {
    router.push(`/${currentGame.value?.uuid}`);
  }
};
</script>
