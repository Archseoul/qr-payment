import type {HoPrintLogGroupVo, HoPrintLogMenuOptionVo, HoPrintLogVo, HoSalesVo, HoTableOrderVo} from '~/types'

export const updateMenuNames = (list : HoPrintLogGroupVo[] | HoSalesVo[] |HoTableOrderVo[] | HoPrintLogVo, shop : string) => {
  if(!list){ return }

  const optionUpdate = (option : HoPrintLogMenuOptionVo[]) => {
    if (!option) { return }
    option.forEach((item: HoPrintLogMenuOptionVo) => {
      if (item.localeOptionGroupName) { item.optionGroupName = item.localeOptionGroupName }
      if (item.localeOptionName) { item.optionName = item.localeOptionName }
    })
  }

  const menuUpdate = (menu:HoPrintLogVo[]|HoPrintLogVo) => {
    if (Array.isArray(menu)) {
      menu.forEach((item: HoPrintLogVo) => {
        if (item.localeMenuName) { item.menuName = item.localeMenuName }
        optionUpdate(item.printLogMenuOptionList)
      })
    } else if (menu.localeMenuName) { menu.menuName = menu.localeMenuName }
  }

  if (shop && Array.isArray(list)) {
    list.forEach((order : HoPrintLogGroupVo | HoTableOrderVo | HoPrintLogVo | HoSalesVo) => {
      if ('printLog' in order) {
        menuUpdate(order.printLog)
      }else if('printLogGroup' in order){
          menuUpdate(order.printLogGroup.printLog)
      } else if ('printLogList' in order) {
        menuUpdate(order.printLogList)
      }
    })
  } else {
    menuUpdate(list as HoPrintLogVo)
  }
}
