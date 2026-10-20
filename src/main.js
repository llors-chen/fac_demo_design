import { createApp } from 'vue'
import App from './App.vue'
import { revealDirective } from './directives/reveal'
import './styles/base.css'

createApp(App).directive('reveal', revealDirective).mount('#app')
