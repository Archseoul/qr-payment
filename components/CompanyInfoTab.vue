<script setup lang="ts">

import type { CompanyVo } from '~/types'
const props = withDefaults(defineProps<{
  isEditing: boolean;
  companyValue: CompanyVo | null;
  readonly?: boolean;
}>(), {
  isEditing: false,
  readonly: false
})
const emits = defineEmits<{
  'update:companyValue': [CompanyVo | null];
}>()

const tab = ref<string>('member-info')

const company = computed({
  get: () => props.companyValue,
  set: value => emits('update:companyValue', value)
})
</script>

<template>
  <div class="company-info-tab-top">
    <q-card v-if="company" class="q-ma-sm">
      <q-tabs
        v-model="tab"
      >
        <q-tab name="member-info" :label="$t('COMPANY.042')" />
      </q-tabs>
      <q-separator />
      <q-tab-panel name="member-info">
        <CompanyMemberInfo :company="company" />
      </q-tab-panel>
    </q-card>
  </div>
</template>

<style scoped lang="scss">

</style>
