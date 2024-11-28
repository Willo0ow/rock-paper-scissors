<template>
  <div>
    <h3>Score</h3>
    <p>Turn: {{ currentTurn }}</p>
    <p>You: {{ score.user }}</p>
    <p>Opponent: {{ score.opponent }}</p>
  </div>
</template>
<script setup lang="ts">
const { currentTurn, score } = storeToRefs(useGameStore());
</script>
