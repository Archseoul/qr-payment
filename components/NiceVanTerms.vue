<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { type ShopInfoVo } from '~/types'

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
const props = defineProps<{
  shopInfo: ShopInfoVo,
  name: string
}>()

const shopInfo = props.shopInfo

const agreement = ref({
  agree1: false,
  agree2: false,
  agree3: false,
  agree4: false
})

</script>

<template>
  <q-dialog
    ref="dialogRef"
    :auto-close="false"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <h6 style="margin-block-start:0;margin-block-end: 0;">
          신용카드 부가통신 서비스 이용 동의서
        </h6>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-list>
          <q-item>
            본 건은 귀 신용카드가맹점이 금융위원회에 등록된 부가통신업자가 제공하는 신용카드 거래중계 서비스 이용에 동의하는 문서입니다.
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label overline>
                1. 신용카드 거래의 승인•중개를 위하여 아래 금융위원회에 등록된 부가통신사업자가 제공하는 서비스를 이용할 것에 동의합니다.
              </q-item-label>
              <q-item-label>
                <q-checkbox v-model="agreement.agree1" label="동의" />
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label overline>
                2. 특수관계인을 포함하여 신용카드부가통신서비스 이용을 이유로 부당하게 보상금 등을 요구하거나 받지 않을 것에 동의합니다.
              </q-item-label>
              <q-item-label>
                <q-checkbox v-model="agreement.agree2" label="동의" />
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label overline>
                3. 신용카드 결제 및 부가서비스 제공을 위해 필요한 최소한의 정보만 수집하고 정보보호를 위한 의무를 성실히 이행할 것에 동의합니다.
              </q-item-label>
              <q-item-label>
                <q-checkbox v-model="agreement.agree3" label="동의" />
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label overline>
                4. 신용카드 거래의 승인•중개를 통해 발생한 귀 가맹점의 신용카드 매출 실적 등의 데이터를 제공하는데 동의합니다.
              </q-item-label>
              <q-item-label>
                <q-checkbox v-model="agreement.agree4" label="동의" />
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-section>
        <q-list>
          <q-item>
            <q-item-section>
              사업자등록번호
            </q-item-section>
            <q-item-section>
              {{ shopInfo.businessNumber }}
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              사업장명(가맹점상호)
            </q-item-section>
            <q-item-section>
              {{ shopInfo.shopName }}
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              대표자명
            </q-item-section>
            <q-item-section>
              {{ shopInfo.ownerName }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-btn
          color="primary"
          label="동의"
          :disable="!agreement.agree1 || !agreement.agree2 || !agreement.agree3 || !agreement.agree4"
          class="float-right q-mb-md"
          @click="onDialogOK"
        />

        <q-btn
          color="grey-5"
          label="닫기"
          @click="onDialogHide"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
