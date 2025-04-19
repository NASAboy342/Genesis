<template>
  <div class="title">Genesis</div>
  <div class="content-container">
    <input class="init-neuroal-network-input" type="text" placeholder="Neural network in Json String" v-model="neuralNetworkInJsonString" />
    <router-link class="start-button" :to="{
      path: '/game',
      query: { neuralNetworkInJsonString: neuralNetworkInJsonString }
    }">Start Game</router-link>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const neuralNetworkInJsonString = ref<string>("");
</script>

<style scoped>
.title {
  font-size: 50px;
  text-align: center;
  margin-top: 50px;
}
.start-button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  text-decoration: none;
  display: inline-block;
  border-radius: 4px;
  margin-top: 20px;
  cursor: pointer;
}
.start-button:hover {
  background-color: #45a049;
}
.content-container {
  display: flex;
  flex-direction: column;;
  justify-content: center;
  align-items: center;
  margin-top: 50px;
}
.init-neuroal-network-input{
  width: 300px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 20px;
}
.init-neuroal-network-input:focus {
  border-color: #4caf50;
  outline: none;
}
</style>
