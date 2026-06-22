import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import naive from 'naive-ui'
import './style.css'
import App from './App.vue'
import router from './router'
import { useUserStore } from '@/stores/user'

const pinia = createPinia()
setActivePinia(pinia)

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(naive)

const userStore = useUserStore()
userStore.initAuth()

app.mount('#app')
