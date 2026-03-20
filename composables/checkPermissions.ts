import { Notify } from 'quasar'
import { menuAuthCheck } from '~/composables/menuAuthCheck'

export const useCheckPermissions = () => {
  const { t } = useI18n()
  const route = useRoute()

  const checkPermissions = (requiredPermissions: string[]) => {
    const currentSubMenu = findSubMenuByPath(route.path)
    const authCheck = menuAuthCheck(currentSubMenu!.subMenu.menuCode)
    
    for (const permission of requiredPermissions) {
      // @ts-ignore
      if (!authCheck[permission]()) {
        Notify.create({
          color: 'negative',
          message: t('COMMON.010'),
          position: 'top',
          timeout: 2000
        })
        return false
      }
    }
    return true
  }

  return { checkPermissions }
}