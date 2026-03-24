import type { PaymentMethod } from '~/types'

export const PERMISSION_READ = 1 // 읽기
export const PERMISSION_WRITE = 2 // 등록
export const PERMISSION_UPDATE = 4 // 수정
export const PERMISSION_DELETE = 8 // 삭제
export const PERMISSION_UPLOAD = 16 // 업로드
export const PERMISSION_DOWNLOAD = 32 // 다운로드

export const shopType = [
  { value: 'cafe', label: '카페' },
  { value: 'restaurant', label: '음식점' }
]

export const companyStatusCode = [
  { value: 'Y', label: 'COMPANY.017' },
  { value: 'N', label: 'COMMON.006' }
]

export const linkType = [
  { value: 'temp', label: '미정' },
  { value: 'handorder', label: '자체연결_주문관리' },
  { value: 'agent', label: '자체연결_주문접수' },
  { value: 'modu', label: '모두의포스' },
  { value: 'okpos', label: 'OKPOS' },
  { value: 'union', label: 'UNION포스' },
  { value: 'smartro', label: 'SMARTRO포스' },
  { value: 'easy', label: 'EASY포스' },
  { value: 'first', label: '퍼스트포스' },
  { value: 'meta', label: '메타포스' },
  { value: 'npos', label: '엔포스' },
  { value: 'lynk', label: '링크포스' },
  { value: 'mobilepos', label: '모바일포스' }
]

export const vanCode = [
  { value: 'nice', label: 'NICE정보통신' },
  { value: 'kis', label: 'KIS정보통신' },
  { value: 'kicc', label: 'KICC' },
  { value: 'smartro', label: '스마트로' },
  { value: 'ksnet', label: 'KSNET' },
  { value: 'kcp', label: 'KCP' },
  { value: 'inicis', label: '이니시스(INICIS)' }
]

export const ynCode = [
  { value: 'Y', label: '예' },
  { value: 'N', label: '아니오' }
]

export const allMenuList = [
  {
    menuId: 'memberManagement',
    menuName: 'SIDE_MENU.001',
    icon: 'svguse:/icons.svg#people-1',
    iconActiveClass: 'stroke-handorder',
    iconNonActiveClass: 'stroke-black',
    iconMiniActiveClass: 'stroke-white',
    auth: ['admin', 'company', 'worker'],
    to: '',
    expanded: false,
    menuCode: '1000',
    menuList: [
      {
        menuName: 'SIDE_MENU.002',
        auth: ['admin'],
        to: '/company',
        menuCode: '1100'
      },
      {
        menuId: 'companyInfo',
        menuName: 'SIDE_MENU.003',
        auth: ['company', 'worker'],
        to: '/myInfo/company',
        menuCode: '1200'
      },
      {
        menuName: 'SIDE_MENU.002',
        auth: ['company', 'worker'],
        to: '/company',
        menuCode: '1300'
      },
      {
        menuId: 'companyReport',
        menuName: 'SIDE_MENU.004',
        auth: ['admin', 'company'],
        to: '/companyReport',
        menuCode: '1700'
      },
      {
        menuId: 'shopInfo',
        menuName: 'SIDE_MENU.003',
        auth: ['shop'],
        to: '/myInfo/shop',
        menuCode: '1400'
      },
      {
        menuName: 'SIDE_MENU.005',
        auth: ['admin'],
        to: '/menuAuth',
        menuCode: '1500'
      },
      {
        menuName: 'SIDE_MENU.006',
        auth: ['admin'],
        to: '/member',
        menuCode: '1600'
      }
    ]
  },
  {
    menuId: 'shopManagement',
    menuName: 'SIDE_MENU.007',
    icon: 'svguse:/icons.svg#shop-2',
    iconActiveClass: 'fill-handorder',
    iconNonActiveClass: 'fill-black',
    iconMiniActiveClass: 'fill-white',
    auth: ['ALL'],
    expanded: false,
    to: '/shop',
    menuCode: '2000',
    menuList: [
      {
        menuName: 'SIDE_MENU.008', // 매장 등록/현황
        auth: ['ALL'],
        to: '/shop',
        menuCode: '2100'
      },
      {
        menuName: 'SIDE_MENU.009', // 매장 설정
        auth: ['admin', 'shop'],
        to: '/shopSetting',
        menuCode: '2200'
      },
      {
        menuName: 'SIDE_MENU.010', // 메뉴판 관리
        auth: ['ALL'],
        to: '/shopMenuboard',
        menuCode: '2300'
      },
      {
        menuName: 'SIDE_MENU.028', // 알림톡 승인요청
        auth: ['admin'],
        to: '/shopAlert',
        menuCode: '2400'
      },
      {
        menuName: 'SIDE_MENU.029', // 통합판매내역
        auth: ['admin', 'company', 'worker'],
        to: '/cardHistory',
        menuCode: '2500'
      },
      {
        menuName: 'SIDE_MENU.030', // 그룹화설정
        auth: ['admin'],
        to: '/shopGroup',
        menuCode: '2600'
      },
      {
        menuName: '매장 권한 관리',
        auth: ['admin'],
        to: null,
        menuCode: '2400',
        expanded: false,
        menuList: [
          {
            menuName: '매장 권한 요청',
            auth: ['admin'],
            to: '/shopAuthority/request',
            menuCode: '2410'
          },
          {
            menuName: '권한 부여 현황',
            auth: ['admin'],
            to: '/shopAuthority/grant',
            menuCode: '2420'
          }
        ]
      }
    ]
  },
  {
    menuId: 'waitingManagement',
    menuName: 'SIDE_MENU.011',
    icon: 'svguse:/icons.svg#clock-1',
    iconActiveClass: 'stroke-handorder',
    iconNonActiveClass: 'stroke-black',
    iconMiniActiveClass: 'stroke-white',
    auth: ['admin'],
    expanded: false,
    to: '/waiting/setting',
    menuCode: '8000',
    menuList: [
      {
        menuName: 'SIDE_MENU.012',
        auth: ['admin'],
        to: '/waiting/setting',
        menuCode: '8100'
      }
    ]
  },
  {
    menuId: 'menuManagement',
    menuName: 'SIDE_MENU.013',
    icon: 'restaurant_menu',
    iconActiveClass: 'text-handorder',
    iconNonActiveClass: 'text-black',
    iconMiniActiveClass: 'text-white',
    auth: ['shop'],
    expanded: false,
    to: null,
    menuList: [],
    menuCode: '3000'
  },
  {
    menuId: 'deviceManagement',
    menuName: 'SIDE_MENU.014',
    icon: 'svguse:/icons.svg#device-1',
    iconActiveClass: 'stroke-handorder',
    iconNonActiveClass: 'stroke-black',
    iconMiniActiveClass: 'stroke-white',
    auth: ['ALL'],
    expanded: false,
    to: '/device/qr',
    menuCode: '4000',
    menuList: [
      {
        menuName: 'SIDE_MENU.015',
        auth: ['ALL'],
        to: '/device/qr',
        menuCode: '4100'
      },
      {
        menuName: 'SIDE_MENU.016',
        auth: ['admin'],
        to: '/device/legacyTemplate',
        menuCode: '4200'
      },
      {
        menuName: 'SIDE_MENU.017',
        auth: ['admin'],
        to: '/device/newTemplate',
        menuCode: '4300'
      }
    ]
  },
  {
    menuId: 'productManagement',
    menuName: 'SIDE_MENU.018',
    icon: 'svguse:/icons.svg#pizza-1',
    iconActiveClass: 'stroke-handorder',
    iconNonActiveClass: 'stroke-black',
    iconMiniActiveClass: 'stroke-white',
    auth: ['ALL'],
    expanded: false,
    to: '/order',
    menuCode: '5000',
    menuList: [
      {
        menuName: 'SIDE_MENU.019',
        auth: ['ALL'],
        to: '/order',
        menuCode: '5100'
      },
      {
        menuName: 'SIDE_MENU.020',
        auth: ['ALL'],
        to: '/history',
        menuCode: '5200'
      },
      {
        menuName: 'SIDE_MENU.021',
        auth: ['ALL'],
        to: '/report/order',
        menuCode: '5300'
      },
      {
        menuName: 'SIDE_MENU.033',
        auth: ['ALL'],
        to: '/paymentHistory',
        menuCode: '5400'
      }
    ]
  },
  {
    menuId: 'boardManagement',
    menuName: 'SIDE_MENU.022',
    icon: 'svguse:/icons.svg#bell-1',
    iconActiveClass: 'stroke-handorder',
    iconNonActiveClass: 'stroke-black',
    iconMiniActiveClass: 'stroke-white',
    auth: ['ALL'],
    expanded: false,
    to: '/notice',
    menuCode: '6000',
    menuList: [
      {
        menuName: 'SIDE_MENU.023',
        auth: ['ALL'],
        to: '/notice',
        menuCode: '6100'
      },
      {
        menuName: 'SIDE_MENU.024',
        auth: ['ALL'],
        to: '/faq',
        menuCode: '6200'
      }
    ]
  },
  {
    menuId: 'localeManagement',
    menuName: 'SIDE_MENU.025',
    icon: 'svguse:/icons.svg#language-1',
    iconActiveClass: 'text-handorder',
    iconNonActiveClass: 'stroke-black',
    iconMiniActiveClass: 'stroke-white',
    auth: ['admin'],
    expanded: false,
    to: '/locale',
    menuCode: '7000',
    menuList: [
      {
        menuName: 'SIDE_MENU.026',
        auth: ['admin'],
        to: '/locale/manage',
        menuCode: '7100'
      },
      {
        menuName: 'SIDE_MENU.027',
        auth: ['admin'],
        to: '/locale/assign',
        menuCode: '7200'
      }
    ]
  }
]

export const desktopAppMenuList = [
  {
    menuId: 'shopManagement',
    menuName: 'SIDE_MENU.007',
    icon: 'svguse:/icons.svg#shop-2',
    iconActiveClass: 'fill-handorder',
    iconNonActiveClass: 'fill-black',
    iconMiniActiveClass: 'fill-white',
    auth: ['ALL'],
    expanded: false,
    to: '',
    menuList: [
      {
        menuId: 'menuManagement',
        menuName: 'SIDE_MENU.013',
        auth: ['shop'],
        to: null
      },
      {
        menuId: '',
        menuName: 'SIDE_MENU.009',
        auth: ['admin'],
        to: '/shopSetting'
      },
      {
        menuId: 'shopSetting',
        menuName: 'SIDE_MENU.009',
        auth: ['shop'],
        to: null
      }
    ]
  },
  {
    menuId: 'productManagement',
    menuName: 'SIDE_MENU.018',
    icon: 'svguse:/icons.svg#pizza-1',
    iconActiveClass: 'stroke-handorder',
    iconNonActiveClass: 'stroke-black',
    iconMiniActiveClass: 'stroke-white',
    auth: ['ALL'],
    expanded: false,
    to: '',
    menuList: [
      {
        menuId: '',
        menuName: 'SIDE_MENU.019',
        auth: ['admin'],
        to: '/order'
      },
      {
        menuId: 'orderInfo',
        menuName: 'SIDE_MENU.019',
        auth: ['shop'],
        to: null
      },
      {
        menuId: '',
        menuName: 'SIDE_MENU.020',
        auth: ['admin'],
        to: '/history'
      },
      {
        menuId: 'orderHistory',
        menuName: 'SIDE_MENU.020',
        auth: ['shop'],
        to: null
      },
      {
        menuId: 'orderReport',
        menuName: 'SIDE_MENU.021',
        auth: ['shop'],
        to: null
      },
      {
        menuId: 'paymentHistory',
        menuName: 'SIDE_MENU.033',
        auth: ['shop'],
        to: null
      }
    ]
  }
]

export const dayList = [
  'COMMON.105',
  'COMMON.106',
  'COMMON.107',
  'COMMON.108',
  'COMMON.109',
  'COMMON.110',
  'COMMON.111'
]

export const orderStatusCode = [
  { value: 'PENDING', label: 'HISTORY.012' },
  { value: 'CANCEL', label: 'ORDER.003' },
  { value: 'CONFIRM', label: 'ORDER.020' },
  { value: 'COMPLETE', label: 'HISTORY.013' },
  { value: 'SUCCESS', label: 'HISTORY.014' },
  { value: 'ORDER_FAIL', label: 'ORDER.016' },
  { value: 'RECEIPT_FAIL', label: 'HISTORY.015' }
]

export const paymentStatusCode = [
  { value: '', label: 'PAYMENT.001' },
  { value: 'PENDING', label: 'PAYMENT.002' },
  { value: 'COMPLETED', label: 'PAYMENT.003' },
  { value: 'CANCELLED', label: 'PAYMENT.004' },
  { value: 'FAILED', label: 'PAYMENT.005' }
]

export const paymentTypeCode = [
  { value: 'ALL', label: 'PAYMENT.006' },
  { value: 'MENU', label: 'PAYMENT.007' },
  { value: 'PRICE', label: 'PAYMENT.008' }
]

export const nonSecurityUrl = [
  'login',
  'signup'
]

export const EncryptKey = 'boHandorder!@'

export const AmtList = [
  { amount: 7700, count: 1000 },
  { amount: 38500, count: 5000 },
  { amount: 77000, count: 10000 }
]

export const PrintType = [
  { value: 'serial', label: 'serial' },
  { value: 'network', label: 'network' }
]

export const PrintSerialPortList = [
  { value: 'COM1', label: 'COM1' },
  { value: 'COM2', label: 'COM2' },
  { value: 'COM3', label: 'COM3' },
  { value: 'COM4', label: 'COM4' },
  { value: 'COM5', label: 'COM5' },
  { value: 'COM6', label: 'COM6' },
  { value: 'COM7', label: 'COM7' },
  { value: 'COM8', label: 'COM8' },
  { value: 'COM9', label: 'COM9' },
  { value: 'COM10', label: 'COM10' },
  { value: 'COM11', label: 'COM11' },
  { value: 'COM12', label: 'COM12' },
  { value: 'COM13', label: 'COM13' },
  { value: 'COM14', label: 'COM14' },
  { value: 'COM15', label: 'COM15' },
  { value: 'COM16', label: 'COM16' },
  { value: 'COM17', label: 'COM17' },
  { value: 'COM18', label: 'COM18' },
  { value: 'COM19', label: 'COM19' },
  { value: 'COM20', label: 'COM20' }
]

export const PrintBaudRateList = [
  { value: '4800', label: '4800' },
  { value: '7200', label: '7200' },
  { value: '9600', label: '9600' },
  { value: '19200', label: '19200' },
  { value: '28800', label: '28800' },
  { value: '38400', label: '38400' },
  { value: '57600', label: '57600' },
  { value: '115200', label: '115200' }
]

export const deviceTypeOption = [
  { value: 'pop', label: 'Qbile POP(1.6)' },
  { value: 'mini', label: 'Qbile MINI(3.5)' },
  { value: 'stand', label: 'Qbile STAND(7.5)' }
]

export const deviceColorOption = [
  { value: 'black', label: 'SHOP.142' },
  { value: 'white', label: 'SHOP.143' }
]

export const shopWaitingStatusCode = [
  { value: 'IMMEDIATE', label: 'WAITING_SETTING.018' },
  { value: 'AVAILABLE', label: 'WAITING_SETTING.019' },
  { value: 'UNAVAILABLE', label: 'WAITING_SETTING.020' },
  { value: 'CLOSED', label: 'WAITING_SETTING.021' }
]

export const businessKindOption = [
  { value: '', label: '선택' },
  { value: '1001', label: '특급호텔' },
  { value: '1002', label: '1급 호텔' },
  { value: '1003', label: '2급 호텔' },
  { value: '1010', label: '콘도' },
  { value: '1020', label: '기타숙박업' },
  { value: '1101', label: '항공사' },
  { value: '1110', label: '관광여행' },
  { value: '1120', label: '고속버스' },
  { value: '1121', label: '철도' },
  { value: '1122', label: '여객선' },
  { value: '1123', label: '택시' },
  { value: '1124', label: '택시회사' },
  { value: '1130', label: '렌터카' },
  { value: '1199', label: '기타교통수단' },
  { value: '2001', label: '골프용품 전문점' },
  { value: '2002', label: '스포츠·레져용품' },
  { value: '2003', label: '총포류판매점' },
  { value: '2010', label: '악기점' },
  { value: '2011', label: '피아노대리점' },
  { value: '2020', label: '음반,영상물' },
  { value: '2101', label: '골프경기장' },
  { value: '2102', label: '골프연습장' },
  { value: '2103', label: '카 지 노' },
  { value: '2104', label: '스크린골프' },
  { value: '2110', label: '스 키 장' },
  { value: '2111', label: '볼 링 장' },
  { value: '2112', label: '테니스장' },
  { value: '2113', label: '수 영 장' },
  { value: '2114', label: '헬스클럽' },
  { value: '2120', label: '종합레져타운' },
  { value: '2121', label: '당 구 장' },
  { value: '2130', label: '노 래 방' },
  { value: '2199', label: '기타레져업소' },
  { value: '2201', label: '골동품점' },
  { value: '2202', label: '화랑' },
  { value: '2210', label: '화방·표구점' },
  { value: '2215', label: '민예·공예품' },
  { value: '2220', label: '수족관' },
  { value: '2230', label: '화원' },
  { value: '2240', label: '애완동물' },
  { value: '2250', label: '영화관' },
  { value: '2251', label: '티켓' },
  { value: '2299', label: '문화취미기타' },
  { value: '3001', label: '일반가구' },
  { value: '3002', label: '철제가구' },
  { value: '3099', label: '기타가구' },
  { value: '3101', label: '가전제품' },
  { value: '3102', label: '냉열기기' },
  { value: '3199', label: '기타전기제품' },
  { value: '3201', label: '주방용구' },
  { value: '3202', label: '주방용식기' },
  { value: '3210', label: '정수기' },
  { value: '3299', label: '기타주방용구' },
  { value: '3301', label: '주유소' },
  { value: '3302', label: 'LPG 취급점' },
  { value: '3304', label: '유류판매' },
  { value: '3305', label: 'SK주유소' },
  { value: '3306', label: 'SK가스충전소' },
  { value: '3307', label: 'GS주유소' },
  { value: '3308', label: '현대정유(오일뱅크)' },
  { value: '3309', label: '쌍용S-OIL' },
  { value: '3311', label: 'GS 가스충전소' },
  { value: '3312', label: '현대정유 가스충전소' },
  { value: '3313', label: '쌍용S-OIL 가스충전소' },
  { value: '3315', label: 'E1가스충전소' },
  { value: '3321', label: '전기차충전소' },
  { value: '3399', label: '기타연료' },
  { value: '3401', label: '카메라' },
  { value: '3402', label: 'DP&E' },
  { value: '3499', label: '기타광학제품' },
  { value: '4001', label: '일반백화점' },
  { value: '4002', label: '자사카드발행백화점' },
  { value: '4004', label: '대형할인점' },
  { value: '4010', label: '편 의 점' },
  { value: '4020', label: '슈퍼마켓' },
  { value: '4021', label: '연 쇄 점' },
  { value: '4031', label: '보훈,복지매장' },
  { value: '4040', label: '면 세 점' },
  { value: '4050', label: '농축수산 가공품' },
  { value: '4060', label: '통신판매업1' },
  { value: '4061', label: 'CATV홈쇼핑' },
  { value: '4062', label: '통신판매업2' },
  { value: '4076', label: '인터넷P/G' },
  { value: '4077', label: '인터넷 종합 Mall' },
  { value: '4078', label: '인터넷 Mall' },
  { value: '4080', label: '상 품 권' },
  { value: '4081', label: '상품권전문판매' },
  { value: '4083', label: '전자상거래상품권' },
  { value: '4084', label: '전자상거래상품권전문판매' },
  { value: '4085', label: 'PG상품권' },
  { value: '4099', label: '기타유통업' },
  { value: '4101', label: '공무원 연금 매점' },
  { value: '4110', label: '농,축협 직영매장' },
  { value: '4111', label: '농협하나로클럽' },
  { value: '4121', label: '구내매점(국가기관 등)' },
  { value: '4199', label: '기타비영리유통' },
  { value: '4201', label: '정장' },
  { value: '4203', label: '아동의류' },
  { value: '4204', label: '양 품 점' },
  { value: '4205', label: '내의판매' },
  { value: '4206', label: '와이셔츠·타이' },
  { value: '4207', label: '캐주얼 의류' },
  { value: '4208', label: '스포츠 의류' },
  { value: '4209', label: '단체복' },
  { value: '4210', label: '맞춤복점' },
  { value: '4299', label: '기타의류' },
  { value: '4301', label: '옷감·직물' },
  { value: '4302', label: '카페트,커튼,천막,지물' },
  { value: '4303', label: '침구·수예점' },
  { value: '4304', label: '혼수전문점' },
  { value: '4399', label: '기타직물' },
  { value: '4401', label: '가 방' },
  { value: '4410', label: '시 계' },
  { value: '4411', label: '귀금속' },
  { value: '4412', label: '액세서리' },
  { value: '4420', label: '제 화' },
  { value: '4421', label: '신 발' },
  { value: '4430', label: '기념품점' },
  { value: '4481', label: '성인용품점' },
  { value: '4499', label: '기타잡화' },
  { value: '5001', label: '일반서적' },
  { value: '5002', label: '전문서적' },
  { value: '5003', label: '정기간행물' },
  { value: '5010', label: '출판 및 인쇄물' },
  { value: '5020', label: '교육용테이프판매' },
  { value: '5030', label: '문구용품' },
  { value: '5040', label: '과학기자재' },
  { value: '5050', label: '완구점' },
  { value: '5099', label: '기타서적문구' },
  { value: '5101', label: '외국어학원' },
  { value: '5102', label: '기능학원' },
  { value: '5103', label: '컴퓨터학원' },
  { value: '5104', label: '예·체능계학원 ' },
  { value: '5105', label: '보습학원' },
  { value: '5106', label: '학습지 교육' },
  { value: '5120', label: '대학등록금' },
  { value: '5121', label: '초중고교육기관' },
  { value: '5122', label: '유치원' },
  { value: '5123', label: '유아원' },
  { value: '5191', label: '독서실' },
  { value: '5192', label: '유학원' },
  { value: '5199', label: '기타 교육기관' },
  { value: '5201', label: '컴퓨터' },
  { value: '5202', label: '사무용 OA기기' },
  { value: '5210', label: '통신기기' },
  { value: '5211', label: '통신기기(무이자할부)' },
  { value: '5280', label: '전자(상우회)' },
  { value: '5299', label: '기타 사무용품' },
  { value: '6001', label: '국산신차판매' },
  { value: '6002', label: '중고자동차판매' },
  { value: '6003', label: '수입자동차' },
  { value: '6004', label: '이륜차판매' },
  { value: '6005', label: '중고자동차위탁판매' },
  { value: '6099', label: '기타운송' },
  { value: '6101', label: '자동차시트·타이어' },
  { value: '6102', label: '자동차부품' },
  { value: '6103', label: '윤활유 전문 판매' },
  { value: '6110', label: '자동차정비' },
  { value: '6111', label: '국산신차 직영부품·정비업소' },
  { value: '6112', label: '중장비수리' },
  { value: '6120', label: '카인테리어' },
  { value: '6130', label: '세차장' },
  { value: '6140', label: '주차장' },
  { value: '6150', label: '견인서비스' },
  { value: '6199', label: '가타자동차서비스' },
  { value: '6201', label: '생명보험' },
  { value: '6210', label: '손해보험' },
  { value: '6299', label: '기타보험' },
  { value: '7001', label: '종합병원' },
  { value: '7010', label: '병원' },
  { value: '7014', label: '한방병원' },
  { value: '7015', label: '치과병원' },
  { value: '7020', label: '의원' },
  { value: '7021', label: '한의 원' },
  { value: '7022', label: '치과의원' },
  { value: '7040', label: '제약회사' },
  { value: '7041', label: '약 국' },
  { value: '7042', label: '한약방' },
  { value: '7043', label: '조산원' },
  { value: '7044', label: '산후조리원' },
  { value: '7050', label: '동물병원' },
  { value: '7060', label: '건강진단' },
  { value: '7099', label: '기타의료기관 및 기타의료기기' },
  { value: '7101', label: '이용원' },
  { value: '7102', label: '미용원' },
  { value: '7103', label: '피부미용실' },
  { value: '7105', label: '안경' },
  { value: '7110', label: '화장품' },
  { value: '7111', label: '미용재료' },
  { value: '7112', label: '의료용품' },
  { value: '7120', label: '사우나' },
  { value: '7121', label: '안마/스포츠마사지' },
  { value: '7199', label: '기타대인서비스' },
  { value: '8001', label: '일반한식' },
  { value: '8002', label: '갈비전문점' },
  { value: '8003', label: '한정식' },
  { value: '8004', label: '일식·회집' },
  { value: '8005', label: '중국식' },
  { value: '8006', label: '서양음식' },
  { value: '8010', label: '칵테일바' },
  { value: '8013', label: '주점' },
  { value: '8021', label: '스넥' },
  { value: '8031', label: '위탁급식업' },
  { value: '8101', label: '유흥주점' },
  { value: '8201', label: '단란주점' },
  { value: '8301', label: '제과점' },
  { value: '8302', label: '정육점' },
  { value: '8303', label: '주류 판매점' },
  { value: '8310', label: '농·축·수산품' },
  { value: '8320', label: '미곡상' },
  { value: '8399', label: '기타음료식품' },
  { value: '8401', label: '홍삼제품' },
  { value: '8402', label: '인삼제품' },
  { value: '8499', label: '기타건강식품' },
  { value: '9001', label: '보일러·펌프·샷시' },
  { value: '9002', label: '건축용 요업제품' },
  { value: '9003', label: '조명기구' },
  { value: '9004', label: '페인트' },
  { value: '9005', label: '유리' },
  { value: '9006', label: '목재·석재·철물' },
  { value: '9010', label: '인테리어전문' },
  { value: '9020', label: '부동산 분양' },
  { value: '9099', label: '기타건축자재' },
  { value: '9101', label: '종합용역' },
  { value: '9110', label: '장례서비스업' },
  { value: '9111', label: '혼례서비스' },
  { value: '9120', label: '보관및 창고업' },
  { value: '9121', label: '화물운송' },
  { value: '9130', label: '사무서비스' },
  { value: '9131', label: '정보서비스' },
  { value: '9132', label: '법률회계서비스(개인)' },
  { value: '9133', label: '부동산 중개·임대' },
  { value: '9134', label: '소프트웨어' },
  { value: '9135', label: '법률회계서비스(법인)' },
  { value: '9140', label: '공공요금대행서비스/소득공제비대상' },
  { value: '9141', label: '공공요금대행서비스/소득공제대상' },
  { value: '9149', label: '통신서비스/소득공제비대상' },
  { value: '9150', label: '통신서비스/소득공제대상' },
  { value: '9151', label: 'CATV' },
  { value: '9153', label: '이동통신요금' },
  { value: '9154', label: '위성방송' },
  { value: '9160', label: '조세서비스' },
  { value: '9199', label: '기타용역서비스' },
  { value: '9201', label: '레져용품수리' },
  { value: '9202', label: '가정용품수리' },
  { value: '9203', label: '신변잡화수리' },
  { value: '9204', label: '사무·통신기기수리' },
  { value: '9210', label: '세탁소' },
  { value: '9299', label: '기타수리서비스' },
  { value: '9301', label: '레져업소' },
  { value: '9302', label: '자동차서비스' },
  { value: '9303', label: '사무서비스' },
  { value: '9304', label: '서적' },
  { value: '9305', label: '학원' },
  { value: '9306', label: '건강식품' },
  { value: '9395', label: '기타1' },
  { value: '9396', label: '기타2' },
  { value: '9397', label: '기타3' },
  { value: '9398', label: '기타4' },
  { value: '9399', label: '기타5' },
  { value: '9601', label: '농기계' },
  { value: '9602', label: '비료,사료,종자' },
  { value: '9699', label: '기타농업관련' },
  { value: '9801', label: '일반자판기' },
  { value: '9802', label: '담배자판기' },
  { value: '9803', label: '공공자판기' },
  { value: '9901', label: '기계공구' },
  { value: '9910', label: '비영리/대상' },
  { value: '9911', label: '비영리/비대상' },
  { value: '9921', label: 'P2P송금' },
  { value: '9931', label: '사업자미등록개인' },
  { value: '9993', label: '외국인전용가맹점' },
  { value: '9998', label: '기타 전문점' },
  { value: '9180', label: '자체물품대금' },
  { value: '9501', label: '생활서비스(통신판매)' },
  { value: '9510', label: '일반(통신판매)' },
  { value: '9995', label: '비씨카드 정산용가맹점' },
  { value: '9996', label: '비씨카드 정산용(할인)' }
]

export const businessKindCatOption = [
  { value: '', label: '전체' },
  { value: '10', label: '숙박업' },
  { value: '11', label: '여행' },
  { value: '20', label: '레져용품' },
  { value: '21', label: '레져업소' },
  { value: '22', label: '문화·취미' },
  { value: '30', label: '가구' },
  { value: '31', label: '전기제품' },
  { value: '32', label: '주방용구' },
  { value: '33', label: '연료판매점' },
  { value: '34', label: '광학제품' },
  { value: '40', label: '유통업영리' },
  { value: '41', label: '유통업비영리' },
  { value: '42', label: '의류' },
  { value: '43', label: '직물' },
  { value: '44', label: '신변잡화' },
  { value: '50', label: '서적문구' },
  { value: '51', label: '학원' },
  { value: '52', label: '사무통신' },
  { value: '60', label: '자동차판매' },
  { value: '61', label: '자동차정비·유지' },
  { value: '62', label: '보험' },
  { value: '70', label: '병원' },
  { value: '70', label: '의원' },
  { value: '70', label: '약국' },
  { value: '70', label: '기타의료기관' },
  { value: '71', label: '보건위생' },
  { value: '80', label: '일반·휴게음식' },
  { value: '81', label: '유흥' },
  { value: '82', label: '단란' },
  { value: '83', label: '음료식품' },
  { value: '84', label: '건강식품' },
  { value: '90', label: '건축자재' },
  { value: '91', label: '용역서비스' },
  { value: '92', label: '수리서비스' },
  { value: '93', label: '회원제형태업소' },
  { value: '96', label: '농업' },
  { value: '98', label: '무인판매' },
  { value: '99', label: '기타' }
]

export const businessTypeOption = [
  { value: '', label: '선택' },
  { value: '0406', label: 'BTOB기계류제조업' },
  { value: '0503', label: 'BTOB기계류제조업' },
  { value: '1101', label: '의류_유아복' },
  { value: '1102', label: '의류_아동복' },
  { value: '1103', label: '의류_남성정장' },
  { value: '1104', label: '의류_여성정장' },
  { value: '1105', label: '의류_내의' },
  { value: '1106', label: '의류_한복점' },
  { value: '1107', label: '의류_캐쥬얼' },
  { value: '1108', label: '의류_기능복' },
  { value: '1109', label: '의류_가죽및모피의류' },
  { value: '1200', label: '의류_종합의류' },
  { value: '1201', label: '의류_세탁소' },
  { value: '1202', label: '의류_옷감/직물' },
  { value: '1301', label: '패션잡화_귀금속/시계' },
  { value: '1302', label: '패션잡화_악세서리' },
  { value: '1303', label: '패션잡화_안경' },
  { value: '1304', label: '패션잡화_가방,핸드백' },
  { value: '1305', label: '패션잡화_제화,지갑,벨트' },
  { value: '1306', label: '패션잡화_가발' },
  { value: '1307', label: '패션잡화_모자,넥타이' },
  { value: '1400', label: '패션잡화_잡화종합' },
  { value: '1401', label: '패션잡화_잡화점' },
  { value: '1402', label: '패션잡화_양품점' },
  { value: '1403', label: '패션잡화_신발판매' },
  { value: '1500', label: '패션잡화_스포츠의류/용품' },
  { value: '1601', label: '뷰티_이발소' },
  { value: '1602', label: '뷰티_미용실' },
  { value: '1603', label: '뷰티_피부,체형관리' },
  { value: '1604', label: '뷰티_화장품' },
  { value: '1605', label: '뷰티_미용재료' },
  { value: '1701', label: '뷰티_피부미용' },
  { value: '1702', label: '뷰티_발관리,네일아트' },
  { value: '1801', label: '의류/패션_복합판매점' },
  { value: '2101', label: '식품_농산물(미곡,청과)' },
  { value: '2102', label: '식품_축산물(정육)' },
  { value: '2103', label: '식품_수산물' },
  { value: '2104', label: '식품_농축수산물' },
  { value: '2200', label: '식품_가공식품' },
  { value: '2300', label: '식품_종합식품' },
  { value: '2401', label: '음료/주류_커피전문점' },
  { value: '2402', label: '음료/주류_주점' },
  { value: '2403', label: '음료/주류_주류판매점' },
  { value: '2404', label: '음료/주류_제과점,아이스크림점' },
  { value: '2405', label: '음료/주류_음료' },
  { value: '2501', label: '음식점_한식' },
  { value: '2502', label: '음식점_일식' },
  { value: '2503', label: '음식점_중식' },
  { value: '2504', label: '음식점_양식' },
  { value: '2505', label: '음식점_패밀리레스토랑' },
  { value: '2506', label: '음식점_부페' },
  { value: '2507', label: '음식점_패스트푸드점' },
  { value: '2508', label: '음식점_간이음식점' },
  { value: '2509', label: '음식점_분식' },
  { value: '3101', label: '인테리어_가구' },
  { value: '3102', label: '인테리어_주방가구/용품' },
  { value: '3103', label: '인테리어_조명' },
  { value: '3104', label: '인테리어_화원,조경,수족관' },
  { value: '3105', label: '인테리어_바닥,벽지,창호' },
  { value: '3106', label: '인테리어_욕실' },
  { value: '3107', label: '인테리어_패브릭' },
  { value: '3108', label: '인테리어_인테리어자재' },
  { value: '3109', label: '인테리어_인테리어소품' },
  { value: '3201', label: '인테리어_재활용품' },
  { value: '3301', label: '가전/통신_가전제품' },
  { value: '3302', label: '가전/통신_컴퓨터및주변기기' },
  { value: '3303', label: '가전/통신_통신기기' },
  { value: '3401', label: '가전/통신_냉열기' },
  { value: '3402', label: '가전/통신_정수기' },
  { value: '3403', label: '가전/통신_보일러/펌프/기계' },
  { value: '3404', label: '가전/통신_종합생활용품' },
  { value: '3501', label: '임대/용역_주택임대' },
  { value: '3502', label: '임대/용역_청소' },
  { value: '3503', label: '임대/용역_보안경비' },
  { value: '3504', label: '임대/용역_화물운송/보관' },
  { value: '3505', label: '임대/용역_가례서비스업' },
  { value: '3506', label: '임대/용역_전문용역서비스' },
  { value: '3507', label: '임대/용역_농업용품' },
  { value: '3508', label: '임대/용역_기타' },
  { value: '3509', label: '임대/용역_일반용역서비스' },
  { value: '3601', label: '임대/용역_수리서비스' },
  { value: '4101', label: '보건/위생_양방종합병원' },
  { value: '4102', label: '보건/위생_한방종합병원' },
  { value: '4103', label: '보건/위생_양한방종합병원' },
  { value: '4201', label: '보건/위생_치과' },
  { value: '4202', label: '보건/위생_산부인과,조산원' },
  { value: '4203', label: '보건/위생_성형외과' },
  { value: '4204', label: '보건/위생_기타외과' },
  { value: '4205', label: '보건/위생_피부과' },
  { value: '4206', label: '보건/위생_안과' },
  { value: '4207', label: '보건/위생_비뇨기과' },
  { value: '4208', label: '보건/위생_이비인후과' },
  { value: '4209', label: '보건/위생_방사선과' },
  { value: '4210', label: '보건/위생_소아과' },
  { value: '4301', label: '보건/위생_내과' },
  { value: '4302', label: '보건/위생_피부비뇨기과' },
  { value: '4401', label: '보건/위생_한의원(한약방)' },
  { value: '4402', label: '보건/위생_양약국' },
  { value: '4501', label: '보건/위생_건강보조식품' },
  { value: '4502', label: '보건/위생_의료기기/용품' },
  { value: '4503', label: '보건/위생_의료재활용품' },
  { value: '4504', label: '보건/위생_산후조리원' },
  { value: '4601', label: '보건/위생_보건소' },
  { value: '4602', label: '보건/위생_요양원' },
  { value: '5101', label: '숙박_호텔' },
  { value: '5102', label: '숙박_콘도' },
  { value: '5103', label: '숙박_여관' },
  { value: '5104', label: '숙박_캠프장' },
  { value: '5105', label: '숙박_고시원' },
  { value: '5201', label: '교통/이동수단_항공' },
  { value: '5202', label: '교통/이동수단_철도' },
  { value: '5203', label: '교통/이동수단_여객선' },
  { value: '5204', label: '교통/이동수단_고속버스' },
  { value: '5205', label: '교통/이동수단_택시' },
  { value: '5206', label: '교통/이동수단_대중교통' },
  { value: '5301', label: '교통/이동수단_렌터카' },
  { value: '5302', label: '교통/이동수단_복합대중교통' },
  { value: '5401', label: '교통/이동수단_수입차' },
  { value: '5402', label: '교통/이동수단_국산차' },
  { value: '5403', label: '교통/이동수단_중고차' },
  { value: '5404', label: '교통/이동수단_차량정비/부품' },
  { value: '5405', label: '교통/이동수단_주차서비스' },
  { value: '5406', label: '교통/이동수단_세차서비스' },
  { value: '5407', label: '교통/이동수단_차량견인' },
  { value: '5408', label: '교통/이동수단_이륜자동차' },
  { value: '5409', label: '교통/이동수단_자전거' },
  { value: '5410', label: '교통/이동수단_공영주차장' },
  { value: '5501', label: '교통/이동수단_자동차관련대행서비스' },
  { value: '5601', label: '연료_주유소' },
  { value: '5602', label: '연료_가스충전소' },
  { value: '5603', label: '연료_가정용연료' },
  { value: '5604', label: '연료_주유소_셀프' },
  { value: '6101', label: '금융_생명보험' },
  { value: '6102', label: '금융_손해보험' },
  { value: '6103', label: '금융_보증보험' },
  { value: '6104', label: '금융_금융상품기타' },
  { value: '6200', label: '금융_복합금융상품' },
  { value: '6301', label: '금융_벌금' },
  { value: '6302', label: '금융_보석금' },
  { value: '6303', label: '금융_회비,등록금등' },
  { value: '6304', label: '금융_관리비' },
  { value: '6305', label: '금융_특별기부금' },
  { value: '6401', label: '금융_통신비' },
  { value: '6501', label: '금융_국세/지방세' },
  { value: '6502', label: '금융_공과금' },
  { value: '6503', label: '금융_비영리단체' },
  { value: '7001', label: '취미/교양_완구' },
  { value: '7002', label: '취미/교양_악기' },
  { value: '7003', label: '취미/교양_스포츠용품' },
  { value: '7004', label: '취미/교양_화방' },
  { value: '7005', label: '취미/교양_동물병원' },
  { value: '7006', label: '취미/교양_골동품' },
  { value: '7007', label: '취미/교양_사진관' },
  { value: '7008', label: '취미/교양_레코드/비디오' },
  { value: '7009', label: '취미/교양_레져용품' },
  { value: '7010', label: '취미/교양_상품권판매' },
  { value: '7011', label: '취미/교양_복권방' },
  { value: '7012', label: '취미/교양_철학관' },
  { value: '7013', label: '취미/교양_성인용품' },
  { value: '7014', label: '대형상품권' },
  { value: '7015', label: '취미/교양_사진용품' },
  { value: '7100', label: '학교/학원_대학시설' },
  { value: '7101', label: '학교/학원_초/중/고등학교' },
  { value: '7102', label: '학교/학원_대학/대학원' },
  { value: '7103', label: '학교/학원_특수학교' },
  { value: '7201', label: '학교/학원_외국어학원' },
  { value: '7202', label: '학교/학원_직업훈련소' },
  { value: '7203', label: '학교/학원_자동차학원' },
  { value: '7204', label: '학교/학원_예체능계학원' },
  { value: '7205', label: '학교/학원_기술/사무계학원' },
  { value: '7206', label: '학교/학원_이미용/요리학원' },
  { value: '7207', label: '학교/학원_문리계학원' },
  { value: '7208', label: '학교/학원_놀이방/어린이집' },
  { value: '7209', label: '학교/학원_유치원' },
  { value: '7210', label: '학교/학원_놀이방' },
  { value: '7301', label: '교육관련상품_교육기자재' },
  { value: '7302', label: '교육관련상품_원격교육' },
  { value: '7303', label: '교육관련상품_문구용품' },
  { value: '7304', label: '교육관련상품_사무용품' },
  { value: '7305', label: '교육관련상품_유아교육용품' },
  { value: '7306', label: '교육관련상품_문화센터' },
  { value: '7307', label: '교육관련상품_유학원' },
  { value: '7308', label: '교육관련상품_서적' },
  { value: '7309', label: '교육관련상품_학습지' },
  { value: '7310', label: '교육관련상품_독서실' },
  { value: '7400', label: '스포츠시설_스포츠시설기타' },
  { value: '7401', label: '스포츠시설_스포츠센터' },
  { value: '7402', label: '스포츠시설_실내외골프연습장' },
  { value: '7403', label: '스포츠시설_테니스장' },
  { value: '7404', label: '스포츠시설_볼링장' },
  { value: '7405', label: '스포츠시설_스키장' },
  { value: '7406', label: '스포츠시설_수영장' },
  { value: '7407', label: '스포츠시설_사격장' },
  { value: '7408', label: '스포츠시설_스쿼시장' },
  { value: '7409', label: '스포츠시설_당구장' },
  { value: '7501', label: '관광/여행_관광여행사' },
  { value: '7600', label: '관람_관람종합' },
  { value: '7601', label: '관람_경기장' },
  { value: '7602', label: '관람_영화/연극' },
  { value: '7603', label: '관람_동물원/박물관' },
  { value: '7604', label: '관람_콘서트' },
  { value: '7605', label: '관람_종합공연장' },
  { value: '7606', label: '관람_CABLETV' },
  { value: '7607', label: '관람_비디오방' },
  { value: '7608', label: '관람_공연/예술' },
  { value: '7701', label: '오락/위락_골프장' },
  { value: '7702', label: '오락/위락_기원' },
  { value: '7703', label: '오락/위락_사우나' },
  { value: '7704', label: '오락/위락_노래방' },
  { value: '7705', label: '오락/위락_PC방' },
  { value: '7706', label: '오락/위락_안마/스포츠마사지' },
  { value: '7707', label: '오락/위락_스포츠마사지' },
  { value: '7801', label: '유흥시설_유흥음식/주점' },
  { value: '7802', label: '유흥시설_극장식당' },
  { value: '7803', label: '유흥시설_룸싸롱' },
  { value: '7804', label: '유흥시설_요정' },
  { value: '7805', label: '유흥시설_나이트클럽' },
  { value: '7806', label: '유흥시설_캬바레' },
  { value: '7807', label: '유흥시설_단란주점' },
  { value: '7808', label: '유흥시설_유흥기타' },
  { value: '7809', label: '유흥시설_카지노' },
  { value: '7901', label: '유흥시설_유원지' },
  { value: '7902', label: '유흥시설_리조트' },
  { value: '8101', label: '복합니즈_대형마트' },
  { value: '8102', label: '복합니즈_슈퍼마켓' },
  { value: '8201', label: '복합니즈_연금/복지매장' },
  { value: '8301', label: '복합니즈_백화점' },
  { value: '8302', label: '복합니즈_면세점' },
  { value: '8303', label: '복합니즈_편의점' },
  { value: '8401', label: '복합니즈_PG' },
  { value: '8402', label: '복합니즈_인터넷쇼핑몰' },
  { value: '8403', label: '복합니즈_CATV홈쇼핑' },
  { value: '8404', label: '복합니즈_오프라인전화주문' },
  { value: '8405', label: '복합니즈_온라인상품권' },
  { value: '8406', label: '복합니즈_통신판매' },
  { value: '8407', label: '복합니즈_오픈PG' },
  { value: '8501', label: '복합니즈_고속도로휴게실' },
  { value: '8601', label: '복합니즈_실버타운' },
  { value: '8701', label: '복합니즈_다단계' },
  { value: '8702', label: '복합니즈_방문판매' },
  { value: '9101', label: 'BTOB_기계류제조및도매' },
  { value: '9102', label: 'BTOB_약품제조및도매' },
  { value: '9103', label: 'BTOB_식품제조및도매' },
  { value: '9104', label: 'BTOB_비기계류제조및도매' },
  { value: '9201', label: 'BTOB_임대,중개업' },
  { value: '9301', label: 'BTOB_무역업' },
  { value: '9401', label: 'BTOB_기계류수리업' },
  { value: '9402', label: 'BTOB_인쇄업' },
  { value: '9501', label: 'BTOB_정보서비스' },
  { value: '9502', label: 'BTOB_연구소' },
  { value: '9601', label: 'BTOB_협회및단체' },
  { value: '9701', label: 'BTOB_당사거래처' }
]

export const paymentMethodCode:Record<PaymentMethod, string> = {
  KKP: '카카오페이', NVP: '네이버페이', PAC: '페이코', '': '카드'
}

export const receiptTypeOption = [
  { value: '', label: '선택안함' },
  { value: 'PAYMENT', label: '결제영수증' },
  { value: 'ORDER', label: '주방영수증' }
]
