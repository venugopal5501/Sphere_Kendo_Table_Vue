<template>
    <v-app>
        <h1 style="text-align: center;">Course Information</h1>
        <SphereTable api-endpoint="Course" table-type="actionable" />
    </v-app>
</template>

<script>
import SphereTable from "./SphereTable.vue"
export default {
    name: "CourseDetails",
    components: {
        SphereTable,
    },
}
</script>
