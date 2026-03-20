<script setup lang="ts">
import useDayjs from 'dayjs'
import type { HoCategoryVo, HoShopMenuboardVo } from '~/types'

const props = defineProps<{
  menuboard: HoShopMenuboardVo,
  categoryList: HoCategoryVo[] | null,
  currentMenuboardYn : boolean
}>()

const dayjs = useDayjs

const menuboard = ref<HoShopMenuboardVo>(props.menuboard)

</script>

<template>
  <q-card
    bordered
    class="cursor-pointer menuboard-card"
    :class="props.currentMenuboardYn ? 'current-menuboard-card':''"
  >
    <template v-if="props.currentMenuboardYn">
      <div class="current-menuboard">
        <span class="current-text">{{ $t('SHOP_MENUBOARD.008') }}</span>
      </div>
    </template>
    <q-card-section style="padding-bottom:3px;">
      <div class="text-h6 text-bold row justify-between menuboard_name" style="">
        {{ menuboard.priority + 1 }}. {{ menuboard.menuboardName }}
        <q-chip
          dense
          :icon="menuboard.useYn ? 'check' : 'close'"
          :color="menuboard.useYn ? 'primary' : 'grey'"
          text-color="white"
          size="sm"
          style="margin-top:8px"
        >
          {{ menuboard.useYn ? $t('COMMON.075') : $t('COMMON.055') }}
        </q-chip>
      </div>
    </q-card-section>
    <q-card-section style="padding-top:3px;">
      <q-item dense>
        <q-item-section side>
          <q-chip
            :label="menuboard.everydayYn ? $t('COMMON.065') : menuboard.dayOfWeekList.sort((a, b) => a - b).map((day) => dayjs().day(day-1).format('dd')).join(', ')"
            dense
            size="md"
          />
          <!-- ({{ menuboard.everydayYn ? '매일' : menuboard.dayOfWeekList.sort((a, b) => a - b).map((day) => dayjs().day(day-1).format('dd')).join(', ') }}) -->
        </q-item-section>
        <q-item-section>
          {{ dayjs(menuboard.startTime, 'HHmm').format('HH:mm') }} ~ {{ dayjs(menuboard.endTime, 'HHmm').format('HH:mm') }}
        </q-item-section>
      </q-item>
      <q-item dense class="justify-center">
        {{ $t('SHOP_MENUBOARD.009') }} : {{ menuboard.menuSeqList.length }}
      </q-item>
      <!-- <q-separator class="q-my-sm" />
       <q-card-section style="padding:2px;height:100%">
        <q-list dense style="max-width:100%;">
          <q-item dense class="text-bold justify-center" style="padding:0px">
            선택 메뉴 수량 : {{ menuboard.menuSeqList.length }}개
          </q-item>
          <q-scroll-area style="max-width:100%; height:110px">
            <div>
              {{ allMenuList.find((menu) => menu.menuSeq === menuboard.menuSeqList[0])?.menuName + (menuboard.menuSeqList.length > 1 ? ' 외 ' + (menuboard.menuSeqList.length - 1) + '개' : '') }}
            </div>
            <q-item
              v-for="menuSeq in menuboard.menuSeqList"
              :key="menuSeq"
              dense
              class="menuboard_name"
              style="display: inline-block; min-width:100%"
            >
              {{ allMenuList.find((m) => m.menuSeq === menuSeq)?.menuName }}
            </q-item>
          </q-scroll-area>
        </q-list>
      </q-card-section> -->
    </q-card-section>
  </q-card>
</template>

<style lang="css">
.menuboard-card {
min-width:200px;
max-width:300px;
max-height:130px;
margin-bottom:15px;

}
.menuboard_name{
  max-width:180px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.current-menuboard{
    font-weight: 600;
    text-align: center;
    position: absolute;
    right: -10px;
    top: -10px;
    color: #fff;
    /* color:var(--handorder-color); */
    font-size: 1em;

    >.current-text{
      background-color: #02ca12;
      padding: 5px;
      border-radius: 10px;
    }
  }
  .current-menuboard-card {
    border-color:#02ca12;
    border-width: 2px;
  }

</style>
