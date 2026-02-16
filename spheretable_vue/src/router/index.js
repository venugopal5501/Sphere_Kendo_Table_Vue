import Vue from "vue";
import Router from "vue-router";
import CourseDetails from "@/components/CourseDetails.vue"
import StudentPortal from "@/components/StudentPortal.vue";
import StudentDetails from "@/components/StudentDetails.vue";
import StaffDetails from "@/components/ProfessorsDetails.vue"

Vue.use(Router);

export default new Router({
  mode: "history",
  routes: [
    {
      path: "/",
      name: "home",
      component: StudentPortal  
    },
    {
      path: "/student",
      name: "student",
      component: StudentDetails
    },
    {
      path: "/course",
      name: "course",
      component: CourseDetails
    },
     {
      path: "/staff",
      name: "staff",
      component: StaffDetails
    }
  ]
});
