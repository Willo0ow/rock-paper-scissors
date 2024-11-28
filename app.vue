<template>
  <NuxtPage />
</template>
<script setup lang="ts">
const store = useUserStore();
store.initUser();
</script>
