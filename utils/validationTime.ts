import type {QVueGlobals} from "quasar";

export const validateTime = (value: number, $q :QVueGlobals): boolean => {
  if (String(value).length > 3) {
    $q.notify({
      message: '소요시간을 3자리 이하의 숫자만 입력해주세요.',
      position: 'top',
      type: 'negative'
    })
    return false
  }
  if (value <= 0) {
    $q.notify({
      type: 'negative',
      message: '소요 시간을 0보다 큰 값으로 입력해주세요.',
      position: 'top'
    })
    return false
  }
  return true
}
