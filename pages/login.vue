<script setup lang="ts">
import { storeToRefs } from 'pinia'
import isElectron from 'is-electron'
import { useAuthStore } from '~/store/auth'
import { customFetch } from '~/composables/customFetch'
import type { AdminMemberVo } from '~/types'

const { authenticateUser, setUserInfo, authenticateDesktopUser } = useAuthStore()

const { authenticated } = storeToRefs(useAuthStore())

const $q = useQuasar()

definePageMeta({
  layout: 'login'
})

const user = ref({
  id: '',
  password: ''
})

const router = useRouter()

const login = async () => {
  if (isElectron()) {
    await electronLogin()
  } else {
    await browserLogin()
  }
}

const browserLogin = async () => {
  // 로그인 시도 전에 모든 Nuxt 캐시 초기화 (SSR 포함)
  clearNuxtData()

  await authenticateUser(user.value)
  if (authenticated.value) {
    // 토큰이 완전히 설정될 때까지 대기
    await nextTick()

    const data = await customFetch('/admin/handOrder/user-info', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    setUserInfo(data as AdminMemberVo)

    // 상태 업데이트 완료 대기
    await nextTick()

    const userInfoData = data as AdminMemberVo
    const shopCode = userInfoData.shopInfo?.shopCode || null
    if (shopCode) {
      await router.push(`/order/desktop/${shopCode}`)
    } else {
      await router.push('/login')
    }
  } else {
    $q.dialog({
      title: $t('LOGIN.006'),
      message: $t('LOGIN.007'),
      ok: $t('LOGIN.008')
    })
  }
}

const electronLogin = async () => {
  // 로그인 시도 전에 모든 Nuxt 캐시 초기화 (SSR 포함)
  clearNuxtData()

  await authenticateDesktopUser(user.value)
  if (authenticated.value) {
    // 토큰이 완전히 설정될 때까지 대기
    await nextTick()

    const data = await customFetch('/admin/handOrder/user-info', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    setUserInfo(data as AdminMemberVo)

    // 상태 업데이트 완료 대기
    await nextTick()

    const { value } = useCookie('token')
    const userInfo = data as AdminMemberVo
    const shopCode = userInfo.shopInfo ? userInfo?.shopInfo.shopCode : null
    await window.electronAPI.loginApp(value, shopCode)/**/
    userInfo.userType === 'admin' ? await router.push('/order') : await router.push('/order/desktop/' + userInfo.shopInfo.shopCode)
  }
}

</script>

<template>
  <div class="login-content q-pa-md full-height flex justify-center content-center">
    <q-img src="/login_back.png" class="login_background" />
    <q-card class="login-card" style="width: 380px; height: 470px;">
      <q-card-section class="text-h5 text-bold text-center q-mt-md">
        <q-img src="handorder_logo_y.png" width="180px" height="97px" fit="scale-down" />
      </q-card-section>
      <q-card-section class="q-mt-lg flex justify-center">
        <q-form class="login-form" @submit="login">
          <div class="q-mb-sm column">
            <span class="form-text q-mb-sm">{{ $t('LOGIN.001') }}</span>
            <q-input
              v-model="user.id"
              :placeholder="$t('LOGIN.002')"
              :rules="[val => val && val.length > 0 || $t('LOGIN.002')]"
              input-class="login-input"
              outlined
              class="login-input-box"
            />
          </div>
          <div class="column">
            <span class="form-text q-mb-sm">{{ $t('LOGIN.003') }}</span>
            <q-input
              v-model="user.password"
              type="password"
              :placeholder="$t('LOGIN.004')"
              :rules="[val => val && val.length > 0 || $t('LOGIN.004')]"
              outlined
              class="login-input-box"
              input-class="login-input"
            />
          </div>
          <div class="text-center">
            <q-btn type="submit" :label="$t('LOGIN.005')" color="primary" class="q-mt-md login-button" style="width: 316px;height: 48px" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
    <div class="q-gutter-md" style="max-width: 300px" />
  </div>
</template>

<style scoped lang="scss">
:root{
  --grayscale-extra-light: #FCFDFE;
}

.login_background{
  position: absolute;
  width: 100%;
  height: 100%;
}
.login-form{
  width: 316px;
  .form-text{
    color: #5C5C5C;
    font-family: Noto Sans KR;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
    line-height: normal;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }
  .login-input-box{
    :deep(.login-input){
      height: 42px;
      color: #64748B;
      font-family: Noto Sans KR;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 20px; /* 142.857% */
    }
    :deep(.q-field__control){
      height: 42px;
      border-radius: 8px;
      background: var(--grayscale-extra-light, #FCFDFE);
    }
    :deep(.q-field__label){
      top:13px;
      font-size:14px;
    }
    :deep(.q-field__marginal){
      height: 42px;
    }
  }
  .login-button{
    box-shadow: 0px 4px 12px 0px rgba(55, 81, 255, 0.24);
  }
}
</style>
