<script setup lang="ts">
import { QInput, useDialogPluginComponent, useQuasar } from 'quasar'
import { isEmpty } from 'lodash-es'
import type { ShopInfoVo } from '~/types'
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
const props = defineProps<{
  shopInfo: ShopInfoVo
}>()
defineEmits([
  ...useDialogPluginComponent.emits,
  'refresh'
])

const $q = useQuasar()
const slide = ref(0)

const deleteList = ref([])

const deleteThumbnail = () => {
  if (isEmpty(deleteList.value)) {
    $q.notify({
      message: '삭제할 사진을 선택해주세요.',
      color: 'negative'
    })
    return
  }

  $q.dialog({
    title: '삭제',
    message: '선택한 사진을 삭제하시겠습니까?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await customFetch('/admin/handOrder/shop/thumbnail', {
      method: 'DELETE',
      body: deleteList.value,
      onResponse: (context) => {
        if (context.response.status === 200) {
          $q.notify({
            message: '삭제되었습니다.',
            color: 'positive'
          })
        } else {
          $q.notify({
            message: `삭제 실패. ${context.response._data.message}`,
            color: 'negative'
          })
        }
      }
    })
    onDialogOK()
  })
}

const updateSort = async () => {
  await customFetch('/admin/handOrder/shop/thumbnail', {
    method: 'PUT',
    body: props.shopInfo.thumbnailList,
    onResponse: (context) => {
      if (context.response.status === 200) {
        $q.notify({
          message: '순서가 저장되었습니다.',
          color: 'positive'
        })
      } else {
        $q.notify({
          message: `순서 저장 실패. ${context.response._data.message}`,
          color: 'negative'
        })
      }
    }
  })
  onDialogOK()
}

</script>

<template>
  <q-dialog
    ref="dialogRef"
    :auto-close="false"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h6 text-bold">
        매장 정보
      </q-card-section>
      <q-card-section>
        <q-card>
          <q-card-section>
            <q-carousel
              v-if="!isEmpty(shopInfo.thumbnailList)"
              v-model="slide"
              animated
              arrows
              navigation
              infinite
              control-color="orange"
            >
              <template v-for="(thumbnail,index) in shopInfo.thumbnailList" :key="thumbnail.thumbnailFilePath">
                <q-carousel-slide
                  :name="index"
                  :img-src="thumbnail.thumbnailFilePath"
                >
                  <q-input
                    v-model="thumbnail.orderIndex"
                    mask="#"
                    fill-mask="0"
                    unmasked-value
                    reverse-fill-mask
                    outlined
                    maxlength="2"
                    class="order-input"
                  />
                  <!--                  <q-btn flat round class="delete-btn" icon="delete" @click="deleteThumbnail(thumbnail)" />-->
                  <q-checkbox v-model="deleteList" :val="thumbnail.thumbnailSeq" class="delete-btn" />
                </q-carousel-slide>
              </template>
            </q-carousel>
            <div v-else>
              <div class="text-center">
                사진이 없습니다.
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-btn label="순서 저장" color="primary" class="float-left q-mb-md" @click="updateSort" />
        <q-btn label="사진 삭제" color="negative" class="float-left q-mb-md q-ml-md" @click="deleteThumbnail" />
        <q-btn
          color="grey-5"
          label="닫기"
          class="float-right q-mb-md"
          @click="onDialogOK"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.order-input{
  position: absolute;
  top:0;
  left:0;
  width: 45px;
  height: 30px;
  :deep(.q-field__control){
    height: 30px;
  }
}
.delete-btn{
  position: absolute;
  top:0;
  right: 0;
}
</style>
