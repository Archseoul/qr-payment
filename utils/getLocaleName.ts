import type { LocaleCodeVo } from '~/types'

export default (localeCode:string, localeList:LocaleCodeVo[]|null) => {
  const locale = localeList?.find(locale => locale.localeCode === localeCode)
  return locale?.localeName ?? ''
}
