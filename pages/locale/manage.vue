<script setup lang="ts">
import type { Ref } from 'vue'
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import type { LocaleCodeVo } from '~/types'
import LocaleAddModal from '~/components/LocaleAddModal.vue'
import LocaleItem from '~/components/LocaleItem.vue'

const { checkPermissions } = useCheckPermissions()
const $q = useQuasar()
const localeListData = await useCustomFetch<LocaleCodeVo[]>('/admin/handOrder/locale', {
  method: 'GET'
})

const saveButton = ref(false)
const localeList:Ref<LocaleCodeVo[] | null > = localeListData.data
watch(localeList, () => {
  saveButton.value = true
}, { deep: true })
const upperOverCode = ref('')
const bottomOverCode = ref('')
const initializeBorder = () => {
  upperOverCode.value = ''
  bottomOverCode.value = ''
}
const openAddModal = () => {
  if (!checkPermissions(['C'])) {
    return
  }
  $q.dialog({
    component: LocaleAddModal
  }).onOk(async () => {
    await localeListData.refresh()
    saveButton.value = false
  })
}
const onDragStart = (e:DragEvent, locale:LocaleCodeVo) => {
  e.dataTransfer?.setData('text/json', JSON.stringify(locale))
}
const onUpperDrop = (e:DragEvent, targetLocale:LocaleCodeVo) => {
  e.preventDefault()
  if (e.stopPropagation) {
    e.stopPropagation()
  }
  if (e.dataTransfer && localeList.value) {
    const targetIndex = targetLocale.orderIndex - 1
    const draggedLocale:LocaleCodeVo = JSON.parse(e.dataTransfer?.getData('text/json'))
    const origDraggedLocale = localeList.value?.find(locale => locale.localeCode === draggedLocale.localeCode)
    if (origDraggedLocale) {
      localeList.value!.filter(locale => locale.orderIndex <= targetIndex)
        .forEach((locale) => { locale.orderIndex -= 1 })
      origDraggedLocale.orderIndex = targetIndex

      localeList.value!.sort((a, b) => a.orderIndex - b.orderIndex)
        .forEach((locale, index) => { locale.orderIndex = index + 1 })
    }
  }
}
const onBottomDrop = (e:DragEvent, targetLocale:LocaleCodeVo) => {
  e.preventDefault()
  if (e.stopPropagation) {
    e.stopPropagation()
  }
  if (e.dataTransfer && localeList.value) {
    const targetIndex = targetLocale.orderIndex + 1
    const draggedLocale:LocaleCodeVo = JSON.parse(e.dataTransfer?.getData('text/json'))
    const origDraggedLocale = localeList.value?.find(locale => locale.localeCode === draggedLocale.localeCode)
    if (origDraggedLocale) {
      localeList.value!.filter(locale => locale.orderIndex >= targetIndex)
        .forEach((locale) => { locale.orderIndex += 1 })
      origDraggedLocale.orderIndex = targetIndex

      localeList.value!.sort((a, b) => a.orderIndex - b.orderIndex)
        .forEach((locale, index) => { locale.orderIndex = index + 1 })
    }
  }
}
const handleUpperDragOver = (e:DragEvent, locale:LocaleCodeVo) => {
  if (e.preventDefault) {
    e.preventDefault()
  }
  e.dataTransfer!.dropEffect = 'move'
  upperOverCode.value = locale.localeCode
  bottomOverCode.value = ''
  return false
}
const handleBottomDragOver = (e:DragEvent, locale:LocaleCodeVo) => {
  if (e.preventDefault) {
    e.preventDefault()
  }
  e.dataTransfer!.dropEffect = 'move'
  bottomOverCode.value = locale.localeCode
  upperOverCode.value = ''
  return false
}

const updateLocale = async () => {
  if (!checkPermissions(['U'])) {
    return
  }
  await customFetch('/admin/handOrder/locale', {
    method: 'PUT',
    body: localeList.value,
    onResponse: async (context) => {
      if (context.response.status === 200) {
        $q.notify({
          message: $t('LOCALE.001'),
          color: 'positive'
        })
        await localeListData.refresh()
        saveButton.value = false
      } else {
        $q.notify({
          message: `${$t('LOCALE.002')} ${context.response._data.message}`,
          color: 'negative'
        })
      }
    }
  })
}
const deleteLocale = async (locale:LocaleCodeVo) => {
  await customFetch('/admin/handOrder/locale', {
    method: 'DELETE',
    params: {
      localeCode: locale.localeCode
    },
    onResponse: (context) => {
      if (context.response.status === 200) {
        $q.notify({
          message: $t('LOCALE.001'),
          color: 'positive'
        })
        saveButton.value = false
        localeListData.refresh()
      } else {
        $q.notify({
          message: `${$t('LOCALE.002')} ${context.response._data.message}`,
          color: 'negative'
        })
      }
    }
  })
}
const deleteLocaleDialog = (locale:LocaleCodeVo) => {
  if (!checkPermissions(['D'])) {
    return
  }
  $q.dialog({
    title: $t('LOCALE.003'),
    message: $t('LOCALE.004'),
    ok: $t('COMMON.004'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    await deleteLocale(locale)
  })
}
const localeItemList = ref<InstanceType<typeof LocaleItem>[]>([])
const isNothingEditing = computed(() => localeItemList.value.every(item => !item.isEditing))

</script>

<template>
  <div class="main-content relative-position full-height">
    <q-scroll-area class="fit q-pa-lg">
      <span class="text-h5 text-bold">{{ $t('SIDE_MENU.026') }}</span>

      <q-separator class="q-my-lg" />

      <q-card flat style="max-width: 500px;">
        <q-card-section class="row justify-between">
          <div class="row items-center text-bold text-h6">
            {{ $t('LOCALE.005') }}
          </div>
          <div class="row items-center q-gutter-sm">
            <q-btn
              color="primary"
              :label="$t('COMMON.064')"
              @click="openAddModal"
            />
            <q-btn
              v-if="saveButton && isNothingEditing"
              color="primary"
              :label="$t('COMMON.009')"
              @click="updateLocale"
            />
          </div>
        </q-card-section>
        <q-card-section>
          <q-list bordered separator class="rounded-borders">
            <template v-for="(locale) in localeList" :key="locale.localeCode">
              <LocaleItem
                ref="localeItemList"
                v-model:locale-name-value="locale.localeName"
                :locale="locale"
                :class="[bottomOverCode===locale.localeCode ? 'bottom-border': '',
                         upperOverCode === locale.localeCode ? 'upper-border':'']"
                @delete="deleteLocaleDialog(locale)"
                @dragstart="(event:DragEvent) => onDragStart(event, locale)"
                @dragend="initializeBorder"
              >
                <div
                  class="absolute-child"
                >
                  <div
                    class="upper-half"
                    @drop="(event:DragEvent) => onUpperDrop(event, locale)"
                    @dragover="(event:DragEvent) => handleUpperDragOver(event, locale)"
                  />
                  <div
                    class="bottom-half"
                    @drop="(event:DragEvent) => onBottomDrop(event, locale)"
                    @dragover="(event:DragEvent) => handleBottomDragOver(event, locale)"
                  />
                </div>
              </LocaleItem>
            </template>
          </q-list>
        </q-card-section>
      </q-card>
    </q-scroll-area>
  </div>
</template>

<style scoped lang="scss">
.relative-parent{
  position: relative;
  .absolute-child {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: grid;
  }
}
.bottom-border{
  border-bottom: solid black 2px !important;
  & + .relative-parent{
    border-top: none;
  }
}
.upper-border{
  border-top: solid black 2px !important;
}
</style>
