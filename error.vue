<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})

const router = useRouter()

console.log(props.error)

onBeforeMount(() => {
  // 401 에러 발생 시 자동으로 로그인 페이지로 이동
  if (props.error?.statusCode === 401) {
    router.push('/login')
  }
})

</script>

<template>
  <div class="error-page">
    <h2 v-if="error?.statusCode === 404">
      {{ $t('ERROR.001') }}
    </h2>
    <h2 v-else-if="error?.statusCode === 401">
      {{ $t('ERROR.002') }}
    </h2>
    <h2 v-else>
      {{ $t('ERROR.003') }}
    </h2>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  border: none;
  background: #007bff;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}

button:hover {
  background: #0056b3;
}
</style>
