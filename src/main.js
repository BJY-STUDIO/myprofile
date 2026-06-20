import '@/styles/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 注册 Material Web 组件
import '@/plugins/material-web'

const app = createApp(App)
app.use(router)
app.mount('#app')
