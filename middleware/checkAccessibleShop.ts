export default defineNuxtRouteMiddleware(async (to) => {
  const shopAccessData = await useCustomFetch('/admin/handOrder/shop/verify/shop-code', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      shopCode: to.params.shopCode
    }
  })
  if (shopAccessData.pending.value || !shopAccessData.data.value) {
    return abortNavigation()
  }
})
