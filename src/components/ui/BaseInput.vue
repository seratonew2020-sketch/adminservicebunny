<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="w-100">
    <label v-if="label" class="text-caption text-medium-emphasis mb-1 d-block font-weight-medium">
      {{ label }}
    </label>
    <v-text-field
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :type="type"
      :placeholder="placeholder"
      :error-messages="error"
      :prepend-inner-icon="icon"
      variant="outlined"
      bg-color="surface-light"
      density="comfortable"
      hide-details="auto"
    ></v-text-field>
  </div>
</template>
