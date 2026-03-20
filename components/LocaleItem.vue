<script setup lang="ts">
import type { LocaleCodeVo } from '~/types'

const props = defineProps<{
  locale: LocaleCodeVo
  localeNameValue: string
}>()
const emits = defineEmits<{
  'update:localeNameValue': [string],
  'delete': []
}>()

const localeName = computed({
  get: () => props.locale.localeName,
  set: (value: string) => {
    emits('update:localeNameValue', value)
  }

})

const isEditing = ref(false)
defineExpose({
  isEditing
})
</script>

<template>
  <q-item
    ref="localeItemList"
    draggable="true"
    class="relative-parent"
  >
    <slot />
    <q-item-section avatar>
      <q-avatar color="primary" text-color="white">
        {{ locale.localeCode }}
      </q-avatar>
    </q-item-section>
    <q-item-section>
      <q-item-label>
        <template v-if="!isEditing">
          {{ locale.localeName }}
        </template>
        <template v-else>
          <q-input
            v-model="localeName"
            dense
            outlined
          />
        </template>
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <div class="text-grey-6 q-gutter-xs">
        <q-btn
          class="gt-xs"
          size="12px"
          ripple
          flat
          dense
          round
          icon="delete"
          @click="$emit('delete')"
        />
        <q-btn
          class="gt-xs"
          size="12px"
          ripple
          flat
          dense
          round
          :icon="isEditing ? 'check':'edit'"
          @click="isEditing = !isEditing"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">

</style>
