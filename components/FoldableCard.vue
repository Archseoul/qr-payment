<script setup lang="ts">
const props = defineProps<{
  title: string
}>()

const isVisible = ref(false)
</script>

<template>
  <div class="q-pa-md">
    <q-card class="full-width">
      <q-item
        clickable
        class="q-pa-md"
        active-class="bg-grey-1"
        @click="isVisible = !isVisible"
      >
        <q-item-section>
          <q-item-label class="text-h5 text-weight-medium text-grey-9">
            {{ props.title }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon
            :name="isVisible ? 'expand_less' : 'expand_more'"
            size="sm"
            class="text-grey-7"
          />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-slide-transition>
        <div v-show="isVisible">
          <slot />
        </div>
      </q-slide-transition>
    </q-card>
  </div>
</template>

<style scoped lang="scss">

</style>
