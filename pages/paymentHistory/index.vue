<script setup lang="ts">
import { useQuasar } from "quasar";
import { ShopSelectModal } from "#components";
import type { ShopInfoVo } from "~/types";

const shopList = useState("shopList", (): ShopInfoVo[] | undefined => []);
const { pending, data } = await useCustomFetch<ShopInfoVo[]>(
  "/admin/handOrder/v2/shop",
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  },
);
shopList.value = data.value!;

const $q = useQuasar();
const showSelectShop = () => {
  $q.dialog({
    component: ShopSelectModal,
    componentProps: {
      shopList: shopList.value,
      routeString: "/paymentHistory/",
    },
  });
};
if (!pending.value) {
  showSelectShop();
}
</script>

<template>
  <div />
</template>

<style scoped lang="scss"></style>
