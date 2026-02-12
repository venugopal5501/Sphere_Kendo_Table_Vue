import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import { registerLicense } from '@progress/kendo-licensing';

// TODO: Replace with your actual Kendo UI license key
// registerLicense('YOUR_LICENSE_KEY_HERE');

Vue.use(Vuetify)

new Vue({
  vuetify: new Vuetify(),
  store,
  router,
  render: h => h(App)
}).$mount('#app')