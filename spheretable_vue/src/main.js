import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import Vuetify from 'vuetify'
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import axios from './plugins/Axios'
import '@/css/SphereGlobal.css'
import '@/css/VuetifyOverrides.css'
import './css/MainLayout.css'
import '@/css/SPHERETable.css'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)
Vue.use(axios)
// const vuetify = new Vuetify({
//   // icons: {
//   //   iconfont: 'mdi'
//   // }
// })

new Vue({
  store,
  router,
  // vuetify,
  render: h => h(App)
}).$mount('#app')