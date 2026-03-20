<script setup lang="ts">
import { QUploader, useQuasar } from 'quasar'
import type { HoShopGroupVo } from '~/types'

const props = defineProps<{
  selectedGroup: HoShopGroupVo
}>()

const emits = defineEmits(['refresh'])

const selectedGroup = toRef(props, 'selectedGroup')

const $q = useQuasar()
const config = useRuntimeConfig()
const imageUploadUrl = `${config.public.baseUrl}/admin/handOrder/shop/group/banner/image`
const token = useCookie('token')
const tokenHeader = computed(() => [{
  name: 'Authorization', value: `Bearer ${token.value}`
}]
)
const imageUploadMode = ref(true)
const imagePreviewPopup = ref(false)
const uploader = ref<null|QUploader>(null)

const saveShopGroup = async () => {
  if (!selectedGroup.value) {
    return
  }
  const result = await uploadImage()
  if (!result) {
    await putShopGroup()
  }
}

const uploadImage = async () => {
  if (!selectedGroup.value) {
    return false
  }
  if (!imageUploadMode.value) {
    return false
  }

  if (uploader.value?.files.length === 0) {
    if (selectedGroup.value.isBannerUse) {
      $q.notify({
        message: '이미지를 업로드해주세요.',
        color: 'negative',
        icon: 'close'
      })
      return true
    }
    return false
  }

  // uploader.value?.upload()

  const formData = new FormData()
  formData.append('file', uploader.value?.files[0])

  selectedGroup.value.bannerImagePath = await customFetch(imageUploadUrl, {
    method: 'POST',
    body: formData
  })
  uploader.value?.reset()
  imageUploadMode.value = false

  return false
}

const putShopGroup = async () => {
  await customFetch('/admin/handOrder/shop/group', {
    method: 'PUT',
    body: selectedGroup.value
  }).then(() => {
    $q.notify({
      message: '저장되었습니다.',
      color: 'positive',
      icon: 'check'
    })
  })
  emits('refresh')
}
//
// const startGroupImagePost:QUploader['onUploaded'] = async ({ xhr }:{xhr:XMLHttpRequest}) => {
//   if (xhr.status !== 200) {
//     notifyRejected()
//     return
//   }
//   selectedGroup.value!.bannerImagePath = xhr.response
//   await putShopGroup()
// }

const notifyRejected = () => {
  $q.notify({
    message: '파일이 규격에 맞지 않습니다. png, jpg, gif 파일만 업로드 가능합니다.',
    color: 'negative',
    icon: 'close'
  })
}

const openImagePreview = () => {
  imagePreviewPopup.value = true
}

onMounted(() => {
  if (selectedGroup.value.bannerImagePath) {
    imageUploadMode.value = false
  }
})

</script>

<template>
  <q-card>
    <q-card-section>
      <div class="row justify-between">
        <div class="text-h6 text-bold full-width">
          그룹 정보
          <q-btn
            icon="edit"
            label="저장"
            color="primary"
            class="float-right"
            @click="saveShopGroup"
          />
        </div>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>
    <q-card-section>
      <div class="group_detail_box row q-col-gutter-sm">
        <div class="col-2">
          <div class="fit flex justify-center items-center bg-grey-3">
            그룹 상태
          </div>
        </div>
        <div class="col-2">
          <q-select
            v-model="selectedGroup.shopGroupStatus"
            outlined
            dense
            map-options
            emit-value
            :options="[
              { label: '운영', value: 'active' },
              { label: '종료', value: 'inactive' }
            ]"
          />
        </div>
        <div class="col-2">
          <div class="fit flex justify-center items-center bg-grey-3">
            그룹명
          </div>
        </div>
        <div class="col-6">
          <q-input
            v-model="selectedGroup.shopGroupName"
            outlined
            dense
          />
        </div>

        <div class="col-2">
          <div class="fit flex justify-center items-center bg-grey-3">
            배너 사용여부
          </div>
        </div>
        <div class="col-2">
          <q-toggle
            v-model="selectedGroup.isBannerUse"
            dense
          />
        </div>
        <div class="col-2">
          <div class="fit flex justify-center items-center bg-grey-3">
            배너 연결링크
          </div>
        </div>
        <div class="col-6">
          <q-input
            v-model="selectedGroup.bannerUrlLink"
            outlined
            dense
          />
        </div>
        <div class="col-2">
          <div class="fit flex justify-center items-center bg-grey-3">
            배너 이미지
          </div>
        </div>
        <div class="col-6">
          <template v-if="imageUploadMode">
            <q-uploader
              ref="uploader"
              v-model="selectedGroup.bannerImagePath"
              :url="imageUploadUrl"
              accept="image/png, image/jpeg, image/gif"
              :max-files="1"
              :headers="tokenHeader"
              field-name="file"
              with-credentials
              hide-upload-btn
              flat
              dense
              no-label
              no-icon
              class="custom_image_ui"
              @rejected="notifyRejected"
            />
            <q-btn
              v-if="selectedGroup.bannerImagePath"
              label="취소"
              color="negative"
              class="q-mr-lg"
              @click="imageUploadMode = false"
            />
          </template>
          <template v-else>
            <q-btn
              label="이미지 수정"
              color="negative"
              class="q-mr-lg"
              @click="imageUploadMode = true"
            />
            <q-btn
              label="미리보기"
              color="primary"
              @click="openImagePreview"
            />
          </template>
        </div>
      </div>
    </q-card-section>
  </q-card>
  <q-dialog v-model="imagePreviewPopup">
    <q-card style="width: 500px">
      <q-card-section>
        <q-img
          :src="selectedGroup?.bannerImagePath"
          style="width: 100%;"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
