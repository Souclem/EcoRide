import   './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useUserStore } from '@/store/index.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// Restaurer l'utilisateur depuis localStorage au démarrage
const userStore = useUserStore()
userStore.initFromLocalStorage()

app.mount('#app')
