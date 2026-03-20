export type PgCode = 'kis' | 'hecto' | 'kovan' | 'smartro' | 'nice' | 'kcp' | 'mainpay';

export interface PgInfoVo{
  pgInfoSeq: number;
  pgName: string;
  pgCodeName: string;
  pay:boolean;
}

export type PayCode = 'sol' | 'nicepay' | 'compass';

export interface HectoPaymentInfoVo{
  hectoPaymentInfoSeq: number;
  mid: string;
  shopSeq: number;
  privacyKey: string;
  hashKey: string;
  tid: string;
}
export interface KisPaymentInfoVo{
  kisPaymentInfoSeq: number;
  mid: string;
  shopSeq: number;
  merchantKey: string;
  tid: string;
}
export interface SmartroPaymentInfoVo{
  smartroPaymentInfoSeq: number;
  mid: string;
  shopSeq: number;
  merchantKey: string;
  tid: string;
  cancelPassword:string;
}
export interface NicePaymentInfoVo{
  nicePaymentInfoSeq: number;
  mid: string;
  shopSeq: number;
  merchantKey: string;
  tid: string;
}
export interface KcpPaymentInfoVo{
  kcpPaymentInfoSeq: number;
  siteCd: string;
  shopSeq: number;
  kcpCertInfo: string;
  certFilePath: string;
  certFileName: string;
  cancelCertPath: string;
  certPassword: string;
  cancelCertName: string;
}
export interface MainPayPaymentInfoVo{
  mainpayPaymentInfoSeq: number;
  shopSeq: number;
  mbrNo: string;
  apiKey: string;
}

export interface EasyPaymentInfoVo {
    easyPaymentInfoSeq: number;
    shopSeq: number;
    mid: string;
}

export interface AlipayPaymentInfoVo{
    alipayPaymentInfoSeq: number;
    shopSeq: number;
    mid: string;
    merchantKey: string;
    useYn: boolean;
}

export type PgPaymentInfoVo =
    | HectoPaymentInfoVo
    | KisPaymentInfoVo
    | SmartroPaymentInfoVo
    | NicePaymentInfoVo
    | KcpPaymentInfoVo
    | MainPayPaymentInfoVo
    | EasyPaymentInfoVo

export interface SolPayInfoVo {
  solPayInfoSeq: number;
  shopSeq: number;
  merchantId: string;
  merchantKey: string;
  cancelPw: string;
}

export interface NiceLinkPayInfoVo {
  niceLinkPaySeq: number;
  shopSeq: number;
  catId: number;
  useAppCard: boolean;
  useKakaoPay: boolean;
  useNaverPay: boolean;
  naverMerchantId: string | null;
  partnerCode: string;
  manual: boolean;
}

export interface shopThumbnailVo {
  thumbnailSeq: string;
  shopSeq: number;
  thumbnailFilePath: string;
  thumbnailFileName: string;
  insTid: string;
  insDate: string;
  orderIndex: number;
  check: boolean;
}

export interface ShopDeviceVo {
  shopDeviceSeq: number | null;
  shopSeq : number;
  deviceType: string;
  deviceColor: string;
  quantity: number;
  status: string;
}

// export interface ShopInfoVo {
//   shopSeq: number;
//   shopName: string;
//   doesAlert: boolean;
//   useEnglish: boolean;
//   insDate: string;
//   insTid: string;
//   uptDate: string;
//   uptTid: string;
//   printerIp: string;
//   usePrinter: boolean;
//   tableNums: string[];
//   posCode: string;
//   mappedStoreId: number;
//   mappedStoreCode: string;
//   qrStoreCode: string;
//   rfMac: string[];
//   activeYn: string;
//   shopStatus: string;
//   region: string;
//   address1: string;
//   address2: string;
//   deviceType: string;
//   deviceCount: number;
//   franchiseYn: string;
//   businessNumber: string;
//   shopType: string;
//   authCd: string;
//   linkType: string;
//   shopCode: string;
//   tableCount: number;
//   bankName: string | null;
//   accountNumber: string | null;
//   accountHolder: string | null;
//   ownerName: string | null;
//   ownerBirth: string | null;
//   corporate: boolean | null;
//   startDate: string | null;
//   endDate: string | null;
//   managerName: string | null;
//   agencyUuid: string | null;
//   agencyId: string | null;
//   managerPhoneNumber: string | null;
//   managerEmail: string | null;
//   naverUrl: string | null;
//   pickup: boolean | null;
//   businessLicensePath: string | null;
//   businessLicenseFileName: string | null;
//   bankBookPath: string | null;
//   bankBookFileName: string | null;
//   shopPhoneNumber: string | null;
//   shopBusinessName: string | null;
//   shopPosCode: string | null;
//   vanCode: string | null;
//   thumbnailList: shopThumbnailVo[];
//   useLocale: boolean;
//   globalPayType : string;
//   acceptOrderButtonActive: boolean;
//   tableManagement: boolean;
//   shopLanguage : string;
//   bannerUse: boolean;
//   bannerFilePath: string | null;
//   bannerFileName: string | null;
//   bannerLink: string | null;
//   requestActive: boolean;
//   openTime: string | null;
//   closeTime: string | null;
//   mappedHeadCode: string;
//   noticeContent: string | null;
//   installationDate: string | null;
//   contractPath: string | null;
//   contractFileName: string | null;
//   cmsFormPath: string | null;
//   cmsFormFileName: string | null;
//   etcFilePath: string | null;
//   etcFileFileName: string | null;
//   etcNote: string | null;
//   monthlyFare: number | null;
//   deviceList: ShopDeviceVo[];
//   workerName: string | null;
//   customLogoUse: boolean;
//   customLogoFilePath: string | null;
//   customLogoFileName: string | null;
//   ownerLicensePath : string | null;
//   ownerLicenseFileName : string | null;
//   paymentMethod: string | null;
//   pg: boolean;
// }

export interface ShopInfoVo {
  requestActive: boolean;
  shopSeq: number;
  shopName: string;
  doesAlert: boolean;
  useEnglish: boolean;
  insDate: string;
  insTid: string;
  uptDate: string;
  uptTid: string;
  printerIp: string;
  usePrinter: boolean;
  usePrinterMenuFilter: boolean; // 프린터별 메뉴 출력 기능 사용 여부
  useOrderTypeSelection: boolean; // 포장/먹고가기 선택 기능 사용 여부
  tableNums: string[];
  posCode: string;
  mappedStoreId: number;
  mappedStoreCode: string;
  qrStoreCode: string;
  rfMac: string[];
  activeYn: string;
  shopStatus: string;
  region: string;
  address1: string;
  address2: string;
  deviceType: string;
  deviceCount: number;
  franchiseYn: string;
  businessNumber: string;
  shopType: string;
  authCd: string;
  linkType: string;
  shopCode: string;
  tableCount: number;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  ownerName: string | null;
  ownerBirth: string | null;
  corporate: boolean | null;
  startDate: string | null;
  endDate: string | null;
  managerName: string | null;
  agencyUuid: string | null;
  agencyId: string | null;
  managerPhoneNumber: string | null;
  managerEmail: string | null;
  naverUrl: string | null;
  pgCommissionCode: string | null;
  pickup: boolean | null;
  businessLicensePath: string | null;
  businessLicenseFileName: string | null;
  bankBookPath: string | null;
  bankBookFileName: string | null;
  ownerLicensePath: string | null;
  ownerLicenseFileName: string | null;
  ownerStampPath: string | null;
  ownerStampFileName: string | null;
  corporateStampPath: string | null;
  corporateStampFileName: string | null;
  corporateRegistrationPath: string | null;
  corporateRegistrationFileName: string | null;
  ownerConfirmationPath: string | null;
  ownerConfirmationFileName: string | null;
  useStampPath: string | null;
  useStampFileName: string | null;
  pgCode: PgCode | null;
  hectoPaymentInfo: HectoPaymentInfoVo | null;
  kisPaymentInfo: KisPaymentInfoVo | null;
  smartroPaymentInfo: SmartroPaymentInfoVo | null;
  nicePaymentInfo: NicePaymentInfoVo | null;
  kcpPaymentInfo: KcpPaymentInfoVo | null;
  shopPhoneNumber: string | null;
  refreshTime: number | null;
  shopBusinessName: string | null;
  shopPosCode: string | null;
  vanCode: string | null;
  thumbnailList: shopThumbnailVo[];
  useLocale: boolean;
  acceptOrderAlarm: boolean;
  cancelOrderAlarm: boolean;
  pickupAlarm: boolean;
  acceptOrderButtonActive: boolean;
  tableManagement: boolean;
  bannerUse: boolean;
  bannerFilePath: string | null;
  bannerFileName: string | null;
  bannerLink: string | null;
  isDeliveryUse : boolean;
  openTime: string | null;
  closeTime: string | null;
  mappedHeadCode: string | null;
  receiptType: string | null;
  noticeContent: string | null;
  minimumAmount: number | null;
  deliveryPgCode: PgCode | null;
  pg: boolean;
  installationDate: string | null;
  contractPath: string | null;
  contractFileName: string | null;
  cmsFormPath: string | null;
  cmsFormFileName: string | null;
  etcFilePath: string | null;
  etcFileFileName: string | null;
  etcNote: string | null;
  monthlyFare: number | null;
  deviceList: ShopDeviceVo[];
  workerName: string | null;
  solPayUse: boolean;
  solPayInfo: SolPayInfoVo | null;
  nicePayUse: boolean;
  niceLinkPayInfo: NiceLinkPayInfoVo | null;
  alipayPaymentInfo : AlipayPaymentInfoVo | null;
  customLogoUse: boolean;
  customLogoFilePath: string | null;
  customLogoFileName: string | null;
  paymentMethod: string | null;
  afterEatPaymentActive: boolean; // 다먹고 결제 활성화 여부
  frontPaymentUse: boolean; // 프론트 결제 사용 여부
  frontPaymentDeviceCode: string | null; // 프론트 결제 디바이스 코드
  usagePurpose: 'TABLE_ORDER' | 'PAYMENT_WINDOW' | 'ALL' | ''; // 에이전트 매장 사용 용도
  alimtalkUse: boolean; // 알림톡 사용 여부
  phoneNumberOptional: boolean; // 전화번호 건너뛰기 여부
  shopLanguage : string;
  zipcode: string | null;

  // 결제 배너
  paymentFileUse: boolean;
  paymentFileName: string | null;
  paymentFileLink: string | null;
  paymentFilePath: string | null;

  mainpayPaymentInfo: MainPayPaymentInfoVo | null;
  easyPaymentInfo: EasyPaymentInfoVo | null;
}

export type ShopPostDto = Pick<ShopInfoVo, 'shopName'|'managerName'|'managerEmail'|'managerPhoneNumber'|'corporate'|'deviceCount'|'linkType'|'posCode'|'shopPosCode'|'vanCode'| 'mappedStoreCode' | 'deviceList'>
export type SignShopDto = Pick<ShopInfoVo, 'shopSeq'|'shopName'|'address1'|'address2'|'businessNumber'|'shopCode'|'tableCount'|'bankName'|'accountNumber'|'accountHolder'|'ownerName'|'ownerBirth'|'managerName'|'managerPhoneNumber'|'managerEmail'|'agencyId'|'naverUrl'|'businessLicensePath'|'businessLicenseFileName'|'bankBookPath'|'bankBookFileName'|'shopBusinessName'|'deviceCount'|'startDate'|'paymentMethod'>
export type ShopStatusPutDto = Pick<ShopInfoVo, 'shopSeq'|'activeYn'|'shopStatus'>

export interface StationVo {
  code: string;
  name: string;
  zoneId: string;
  ipNtpServer: string;
}
export interface GatewayInfoVo {
  id: number;
  code: string;
  macAddress: string;
  ipAddress: string;
  name: string;
  version: string;
  status: string;
  lastConnectionDate: string;
  station: StationVo;
  endDevicesCountByState: Object;
}

export type align = 'left' | 'center' | 'right'
export interface ArticleVo{
  stationCode: string;
  id: string;
  nfc: string;
  name: string;
  reservedOne: string;
  reservedTwo: string;
  reservedThree: string;
}

export interface SLabelStatusVo{
  battery: string;
  signalStrength: string;
  updateStatus: string;
  aliveStatus: string;
  temperature: number;
}

export interface HandOrderLabelStatusVo{
  stationCode: string;
  labelCode: string;
  statusUpdateTime: string;
  status: string;
  articleList: ArticleVo[];
  sLabelStatus: SLabelStatusVo;
}
export interface HoRandomMapVo{
  codeLinkSeq: number;
  storeCode: string;
  productId: string;
  randomCode: string;
  prevRandomCode: string;
  landingUrl: string;
  batchUpdate: boolean;
}
export interface HoNoticeVo{
  boardSeq?: number|null;
  boardTitle: string;
  boardText: string;
  createDt?: string|null;
  updateDt?: string|null;
  isDeleted?: boolean|null;
  boardType: string;
}
export interface HandOrderGatewayPostDto{
  code: string;
  name: string;
  stationCode: string;
}
export interface HandOrderProductPostDto{
  productId: string | null;
  storeCode: string | null;
  tableNum: number | null;
}

export interface CompanyVo{
  companySeq: number;
  companyCode: string;
  companyName: string;
  companyType: string;
  ownerName: string;
  startDate: string;
  endDate: string;
  businessStatus: string;
  businessType: string;
  businessNumber: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  accountNumber: string;
  accountHolder: string;
  headCompanySeq: number;
  headCompanyName: string;
  bankName: string;
  address1: string;
  address2: string;
  businessLicensePath: string|null;
  bankbookPath: string|null;
  bankbookFileName: string|null;
  businessLicenseFileName: string|null;
  pickupPgCode: string | null;
  servingPgCode: string | null;
  companyBusinessName: string | null;
  businessCheckYn: boolean | null;
  headCompanyMemberId: string;
  insTid: string;
  insDate: string;
  uptTid: string;
  uptDate: string;
  shopCount: number;
  activeYn: string;
  companyStatus: string;
}

export type SignupCompanyDto = Pick<CompanyVo, 'companySeq'|'companyName'|'companyBusinessName'|'businessType'|'ownerName'|'businessStatus'|'businessNumber'|'managerName'|'managerPhone'|'managerEmail'|'address1'|'address2'|'bankbookPath'|'bankbookFileName'|'businessLicensePath'|'businessLicenseFileName'|'headCompanyMemberId'|'businessCheckYn'|'startDate'|'headCompanySeq'>
export type CompanyPostDto = Pick<CompanyVo, 'companyName'|'managerName'|'managerEmail'|'headCompanySeq'>
export type CompanyStatusPutDto = Pick<CompanyVo, 'companySeq'|'activeYn'>

export interface HandOrderProductBatchPostDto{
  storeCode: string|null;
  tableTotalCount: number|null;
}
export interface ChatMessage {
  from: string;
  text: string;
  time: string;
}
export type UserType = 'admin' | 'company' | 'worker' | 'shop'

export interface AdminMemberVo{
  memberUuid: string;
  id: string;
  password: string;
  userName : string;
  storeSeq: string;
  role: string;
  position: string;
  companySeq: number;
  userType: UserType;
  email: string;
  phoneNumber: string;
  shopInfo: ShopInfoVo;
  companyCode: string;
  agreed: boolean;
  shopSeq: number;
  authGroupSeq: number;
  menuAuth:string;
  isAuthorityRequestBlocked: boolean;
  hasShopInfoEditPermission: boolean;
  isAuthorityRequestBlocked: boolean;
  hasShopInfoEditPermission: boolean;
}
export type AdminMemberPostDto = Pick<AdminMemberVo, 'id'|'password'|'userName'|'position'|'userType'|'phoneNumber'|'email'|'shopSeq'>

export interface MenuAuthVo{
  authSeq: number;
  menuId: string;
  menuAuth: string;
}

export interface AuthVo{
  authSeq: number;
  authName: string;
  authCd: string;
  prevAuthSeq: string;
  createMemberUuid: string;
  shopSeq: number;
  companySeq: number;
  prevAuthName: string;
  companyName: string;
  menuAuthList: MenuAuthVo[];
}
export interface HoPrintLogMenuOptionVo{
  printSeq: number;
  printGroupUuid: string;
  optionUuid: string;
  menuSeq: number;
  optionName: string;
  doesReplace: boolean;
  insDate: string;
  insTid: string;
  uptDate: string;
  uptTid: string;
  optionPrice: number;
  optionGroupName: string;
  localeOptionGroupName : string;
  optionUnique: boolean;
  localeOptionName: string;
}
export interface HoPrintLogVo{
  printSeq: number;
  printGroupUuid: string;
  shopSeq: number;
  tableSeq: number;
  tableNum: string;
  menuSeq: number;
  menuName: string;
  menuPrice: number;
  quantity: number;
  finalPrice: number;
  printDate: string;
  insDate: string;
  insTid: string;
  uptDate: string;
  uptTid: string;
  isPrinted: boolean;
  localeMenuName: string;
  printLogMenuOptionList: HoPrintLogMenuOptionVo[];
  requestText ?: string;
  riderRequestText ?: string;
  userPhoneNumber?:string;
}

export interface HoOrderStatusVo{
  storeId: number;
  storeCode: string;
  orderNo: number;
  status: string;
  deliveryTime: number;
  cancelCode: number;
  orderCode: string;
}

export interface HoPrintLogGroupVo{
  printGroupUuid: string;
  tableSeq: number;
  tableNum: string;
  tableName: string;
  insDate: string;
  printLog: HoPrintLogVo[];
  orderStatus: HoOrderStatusVo;
  orderNumber: number|null;
  requestText: string|null;
  pgPaymentResult?: {
    trdNo: string;
    method: string;
    mchtId: string;
    mchtTrdNo: string;
    pmtprdNm: string;
    trdDtm: string;
    trdAmt: number;
    cardCd: string;
    cardNm: string;
    cardNo: string;
    cardApprNo: string;
    instmtMon: string;
    pktHash?: string;
    ezpDivCd?: string;
    canceled: boolean;
    canceledAmt?: number;
    cancelDtm?: string;
    pgType: string;
    appCardCd?: string;
    appCardNm?: string;
    resultMsg?: string;
  } | null;
  delivery: boolean;
  takeOut: boolean;
  cardApprNo : string | null;
}

export interface HoTableOrderVo{
  tableSeq: number;
  shopSeq: number;
  tableNum: string;
  tableName: string;
  printLogList: HoPrintLogVo[];
}

export interface HoMenuImageVo{
  imageUuid: string;
  menuSeq: number;
  shopSeq: number;
  imagePath: string;
  imageName: string;
  imageUrl: string;
  sortNumber: number;
  insTid: string;
  insDate: string;
}

export interface HoOptionVo{
  optionUuid: string;
  optionGroupUuid: string;
  optionName: string;
  optionPrice: number;
  orderIndex: number;
  insDate: string;
  insTid: string;
  uptDate: string;
  uptTid: string;
  engOptionName: string;
  isDeleted: boolean;
  shopCode: string;
  mappedOptionCode: string;
  mappedOptionName: string;
  mappedOptionGroupCode: string;
  outOfStock?: boolean;
  isHidden: boolean;
  optionGroupName?: string;
}

export interface HoOptionGroupVo{
  optionGroupUuid: string;
  optionGroupName: string;
  optionUnique: boolean;
  optionRequired: boolean;
  doesReplace: boolean;
  engOptionGroupName: string;
  insDate: string;
  insTid: string;
  uptDate: string;
  uptTid: string;
  optionGroupVisibleName: string;
  orderIndex: number;
  tempMenuSeq: number;
  isDeleted: boolean;
  isHidden: boolean;
  shopCode: string;
  shopSeq: number;
  optionList: HoOptionVo[];
  mappedOptionGroupCode: string;
  mappedOptionGroupName: string;
  maxQty: number|null;
  minQty: number|null;
}

export interface HoMenuVo{
  menuSeq: number;
  shopCode: string;
  menuName: string;
  engMenuName: string;
  categoryUuid: string;
  menuPrice: number;
  isRecommended: boolean;
  thumbnailPath: string;
  informationText: string|null;
  delayingMenu: boolean;
  outOfStock: boolean;
  isHidden: boolean;
  menuOptionGroups: HoOptionGroupVo[];
  orderIndex: number;
  thumbnailUrl: string;
  startDate: string | null;
  endDate: string | null;
  ingredients: string | null;
  label: string;
}
export interface HoCategoryVo{
  categoryUuid: string;
  shopSeq: number;
  shopCode: string;
  categoryName: string;
  engCategoryName: string;
  insDate: string;
  insTid: string;
  uptDate: string;
  uptTid: string;
  menus: HoMenuVo[];
  orderIndex: number;
  isDeleted: boolean;
  isHidden: boolean;
  mappedCategoryCode: string;
  mappedCategoryName: string;
}

export interface HoTableVo{
  tableSeq: number;
  shopSeq: number;
  tableNum: string;
  tableName: string;
  mappedTableId: string;
  mappedFloorId: string;
  mappedUptDt: string;
  delivery : boolean;
}

export interface LocaleCodeVo{
  localeCode: string;
  localeName: string;
  orderIndex: number;
}
export interface LocaleMenuVo{
  localeMenuMapSeq: number;
  menuSeq: number;
  localeCode: string;
  localeMenuName: string;
  localeInformationText: string;
}
export interface LocaleCategoryVo{
  localeCategoryMapSeq: number;
  categoryUuid: string;
  localeCode: string;
  localeCategoryName: string;
}
export interface LocaleOptionGroupVo{
  localeOptionGroupMapSeq: number;
  optionGroupUuid: string;
  localeCode: string;
  localeOptionGroupName: string;
}
export interface LocaleOptionVo{
  localeOptionMapSeq: number;
  optionUuid: string;
  localeCode: string;
  localeOptionName: string;
}

export interface PrinterVo{
  printerObjectType: string;
  printerSeq: number;
  shopSeq: number;
  printerName: string;
  printerType: string;
  mainConnectionInfo: string;
  subConnectionInfo: string;
  orderReceipt: boolean;
  rePrint: boolean;
  insDate: string;
  insTid: string;
  uptDate: string;
  uptTid: string;
  check?: boolean;
  menuSeqList?: number[];
    orderReceiptType : string | null;
    rePrintType : string | null;
}

export interface PrinterMenuMappingVo {
  printerSeq: number;
  menuSeq: number;
}

export interface HoDesktopOrderVo extends HoPrintLogGroupVo{
  printerList: PrinterVo[];
  shopInfo: ShopInfoVo;
}

export type LabelDeviceType = '2.2/3'|'3.5/3'|'3.5/4'|'7.5/4';
export type ExtraSmallTemplateType = 'CUSTOM_EXTRA_SMALL'|'BLACK';
export type SmallTemplateType = 'DEFAULT_SMALL'|'WHITE'|'BLACK'|'CUSTOM_SMALL';
export type BigTemplateType = 'DEFAULT'|'KIOSK'|'TABLE'|'CUSTOM';

export interface LabelTemplateVo {
  labelTemplateSeq?: number;
  deviceType: LabelDeviceType;
  extraSmallTemplateType?: ExtraSmallTemplateType;
  smallTemplateType?: SmallTemplateType;
  bigTemplateType?: BigTemplateType;
  templateName: string;
  imageName: string;
  file:File;
  fileName: string;
  filePath: string;
  textTop?: string;
  textBottom?: string;
}

export interface HoMenuAuthGroupVo{
    authGroupSeq: number;
    groupName: string;
    menuAuth: string;
}

export interface MenuItem {
  menuId?: string
  menuName: string
  icon?: string
  iconActiveClass?: string
  iconNonActiveClass?: string
  iconMiniActiveClass?: string
  auth: string[]
  to: string | null
  expanded: boolean
  menuCode: string
  menuList: MenuItem[]
}

export interface HoBusinessTime{
  hour : string,
  minute: string,
}

export interface HoBreakTimeVo{
  shopBreakTimeSeq: number | undefined;
  shopSeq: number;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  dayOfWeekList : number[];
}

export interface HoBreakTime extends HoBreakTimeVo {
  seq: number;
  startTimeData: HoBusinessTime;
  endTimeData: HoBusinessTime;
  state:string;
}

export interface ExcelCategoryMenuJsonVo {
  categoryName : string;
  menuName: string;
  menuPrice: number;
  menuDescription: string;
}

export interface ExcelOptionGroupJsonVo {
  optionGroupName: string;
  optionUnique:boolean;
  optionRequired: boolean;
  doesReplace: boolean;
  minQty: number;
  maxQty: number;
}

export interface ExcelOptionJsonVo {
  optionGroupName: string ;
  optionName: string;
  optionPrice: number;
}

export interface ExcelImportDto {
  categoryMenuList : ExcelCategoryMenuJsonVo[];
  optionGroupList : HoOptionGroupVo[];
  optionList : HoOptionVo[];
}

export interface CompanyReportDto {
  companySeq : number;
  companyCode: string;
  companyName : string;
  headCompanySeq : number;
}

export interface ArticleObjectDto {
  articleId: string;
  articleName: string;
  data: string;
}

export interface GatewayObjectDto {
  id: number;
  code: string;
  macAddress: string;
  ipAddress: string;
  name: string;
  version: string;
  status: string;
  lastConnectionDate: string; // ISO Date 형식 문자열
  uriScheme: string;
  port: number;
}

export interface LabelDataDto {
  labelCode: string;
  networkStatus: boolean;
  articleList: ArticleObjectDto[];
  updateStatus: string;
  battery: string;
  signal: string;
  type: string;
  gateway: GatewayObjectDto;
  firmwareVersion: number;
  templateName: string[];
  templateType: string[];
  lastResponseTime: string; // ISO Date 형식 문자열
  lastConnectionTime: string; // ISO Date 형식 문자열
  arrow: string;
  addInfo2: string;
  addInfo3: string;
  addInfo4: string;
  addInfo5: string;
  temperature: number;
  requestDate: string; // ISO Date 형식 문자열
  completedDate: string; // ISO Date 형식 문자열
  batteryLevel: string;
  templateManual: boolean;
}

export interface LabelDto {
  responseMessage: string;
  responseCode: string;
  customBatchId: string;
  labelList: LabelDataDto[];
}

export interface HoShopMenuboardVo{
  shopMenuboardSeq: number | undefined;
  shopSeq: number;
  menuboardName: string;
  useYn: boolean;
  everydayYn: boolean;
  startTime: string;
  endTime: string;
  dayOfWeekList : number[];
  menuSeqList : number[];
  priority: number;
}

export interface QxImageVo{
  shopSeq: number;
  imageUuid : string;
  imageName : string;
  imageOriginalName : string;
  imagePath : string;
  insDate : string;
  insTid : string;
  uptDate : string;
  uptTid : string;
  isDeleted : boolean;
}
export interface LabelTemplateToTablesDto {
  shopInfoList: ShopInfoVo[];
  tableSeqList: number[];
}

export interface ShopWaitingVo {
  shopSeq: number;
    useWaiting: boolean;
    waitingStatus: string;
    useAdult: boolean;
    adultMin: number;
    adultMax: number;
    useKid: boolean;
    kidMin: number;
    kidMax: number;
}

export interface WaitingVo {
  waitingUuid: string;
  shopSeq: number;
  waitingNumber: number;
  waitingStatus: string;
  userPhoneNumber: string;
  adultCount: number;
  kidCount: number;
  insDate: string;
}

export interface AlertChargeVo{
  alertChargeKey: string;
  shopSeq: number;
  shopCode: string;
  applyDate: string;
  chargeStatus: string;
  chargeAmount: number;
  chargeCount: number;
  approvalDate: string;
  approvalUuid: string;
  isCashReceiptRequest: boolean;
}
export interface HoPgCommissionCodeVo{
  pgCommissionCode: string;
  pgCommissionName: string;
  pgCommissionRateSeq: number;
  commissionRate: number;
  orderIndex: number;
}

export interface HoPgPaymentMethodVo{
  pgPaymentMethodCode: string;
  pgPaymentMethodName: string;
  orderIndex: number;
  pgCommissionCodeList: HoPgCommissionCodeVo[];
}

export interface HoPaymentVo{
  paymentUuid: string;
  shopSeq: number;
  tableNum: string;
  paymentTitle: string;
  paymentAmount: number;
  paymentMethod: string;
  printGroupUuid: string | null;
  paymentRequesterCode: string;
  paymentStatus: string;
  insDate: string;
  uptDate: string;
}

export interface HoPaymentListResponse{
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  payments: HoPaymentVo[];
}

export interface HoPaymentCancelResponse{
  success: boolean;
  message: string;
  paymentUuid: string;
  canceledAmount?: number;
  canceledAt?: string;
}

export interface NiceVanPartnerCodeKeyVo {
  index : number;
  partnerCode: string;
  manual: boolean;
  note: string;
}

export interface NiceVanCorpAffObj {
  useYn: string; // 사용여부
  affiliationNo: string; // 가맹점번호
  acquireMethodCode: string; // 매입방법코드
  affiliationOpenDate: string; // 가맹점 개시일
  affiliationCloseDate: string; // 가맹점 해지일
  normalKeyinYn: string; // 키인여부
  monthYn: string; // 할부여부
  autoAcquireOpenDate: string; // 자동이체 개시일
  autoAcquireCloseDate: string; // 자동이체 해지일
  autoAcquireKeyinYn: string; // 자동이체 키인여부
}

export interface NiceVanContractDto {
  type: string; // 신청 구분
  businessNo: string; // 사업자번호
  businessName: string; // 상호명
  merchantName: string; // 간판상호명
  directorName: string; // 대표자명
  birthDt: string; // 생년월일
  zipCode: string; // 우편번호
  officeAddress1: string; // 사업장주소1
  businessKind: string; // 업태(종목)
  businessType: string; // 업종
  businessDetail: string; // 취급품목
  officeTelNo: string; // 사업장연락처
  mobileTelNo: string; // 휴대전화번호
  homeTelNo: string; // 자택전화번호
  email: string; // Email 주소
  regDate1: string; // 신청일
  regUser1: string; // 신청자(대표자)
  regDate2: string; // 신청일2
  regUser2: string; // 신청자2(대표자)
  kisBackupYn: string; // 백업시스템
  formVersion: string; // 신청서 버전
  agentRegDate: string; // 위임 신청일
  agentCode: string; // 대리점코드
  agentBusinessNo: string; // 대리점 사업자번호
  agentName: string; // 대리점명
  parentAgentCode: string; // 모대리점코드
  estInfoCollectYn: string; // 개인정보 수집 이용 동의1
  privacyCollectYn: string; // 개인정보 수집 이용 동의2
  estInfoOfferYn: string; // 개인(신용)정보 제공 동의1
  privacyOfferYn: string; // 개인(신용)정보 제공 동의2

  corpRegNo: string | null; // 법인등록번호
  officeAddress2: string | null; // 사업장주소2
  staffTelNo: string | null; // 담당전화번호
  homepage: string | null; // 홈페이지
  visaAcqCom: string | null; // 비자매입사
  masterAcqCom: string | null; // 마스터매입사
  jcbAcqCom: string | null; // JCB 매입사
  agentDirectorName: string | null; // 대리점 대표자명
  agentAddr1: string | null; // 대리점주소1
  agentAddr2: string | null; // 대리점주소2
  agentUsrId: string | null; // 모집인ID
  agentUsrName: string | null; // 모집인명
  agentUsrPhone: string | null; // 모집인 연락처
  useAdviceMethodYn: string | null; // NICE VAN 서비스 이용 동의 여부
  useAdviceMethodTelYn: string | null; // 서비스 이용 권유방법(전화)
  useAdviceMethodSmsYn: string | null; // 서비스 이용 권유방법(SMS)
  useAdviceMethodWrittenYn: string | null; // 서비스 이용 권유방법(서면)
  useAdviceMethodEmailYn: string | null; // 서비스 이용 권유방법(EMail)

  businessLicenseFile: File | null; // 사업자등록증
  ownerIdCardFile: File | null; // 대표자 신분증

  corpAffObj: {cardName:string, affObj:NiceVanCorpAffObj}[];

  partnerCode: string; // 파트너 코드
  catId: number; // 밴 직접 등록 시 입력받는 CAT ID
}

export interface NicePayNaverInfoDto {
  storeName: string;
  businessNo: string;
  storeAddress: string;
  phone: string;

  businessType: string;
  zipCode: string;
  changeType: string;
  businessTypeCode: string;
}

export interface MobilePosDeviceVo {
  device_id: string;
  shop_seq: number;
  device_role: number;
  is_approved: 'Y' | 'N';
}

/**
 * 모바일 POS 디바이스 역할
 *
 * 1 : 점장
 * 10 : 직원
 */
export interface MobilePosDeviceRoleVo {
  deviceRole: '1' | '10';
  deviceRoleName: string;
}

export interface PgPaymentResultVo{
  outStatCd: string;
  trdNo: string;
  method: string;
  bizType: string;
  mchtId: string;
  mchtTrdNo: string;
  mchtCustNm: string;
  mchtName: string;
  pmtprdNm: string;
  trdDtm: string;
  trdAmt: number;
  svcAmt: number;
  billKey: string;
  billKeyExpireDt: string;
  cardCd: string;
  cardNm: string;
  email: string;
  mchtCustId: string;
  cardNo: string;
  cardApprNo: string;
  instmtMon: string;
  instmtType: string;
  orgTrdNo: string;
  orgTrdDt: string;
  mixTrdNo: string;
  mixTrdAmt: number;
  payAmt: string;
  cnclType: string;
  mchtParam: string;
  pktHash: string;
  ezpDivCd: PaymentMethod;
  pntAmt: number;
  cardAmt: number;
  coupAmt: number;
  kkmAmt: number;
  csrcIssAmt: number;
  csrcIssNo: string;
  canceled: boolean;
  canceledAmt: number;
  cancelDtm: string;
  pgType: PgCode | PayCode;
  appCardCd: string;
  cardType: string;
  resultMsg: string;
  mbsReserved: string;
  nointFlg: string;
  usePointAmt: number;
  authType: string;
  cancelYn: string;
  easyPayCd: string;
  easyPayNm: string;
  cashCrctFlg: string;
  vacntNo: string;
  lmtDay: string;
  socHpNo: string;
  crctType: string;
  crctNo: string;
}

export type PaymentMethod = '' | 'KKP' | 'NVP' | 'PAC';

export interface HoSalesVo{
  printLogGroup: HoPrintLogGroupVo;
  pgPaymentResult: PgPaymentResultVo;
  shopInfo: ShopInfoVo;
  company?: CompanyVo;
}

export interface HoShopGroupCustomLinkVo{
  shopGroupUuid: string;
  linkSeq: number;
  isActive: boolean;
  linkUrl: string;
  linkName: string;
  sortNumber: number;
  insDate: string;
  image: File | null;
  imagePath: string;
  orgImageName: string;
}

export interface HoShopGroupLinkVo{
  shopGroupUuid: string;
  shopGroupLinkCode: string;
  linkName: string;
  defaultAddress: string;
  isDeleted: boolean;
  isActive: boolean;
  insTid: string;
  insDate: string;
  uptTid: string;
  uptDate: string;
}

export interface HoShopGroupVo{
  shopGroupUuid: string;
  shopGroupName: string;
  shopGroupStatus: string;
  isBannerUse: boolean;
  bannerUrlLink: string;
  bannerImagePath: string;
  shopGroupNotice: string;
  insTid: string;
  insDate: string;
  uptTid: string;
  uptDate: string;
  isDeleted: boolean;
}

export interface HoShopGroupMappedVo{
  shopGroupUuid: string;
  shopSeq: number;
  isActive: boolean;
  codeLinkSeq: number;
  shopName: string;
  shopCode: string;
  openTime: string;
  closeTime: string;
  codeLink: string;
  randomCode: string;
  image: File | null;
  imagePath: string;
  orgImageName: string;
}

export type groupMappedPostDto = Pick<HoShopGroupMappedVo, 'shopGroupUuid'|'shopSeq'|'codeLinkSeq'|'image'>

export interface SignageVo{
  signageObjectType: string;
  signageCode: string;
  signageName: string;
  shopSeq: number;
  isActive: boolean;
  insDate: string;
  uptDate: string;
  uptTid: string;
  check?: boolean;
}

export class SignageClass implements SignageVo {
  public signageObjectType: string = 'new'
  public signageCode: string = ''
  public signageName: string = ''
  public shopSeq: number = 0
  public isActive: boolean = true
  public insDate: string = ''
  public uptDate: string = ''
  public uptTid: string = ''
  public check?: boolean = false
  constructor (init?: Partial<SignageVo>) {
    Object.assign(this, init)
  }
}
export interface HoPgOrderVo extends HoPrintLogGroupVo{
  printerList: PrinterVo[];
  shopInfo: ShopInfoVo;
  pgPaymentResult: PgPaymentResultVo;
}

export interface ShopAuthorityResponse {
  shopSeq: number;
  shopCode: string;
  shopName: string;
  shopStatus: string;
  address: string;
  companyName: string;
  authorityStatus: string;
  userName: string;
  memberId: string;
  memberUuid: string;
  requestDate: string;
  endDate: string;
}

export interface CompassShopStatusVo {
  shopSeq: number;
  shopCode: string;
  shopName: string;
  compassStoreCode: string;
  status: 'IN_PROGRESS' | 'ACTIVE';
  compassType: string;
  insDate: string;
  uptDate: string | null;
}

export interface ShopAuthorityResponse {
  shopSeq: number;
  shopCode: string;
  shopName: string;
  shopStatus: string;
  address: string;
  companyName: string;
  authorityStatus: string;
  userName: string;
  memberId: string;
  memberUuid: string;
  requestDate: string;
  endDate: string;
}
