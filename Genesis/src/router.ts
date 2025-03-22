import { createRouter, createWebHistory } from 'vue-router';
import game from '@/view/game.vue'
import home from '@/view/home.vue'

const routes = [
    { path: '/', component: home, name: 'home' },
    { path: '/game', component: game, name: 'game' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
