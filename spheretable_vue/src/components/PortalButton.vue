<template>
  <button class="portal-btn">
    {{ label }}
  </button>
</template>

<script>
export default {
  name: "PortalButton",
  props: {
    label: {
      type: String,
      required: true
    }
  }
}
</script>

<style scoped>
.portal-btn {
  padding: 12px 25px;
  margin: 10px;
  border: none;
  background-color: #007bff;
  color: white;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
}

.portal-btn:hover {
  background-color: #0056b3;
}
</style>
