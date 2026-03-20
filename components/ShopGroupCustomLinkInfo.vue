<script setup lang="ts">
import { useQuasar } from 'quasar'
import type { HoShopGroupCustomLinkVo } from '~/types'

const props = defineProps<{
  shopGroupUuid: String
  shopGroupCustomLinkList: HoShopGroupCustomLinkVo[]
}>()

const emits = defineEmits(['refresh'])

const config = useRuntimeConfig()
const { menuHost } = config.public

const $q = useQuasar()
const createShopGroupCustomLinkPopup = ref(false)
const editShopGroupLinkPopup = ref(false)
const pagination = ref({
  rowsPerPage: 0
})

const createShopGroupCustomLinkData = ref({
  shopGroupUuid: props.shopGroupUuid,
  linkUrl: '',
  linkName: '',
  isActive: true,
  sortNumber: 0,
  imagePath: '',
  image: null as File | null
})

const selectedCustomGroupLink = ref<HoShopGroupCustomLinkVo | null>(null)

const columns = [
  {
    name: 'linkUrl',
    required: true,
    label: '연결 URL',
    align: 'left',
    field: 'linkUrl',
    sortable: true
  },
  {
    name: 'linkName',
    required: true,
    label: '링크명',
    align: 'left',
    field: 'linkName',
    sortable: true
  },
  {
    name: 'isActive',
    required: true,
    label: '활성화 여부',
    align: 'left',
    field: 'isActive',
    sortable: true,
    format: (val:boolean) => `${val ? '활성화' : '비활성화'}`
  },
  {
    name: 'sortNumber',
    required: true,
    label: '순서',
    align: 'left',
    field: 'sortNumber'
  }
]

const openCreateShopGroupCustomLinkPopup = () => {
  createShopGroupCustomLinkData.value = {
    shopGroupUuid: props.shopGroupUuid,
    linkUrl: '',
    linkName: '',
    isActive: true,
    sortNumber: 0,
    imagePath: ''
  }

  createShopGroupCustomLinkPopup.value = true
}

const closeCreateShopGroupCustomLinkPopup = () => {
  createShopGroupCustomLinkPopup.value = false
}

const createShopGroupCustomLink = () => {
  $q.dialog({
    title: '링크 생성',
    message: '링크를 생성하시겠습니까?',
    ok: '확인',
    cancel: '취소'
  }).onOk(async () => {
    const formData = new FormData()

    for (const key in createShopGroupCustomLinkData.value) {
      const value = createShopGroupCustomLinkData.value[key as keyof typeof createShopGroupCustomLinkData.value]
      if (value instanceof File) {
        formData.append(key, value)
      } else if (value !== null && value !== undefined) {
        if (typeof value === 'object') {
          // 객체나 배열은 JSON 문자열로 변환
          formData.append(key, JSON.stringify(value))
        } else {
          // 문자열, 숫자 등은 그대로
          formData.append(key, value.toString())
        }
      }
    }

    await customFetch('/admin/handOrder/shop/group/custom-link', {
      method: 'POST',
      body: formData
    })
    emits('refresh')
    closeCreateShopGroupCustomLinkPopup()
  })
}

const openEditShopGroupLinkPopup = (row:HoShopGroupCustomLinkVo) => {
  selectedCustomGroupLink.value = row
  editShopGroupLinkPopup.value = true
}

const closeEditShopGroupLinkPopup = () => {
  editShopGroupLinkPopup.value = false
}

const editShopGroupLink = () => {
  const formData = new FormData()

  for (const key in selectedCustomGroupLink.value) {
    const value = selectedCustomGroupLink.value[key as keyof typeof selectedCustomGroupLink.value]
    if (value instanceof File) {
      formData.append(key, value)
    } else if (value !== null && value !== undefined) {
      if (typeof value === 'object') {
        // 객체나 배열은 JSON 문자열로 변환
        formData.append(key, JSON.stringify(value))
      } else {
        // 문자열, 숫자 등은 그대로
        formData.append(key, value.toString())
      }
    }
  }

  $q.dialog({
    title: '링크 수정',
    message: '링크를 수정하시겠습니까?',
    ok: '확인',
    cancel: '취소'
  }).onOk(async () => {
    await customFetch('/admin/handOrder/shop/group/custom-link', {
      method: 'PUT',
      body: formData
    })
    emits('refresh')
    closeEditShopGroupLinkPopup()
  })
}

const deleteShopGroupCustomLink = () => {
  $q.dialog({
    title: '외부 URL 삭제',
    message: '외부 URL을 삭제하시겠습니까?',
    ok: {
      label: '확인',
      color: 'primary'
    },
    cancel: {
      label: '취소',
      color: 'negative'
    }
  }).onOk(async () => {
    await customFetch('/admin/handOrder/shop/group/custom-link', {
      method: 'DELETE',
      body: selectedCustomGroupLink.value
    })

    $q.notify({
      message: '매장이 삭제되었습니다.',
      color: 'positive'
    })
    emits('refresh')
    closeEditShopGroupLinkPopup()
  })
}

const notifyRejected = () => {
  $q.notify({
    message: '파일이 규격에 맞지 않습니다. png, jpg, gif 파일만 업로드 가능합니다.',
    color: 'negative',
    icon: 'close'
  })
}

</script>

<template>
  <q-card>
    <q-card-section>
      <div class="row justify-between">
        <div class="text-h6 text-bold full-width">
          외부 URL 연결
          <q-btn
            label="생성"
            color="primary"
            class="float-right"
            @click="openCreateShopGroupCustomLinkPopup"
          />
        </div>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>
    <q-card-section>
      <q-table
        v-model:pagination="pagination"
        style="max-height: 500px"
        flat
        bordered
        :rows="shopGroupCustomLinkList ?? []"
        :columns="columns"
        row-key="shopGroupLinkCode"
        virtual-scroll
        :rows-per-page-options="[0]"
        hide-bottom
      >
        <template v-slot:header="headProps">
          <q-tr :props="headProps">
            <q-th
              v-for="col in headProps.cols"
              :key="col.name"
              :props="headProps"
              class="text-center"
            >
              {{ col.label }}
            </q-th>
            <q-th />
          </q-tr>
        </template>
        <template v-slot:body="scope">
          <q-tr :props="scope">
            <q-td
              v-for="col in scope.cols"
              :key="col.name"
              :props="scope"
            >
              <template v-if="col.field == 'shopGroupLinkCode'">
                <a :href="`${menuHost}/group/${col.value}`" target="_blank">
                  {{ col.value }}
                </a>
              </template>
              <template v-else>
                {{ col.value }}
              </template>
            </q-td>
            <q-td>
              <q-btn
                icon="edit"
                color="primary"
                dense
                @click="openEditShopGroupLinkPopup(scope.row)"
              />
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
  <q-dialog v-model="createShopGroupCustomLinkPopup">
    <q-card class="shop_group_link_popup">
      <q-card-section style="padding-bottom:10px">
        <div class="row justify-between">
          <div class="text-h6 text-bold">
            링크 생성
          </div>
          <div class="text-h6 cursor-pointer close-btn">
            <q-icon name="close" @click="closeCreateShopGroupCustomLinkPopup" />
          </div>
        </div>
        <q-separator class="q-mt-sm" />
      </q-card-section>
      <q-card-section>
        <div class="create_group_content col-1 q-gutter-lg">
          <q-input
            v-model="createShopGroupCustomLinkData.linkName"
            outlined
            label="링크명"
            placeholder="링크명을 입력해주세요."
          />
          <q-input
            v-model="createShopGroupCustomLinkData.linkUrl"
            outlined
            label="URL을 입력해주세요"
            placeholder="URL을 입력해주세요"
          />
          <q-file
            v-model="createShopGroupCustomLinkData.image"
            outlined
            label="이미지 업로드"
            placeholder="이미지를 업로드해주세요"
            :max-files="1"
            accept="image/png, image/jpeg, image/gif"
            @rejected="notifyRejected"
          />
          <q-checkbox v-model="createShopGroupCustomLinkData.isActive" label="활성화" />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          label="취소"
          color="primary"
          flat
          @click="closeCreateShopGroupCustomLinkPopup"
        />
        <q-btn
          label="생성"
          color="primary"
          @click="createShopGroupCustomLink"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="editShopGroupLinkPopup">
    <q-card class="shop_group_link_popup">
      <q-card-section style="padding-bottom:10px">
        <div class="row justify-between">
          <div class="text-h6 text-bold">
            링크 생성
          </div>
          <div class="text-h6 cursor-pointer close-btn">
            <q-icon name="close" @click="closeEditShopGroupLinkPopup" />
          </div>
        </div>
        <q-separator class="q-mt-sm" />
      </q-card-section>
      <q-card-section>
        <div class="create_group_content col-1 q-gutter-lg">
          <q-input
            v-model="selectedCustomGroupLink!.linkName"
            outlined
            label="링크명"
            placeholder="링크명을 입력해주세요."
          />
          <q-input
            v-model="selectedCustomGroupLink!.linkUrl"
            outlined
            label="URL을 입력해주세요"
            placeholder="URL을 입력해주세요"
          />
          <q-file
            v-model="selectedCustomGroupLink.image"
            outlined
            :label="selectedCustomGroupLink.orgImageName || '이미지 업로드'"
            placeholder="이미지를 업로드해주세요"
            :max-files="1"
            accept="image/png, image/jpeg, image/gif"
            @rejected="notifyRejected"
          />
          <q-checkbox v-model="selectedCustomGroupLink!.isActive" label="활성화" />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          label="취소"
          color="primary"
          flat
          @click="closeEditShopGroupLinkPopup"
        />
        <q-btn
          label="삭제"
          color="negative"
          @click="deleteShopGroupCustomLink"
        />
        <q-btn
          label="수정"
          color="primary"
          @click="editShopGroupLink"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.shop_group_link_popup{
  width: 500px;
}
</style>
