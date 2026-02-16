<template>
  <div class="student">
    <h1>Student Management Portal</h1>
    <div class="btn-container">
      <router-link to="/student" class="nav-btn">Student Details</router-link>
      <router-link to="/course" class="nav-btn">Course Details</router-link>
      <router-link to="/staff" class="nav-btn">Staff Details</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "studentPortal"
};
</script>

<style scoped>
.student {
  text-align: center;
  margin-top: 5%;
}

h1 {
  margin-bottom: 30px;
}

.btn-container {
  margin-bottom: 30px;
}

.nav-btn {
  display: inline-block;
  padding: 12px 25px;
  margin: 10px;
  text-decoration: none;
  background-color: #007bff;
  color: white;
  font-size: 16px;
  border-radius: 6px;
  transition: 0.3s;
}

.nav-btn:hover {
  background-color: #0056b3;
}
</style>
