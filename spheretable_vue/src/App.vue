<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script>
import SphereTable from "./components/SphereTable.vue"

export default {
  components: {
    SphereTable,
  },
}
</script>
