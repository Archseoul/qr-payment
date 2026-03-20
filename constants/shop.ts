/**
 * 매장관리 > 매장 등록/현황 > 매장상세 페이지의 PG 설정 컴포넌트에서 사용되는
 * PG사별 설정 필드 정보
 *
 * @description
 * PG사 선택 시 하단에 표시되는 입력 필드들의 정보를 정의
 * 각 PG사별로 필요한 설정값(상점ID, 키 등)의 라벨과 필드명을 관리
 */
export const pgFields: Record<string, { id: number; label: string; fieldKey: string}[]> = {
  hecto: [
    { id: 1, label: '상점 아이디', fieldKey: 'mid' },
    { id: 2, label: 'Privacy Key', fieldKey: 'privacyKey' },
    { id: 3, label: 'Hash Key', fieldKey: 'hashKey' }
  ],
  kis: [
    { id: 1, label: '상점 아이디', fieldKey: 'mid' },
    { id: 2, label: 'Merchant Key', fieldKey: 'merchantKey' }
  ],
  smartro: [
    { id: 1, label: '상점 아이디', fieldKey: 'mid' },
    { id: 2, label: 'Merchant Key', fieldKey: 'merchantKey' },
    { id: 3, label: '결제취소 비밀번호', fieldKey: 'cancelPassword' }
  ],
  nice: [
    { id: 1, label: 'mid', fieldKey: 'mid' },
    { id: 2, label: 'Merchant Key', fieldKey: 'merchantKey' }
  ],
  kcp: [
    { id: 1, label: 'site code', fieldKey: 'siteCd' },
    { id: 2, label: '결제취소 비밀번호', fieldKey: 'certPassword' }
  ],
  mainpay: [
    { id: 1, label: 'Member No', fieldKey: 'mbrNo' },
    { id: 2, label: 'Api Key', fieldKey: 'apiKey' }
  ],
  easy: [
    { id: 1, label: 'MID', fieldKey: 'mid' },
    { id: 2, label: 'Secret Key', fieldKey: 'secretKey' }
  ]
} as const

/**
 * 매장관리 > 매장 등록/현황 > 매장상세 페이지의 PG 설정 컴포넌트에서 사용되는
 * PG사별 초기 데이터 구조
 *
 * @description
 * PG사 선택 시 생성되는 초기 데이터 구조를 정의
 * 각 PG사별로 필요한 필드들의 기본값을 관리
 */
export const pgInitialData = {
  hecto: {
    hectoPaymentInfoSeq: 0,
    mid: '',
    shopSeq: 0,
    privacyKey: '',
    hashKey: '',
    tid: ''
  },
  kis: {
    kisPaymentInfoSeq: 0,
    shopSeq: 0,
    mid: '',
    merchantKey: '',
    tid: ''
  },
  smartro: {
    smartroPaymentInfoSeq: 0,
    shopSeq: 0,
    mid: '',
    merchantKey: '',
    tid: '',
    cancelPassword: ''
  },
  nice: {
    nicePaymentInfoSeq: 0,
    shopSeq: 0,
    mid: '',
    merchantKey: '',
    tid: ''
  },
  kcp: {
    kcpPaymentInfoSeq: 0,
    shopSeq: 0,
    siteCd: '',
    certFilePath: '',
    certFileName: '',
    kcpCertInfo: '',
    cancelCertPath: '',
    cancelCertName: '',
    certPassword: ''
  },
  mainpay: {
    mainpayPaymentInfoSeq: 0,
    shopSeq: 0,
    mbrNo: '',
    apiKey: ''
  },
  easy: {
    easyPaymentInfoSeq: 0,
    shopSeq: 0,
    mid: '',
    secretKey: ''
  }
} as const
