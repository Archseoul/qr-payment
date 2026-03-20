<template>
  <div
    class="toggle-wrap"
    :class="{ 'is-active': modelValue }"
    @click="toggle"
    role="switch"
    :aria-checked="modelValue"
    tabindex="0"
    @keydown.space.prevent="toggle"
  >
    <div class="toggle-thumb" />
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>

<style scoped>
.toggle-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 35px;
  height: 20px;
  border-radius: 999px;
  background-color: #d9d9d9;
  cursor: pointer;
  transition: background-color 0.25s ease;
  flex-shrink: 0;
}

.toggle-wrap:focus-visible {
  outline: 2px solid #fa8c4f;
  outline-offset: 2px;
}

.toggle-wrap.is-active {
  background-color: #fa8c4f;
}

.toggle-thumb {
  position: absolute;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s ease;
}

.toggle-wrap.is-active .toggle-thumb {
  transform: translateX(17px);
}
</style>
