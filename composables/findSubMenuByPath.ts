// composables/useMenuUtils.ts
import type { MenuItem } from '@/types'
import { allMenuList } from '~/utils/code'

/**
 * 현재 경로에 해당하는 서브 메뉴를 찾는 함수
 * @param path 현재 경로
 * @param menuList 메뉴 리스트
 * @returns 찾은 서브 메뉴와 상위 메뉴, 또는 null
 */
export const findSubMenuByPath = (
  path: string
): { parentMenu: MenuItem; subMenu: MenuItem } | null => {
  for (const parentMenu of allMenuList as MenuItem[]) {
    // 서브 메뉴가 있는 경우
    if (parentMenu.menuList && parentMenu.menuList.length > 0) {
      for (const subMenu of parentMenu.menuList) {
        if (subMenu.to === path) {
          return { parentMenu, subMenu }
        }
        if (subMenu.to && path.includes(subMenu.to + '/')) {
          return { parentMenu, subMenu }
        }
      }
    }

    // 상위 메뉴 자체가 현재 경로와 일치하는지 확인
    if (parentMenu.to === path) {
      return { parentMenu, subMenu: parentMenu }
    }
  }
  return null
}
