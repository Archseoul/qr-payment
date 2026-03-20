<script setup lang="ts">
import { useQuasar, useDialogPluginComponent } from 'quasar'
import type { ShopInfoVo } from '~/types'
import { linkType, vanCode } from '~/utils/code'

interface Props {
  shopCode: string
}

const props = defineProps<Props>()

defineEmits([
  ...useDialogPluginComponent.emits
])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const $q = useQuasar()

const shop = ref<ShopInfoVo | null>(null)
const shopRefreshTime = ref<number[] | null>(null)
const isLoading = ref(true)

const businessLicenseFile = ref<File | null>(null)
const bankBookFile = ref<File | null>(null)
const contractFile = ref<File | null>(null)
const cmsFormFile = ref<File | null>(null)
const etcFileFile = ref<File | null>(null)
const ownerLicenseFile = ref<File | null>(null)

// 매장 정보 조회
onMounted(async () => {
  try {
    const [shopInfo, refreshTime] = await Promise.all([
      customFetch<ShopInfoVo>(`/admin/handOrder/shop/${props.shopCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      customFetch<number[]>('/admin/handOrder/shop/refresh-time', {
        method: 'GET',
        params: {
          shopCode: props.shopCode
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
    ])

    shop.value = shopInfo
    shopRefreshTime.value = refreshTime
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '매장 정보 조회에 실패하였습니다'
    })
  } finally {
    isLoading.value = false
  }
})

type FileType = 'businessLicenseFile' | 'bankBookFile' | 'contractFile' | 'cmsFormFile' | 'etcFileFile' | 'ownerLicenseFile'
const fileObject: Record<FileType, { koreanFileType: string, apiPath: string, file: Ref<File | null> }> = {
  businessLicenseFile: {
    koreanFileType: '사업자등록증',
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/business-license',
    file: businessLicenseFile
  },
  bankBookFile: {
    koreanFileType: '통장 사본',
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/bank-book',
    file: bankBookFile
  },
  contractFile: {
    koreanFileType: '계약서',
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/contract',
    file: contractFile
  },
  cmsFormFile: {
    koreanFileType: 'CMS신청서',
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/cms-form',
    file: cmsFormFile
  },
  etcFileFile: {
    koreanFileType: '기타 첨부파일',
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/etc-file',
    file: etcFileFile
  },
  ownerLicenseFile: {
    koreanFileType: '대표자 신분증',
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/owner-license',
    file: ownerLicenseFile
  }
}

const sendFile = async (fileType: FileType) => {
  if (fileObject[fileType].file.value && shop.value) {
    const formData = new FormData()
    formData.append('file', fileObject[fileType].file.value!)
    const postResult = await customFetch<string>(fileObject[fileType].apiPath, {
      method: 'POST',
      body: formData,
      onResponseError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `${fileObject[fileType].koreanFileType} 업로드에 실패하였습니다. 상태 코드: ${ctx.response.status} ${ctx.response.statusText}`
        })
      }
    })

    const setShopInfo: Record<FileType, () => void> = {
      businessLicenseFile: () => {
        shop.value!.businessLicensePath = postResult
        shop.value!.businessLicenseFileName = fileObject[fileType].file.value!.name
      },
      bankBookFile: () => {
        shop.value!.bankBookPath = postResult
        shop.value!.bankBookFileName = fileObject[fileType].file.value!.name
      },
      contractFile: () => {
        shop.value!.contractPath = postResult
        shop.value!.contractFileName = fileObject[fileType].file.value!.name
      },
      cmsFormFile: () => {
        shop.value!.cmsFormPath = postResult
        shop.value!.cmsFormFileName = fileObject[fileType].file.value!.name
      },
      etcFileFile: () => {
        shop.value!.etcFilePath = postResult
        shop.value!.etcFileFileName = fileObject[fileType].file.value!.name
      },
      ownerLicenseFile: () => {
        shop.value!.ownerLicensePath = postResult
        shop.value!.ownerLicenseFileName = fileObject[fileType].file.value!.name
      }
    }
    setShopInfo[fileType]()
  }
}

const updateShopInfo = async () => {
  if (!shop.value) { return }

  $q.loading.show()
  try {
    // 파일 업로드
    await Promise.all([
      sendFile('businessLicenseFile'),
      sendFile('bankBookFile'),
      sendFile('contractFile'),
      sendFile('cmsFormFile'),
      sendFile('etcFileFile'),
      sendFile('ownerLicenseFile')
    ])

    // 매장 정보 수정
    await customFetch('/admin/handOrder/shop', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: shop.value,
      onResponseError: (context) => {
        $q.notify({
          type: 'negative',
          message: `매장 정보 수정에 실패하였습니다. 상태 코드: ${context.response.status} ${context.response.statusText}`
        })
      }
    })

    // QR 변경 시간대 수정
    await customFetch('/admin/handOrder/shop/refresh-time', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: shopRefreshTime.value,
      params: {
        shopCode: shop.value.shopCode
      },
      onResponseError: (context) => {
        $q.notify({
          type: 'negative',
          message: `QR변경 시간대 수정에 실패하였습니다. 상태 코드: ${context.response.status} ${context.response.statusText}`
        })
      }
    })

    $q.notify({
      type: 'positive',
      message: '매장 정보가 수정되었습니다'
    })

    onDialogOK()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '매장 정보 수정 중 오류가 발생했습니다'
    })
  } finally {
    $q.loading.hide()
  }
}

</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">
          매장 정보 수정
        </div>
        <div class="text-caption text-grey-7">
          일부 정보만 수정 가능합니다
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="isLoading" class="flex justify-center q-pa-lg">
        <q-spinner color="primary" size="3em" />
      </q-card-section>

      <q-card-section v-else-if="shop" style="max-height: 60vh" class="scroll">
        <q-form @submit="updateShopInfo">
          <div class="row q-col-gutter-sm">
            <!-- 연동 포스 종류 -->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                연동 포스종류
              </div>
            </div>
            <div class="col-9">
              <q-select
                v-model="shop.posCode"
                :options="linkType"
                emit-value
                map-options
                dense
                outlined
              />
            </div>

            <!-- 매장 담당자명 -->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                매장 담당자명
              </div>
            </div>
            <div class="col-9">
              <q-input
                v-model="shop.managerName"
                outlined
                dense
                input-style="text-align: center;"
              />
            </div>

            <!-- 담당 대리점 ID (readonly) -->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                담당 대리점 ID
              </div>
            </div>
            <div class="col-9">
              <q-input
                :model-value="shop.agencyId ?? '없음'"
                outlined
                dense
                readonly
                input-style="text-align: center;"
              />
            </div>

            <!-- 네이버 플레이스 URL -->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                네이버플레이스 URL
              </div>
            </div>
            <div class="col-9">
              <q-input
                v-model="shop.naverUrl"
                outlined
                dense
                input-style="text-align: center;"
              />
            </div>

            <!-- 매장 type -->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                매장 type
              </div>
            </div>
            <div class="col-9">
              <q-input
                v-model="shop.shopType"
                outlined
                dense
                input-style="text-align: center;"
              />
            </div>

            <!-- 파일 업로드 -->
            <div class="col-12 q-mt-md">
              <div class="text-subtitle2 q-mb-sm">
                파일 업로드
              </div>
            </div>

            <div class="col-6">
              <q-file
                v-model="businessLicenseFile"
                :label="shop.businessLicenseFileName ?? '사업자등록증'"
                dense
                outlined
                :max-files="1"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>

            <div class="col-6">
              <q-file
                v-model="bankBookFile"
                :label="shop.bankBookFileName ?? '통장 사본'"
                dense
                outlined
                :max-files="1"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>

            <div class="col-6">
              <q-file
                v-model="contractFile"
                :label="shop.contractFileName ?? '계약서'"
                dense
                outlined
                :max-files="1"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>

            <div class="col-6">
              <q-file
                v-model="cmsFormFile"
                :label="shop.cmsFormFileName ?? 'CMS신청서'"
                dense
                outlined
                :max-files="1"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>

            <div class="col-6">
              <q-file
                v-model="etcFileFile"
                :label="shop.etcFileFileName ?? '기타 첨부파일'"
                dense
                outlined
                :max-files="1"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>

            <div class="col-6">
              <q-file
                v-model="ownerLicenseFile"
                :label="shop.ownerLicenseFileName ?? '대표자 신분증'"
                dense
                outlined
                :max-files="1"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>

            <!-- QR 변경 시간대 -->
            <div class="col-12 q-mt-md">
              <div class="text-subtitle2 q-mb-sm">
                QR 변경 시간대
              </div>
            </div>
            <div class="col-12">
              <q-select
                v-model="shopRefreshTime"
                :options="Array.from({ length: 25 }, (_, i) => {
                  return {
                    label: i === 0 ? '비활성화' : i - 1 + '시',
                    value: i === 0 ? null : i - 1
                  }
                })"
                emit-value
                map-options
                dense
                multiple
                :max-values="24"
                outlined
              />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="취소" color="grey-5" :disable="isLoading" @click="onDialogCancel" />
        <q-btn flat label="저장" color="primary" :disable="isLoading || !shop" @click="updateShopInfo" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
