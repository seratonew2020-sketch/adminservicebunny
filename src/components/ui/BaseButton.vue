<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'success'].includes(value)
  },
  block: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  to: {
    type: [String, Object],
    default: null
  }
})

defineEmits(['click'])

// Map variants to specific colors/gradients if needed, or use Vuetify's color system
const getColor = (variant) => {
  switch (variant) {
    case 'primary': return 'primary'; // Will use our Indigo primary
    case 'secondary': return 'secondary';
    case 'danger': return 'error';
    case 'success': return 'success';
    default: return 'primary';
  }
}
</script>

<template>
  <v-btn
    :color="getColor(variant)"
    :block="block"
    :loading="loading"
    :to="to"
    @click="$emit('click', $event)"
    class="text-none font-weight-medium"
    :class="{ 'bg-gradient-primary': variant === 'primary' }"
    height="44"
    elevation="0"
  >
    <slot></slot>
  </v-btn>
</template>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(to right, #6366F1, #8B5CF6) !important;
  color: white !important;
}
</style>
