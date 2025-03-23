<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
  const route = useRoute();

  const isShowHomeButton = ref(false);
  function reloadPage() {
    window.location.reload();
  }
</script>

<template>
  <router-link v-if="route.name !== 'home'" class="home-button positive-button" to="/" :onclick="reloadPage">Home</router-link>
  <router-view ></router-view>
</template>

<style scoped>
.home-button{
  position: absolute;
  top: 10px;
  left: 10px;
  text-decoration: none;
  color: unset;
  padding: 5px 10px;
  border-radius: 5px;
  z-index: 1;
}
</style>

