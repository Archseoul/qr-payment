<script setup lang="ts">
import ShopStatusButtons from '@/components/ShopStatusButtons.vue'

interface Props {
  show: boolean
  isEmbedded?: boolean // 데스크톱 탭 내부에 임베디드될 때 true
}

const props = withDefaults(defineProps<Props>(), {
  isEmbedded: false
})

const emit = defineEmits<{
  'update:status': []
}>()

const handleShopStatusChanged = () => {
  emit('update:status')
}
</script>

<template>
  <div v-if="props.show" class="shop-closed-overlay" :class="{ 'embedded': props.isEmbedded }">
    <!-- <div class="overlay-content">
      <div class="overlay-message">
        <h3>결제 마감</h3>
        <p>결제 활성화 하시면 결제를 등록할 수 있습니다.</p>
      </div>
      <ShopStatusButtons @update:status="handleShopStatusChanged" />
    </div> -->
  </div>
</template>

<style scoped lang="scss">
.shop-closed-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2999;
  backdrop-filter: blur(2px);

  &.embedded {
    position: absolute;
  }
}

.overlay-content {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  text-align: center;
  max-width: 450px;
  animation: slideUp 0.3s ease-out;

  .overlay-message {
    margin-bottom: 16px;
    font-family: "Pretendard";

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #1C1917;
      letter-spacing: -0.4px;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: #5D5D5C;
      line-height: 1.6;
      letter-spacing: -0.3px;
    }
  }

  :deep(.shop-status-buttons) {
    display: flex;
    width: 100%;

    .status-button {
      flex: 1;
      width: 100%;
      min-width: 0;
      display: flex;
      padding: 10px;
      border-radius: 6px;
      font-size: 14px;
      letter-spacing: -0.3px;
      background: #FF8B4A;
      color: #FFFFFF;
      justify-content: center;
      align-items: center;

      &:hover:not(:disabled) {
        background: #FF6D17;
        box-shadow: 0 4px 12px rgba(255, 139, 74, 0.3);
      }
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #FFFFFF;
    }
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
