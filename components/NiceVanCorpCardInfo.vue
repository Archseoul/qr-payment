<script setup lang="ts">
import { QForm, useQuasar } from 'quasar'
import type { NiceVanCorpAffObj } from '~/types'

const props = defineProps<{
  shopSeq:number,
  isCorp: boolean,
  affForm:QForm | null,
  corpAffObj: {cardName:string, affObj: NiceVanCorpAffObj}[]
}>()

const emits = defineEmits<{
  'update:corp-aff-obj': [{cardName:string, affObj: NiceVanCorpAffObj}[]],
  'update:aff-form': [QForm | null]
}>()

const $q = useQuasar()

const shopSeq = props.shopSeq

const cardList = ref([
  { label: '비씨카드', value: 'bcObj' },
  { label: '국민카드', value: 'kbObj' },
  { label: '하나(구외환)카드', value: 'hnObj' },
  { label: '삼성카드', value: 'ssObj' },
  { label: '신한(구LG)', value: 'shObj' },
  { label: '현대카드', value: 'hdObj' },
  { label: 'NH카드', value: 'nhObj' },
  { label: '씨티카드(구.한미)', value: 'ctObj' },
  { label: '수협카드', value: 'suObj' },
  { label: '제주비자', value: 'jjObj' },
  { label: '광주비자', value: 'kjObj' },
  { label: '전북비자', value: 'jbObj' },
  { label: '롯데아멕스카드', value: 'ldObj' },
  { label: '우리카드', value: 'wrObj' }
])

const acquireMethodCodeList = ref([
  { label: 'Data_Draft_Capture', value: 'DDC' },
  { label: 'Data_Sign_Captue(DESC)', value: 'DSC' },
  { label: 'Electronics_Data_Capture(BCC)', value: 'EDC' },
  { label: 'Data_Sign_captue(BCC)', value: 'ESC' },
  { label: '창고_전표매입', value: 'ETC' }
])

// const cardObjList = ref<{cardName: string, affObj: NiceVanCorpAffObj}[]>(props.contract.corpAffObj || [])

const cardObjList = computed({
  get () {
    return props.corpAffObj
  },
  set (value:{cardName: string, affObj: NiceVanCorpAffObj}[]) {
    emits('update:corp-aff-obj', value)
  }
})

const affForm = computed({
  get () {
    return props.affForm
  },
  set (value:QForm | null) {
    emits('update:aff-form', value)
  }
})

const selectedCardList = ref<string[]>(cardObjList.value.map(card => card.cardName))

// const initCardObjList = () => {
//   const obj = cardList.value.map((card) => {
//     return {
//       cardName: card.value,
//       affObj: {
//         useYn: 'N', // 사용여부
//         affiliationNo: '', // 가맹점번호
//         acquireMethodCode: '', // 매입방법코드
//         affiliationOpenDate: '', // 가맹점 개시일
//         affiliationCloseDate: '', // 가맹점 해지일
//         normalKeyinYn: 'N', // 키인여부
//         monthYn: 'N', // 할부여부
//         autoAcquireOpenDate: '', // 자동이체 개시일
//         autoAcquireCloseDate: '', // 자동이체 해지일
//         autoAcquireKeyinYn: 'N' // 자동이체 키인여부
//       }
//     }
//   })
//   cardObjList.value = obj
// }

// const updateUseYn = (val: string[]) => {
//   cardObjList.value?.forEach((card) => {
//     if (val.includes(card.cardName)) {
//       card.affObj.useYn = 'Y'
//     } else {
//       card.affObj.useYn = 'N'
//     }
//   })
// }
// onMounted(() => {
//   initCardObjList()
// })

const getAffiliationData = async () => {
  $q.loading.show()
  const affiliation = await customFetch<{cardName: string, affObj: NiceVanCorpAffObj}[]>(`/admin/handOrder/nicevan/merchant/affiliation/${shopSeq}`, {
    method: 'GET',
    params: {
      isCorp: props.isCorp
    }
  })
  cardObjList.value = affiliation

  selectedCardList.value = affiliation.filter(card => card.affObj.useYn).map(card => card.cardName) || []

  if (selectedCardList.value.length > 0) {
    $q.notify({
      color: 'positive',
      message: '카드사 가맹 정보 조회에 성공했습니다.'
    })
  } else {
    $q.notify({
      message: '조회된 카드사 가맹 정보가 없습니다.'
    })
  }
  $q.loading.hide()
}

const addNewAff = () => {
  cardObjList.value.push({
    cardName: '',
    affObj: {
      useYn: 'Y', // 사용여부
      affiliationNo: '', // 가맹점번호
      acquireMethodCode: '', // 매입방법코드
      affiliationOpenDate: '', // 가맹점 개시일
      affiliationCloseDate: '', // 가맹점 해지일
      normalKeyinYn: 'N', // 키인여부
      monthYn: 'N', // 할부여부
      autoAcquireOpenDate: '', // 자동이체 개시일
      autoAcquireCloseDate: '', // 자동이체 해지일
      autoAcquireKeyinYn: 'N' // 자동이체 키인여부
    }
  })
  selectedCardList.value.push('')
}

</script>

<template>
  <div class="full-width" style="width:100%">
    <div style="display:flex; justify-content: center;">
      <q-btn
        label="카드사 가맹정보 자동 조회"
        color="grey-5"
        class="q-mb-md"
        @click="getAffiliationData"
      />
    </div>
    <q-list>
      <q-separator />
      <!-- <q-select
      v-model="selectedCardList"
      :options="cardList"
      class="q-mb-md"
      map-options
      emit-value
      multiple

      dense
      label="사용 카드사 선택"
      style="min-width: 200px"
      @update:model-value="updateUseYn"
    /> -->

      <q-item
        v-if="isCorp"
        style="display:flex; justify-content: flex-end;"
      >
        <q-btn
          color="primary"
          label="추가"
          @click="addNewAff()"
        />
      </q-item>

      <template v-if="selectedCardList.length > 0">
        <q-form
          ref="affForm"
        >
          <q-item v-for="(card,index) in cardObjList.toReversed()" :key="card">
            <q-card style="margin-bottom: 10px; min-width: 100%;">
              <!-- <q-card-section class="text-h6">
            {{ cardList.find((nameValue) => nameValue.value === card.cardName)?.label }}
          </q-card-section> -->
              <q-card-section>
                <q-select
                  v-model="card.cardName"
                  label="카드사"
                  :options="cardList"
                  class="q-mb-md"
                  map-options
                  emit-value
                  dense
                  :readonly="!isCorp"
                  :rules="[(val:string)=> (card.affObj.useYn === 'N' || val.length > 0) || '카드사를 선택해주세요.']"
                />
                <q-btn
                  v-if="isCorp"
                  color="negative"
                  dense
                  @click="cardObjList = cardObjList.filter((card, idx) => cardObjList.length - 1 - idx !== index)"
                >
                  <q-icon name="delete" />
                </q-btn>
              </q-card-section>

              <q-card-section>
                <q-input
                  v-model="card.affObj.affiliationNo"
                  dense
                  outlined
                  label="가맹점 번호"
                  :readonly="!isCorp"
                  :rules="[(val:string)=> (card.affObj.useYn === 'N' || val.length > 0) || '가맹점 번호를 입력해주세요.']"
                />
              </q-card-section>

              <q-card-section>
                <q-select
                  v-model="card.affObj.acquireMethodCode"
                  :options="acquireMethodCodeList"
                  map-options
                  emit-value
                  dense
                  outlined
                  label="매입 방법"
                  :readonly="!isCorp"
                  :rules="[(val:string) => (card.affObj.useYn === 'N' || val.length > 0) || '매입 방법을 선택해주세요.']"
                />
              </q-card-section>

              <q-card-section>
                <q-input
                  label="가맹점 개시일"
                  outlined
                  dense
                  :model-value="card.affObj.affiliationOpenDate"
                  :readonly="!isCorp"
                  :rules="[(val:string) => (card.affObj.useYn === 'N' || val.length > 0) || '가맹점 개시일을 입력해주세요.']"
                >
                  <template v-if="isCorp" v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="card.affObj.affiliationOpenDate" mask="YYYYMMDD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </q-card-section>

              <q-expansion-item
                v-if="isCorp"
                header
              >
                <template v-slot:header>
                  <span
                    style="display: flex; align-items: center;"
                  >
                    상세 정보
                  </span>
                </template>
                <q-card-section>
                  <q-input
                    label="가맹점 해지일"
                    outlined
                    :model-value="card.affObj.affiliationCloseDate"
                    dense
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="card.affObj.affiliationCloseDate" mask="YYYYMMDD">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </q-card-section>

                <q-card-section>
                  <q-toggle
                    v-model="card.affObj.normalKeyinYn"
                    label="키인여부"
                    true-value="Y"
                    false-value="N"
                    dense
                  />
                </q-card-section>

                <q-card-section>
                  <q-toggle
                    v-model="card.affObj.monthYn"
                    label="할부여부"
                    true-value="Y"
                    false-value="N"
                    dense
                  />
                </q-card-section>

                <q-card-section>
                  <q-input
                    label="자동이체 개시일"
                    outlined
                    :model-value="card.affObj.autoAcquireOpenDate"
                    dense
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="card.affObj.autoAcquireOpenDate" mask="YYYYMMDD">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </q-card-section>

                <q-card-section>
                  <q-input
                    label="자동이체 해지일"
                    outlined
                    :model-value="card.affObj.autoAcquireCloseDate"
                    dense
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="card.affObj.autoAcquireCloseDate" mask="YYYYMMDD">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </q-card-section>

                <q-card-section>
                  <q-toggle
                    v-model="card.affObj.autoAcquireKeyinYn"
                    label="자동이체 키인여부"
                    true-value="Y"
                    false-value="N"
                    dense
                  />
                </q-card-section>
              </q-expansion-item>
            </q-card>
          </q-item>
          <q-separator />
        </q-form>
      </template>
    </q-list>
  </div>
</template>

<style scoped lang="scss">
</style>
