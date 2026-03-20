<script setup lang="ts">
import type { HoCategoryVo, HoShopMenuboardVo } from '~/types'

const { dialogRef, onDialogCancel, onDialogOK } = useDialogPluginComponent()

const $q = useQuasar()

const props = defineProps<{
  menuboard: HoShopMenuboardVo,
  shopCode: string,
  shopSeq: number,
  categoryList: HoCategoryVo[]
}>()

const menuboard = ref<HoShopMenuboardVo>(props.menuboard)

const status = ref<'select' | 'insert' | 'update'>(menuboard.value.shopMenuboardSeq ? 'select' : 'insert')
const hourOption:string[] = new Array(24).fill(0).map((_, idx) => idx < 10 ? `0${idx}` : `${idx}`)
const minuteOption = ['00', '30']

const createStringTime = (time : string | null) => {
  return {
    hour: time ? time.slice(0, 2) : '00',
    minute: time ? time.slice(2, 4) : '00'
  }
}

const startTimeData = {
  hour: computed({
    get () {
      return createStringTime(menuboard.value.startTime).hour
    },
    set (time) {
      menuboard.value.startTime = time + startTimeData.minute.value
    }
  }),
  minute: computed({
    get () {
      return createStringTime(menuboard.value.startTime).minute
    },
    set (time) {
      menuboard.value.startTime = startTimeData.hour.value + time
    }
  })
}

const endTimeData =
{
  hour: computed({
    get () {
      return createStringTime(menuboard.value.endTime).hour
    },
    set (time) {
      menuboard.value.endTime = time + endTimeData.minute.value
    }
  }),
  minute: computed({
    get () {
      return createStringTime(menuboard.value.endTime).minute
    },
    set (time) {
      menuboard.value.endTime = endTimeData.hour.value + time
    }
  })
}

const categories = reactive<{categoryUuid: string, selected:boolean, name:string, menuCount:number, menus:{menuSeq:number, name:string, useYn:boolean}[]}[]>(

  props.categoryList
    ? props.categoryList.map((category) => {
      return {
        categoryUuid: category.categoryUuid,
        name: category.categoryName,
        selected: false,
        menuCount: menuboard.value.menuSeqList.length,
        menus: category.menus.map((menu) => {
          return {
            menuSeq: menu.menuSeq,
            name: menu.menuName,
            useYn: menuboard.value.menuSeqList.includes(menu.menuSeq)
          }
        })
      }
    })
    : []
)

const catSelected = categories.map(cat =>
  computed({
    get: () => !cat.menus.map(menu => menu.useYn).includes(false) as boolean,
    set: (val:boolean) => {
      cat.menus = cat.menus.map((menu) => {
        return { ...menu, useYn: val }
      })
    }
  })
)

const catExpanded = ref<boolean[]>(categories.map(() => (true)))

const allExpanded = ref(true)

watch(allExpanded, (val) => {
  catExpanded.value = categories.map(() => val)
})

const validation = () => {
  let message = ''
  if (menuboard.value.menuSeqList.length === 0) {
    message = $t('SHOP_MENUBOARD.010')
  }
  if (menuboard.value.startTime === menuboard.value.endTime) {
    message = $t('SHOP_MENUBOARD.011')
  }
  if (!menuboard.value.everydayYn && menuboard.value.dayOfWeekList.length === 0) {
    message = $t('SHOP_MENUBOARD.012')
  }

  if (menuboard.value.menuboardName === '') {
    message = $t('SHOP_MENUBOARD.013')
  }

  if (message !== '') {
    $q.notify({
      color: 'negative',
      message
    })
    return false
  } else {
    return true
  }
}
const saveMenuboard = async () => {
  $q.loading.show()

  menuboard.value.menuSeqList = categories.flatMap(cat => cat.menus.filter(menu => menu.useYn).map(menu => menu.menuSeq))
  if (menuboard.value.dayOfWeekList.length === 7) {
    menuboard.value.everydayYn = true
    menuboard.value.dayOfWeekList = []
  } else {
    menuboard.value.dayOfWeekList = menuboard.value.dayOfWeekList.sort((a, b) => a - b)
  }

  if (!validation()) {
    $q.loading.hide()
    return
  }

  try {
    await customFetch(`/admin/handOrder/menuboard/${props.shopCode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(menuboard.value)
    })

    // 저장 성공 시 표시
    $q.notify({
      message: $t('SHOP_MENUBOARD.015'),
      color: 'positive',
      icon: 'check'
    })

    onDialogOK()
  } catch (error: any) {
    const errorMessage = error?.response?._data?.message || error?.message || '알 수 없는 오류'
    $q.notify({
      message: `${$t('SHOP_MENUBOARD.014')} ${errorMessage}`,
      color: 'negative',
      icon: 'close'
    })
  } finally {
    $q.loading.hide()
  }
}

const deleteMenuboard = async () => {
  $q.loading.show()

  await customFetch(`/admin/handOrder/menuboard/${menuboard.value.shopMenuboardSeq}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(() => {
      $q.notify({
        type: 'positive',
        message: $t('SHOP_MENUBOARD.016')
      })
      $q.loading.hide()
      onDialogOK()
    })
}
const confirmDeleteMenuboard = () => {
  $q.dialog({
    title: $t('SHOP_MENUBOARD.017'),
    message: $t('COMMON.060'),
    cancel: true
  }).onOk(() => {
    deleteMenuboard()
  })
}

</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogCancel"
  >
    <q-card class="q-dialog-plugin" style="width: 700px; max-width:80vw;" persistent>
      <q-form @submit="saveMenuboard">
        <q-card-section class="q-pa-md">
          <div class="text-h5 text-bold row justify-between">
            {{ $t('SHOP_MENUBOARD.023') }} {{ status === 'insert' ? $t('COMMON.064') : status === 'update' ? $t('COMMON.062') : $t('SHOP_MENUBOARD.019') }}
            <div v-if="status !== 'select'">
              <q-btn
                :label="$t('COMMON.009')"
                color="primary"
                role="submit"
                @click="saveMenuboard"
              />
            </div>
            <div v-else>
              <q-btn
                :label="$t('COMMON.007')"
                color="negative"
                @click="confirmDeleteMenuboard"
              />
              {{ '  ' }}
              <q-btn
                :label="$t('COMMON.035')"
                color="primary"
                @click="status = 'update'"
              />
            </div>
          </div>

          <q-separator class="q-my-lg" />

          <div class="q-mt-sm">
            <q-list>
              <q-item>
                <q-item-section class="label-section">
                  {{ $t('SHOP_MENUBOARD.020') }}
                </q-item-section>
                <q-item-section>
                  <q-input
                    v-model="menuboard.menuboardName"
                    :label="$t('SHOP_MENUBOARD.020')"
                    outlined
                    dense
                    maxlength="100"
                    :disable="status === 'select'"
                    :rules="[(val:string) => val != undefined && val != '' || $t('SHOP_MENUBOARD.013')]"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section class="label-section">
                  {{ $t('SHOP_MENUBOARD.021') }}
                </q-item-section>
                <q-item-section>
                  <q-checkbox
                    v-model="menuboard.useYn"
                    :label="menuboard.useYn ? $t('COMMON.075') : $t('COMMON.055')"
                    outlined
                    dense
                    :disable="status === 'select'"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section class="label-section">
                  {{ $t('COMMON.092') }}
                </q-item-section>
                <!-- 활성화 시간 -->
                <q-item-section>
                  <div class="flex row justify-start items-center q-gutter-sm" style="margin-top :0px;">
                    <q-select
                      v-model="startTimeData.hour.value"
                      outlined
                      dense
                      :options="hourOption"
                      autocomplete="off"
                      :disable="status === 'select'"
                    />
                    <span>:</span>
                    <q-select
                      v-model="startTimeData.minute.value"
                      outlined
                      dense
                      :options="minuteOption"
                      autocomplete="off"
                      :disable="status === 'select'"
                    />

                    <div>
                      ~
                    </div>

                    <q-select
                      v-model="endTimeData.hour.value"
                      outlined
                      dense
                      :options="hourOption"
                      autocomplete="off"
                      :disable="status === 'select'"
                    />
                    <span>:</span>
                    <q-select
                      v-model="endTimeData.minute.value"
                      outlined
                      dense
                      :options="minuteOption"
                      autocomplete="off"
                      :disable="status === 'select'"
                    />
                    <div>
                      <q-toggle
                        v-model="menuboard.everydayYn"
                        :label="$t('COMMON.065')"
                        :disable="status === 'select'"
                      />
                    </div>

                    <div v-if="!menuboard.everydayYn" style="margin-left: 30px">
                      <q-option-group
                        v-model="menuboard.dayOfWeekList"
                        type="checkbox"
                        toggle-color="primary"
                        inline
                        :options="[
                          {label: $t('COMMON.066'), value: 1},
                          {label: $t('COMMON.067'), value: 2},
                          {label: $t('COMMON.068'), value: 3},
                          {label: $t('COMMON.069'), value: 4},
                          {label: $t('COMMON.070'), value: 5},
                          {label: $t('COMMON.071'), value: 6},
                          {label: $t('COMMON.072'), value: 7},
                        ]"
                        :disable="status === 'select'"
                      />
                    </div>

                  <!-- 활성화 시간 -->
                  </div>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section class="label-section" top>
                  {{ $t('SHOP_MENUBOARD.022') }}
                  <q-item-label caption>
                    <q-toggle
                      v-model="allExpanded"
                      :label="$t('SHOP_MENUBOARD.018')"
                      style="color"
                    />
                  </q-item-label>
                </q-item-section>
                <q-item-section>
                  <q-list v-if="props.categoryList?.length > 0" bordered padding>
                    <div v-for="category, index in categories" :key="category.categoryUuid">
                      <q-expansion-item
                        v-model="catExpanded[index]"
                        header
                      >
                        <template v-slot:header>
                          <div class="row justify-around" style="margin-right:5px;">
                            <div class="column justify-around" style="margin-right:5px">
                              <q-checkbox
                                v-model="catSelected[index].value"
                                :disable="status === 'select'"
                                dense
                              />
                            </div>
                            <div class="col column justify-around">
                              <span>{{ category.name }}</span>
                            </div>
                          </div>
                          <div class="text-grey-6 col column row justify-around">
                            <span>
                              ({{ category.menus.filter(menu => menu.useYn).length }} / {{ category.menus.length }})
                            </span>
                          </div>
                        </template>

                        <q-item dense>
                          <q-list>
                            <q-item v-for="menu in category.menus" :key="menu.menuSeq" dense>
                              <q-checkbox
                                v-model="menu.useYn"
                                :label="menu.name"
                                dense
                                :true-value="true"
                                :false-value="false"
                                :disable="status === 'select'"
                              />
                            </q-item>
                          </q-list>
                        </q-item>
                      </q-expansion-item>
                      <q-separator v-if="index != props.categoryList.length - 1" spaced />
                    </div>
                  </q-list>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.label-section {
  max-width:150px;
}
</style>
