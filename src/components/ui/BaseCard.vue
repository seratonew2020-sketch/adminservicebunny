<script setup>
defineProps({
  hover: {
    type: Boolean,
    default: true
  },
  padding: {
    type: String,
    default: 'pa-6' // Vuetify padding class
  }
})
</script>

<template>
  <v-card
    class="transition-swing"
    :class="[padding, { 'hover-card': hover }]"
    color="surface"
    border
  >
    <slot></slot>
  </v-card>
</template>

<style scoped>
.hover-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.1), 0 4px 6px -2px rgba(99, 102, 241, 0.05) !important;
  border-color: rgba(99, 102, 241, 0.3) !important;
}
</style>
