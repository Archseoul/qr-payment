<script setup lang="ts">
import { ref, onBeforeMount, onBeforeUnmount, reactive } from 'vue'
import { useCustomFetch } from '~/composables/useCustomFetch'
import type { ShopWaitingVo } from '~/types'

const route = useRoute()
const $q = useQuasar()

const shopCode = route.params.shopCode as string

const waitingInfo = ref<ShopWaitingVo>({} as ShopWaitingVo)
const { data: waitingInfoData } = await useCustomFetch<ShopWaitingVo>(`/admin/handOrder/shop/${shopCode}/waiting`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
}) as { data: Ref<ShopWaitingVo> }

waitingInfo.value = waitingInfoData.value ?? {}

/* =========================
   커스텀 스텝퍼 유틸 (길게누르기 포함)
   ========================= */
type StepKey = 'adultMin'|'adultMax'|'kidMin'|'kidMax'
const minMap: Record<StepKey, number> = { adultMin: 0, adultMax: 0, kidMin: 0, kidMax: 0 }
const maxMap: Record<StepKey, number> = { adultMin: 99, adultMax: 99, kidMin: 99, kidMax: 99 }

const stepOnce = (key: StepKey, dir: 1 | -1) => {
  const cur = Number(waitingInfo.value[key] ?? 0)
  const nv = Math.min(maxMap[key], Math.max(minMap[key], cur + dir))
  waitingInfo.value[key] = nv
}

const hold = reactive<{ t: number | null; i: number | null }>({ t: null, i: null })
const startHold = (key: StepKey, dir: 1 | -1) => {
  stepOnce(key, dir)
  stopHold()
  hold.t = window.setTimeout(() => {
    hold.i = window.setInterval(() => stepOnce(key, dir), 60)
  }, 420)
}
const stopHold = () => {
  if (hold.t) { clearTimeout(hold.t); hold.t = null }
  if (hold.i) { clearInterval(hold.i); hold.i = null }
}
onBeforeUnmount(stopHold)

/* =========================
   저장/검증/초기화 (기존 로직 유지)
   ========================= */
const saveWaiting = async () => {
  if (!validation()) { return }
  await customFetch(`/admin/handOrder/shop/${shopCode}/waiting`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(waitingInfo.value),
    onResponse: (context) => {
      if (context.response.status === 200) {
        $q.notify({
          message: $t('WAITING_SETTING.001'),
          color: 'positive',
          icon: 'check'
        })
      }
    }
  })
}

const validation = () => {
  if (waitingInfo.value.useAdult) {
    if (waitingInfo.value.adultMin > waitingInfo.value.adultMax && waitingInfo.value.adultMax !== 0) {
      $q.notify({
        message: $t('WAITING_SETTING.002'),
        color: 'negative',
        icon: 'close'
      })
      return false
    }
  }
  if (waitingInfo.value.useKid) {
    if (waitingInfo.value.kidMin > waitingInfo.value.kidMax && waitingInfo.value.kidMax !== 0) {
      $q.notify({
        message: $t('WAITING_SETTING.003'),
        color: 'negative',
        icon: 'close'
      })
      return false
    }
  }
  return true
}

onBeforeMount(async () => {
  if (!waitingInfo.value) {
    await customFetch(`/admin/handOrder/shop/${shopCode}/waiting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {}
    })
    await refreshNuxtData()
  }
})
</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">{{ $t('SIDE_MENU.012') }}</span>
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col">
      <div class="full-width row wrap justify-start items-start content-start">
        <div class="waiting-setting-box">
          <div class="text-h6 text-bold title-box">
            {{ $t('WAITING_SETTING.004') }}
          </div>
          <div class="column q-mt-md q-ml-lg q-gutter-y-md">
            <div class="col">
              <span class="option-text">{{ $t('WAITING_SETTING.005') }} </span><q-toggle v-model="waitingInfo.useWaiting" />
            </div>
          </div>
          <div class="text-h6 text-bold title-box q-mt-lg">
            {{ $t('WAITING_SETTING.006') }}
          </div>
          <div class="row q-mt-md q-ml-lg q-gutter-y-md">
            <div class="col">
              <span class="option-text">{{ $t('WAITING_SETTING.007') }} </span><q-toggle v-model="waitingInfo.useAdult" />
              <div class="row count-box">
                <div class="col q-mt-lg inline-field">
                  <span class="option-text q-mr-lg">{{ $t('WAITING_SETTING.008') }} </span>

                  <div class="stepper" :data-disabled="!waitingInfo.useAdult">
                    <button
                      type="button"
                      class="btn"
                      :disabled="!waitingInfo.useAdult || waitingInfo.adultMin <= 0"
                      @pointerdown.prevent="startHold('adultMin', -1)"
                      @pointerup="stopHold"
                      @pointercancel="stopHold"
                      @pointerleave="stopHold"
                    >
                      −
                    </button>

                    <div class="value">
                      {{ waitingInfo.adultMin }}
                    </div>

                    <button
                      type="button"
                      class="btn"
                      :disabled="!waitingInfo.useAdult || waitingInfo.adultMin >= 99"
                      @pointerdown.prevent="startHold('adultMin', +1)"
                      @pointerup="stopHold"
                      @pointercancel="stopHold"
                      @pointerleave="stopHold"
                    >
                      ＋
                    </button>
                  </div>
                </div>
                <div class="col q-mt-lg inline-field">
                  <span class="option-text q-mr-lg">{{ $t('WAITING_SETTING.009') }} </span>

                  <div class="stepper" :data-disabled="!waitingInfo.useAdult">
                    <button
                      type="button"
                      class="btn"
                      :disabled="!waitingInfo.useAdult || waitingInfo.adultMax <= 0"
                      @pointerdown.prevent="startHold('adultMax', -1)"
                      @pointerup="stopHold"
                      @pointercancel="stopHold"
                      @pointerleave="stopHold"
                    >
                      −
                    </button>

                    <div class="value">
                      {{ waitingInfo.adultMax }}
                    </div>

                    <button
                      type="button"
                      class="btn"
                      :disabled="!waitingInfo.useAdult || waitingInfo.adultMax >= 99"
                      @pointerdown.prevent="startHold('adultMax', +1)"
                      @pointerup="stopHold"
                      @pointercancel="stopHold"
                      @pointerleave="stopHold"
                    >
                      ＋
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 아동 -->
          <div class="row q-mt-md q-ml-lg q-gutter-y-md">
            <div class="col">
              <span class="option-text">{{ $t('WAITING_SETTING.010') }} </span><q-toggle v-model="waitingInfo.useKid" />
              <div class="row count-box">
                <div class="col q-mt-lg inline-field">
                  <span class="option-text q-mr-lg">{{ $t('WAITING_SETTING.008') }} </span>

                  <div class="stepper" :data-disabled="!waitingInfo.useKid">
                    <button
                      type="button"
                      class="btn"
                      :disabled="!waitingInfo.useKid || waitingInfo.kidMin <= 0"
                      @pointerdown.prevent="startHold('kidMin', -1)"
                      @pointerup="stopHold"
                      @pointercancel="stopHold"
                      @pointerleave="stopHold"
                    >
                      −
                    </button>

                    <div class="value">
                      {{ waitingInfo.kidMin }}
                    </div>

                    <button
                      type="button"
                      class="btn"
                      :disabled="!waitingInfo.useKid || waitingInfo.kidMin >= 99"
                      @pointerdown.prevent="startHold('kidMin', +1)"
                      @pointerup="stopHold"
                      @pointercancel="stopHold"
                      @pointerleave="stopHold"
                    >
                      ＋
                    </button>
                  </div>
                </div>

                <div class="col q-mt-lg inline-field">
                  <span class="option-text q-mr-lg">{{ $t('WAITING_SETTING.009') }} </span>

                  <div class="stepper" :data-disabled="!waitingInfo.useKid">
                    <button
                      type="button"
                      class="btn"
                      :disabled="!waitingInfo.useKid || waitingInfo.kidMax <= 0"
                      @pointerdown.prevent="startHold('kidMax', -1)"
                      @pointerup="stopHold"
                      @pointercancel="stopHold"
                      @pointerleave="stopHold"
                    >
                      −
                    </button>

                    <div class="value">
                      {{ waitingInfo.kidMax }}
                    </div>

                    <button
                      type="button"
                      class="btn"
                      :disabled="!waitingInfo.useKid || waitingInfo.kidMax >= 99"
                      @pointerdown.prevent="startHold('kidMax', +1)"
                      @pointerup="stopHold"
                      @pointercancel="stopHold"
                      @pointerleave="stopHold"
                    >
                      ＋
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="q-mt-lg">
        <q-btn :label="$t('COMMON.009')" color="primary" class="q-mt-md float-right q-mr-md" @click="saveWaiting" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.content-body {
  .waiting-setting-box{
    width: 100%;
    .box-style {
      width: 48%;
      margin-bottom: 20px;
    }

    .title-box {
      font-size: 1.5rem;
      color: #ff8b4a;
      font-weight: bold;
      line-height: 1.8;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .option-text{
      font-size: 1.1rem;
      font-weight: 700;
    }
    .count-box{
      gap: 10%;
    }

    /* 라벨 + 스텝퍼를 한 줄로 */
    .inline-field{
      display:flex; align-items:center; gap:12px;
      /* Quasar .col의 flex 확장을 막아 길게 늘어지는 것 방지 */
      width:auto; flex:0 0 auto;
    }

    /* 숫자 스텝퍼 (컴팩트) */
    .stepper{
      --w: 124px;            /* 전체 너비 */
      --btn: 32px;           /* 버튼 한 변 길이 */
      --val: 34px;           /* 숫자 영역 너비 */

      display:flex; align-items:center; gap:8px;
      width: var(--w);       /* ← 고정 폭 */
      min-width: var(--w);
      background:#fff; border-radius:30px; border:1.5px solid #878787;
      height:34px; padding:0 6px;
      user-select:none; transition:opacity .15s ease, filter .15s ease;
      flex:0 0 var(--w);     /* 부모 flex 컨텍스트에서도 확장 금지 */
    }

    .stepper[data-disabled="true"]{
      opacity:.55; filter:grayscale(.15); pointer-events:none;
    }

    .stepper .value{
      width: var(--val); text-align:center;
      font-size:14px; font-weight:700; color:#F3610B;
    }

    .stepper .btn{
      width: var(--btn); height: var(--btn);
      border:0; border-radius:999px; background:#fff;
      display:grid; place-items:center;
      font-weight:900; font-size:16px; color:#333; cursor:pointer;
    }
    .stepper .btn:disabled{ opacity:.35; cursor:not-allowed; }
    .stepper .btn:active{ transform:translateY(1px); }

    /* 좁은 화면에서는 살짝 더 작게 */
    @media (max-width: 640px){
      .stepper{ --w: 112px; --btn: 30px; --val: 30px; height:32px; }
    }
  }

}
</style>
