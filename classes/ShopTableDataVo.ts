import type { ShopInfoVo, shopThumbnailVo } from '~/types'

export default class ShopTableData implements ShopInfoVo {
  index: number
  doesAlert: boolean
  insDate: string
  insTid: string
  mappedStoreCode: string
  mappedStoreId: number
  posCode: string
  printerIp: string
  qrStoreCode: string
  shopName: string
  shopSeq: number
  tableNums: string[]
  uptDate: string
  uptTid: string
  useEnglish: boolean
  usePrinter: boolean
  rfMac: string[]
  activeYn: string
  address1: string
  address2: string
  authCd: string
  businessNumber: string
  deviceCount: number
  deviceType: string
  franchiseYn: string
  linkType: string
  region: string
  shopCode: string
  shopType: string
  tableCount: number
  bankName: string | null
  accountNumber: string | null
  accountHolder: string | null
  ownerName: string | null
  ownerBirth: string | null
  corporate: boolean | null
  startDate: string | null
  endDate: string | null
  managerName: string | null
  agencyUuid: string | null
  agencyId: string | null
  managerPhoneNumber: string | null
  managerEmail: string | null
  naverUrl: string | null
  pickup: boolean | null
  businessLicensePath: string | null
  businessLicenseFileName: string | null
  bankBookPath: string | null
  bankBookFileName: string | null
  shopPhoneNumber: string | null
  refreshTime: number | null
  shopBusinessName: string | null
  shopPosCode: string | null
  vanCode: string | null
  thumbnailList: shopThumbnailVo[]
  useLocale: boolean
  globalPayType : string
  acceptOrderButtonActive: boolean
  tableManagement: boolean
  constructor (index:number, shopInfoVo:ShopInfoVo) {
    this.index = index
    this.doesAlert = shopInfoVo.doesAlert
    this.insDate = shopInfoVo.insDate
    this.insTid = shopInfoVo.insTid
    this.mappedStoreCode = shopInfoVo.mappedStoreCode
    this.mappedStoreId = shopInfoVo.mappedStoreId
    this.posCode = shopInfoVo.posCode
    this.printerIp = shopInfoVo.printerIp
    this.qrStoreCode = shopInfoVo.qrStoreCode
    this.shopName = shopInfoVo.shopName
    this.shopSeq = shopInfoVo.shopSeq
    this.tableNums = shopInfoVo.tableNums
    this.uptDate = shopInfoVo.uptDate
    this.uptTid = shopInfoVo.uptTid
    this.useEnglish = shopInfoVo.useEnglish
    this.usePrinter = shopInfoVo.usePrinter
    this.rfMac = shopInfoVo.rfMac
    this.activeYn = shopInfoVo.activeYn
    this.address1 = shopInfoVo.address1
    this.address2 = shopInfoVo.address2
    this.authCd = shopInfoVo.authCd
    this.businessNumber = shopInfoVo.businessNumber
    this.deviceCount = shopInfoVo.deviceCount
    this.deviceType = shopInfoVo.deviceType
    this.franchiseYn = shopInfoVo.franchiseYn
    this.linkType = shopInfoVo.linkType
    this.region = shopInfoVo.region
    this.shopCode = shopInfoVo.shopCode
    this.shopType = shopInfoVo.shopType
    this.tableCount = shopInfoVo.tableCount
    this.bankName = shopInfoVo.bankName
    this.accountNumber = shopInfoVo.accountNumber
    this.accountHolder = shopInfoVo.accountHolder
    this.ownerName = shopInfoVo.ownerName
    this.ownerBirth = shopInfoVo.ownerBirth
    this.corporate = shopInfoVo.corporate
    this.startDate = shopInfoVo.startDate
    this.endDate = shopInfoVo.endDate
    this.managerName = shopInfoVo.managerName
    this.agencyUuid = shopInfoVo.agencyUuid
    this.agencyId = shopInfoVo.agencyId
    this.managerPhoneNumber = shopInfoVo.managerPhoneNumber
    this.managerEmail = shopInfoVo.managerEmail
    this.naverUrl = shopInfoVo.naverUrl
    this.pickup = shopInfoVo.pickup
    this.businessLicensePath = shopInfoVo.businessLicensePath
    this.businessLicenseFileName = shopInfoVo.businessLicenseFileName
    this.bankBookPath = shopInfoVo.bankBookPath
    this.bankBookFileName = shopInfoVo.bankBookFileName
    this.shopPhoneNumber = shopInfoVo.shopPhoneNumber
    this.refreshTime = shopInfoVo.refreshTime
    this.shopBusinessName = shopInfoVo.shopBusinessName
    this.shopPosCode = shopInfoVo.shopPosCode
    this.vanCode = shopInfoVo.vanCode
    this.thumbnailList = shopInfoVo.thumbnailList
    this.useLocale = shopInfoVo.useLocale
    this.globalPayType = shopInfoVo.globalPayType
    this.acceptOrderButtonActive = shopInfoVo.acceptOrderButtonActive
    this.tableManagement = shopInfoVo.tableManagement
  }
}
