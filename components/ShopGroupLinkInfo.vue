<script setup lang="ts">
import { useQuasar } from 'quasar'
import type { HoShopGroupLinkVo } from '~/types'

const props = defineProps<{
  shopGroupUuid: String
  shopGroupLinkList: HoShopGroupLinkVo[]
}>()

const emits = defineEmits(['refresh'])

const config = useRuntimeConfig()
const { menuHost } = config.public

const $q = useQuasar()
const createShopGroupLinkPopup = ref(false)
const editShopGroupLinkPopup = ref(false)
const pagination = ref({
  rowsPerPage: 0
})

const createShopGroupLinkData = ref({
  shopGroupUuid: props.shopGroupUuid,
  shopGroupLinkCode: '',
  linkName: '',
  defaultAddress: '',
  isActive: true
})

const selectedGroupLink = ref<HoShopGroupLinkVo | null>(null)

const columns = [
  {
    name: 'shopGroupLinkCode',
    required: true,
    label: '링크 코드',
    align: 'left',
    field: 'shopGroupLinkCode',
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
    name: 'defaultAddress',
    required: true,
    label: '기본 주소',
    align: 'left',
    field: 'defaultAddress',
    sortable: true
  },
  {
    name: 'isActive',
    required: true,
    label: '활성화여부',
    align: 'left',
    field: 'isActive',
    sortable: true,
    format: (val:boolean) => `${val === true ? '활성화' : '비활성화'}`
  }
]

const openCreateShopGroupLinkPopup = () => {
  createShopGroupLinkData.value = {
    shopGroupUuid: props.shopGroupUuid,
    shopGroupLinkCode: '',
    linkName: '',
    defaultAddress: '',
    isActive: true
  }

  createShopGroupLinkPopup.value = true
}

const closeCreateShopGroupLinkPopup = () => {
  createShopGroupLinkPopup.value = false
}

const createShopGroupLink = () => {
  $q.dialog({
    title: '링크 생성',
    message: '링크를 생성하시겠습니까?',
    ok: '확인',
    cancel: '취소'
  }).onOk(async () => {
    await customFetch('/admin/handOrder/shop/group/link', {
      method: 'POST',
      body: JSON.stringify(createShopGroupLinkData.value)
    })
    emits('refresh')
    closeCreateShopGroupLinkPopup()
  })
}

const openEditShopGroupLinkPopup = (row:HoShopGroupLinkVo) => {
  selectedGroupLink.value = row
  editShopGroupLinkPopup.value = true
}

const closeEditShopGroupLinkPopup = () => {
  editShopGroupLinkPopup.value = false
}

const editShopGroupLink = () => {
  $q.dialog({
    title: '링크 수정',
    message: '링크를 수정하시겠습니까?',
    ok: '확인',
    cancel: '취소'
  }).onOk(async () => {
    await customFetch('/admin/handOrder/shop/group/link', {
      method: 'PUT',
      body: JSON.stringify(selectedGroupLink.value)
    })
    emits('refresh')
    closeEditShopGroupLinkPopup()
  })
}

</script>

<template>
  <q-card>
    <q-card-section>
      <div class="row justify-between">
        <div class="text-h6 text-bold full-width">
          링크
          <q-btn
            label="링크 생성"
            color="primary"
            class="float-right"
            @click="openCreateShopGroupLinkPopup"
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
        :rows="shopGroupLinkList ?? []"
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
  <q-dialog v-model="createShopGroupLinkPopup">
    <q-card class="shop_group_link_popup">
      <q-card-section style="padding-bottom:10px">
        <div class="row justify-between">
          <div class="text-h6 text-bold">
            링크 생성
          </div>
          <div class="text-h6 cursor-pointer close-btn">
            <q-icon name="close" @click="closeCreateShopGroupLinkPopup" />
          </div>
        </div>
        <q-separator class="q-mt-sm" />
      </q-card-section>
      <q-card-section>
        <div class="create_group_content col-1 q-gutter-lg">
          <q-input
            v-model="createShopGroupLinkData.linkName"
            outlined
            label="링크명"
            placeholder="링크명을 입력해주세요."
          />
          <q-input
            v-model="createShopGroupLinkData.defaultAddress"
            outlined
            label="기본 주소"
            placeholder="기본 주소를 입력해주세요."
          />
          <q-checkbox v-model="createShopGroupLinkData.isActive" label="활성화" />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          label="취소"
          color="primary"
          flat
          @click="closeCreateShopGroupLinkPopup"
        />
        <q-btn
          label="생성"
          color="primary"
          @click="createShopGroupLink"
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
            v-model="selectedGroupLink!.linkName"
            outlined
            label="링크명"
            placeholder="링크명을 입력해주세요."
          />
          <q-input
            v-model="selectedGroupLink!.defaultAddress"
            outlined
            label="기본 주소"
            placeholder="기본 주소를 입력해주세요."
          />
          <q-checkbox v-model="selectedGroupLink!.isActive" label="활성화" />
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
