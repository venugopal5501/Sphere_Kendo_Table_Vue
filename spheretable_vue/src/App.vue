<template>
  <v-app>
    <SphereTable :columns="columns" :data-items="dataItems" table-type="simple" :page-length="pageLength" />
  </v-app>
</template>

<script>
import SphereTable from './components/SphereTable.vue';

export default {
  name: 'App',
  components: {
    SphereTable
  },

  data() {
    return {
      pageLength: 10,
      columns: [],
      dataItems: []
    }
  },

  created() {
    this.columns = [
      { field: 'id', title: 'ID' },
      { field: 'name', title: 'Name' },
      { field: 'email', title: 'Email' },
      { field: 'subject', title: 'Subject' }
    ]
    this.dataItems = [
      { id: 1, name: 'Venugopal', email: 'venu@gmail.com', subject: 'Tamil' },
      { id: 2, name: 'Rahul', email: 'rahul@gmail.com', subject: 'Tamil' },
      { id: 3, name: 'Anjali', email: 'anjali@gmail.com' , subject: 'Tamil'}
    ]
  }
}
</script>
