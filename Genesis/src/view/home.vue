<template>
  <div class="title">Genesis</div>
  <div class="content-container">
    <router-link class="start-button" to="/game">Start Game</router-link>
  </div>
</template>

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
  justify-content: center;
  align-items: center;
  margin-top: 50px;
}
</style>
