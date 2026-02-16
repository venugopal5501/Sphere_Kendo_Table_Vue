<template>
    <v-app>
        <h1 style="text-align: center;">Student Information</h1>
        <SphereTable api-endpoint="Student" table-type="simple" />
    </v-app>
</template>

<script>
import SphereTable from "./SphereTable.vue"
export default {
    name: "StudentDetails",
    components: {
        SphereTable,
    },
}
</script>
