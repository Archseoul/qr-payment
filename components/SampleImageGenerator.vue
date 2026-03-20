<script setup lang="ts">
import type {BigTemplateType, ExtraSmallTemplateType, LabelDeviceType, SmallTemplateType} from '~/types'

const props = defineProps<{
  show: boolean;
  sampleImgSrc: string;
  labelDeviceType: LabelDeviceType;
  extraSmallTemplateType?: ExtraSmallTemplateType;
  smallTemplateType?: SmallTemplateType;
  bigTemplateType?: BigTemplateType;
  upperText?: string;
  lowerText?: string;
}>()

const blackOrWhite = computed(() => {
  if (props.smallTemplateType === 'WHITE') return 'white'
  if (props.extraSmallTemplateType === 'BLACK') return 'black'
  return 'black'
})
</script>

<template>
  <div v-if="labelDeviceType==='2.2/3'" style="width: 120px; height: 250px; position:relative;">
    <q-img
      v-if="show&&(extraSmallTemplateType==='CUSTOM_EXTRA_SMALL')"
      :src="sampleImgSrc"
      style="width: 135px; height: 250px;border: solid 1px black;"
      fit="fill"
    />
    <q-img
      v-else-if="show&&(extraSmallTemplateType==='BLACK')"
      :src="sampleImgSrc"
      style="width: 135px; height: 60px; position:absolute; bottom: 0;"
      fit="fill"
    />
    <div
      v-if="extraSmallTemplateType==='BLACK'"
      class="row justify-center"
      style="width: 135px; height: 250px; top:0; position: absolute; border: solid 1px black;"
      :style="{color: blackOrWhite}"
    >
      <div style="position: absolute; top:40px; background-color: rgba(0,0,0,0.43); width: 60px; height: 60px;" />
      <div style="position: absolute; top: 140px; font-size: 14px; font-weight: 500;" class="column items-center justify-center">
        <div>
          QR로 주문
        </div>
      </div>
      <div style="position: absolute; top: 170px; font-size: 12px; font-weight: bold;">
        ETC_0
      </div>
    </div>
    <div
      v-if="extraSmallTemplateType==='CUSTOM_EXTRA_SMALL'"
      class="row justify-center"
      style="width: 135px; height: 250px; top:0; position: absolute; border: solid 1px black;"
      :style="{color: blackOrWhite}"
    >
      <div style="position: absolute; top: 140px; font-size: 12px; font-weight: bold;">
        ETC_0
      </div>
      <div style="position: absolute; top:40px; background-color: rgba(0,0,0,0.43); width: 60px; height: 60px;" />
    </div>
  </div>
  <div v-else-if="labelDeviceType!=='7.5/4'" style="width: 180px; height: 384px; position:relative;">
    <q-img
      v-if="show&&(smallTemplateType!=='DEFAULT_SMALL')"
      :src="sampleImgSrc"
      style="width: 180px; height: 384px;border: solid 1px black;"
      fit="fill"
    />
    <q-img
      v-else-if="show&&(smallTemplateType==='DEFAULT_SMALL')"
      src="/3csmall.png"
      style="width: 180px; height: 384px; border: solid 1px black;"
      fit="fill"
    />
    <div
      v-if="((smallTemplateType!=='DEFAULT_SMALL')&&(smallTemplateType!=='CUSTOM_SMALL'))"
      class="row justify-center"
      style="width: 180px; height: 384px; top:0; position: absolute; "
      :style="{color: blackOrWhite}"
    >
      <div style="position: absolute; top: 5px; font-size: 8px;">
        NFC
      </div>
      <div style="position: absolute; top: 30px; font-size: 17px; font-weight: bold;">
        ETC_0
      </div>
      <div style="position: absolute; top:63px; background-color: rgba(0,0,0,0.43); width: 100px; height: 100px;" />
      <div style="position: absolute; top: 170px; font-size: 20px; font-weight: 500;" class="column items-center justify-center">
        <div>
          {{ $t('DEVICE_TEMPLATE.024') }}
        </div>
        <div>
          {{ $t('DEVICE_TEMPLATE.025') }}
        </div>
      </div>
    </div>
  </div>
  <div v-else style="width: 240px; height: 400px; position:relative;border:solid 1px black;box-sizing: content-box;">
    <q-img
      v-if="show&&(bigTemplateType==='KIOSK')"
      :src="sampleImgSrc"
      style="width: 240px; height: 200px;position:absolute; bottom: 0;"
      fit="fill"
    />
    <q-img
      v-else-if="show&&(bigTemplateType==='TABLE')"
      :src="sampleImgSrc"
      style="width: 240px; height: 300px;position:absolute; bottom: 0;"
      fit="fill"
    />
    <q-img
      v-else-if="show&&(bigTemplateType==='DEFAULT')"
      src="/4cbig.png"
      style="width: 240px; height: 400px;"
      fit="fill"
    />
    <q-img
      v-else-if="show&&(bigTemplateType==='CUSTOM')"
      :src="sampleImgSrc"
      style="width: 240px; height: 400px;"
      fit="fill"
    />
    <div
      v-if="bigTemplateType==='KIOSK'"
      class="row justify-center"
      style="width: 240px; height: 400px; top:0; position: absolute; "
      :style="{color: blackOrWhite}"
    >
      <div style="position: absolute; top: 20px; font-size: 17px; font-weight: 600;">
        {{ upperText }}
      </div>
      <div style="position: absolute; top: 47px; font-size: 10px; font-weight: 600;">
        {{ lowerText }}
      </div>
      <div style="position: absolute; top: 78px; font-size: 8px; font-weight: bold;">
        ETC_0
      </div>
      <div style="position: absolute; top:100px; background-color: rgba(0,0,0,0.43); width: 80px; height: 80px;" />
    </div>
    <div
      v-if="bigTemplateType==='CUSTOM'"
      class="row justify-center"
      style="width: 240px; height: 400px; top:0; position: absolute; "
      :style="{color: blackOrWhite}"
    >
      <div style="position: absolute; top: 78px; font-size: 8px; font-weight: bold;">
        ETC_0
      </div>
      <div style="position: absolute; top:100px; background-color: rgba(0,0,0,0.43); width: 80px; height: 80px;" />
    </div>
    <div
      v-if="bigTemplateType==='TABLE'"
      class="row justify-center"
      style="width: 240px; height: 400px; top:0; position: absolute; color: white;"
    >
      <div style="position: absolute; top:0; width: 240px; height: 102px; background-color: black;" />
      <div style="position: absolute; top:20px; left:16px; background-color: rgba(255,255,255,0.90); width: 59px; height: 59px;" />
      <div style="position: absolute; width: 150px; height: 50px; top: 23px; left: 83px;line-height: 1.16; font-size: 17px; font-weight: 600;">
        {{ upperText }}
      </div>
      <div style="position: absolute; width: 148px; height: 18px;top: 69px; left: 85px; font-size: 8px; font-weight: 600;">
        {{ lowerText }}
      </div>
      <div style="position: absolute; top: 6px; font-size: 8px; font-weight: bold;">
        ETC_0
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
