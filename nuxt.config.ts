// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  nitro: {
    preset: 'static',
    prerender: {
      autoSubfolderIndex: false,
      crawlLinks: true
    }
  },
  router: {
    options: {
      strict: true
    }
  },
  hooks: {
    'pages:extend' (pages) {
      // /order/desktop/[shopCode] 페이지에 /order/pg/[shopCode] 별칭 추가
      const desktopPage = pages.find(page => page.path === '/order/desktop/:shopCode()')
      if (desktopPage) {
        desktopPage.alias = ['/order/pg/:shopCode()']
      }

      // 각 페이지에 trailing slash 제거 설정
      pages.forEach((page) => {
        page.path = page.path.replace(/\/$/, '')
      })
    }
  },
  future: {
    compatibilityVersion: 3
  },
  css: ['@/assets/custom.scss', '@/assets/pretendard.css'],
  modules: ['nuxt-quasar-ui', '@pinia/nuxt', 'dayjs-nuxt', '@element-plus/nuxt', '@nuxtjs/i18n'],

  runtimeConfig: {
    public: {
      baseUrl: process.env.BASE_URL || 'https://api.handorder.co.kr/data',
      webSocketUrl: process.env.BASE_WEBSOCKET_URL || 'wss://bo.gongbbu.com/data/chat',
      stationCode: process.env.STATION_CODE || 'DEFAULT_STATION_CODE',
      menuHost: process.env.MENU_HOST || 'https://handorder.co.kr'
    }
  },

  i18n: {
    locales: [
      { code: 'ko', name: '한국어', file: 'ko.json', dir: 'ltr' },
      { code: 'en', name: 'English', file: 'en.json', dir: 'ltr' },
      { code: 'ja', name: '日本語', file: 'ja.json', dir: 'ltr' },
      { code: 'ar', name: 'العربية', file: 'ar.json', dir: 'rtl' }
    ],
    defaultLocale: 'ko',
    strategy: 'no_prefix',
    langDir: './locales/',
    vueI18n: './i18n.config.ts'
  },

  dayjs: {
    locales: ['ko']
  },

  quasar: {
    lang: 'ko-KR',
    plugins: ['BottomSheet', 'Dialog', 'Loading', 'LoadingBar', 'Notify', 'Dark'],
    extras: {
      font: 'roboto-font',
      fontIcons: ['material-icons', 'material-icons-outlined']
    },
    config: {
      brand: {
        primary: '#ff8b4a'
      },
      notify: {
        position: 'top'
      },
      loadingBar: {
        skipHijack: false
      }
    },
    components: {
      defaults: {
        QBtn: {
          unelevated: true
        }
      }
    }
  },

  app: {
    head: {
      script: [
        { children: 'var global = window;' }
      ]
    }
  },

  build: {
    transpile: ['xlsx']
  },

  compatibilityDate: '2025-08-27'
})
