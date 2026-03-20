<script setup lang="ts">
import { useQuasar } from 'quasar'
import type { groupMappedPostDto, HoRandomMapVo, HoShopGroupMappedVo, HoTableVo, ShopInfoVo } from '~/types'

const props = defineProps<{
  shopGroupUuid: string
  shopGroupMappedList: HoShopGroupMappedVo[]
}>()

const emits = defineEmits(['refresh'])

const { data: shopList } = await useCustomFetch<ShopInfoVo[]>('/admin/handOrder/shop/pg', {
  method: 'GET'
})

const image:Ref<File | null> = ref(null as File)

const $q = useQuasar()
const config = useRuntimeConfig()
const { baseUrl } = config.public
const shopGroupPopup = ref(false)
const selectedShop = ref<ShopInfoVo | null>(null)
const shopTableList = ref<HoTableVo[] | null>(null)
const shopProductCodeList = ref<HoRandomMapVo[] | null>(null)
const filterProductCodeList = ref<HoRandomMapVo[] | null>(null)
const createShopGroup = ref<groupMappedPostDto | null>(null)
const isDelivery = ref(false)
const openCreateShopGroupPopup = () => {
  shopGroupPopup.value = true
}

const deleteShopGroupMapped = (shopGroupMapped:HoShopGroupMappedVo) => {
  $q.dialog({
    title: '매장 삭제',
    message: '매장을 삭제하시겠습니까?',
    ok: {
      label: '확인',
      color: 'primary'
    },
    cancel: {
      label: '취소',
      color: 'negative'
    }
  }).onOk(async () => {
    await customFetch(`/admin/handOrder/shop/group/mapped/${shopGroupMapped.shopGroupUuid}/${shopGroupMapped.shopSeq}`, {
      method: 'DELETE'
    })

    $q.notify({
      message: '매장이 삭제되었습니다.',
      color: 'positive'
    })
    emits('refresh')
  })
}

const addShopGroupMapped = (productCode:HoRandomMapVo) => {
  // 매장을 추가하시겠습니까?
  $q.dialog({
    title: '매장 추가',
    message: '매장을 추가하시겠습니까?',
    ok: {
      label: '확인',
      color: 'primary'
    },
    cancel: {
      label: '취소',
      color: 'negative'
    }
  }).onOk(async () => {
    createShopGroup.value = {
      shopGroupUuid: props.shopGroupUuid,
      shopSeq: selectedShop.value!.shopSeq,
      codeLinkSeq: productCode.codeLinkSeq,
      image: image.value
    }

    const formData = new FormData()

    for (const key in createShopGroup.value) {
      const value = createShopGroup.value[key as keyof typeof createShopGroup.value]
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

    await customFetch('/admin/handOrder/shop/group/mapped', {
      method: 'POST',
      body: formData
    })

    $q.notify({
      message: '매장이 추가되었습니다.',
      color: 'positive'
    })
    image.value = null
    closeCreateShopGroupPopup()
    emits('refresh')
  })
}

const selectedShopData = (shop:ShopInfoVo) => {
  selectedShop.value = shop
  fetchShopTableList()
  fetchCodeLinkList()
}

const fetchShopTableList = async () => {
  const { data } = await useCustomFetch<HoTableVo[]>(`/admin/handOrder/table/${selectedShop.value!.shopCode}`, {
    method: 'GET'
  })
  shopTableList.value = data.value ?? []
}

const fetchCodeLinkList = async () => {
  const { data } = await useCustomFetch<HoRandomMapVo[]>('/admin/handOrder/productList', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      shopSeq: selectedShop.value!.shopSeq,
      storeCode: selectedShop.value!.qrStoreCode
    }
  })
  filterProductCodeList.value = shopProductCodeList.value = data.value ?? []
}

const closeCreateShopGroupPopup = () => {
  shopGroupPopup.value = false
  selectedShop.value = null
}

const isDeliveryCodeData = (deliveryValue:boolean) => {
  if (!deliveryValue) {
    filterProductCodeList.value = shopProductCodeList.value
    return
  }

  const deliveryTableList = shopTableList.value?.filter(table => table.delivery)
  // landingUrl :postest.gongbbu.com/22/10 중 마지막 숫자가 tableSeq
  filterProductCodeList.value = shopProductCodeList.value?.filter((productCode) => {
    const tableSeq = productCode.landingUrl.split('/').pop()

    return deliveryTableList?.some(table => table.tableNum === tableSeq)
  }) ?? []
}

const getShopTime = (time:string) => {
  return `${time.slice(0, 2)}:${time.slice(2, 4)}`
}

const searchWord = ref('')

const filteredShops = computed(() => {
  if (!searchWord.value) {
    return shopList.value
  }
  return shopList.value.filter(shop => shop.shopName.includes(searchWord.value))
})

const updateMapped = async (shop:HoShopGroupMappedVo) => {
  const formData = new FormData()

  for (const key in shop) {
    const value = shop[key as keyof typeof shop]
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

  await customFetch('/admin/handOrder/shop/group/mapped', {
    method: 'PUT',
    body: formData
  })
}

const uploadMappedImage = async (shop:HoShopGroupMappedVo) => {
  await updateMapped(shop)

  $q.notify({
    message: '이미지를 업로드하였습니다.',
    color: 'positive'
  })

  image.value = null
}

const removeMappedImage = (shopGroupMapped:HoShopGroupMappedVo) => {
  $q.dialog({
    title: '이미지 삭제',
    message: '매장 이미지를 삭제하시겠습니까?',
    ok: {
      label: '확인',
      color: 'primary'
    },
    cancel: {
      label: '취소',
      color: 'negative'
    }
  }).onOk(async () => {
    shopGroupMapped.orgImageName = null
    shopGroupMapped.imagePath = null
    shopGroupMapped.image = null

    await updateMapped(shopGroupMapped)

    $q.notify({
      message: '이미지를 삭제하였습니다.',
      color: 'positive'
    })
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
          매장 목록
          <q-btn
            label="매장 추가"
            color="primary"
            class="float-right"
            @click="openCreateShopGroupPopup"
          />
        </div>
      </div>
      <q-separator class="q-mt-sm" />
    </q-card-section>
    <q-card-section>
      <q-list separator bordered>
        <q-item>
          <q-item-section>
            <q-item-label>매장명</q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>매장코드</q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>영업 시간</q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>연결 링크</q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>이미지</q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label />
          </q-item-section>
        </q-item>
        <q-item v-for="shopGroupMapped in props.shopGroupMappedList" :key="shopGroupMapped.shopSeq" clickable>
          <q-item-section>
            <q-item-label>{{ shopGroupMapped.shopName }}</q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ shopGroupMapped.shopCode }}</q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <template v-if="shopGroupMapped.openTime">
                {{ shopGroupMapped.openTime? getShopTime(shopGroupMapped.openTime) : '-' }} ~ {{ shopGroupMapped.closeTime? getShopTime(shopGroupMapped.closeTime) : '-' }}
              </template>
              <template v-else>
                -
              </template>
            </q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <NuxtLink :to="`${baseUrl}/r?r=${shopGroupMapped.randomCode}`" target="_blank">
                링크
              </NuxtLink>
            </q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ shopGroupMapped.imagePath }}
              <q-file
                v-model="shopGroupMapped.image"
                dense
                :name="shopGroupMapped.orgImageName"
                :max-files="1"
                accept="image/png, image/jpeg, image/gif"
                :label="shopGroupMapped.orgImageName || '이미지 업로드'"
                @rejected="notifyRejected"
                @update:model-value="() => uploadMappedImage(shopGroupMapped)"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
                <template v-slot:append>
                  <q-icon name="close" class="cursor-pointer" @click="() => removeMappedImage(shopGroupMapped)" />
                </template>
              </q-file>
            </q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-btn
                icon="delete"
                color="primary"
                dense
                @click="deleteShopGroupMapped(shopGroupMapped)"
              />
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
  <q-dialog v-model="shopGroupPopup" persistent>
    <q-card style="width: 700px;">
      <q-card-section>
        <div class="text-h6 text-bold">
          매장 추가
          <q-btn
            v-if="selectedShop"
            color="primary"
            icon="arrow_back"
            label="뒤로"
            class="float-right"
            @click="selectedShop = null"
          />
        </div>
      </q-card-section>
      <q-card-section style="max-height: 500px; overflow: auto">
        <template v-if="!selectedShop">
          <q-input v-model="searchWord" dense debounce="300" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-item v-for="shop in filteredShops as ShopInfoVo[]" :key="shop.shopSeq" clickable @click="selectedShopData(shop)">
            <q-item-section>
              <q-item-label>{{ shop.shopName }}</q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ shop.shopCode }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template v-else>
          <div class="column">
            <span class="text-h6">매장명 : {{ selectedShop.shopName }}</span>
            <span class="text-h6">매장코드 : {{ selectedShop.shopCode }}</span>
            <span class="text-h6">영업 시간 : {{ selectedShop.openTime }} ~ {{ selectedShop.closeTime }}</span>
            <span class="text-h6">
              <q-file
                v-model="image"
                outlined
                label="이미지 업로드"
                placeholder="이미지를 업로드해주세요"
                :max-files="1"
                accept="image/png, image/jpeg, image/gif"
                @rejected="notifyRejected"
              />
            </span>
          </div>
          <q-separator class="q-my-md" />
          <div>
            <q-item>
              <q-item-section>
                <q-item-label>테이블QR ID</q-item-label>
              </q-item-section>
              <q-item-section>
                <q-item-label>연결 URL</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator class="q-my-md" />
            <span>
              배달테이블만 보기
              <q-toggle v-model="isDelivery" @update:model-value="isDeliveryCodeData" />
            </span>
            <q-item v-for="productCode in filterProductCodeList" :key="productCode.codeLinkSeq" clickable @click="addShopGroupMapped(productCode)">
              <q-item-section>
                <q-item-label>{{ productCode.randomCode }}</q-item-label>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ productCode.landingUrl }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </template>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="red"
          label="취소"
          @click="closeCreateShopGroupPopup"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
