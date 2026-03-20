<script setup lang="ts">
import type { ShopInfoVo } from '~/types'

const $q = useQuasar()

const props = defineProps<{
  modelValue : ShopInfoVo;
}>()

const shop = computed(() => props.modelValue)

// const readonlyFlag = computed(() => shop.value.isDeliveryUse)

const kcpCertFile = inject<Ref<File | null>>('kcpCertFile')
const kcpCancelCertFile = inject<Ref<File | null>>('kcpCancelCertFile')

const onChangeCertFile = (file: File|null) => {
  if (file && kcpCertFile) { kcpCertFile.value = file }
}

const onCancelCertFile = (file: File|null) => {
  if (file && kcpCancelCertFile) { kcpCancelCertFile.value = file }
}

const getFile = async () => {
  let fileName
  const file = await customFetch<Blob>('/admin/handOrder/shop/' + shop.value.shopCode + '/kcp-cert', {
    method: 'GET',
    responseType: 'blob',
    onResponseError: (ctx) => {
      $q.notify({
        type: 'negative',
        message: `인증서 다운로드에 실패하였습니다. 상태 코드: ${ctx.response.status} ${ctx.response.statusText}`
      })
    },
    onResponse: (context) => {
      fileName = context.response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
      // url decode
      fileName = decodeURIComponent(fileName ?? '')
    }
  })
  const url = window.URL.createObjectURL(file)
  const link = document.createElement('a')
  link.setAttribute('download', fileName ?? '인증서')
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
const getCancelFile = async () => {
  let fileName
  const file = await customFetch<Blob>('/admin/handOrder/shop/' + shop.value.shopCode + '/kcp-cancel-cert', {
    method: 'GET',
    responseType: 'blob',
    onResponseError: (ctx) => {
      $q.notify({
        type: 'negative',
        message: `인증서 다운로드에 실패하였습니다. 상태 코드: ${ctx.response.status} ${ctx.response.statusText}`
      })
    },
    onResponse: (context) => {
      fileName = context.response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
      // url decode
      fileName = decodeURIComponent(fileName ?? '')
    }
  })
  if (!file) {
    return
  }
  const url = window.URL.createObjectURL(file)
  const link = document.createElement('a')
  link.setAttribute('download', fileName ?? '인증서')
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <template v-if="shop.deliveryPgCode==='hecto' && shop.hectoPaymentInfo">
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        상점아이디
      </div>

      <div>
        <q-input
          v-model="shop.hectoPaymentInfo.mid"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        Privacy Key
      </div>
      <div>
        <q-input
          v-model="shop.hectoPaymentInfo.privacyKey"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        Hash Key
      </div>
      <div>
        <q-input
          v-model="shop.hectoPaymentInfo.hashKey"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
  </template>
  <template v-if="shop.deliveryPgCode==='kis' && shop.kisPaymentInfo">
    <div class="input-wrap">
      <div class=" flex justify-center items-center bg-grey-3">
        상점아이디
      </div>
      <div>
        <q-input
          v-model="shop.kisPaymentInfo.mid"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        Merchant Key
      </div>
      <div>
        <q-input
          v-model="shop.kisPaymentInfo.merchantKey"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
  </template>
  <template v-if="shop.deliveryPgCode==='smartro' && shop.smartroPaymentInfo">
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        상점아이디
      </div>
      <div>
        <q-input
          v-model="shop.smartroPaymentInfo.mid"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        Merchant Key
      </div>
      <div>
        <q-input
          v-model="shop.smartroPaymentInfo.merchantKey"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        결제취소 비밀번호
      </div>
      <div>
        <q-input
          v-model="shop.smartroPaymentInfo.cancelPassword"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
  </template>
  <template v-if="shop.deliveryPgCode==='nice' && shop.nicePaymentInfo">
    <div class="input-wrap">
      <div class=" flex justify-center items-center bg-grey-3">
        mid
      </div>
      <div>
        <q-input
          v-model="shop.nicePaymentInfo.mid"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        Merchant Key
      </div>
      <div>
        <q-input
          v-model="shop.nicePaymentInfo.merchantKey"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
  </template>
  <template v-if="shop.deliveryPgCode==='kcp' && shop.kcpPaymentInfo">
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        site code
      </div>
      <div>
        <q-input
          v-model="shop.kcpPaymentInfo.siteCd"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        인증서
      </div>
      <div class="file-wrap">
        <q-file
          v-model="kcpCertFile"
          :label="shop.kcpPaymentInfo.certFileName ?? '인증서 파일'"
          dense
          rounded
          outlined
          color="primary"
          :max-files="1"
          @update:model-value="onChangeCertFile"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>
        <q-chip
          v-if="shop.kcpPaymentInfo.certFilePath"
          clickable
          color="grey-5"
          text-color="white"
          :class="!shop.isDeliveryUse ||'width-20'"
          @click="getFile()"
        >
          <q-icon name="attachment" />
          <span> {{ shop.kcpPaymentInfo.certFileName }} </span>
        </q-chip>
      </div>
    </div>
    <div class="input-wrap">
      <div class=" flex justify-center items-center bg-grey-3">
        취소용 인증서
      </div>
      <div class="file-wrap">
        <q-file
          v-model="kcpCancelCertFile"
          :label="shop.kcpPaymentInfo.cancelCertName ?? '인증서 파일'"
          dense
          rounded
          outlined
          color="primary"
          :max-files="1"
          @update:model-value="onCancelCertFile"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>
        <q-chip
          v-if="shop.kcpPaymentInfo.cancelCertPath"
          clickable
          color="grey-5"
          text-color="white"
          :class="!shop.isDeliveryUse ||'width-20'"
          @click="getCancelFile"
        >
          <q-icon name="attachment" />
          <span> {{ shop.kcpPaymentInfo.cancelCertName }} </span>
        </q-chip>
      </div>
    </div>
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        결제취소 비밀번호
      </div>
      <div>
        <q-input
          v-model="shop.kcpPaymentInfo.certPassword"
          outlined
          dense
          input-style="text-align: center;"
        />
      </div>
    </div>
  </template>

  <template v-if="shop.deliveryPgCode==='mainpay' && shop.mainpayPaymentInfo">
    <div class="input-wrap">
      <div class=" flex justify-center items-center bg-grey-3">
        mbrNo
      </div>
      <div>
        <q-input
            v-model="shop.mainpayPaymentInfo.mbrNo"
            outlined
            dense
            input-style="text-align: center;"
        />
      </div>
    </div>
    <div class="input-wrap">
      <div class="flex justify-center items-center bg-grey-3">
        API Key
      </div>
      <div>
        <q-input
            v-model="shop.mainpayPaymentInfo.apiKey"
            outlined
            dense
            input-style="text-align: center;"
        />
      </div>
    </div>
  </template>
</template>

<style scoped lang="scss">
.input-wrap {
  display: flex;
  margin-bottom: 10px;
  div:nth-child(1) {
    width: 25%;
  }

  div:nth-child(2) {
    flex-grow: 1;
  }

  .file-wrap{
    display: flex;

    >label{
      width: 80%;
    }

    >div{
      height: inherit;
      flex-grow: 1;
      border:1px solid darkgrey;
      overflow: hidden;
    }
    .width-20{
      max-width: 20%;
    }
  }
}
</style>
