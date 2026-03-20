<script setup lang="ts">
const route = useRoute()
const shopCode = route.params.shopCode

// /order/pg/[shopCode]로 접근 시 /order/desktop/[shopCode]로 리다이렉트
navigateTo(`/order/desktop/${shopCode}`, { redirectCode: 301 })
</script>

<template>
  <div />
</template>
