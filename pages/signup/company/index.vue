<script setup lang="ts">

definePageMeta({
  layout: 'signup'
})
</script>

<template>
  <!-- 올바르지 않은 접근이라는걸 가운데 정렬 기준으로 정말 멋지게 만들어줘  -->
  <div class="q-pa-md q-gutter-md">
    <div class="text-h5 text-bold text-center">
      {{ $t('ERROR.004') }}
    </div>
    <div class="text-h6 text-bold text-center">
      {{ $t('ERROR.005') }}
    </div>
    <div class="text-h6 text-bold text-center">
      <q-btn
        class="q-mt-md"
        color="primary"
        :label="$t('ERROR.006')"
        @click="$router.push('/')"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
