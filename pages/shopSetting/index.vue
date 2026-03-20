<script setup lang="ts">
import { useQuasar } from 'quasar'
import { ShopSelectModal } from '#components'
import type { ShopInfoVo } from '~/types'

const shopList = useState('shopList', ():ShopInfoVo[]|undefined => [])
const shouldRedirectToLogin = useState('shouldRedirectToLogin', () => false)

const { pending, data, error } = await useCustomFetch<ShopInfoVo[]>('/admin' +
    '/handOrder/v2/shop', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

shopList.value = data.value ?? []

// 클라이언트에서 redirect 처리
if (process.client && shouldRedirectToLogin.value) {
  navigateTo('/login')
}

// 에러 처리
if (error.value && process.client) {
  if (error.value.statusCode === 401 || error.value.status === 401) {
    navigateTo('/login')
  }
}

const $q = useQuasar()
const showSelectShop = () => {
  // shopList가 비어있으면 모달을 띄우지 않음
  if (!shopList.value || shopList.value.length === 0) {
    return
  }

  $q.dialog({
    component: ShopSelectModal,
    componentProps: {
      shopList: shopList.value,
      routeString: '/shopSetting/'
    }
  })
}

if (!pending.value) {
  showSelectShop()
}
</script>

<template>
  <div />
</template>

<style scoped lang="scss">

</style>
