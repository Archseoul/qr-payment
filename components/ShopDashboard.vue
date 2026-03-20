<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import isoWeek from 'dayjs/plugin/isoWeek'
import useDayjs from 'dayjs'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/store/auth'
import { useCustomFetch } from '~/composables/useCustomFetch'
import type { HoPrintLogGroupVo } from '~/types'

// Chart.js 초기화 상태 추적
let isChartJsInitialized = false

// Chart.js 초기화 함수 (클라이언트 사이드에서만 실행)
const initializeChartJs = () => {
  if (typeof window === 'undefined' || isChartJsInitialized) {
    return
  }

  try {
    // Chart.js 등록
    Chart.register(...registerables, ChartDataLabels)

    // 전역 기본 설정으로 datalabels를 비활성화
    Chart.defaults.set('plugins.datalabels', {
      display: false
    })

    isChartJsInitialized = true
  } catch (error) {
    // Chart.js 초기화 실패 시 무시
  }
}

const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)
const { userInfo } = storeToRefs(authStore)

const dayjs = useDayjs
dayjs.extend(isoWeek)

// 차트 인스턴스
const barChart = ref<Chart | null>(null)
const lineChart = ref<Chart | null>(null)
const pieChart = ref<Chart | null>(null)
const peakTimeChart = ref<Chart | null>(null)

// 주별/월별 토글
const viewType = ref<'weekly' | 'monthly'>('weekly')

// 로딩 상태
const isLoading = ref(true)
const orderList = ref<HoPrintLogGroupVo[]>([])
const isMounted = ref(false)
const isChartsInitialized = ref(false) // 차트 초기화 상태 추적

// 날짜 범위 설정
const getDateRange = () => {
  if (viewType.value === 'weekly') {
    return {
      startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD')
    }
  } else {
    return {
      startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD')
    }
  }
}

// userInfo 로드 상태 확인
const isUserInfoLoaded = computed(() => {
  return userInfo.value && Object.keys(userInfo.value).length > 0 && userInfo.value.shopInfo?.shopCode
})

// API 데이터 가져오기
const fetchOrderData = async (forceRefresh: boolean = false) => {
  if (!isUserInfoLoaded.value) {
    // 사용자 정보가 아직 로드되지 않음
    return
  }

  isLoading.value = true
  const { startDate, endDate } = getDateRange()

  try {
    // 캐시 문제 해결을 위해 고유 key 사용
    const cacheKey = `shop-history-${userInfo.value.shopInfo.shopCode}-${viewType.value}-${startDate}-${endDate}`
    const { data, refresh } = await useCustomFetch<HoPrintLogGroupVo[]>(
      `/admin/handOrder/shop/${userInfo.value.shopInfo.shopCode}/history/dashboard`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          startDate,
          endDate,
          shopLanguage: 'ko',
          // 캐시 버스팅을 위한 타임스탬프 추가
          _t: forceRefresh ? Date.now() : undefined
        },
        key: cacheKey,
        // 캐시 전략 설정
        server: false, // 클라이언트 사이드에서만 실행
        lazy: false, // 즉시 로드
        default: () => [] as HoPrintLogGroupVo[],
        transform: (data: any) => data || []
      }
    )

    // 강제 새로고침이 요청된 경우 refresh 호출
    if (forceRefresh && refresh) {
      await refresh()
    }

    orderList.value = data.value || []
  } catch (error) {
    // 데이터 로딩 실패 처리
    orderList.value = []
    // 에러 상태 알림 (필요시 활성화)
  } finally {
    isLoading.value = false
  }
}

// 데이터 가공 함수들
const getTablePerformanceData = computed(() => {
  if (!orderList.value || orderList.value.length === 0) {
    return { labels: [], data: [] }
  }

  const tableStats = new Map<string, number>()

  // 테이블별 주문 수 집계
  orderList.value.forEach((order: HoPrintLogGroupVo) => {
    const tableName = order.tableName
    const currentCount = tableStats.get(tableName) || 0
    tableStats.set(tableName, currentCount + 1)
  })

  // 테이블명에서 숫자 추출하는 함수
  const extractTableNumber = (tableName: string): number => {
    const match = tableName.match(/\d+/)
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
  }

  // 숫자 기준 정렬
  const sortedTables = Array.from(tableStats.entries()).sort(
    ([nameA], [nameB]) =>
      extractTableNumber(nameA) - extractTableNumber(nameB)
  )

  return {
    labels: sortedTables.map(([name]) => {
      const match = name.match(/\d+/)
      return match ? match[0] : name
    }),
    data: sortedTables.map(([, count]) => count)
  }
})

const getWeeklyOrdersData = computed(() => {
  if (!orderList.value || orderList.value.length === 0) {
    return { labels: [], data: [] }
  }

  const dateStats = new Map<string, number>()

  orderList.value.forEach((order: HoPrintLogGroupVo) => {
    const date = dayjs(order.insDate, 'YYYYMMDDHHmmss').format('YYYY-MM-DD')
    const currentPrice = dateStats.get(date) || 0
    const totalPrice = order.printLog.reduce((sum, log) => sum + log.finalPrice, 0)
    dateStats.set(date, currentPrice + totalPrice)
  })

  // 날짜별로 정렬
  const sortedDates = Array.from(dateStats.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  return {
    labels: sortedDates.map(([date]) => dayjs(date).format('MM/DD')),
    data: sortedDates.map(([, price]) => price)
  }
})

// 메뉴명 줄임표 처리 함수
const truncateMenuName = (menuName: string, maxLength: number = 12): string => {
  if (menuName.length <= maxLength) {
    return menuName
  }
  return menuName.substring(0, maxLength) + '...'
}

const getMenuSalesData = computed(() => {
  if (!orderList.value || orderList.value.length === 0) {
    return { labels: [], data: [], originalLabels: [] }
  }

  const menuStats = new Map<string, number>()

  // 메뉴별 판매량 집계
  orderList.value.forEach((order: HoPrintLogGroupVo) => {
    order.printLog.forEach((log) => {
      const menuName = log.menuName
      const currentCount = menuStats.get(menuName) || 0
      menuStats.set(menuName, currentCount + log.quantity)
    })
  })

  // 판매량 기준으로 정렬
  const sortedMenus = Array.from(menuStats.entries())
    .sort((a, b) => b[1] - a[1])

  // 상위 8개 메뉴만 표시, 나머지는 "기타"로 그룹화
  const topMenusLimit = 8
  let processedMenus = []
  let otherMenusCount = 0

  if (sortedMenus.length > topMenusLimit) {
    // 상위 N개 메뉴
    processedMenus = sortedMenus.slice(0, topMenusLimit)
    // 나머지 메뉴들을 "기타"로 합산
    otherMenusCount = sortedMenus
      .slice(topMenusLimit)
      .reduce((sum, [, count]) => sum + count, 0)

    if (otherMenusCount > 0) {
      processedMenus.push(['기타', otherMenusCount])
    }
  } else {
    processedMenus = sortedMenus
  }

  return {
    labels: processedMenus.map(([name]) => truncateMenuName(name)),
    data: processedMenus.map(([, count]) => count),
    originalLabels: processedMenus.map(([name]) => name) // 툴팁용 원본 이름
  }
})

const getPeakTimeData = computed(() => {
  if (!orderList.value || orderList.value.length === 0) {
    return { labels: [], data: [] }
  }

  const hourStats = new Map<number, number>()

  // 0~23시 초기화
  for (let i = 0; i < 24; i++) {
    hourStats.set(i, 0)
  }

  orderList.value.forEach((order: HoPrintLogGroupVo) => {
    const hour = parseInt(dayjs(order.insDate, 'YYYYMMDDHHmmss').format('HH'))
    const currentCount = hourStats.get(hour) || 0
    hourStats.set(hour, currentCount + 1)
  })

  return {
    labels: Array.from(hourStats.keys()).map(h => `${h.toString().padStart(2, '0')}:00`),
    data: Array.from(hourStats.values())
  }
})

// 차트 초기화 함수들
const initBarChart = () => {
  // Chart.js가 초기화되지 않았으면 먼저 초기화
  if (!isChartJsInitialized) {
    initializeChartJs()
  }

  const canvas = document.getElementById('barChart') as HTMLCanvasElement
  if (!canvas) {
    return
  }

  // 기존 차트 완전히 정리
  if (barChart.value) {
    try {
      barChart.value.destroy()
    } catch (e) {
      // 기존 barChart 파괴 실패 시 무시
    }
    barChart.value = null
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  // Canvas 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const chartData = getTablePerformanceData.value

  // 데이터가 없으면 차트를 생성하지 않음
  if (!chartData.data || chartData.data.length === 0) {
    return
  }

  barChart.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: '주문 수',
        data: chartData.data,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 5,
          bottom: 5,
          left: 5,
          right: 5
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          displayColors: true,
          callbacks: {
            title: (context) => {
              return context[0].label
            },
            label: (context) => {
              return `주문 수: ${context.parsed.y}건`
            }
          }
        },
        datalabels: {
          display: true,
          anchor: 'center',
          align: 'center',
          color: '#fff',
          font: {
            weight: 'bold',
            size: 16
          },
          formatter: (value) => {
            return `${value}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          ticks: {
            font: {
              size: 12
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  })
}

const initLineChart = () => {
  // Chart.js가 초기화되지 않았으면 먼저 초기화
  if (!isChartJsInitialized) {
    initializeChartJs()
  }

  const canvas = document.getElementById('lineChart') as HTMLCanvasElement
  if (!canvas) {
    return
  }

  // 기존 차트 완전히 정리
  if (lineChart.value) {
    try {
      lineChart.value.destroy()
    } catch (e) {
      // 기존 lineChart 파괴 실패 시 무시
    }
    lineChart.value = null
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  // Canvas 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const chartData = getWeeklyOrdersData.value

  // 데이터가 없으면 차트를 생성하지 않음
  if (!chartData.data || chartData.data.length === 0) {
    return
  }

  lineChart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: '주문 금액 (원)',
        data: chartData.data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.15)',
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          displayColors: true,
          callbacks: {
            title: (context) => {
              return context[0].label
            },
            label: (context) => {
              return `주문 금액: ${(context.parsed.y).toLocaleString()}원`
            }
          }
        },
        datalabels: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return (value as number).toLocaleString()
            }
          }
        }
      }
    }
  })
}

const initPieChart = () => {
  // Chart.js가 초기화되지 않았으면 먼저 초기화
  if (!isChartJsInitialized) {
    initializeChartJs()
  }

  const canvas = document.getElementById('pieChart') as HTMLCanvasElement
  if (!canvas) {
    return
  }

  // 기존 차트 완전히 정리
  if (pieChart.value) {
    try {
      pieChart.value.destroy()
    } catch (e) {
      // 기존 pieChart 파괴 실패 시 무시
    }
    pieChart.value = null
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  // Canvas 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const chartData = getMenuSalesData.value

  // 데이터가 없으면 차트를 생성하지 않음
  if (!chartData.data || chartData.data.length === 0) {
    return
  }
  const colorPalette = [
    'rgba(255, 99, 132, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)'
  ]

  const borderColorPalette = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)'
  ]

  pieChart.value = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: chartData.labels,
      datasets: [{
        data: chartData.data,
        backgroundColor: chartData.data.map((_, index) =>
          colorPalette[index % colorPalette.length]
        ),
        borderColor: chartData.data.map((_, index) =>
          borderColorPalette[index % borderColorPalette.length]
        ),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: {
              size: 12
            },
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 12,
            boxHeight: 12,
            // 긴 텍스트 줄바꿈 처리
            generateLabels: (chart) => {
              const data = chart.data
              if (data.labels && data.datasets.length) {
                return data.labels?.map((label, i) => {
                  const meta = chart.getDatasetMeta(0)
                  const style = meta.controller?.getStyle(i)
                  const dataValue = data.datasets?.[0]?.data?.[i]
                  return {
                    text: label as string,
                    fillStyle: style?.backgroundColor || '#000',
                    strokeStyle: style?.borderColor || '#000',
                    lineWidth: style?.borderWidth || 1,
                    pointStyle: 'circle',
                    hidden: isNaN(dataValue as number) || (meta.data[i] as any)?.hidden || false,
                    index: i
                  }
                }) || []
              }
              return []
            }
          },
          maxWidth: 150, // 범례 최대 너비 제한
          onClick: (_e, legendItem, legend) => {
            const index = legendItem.index
            if (index !== undefined) {
              const chart = legend.chart
              const meta = chart.getDatasetMeta(0)
              const element = meta.data[index] as any

              if (element) {
                element.hidden = !element.hidden
                chart.update()
              }
            }
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 15,
          displayColors: true,
          titleFont: {
            size: 13,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          callbacks: {
            title: (context) => {
              // 원본 메뉴명 표시 (줄임표 처리되지 않은 전체 이름)
              const index = context[0]?.dataIndex
              return (index !== undefined && chartData.originalLabels?.[index]) || context[0]?.label || ''
            },
            label: (context) => {
              const data = context.dataset?.data || []
              const total = data.reduce((a: number, b: number) => (a || 0) + (b || 0), 0)
              const parsed = context.parsed || 0
              const percentage = total > 0 ? ((parsed / total) * 100).toFixed(1) : '0.0'
              return `판매량: ${parsed}개 (${percentage}%)`
            }
          }
        },
        datalabels: {
          display: true,
          color: '#333333',
          font: {
            weight: 'bold',
            size: 12
          },
          formatter: (value) => {
            return value
          }
        }
      }
    }
  })
}

const initPeakTimeChart = () => {
  // Chart.js가 초기화되지 않았으면 먼저 초기화
  if (!isChartJsInitialized) {
    initializeChartJs()
  }

  const canvas = document.getElementById('peakTimeChart') as HTMLCanvasElement
  if (!canvas) {
    return
  }

  // 기존 차트 완전히 정리
  if (peakTimeChart.value) {
    try {
      peakTimeChart.value.destroy()
    } catch (e) {
      // 기존 peakTimeChart 파괴 실패 시 무시
    }
    peakTimeChart.value = null
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  // Canvas 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const chartData = getPeakTimeData.value

  // 데이터가 없으면 차트를 생성하지 않음
  if (!chartData.data || chartData.data.length === 0) {
    return
  }

  peakTimeChart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: '주문 건수',
        data: chartData.data,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.15)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          displayColors: true,
          callbacks: {
            title: (context) => {
              return context[0].label
            },
            label: (context) => {
              return `주문 건수: ${context.parsed.y}건`
            }
          }
        },
        datalabels: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })
}

// Canvas 요소 존재 확인 함수
const checkCanvasElements = () => {
  const canvasIds = ['barChart', 'lineChart', 'pieChart', 'peakTimeChart']
  const missingCanvas = []

  for (const id of canvasIds) {
    const canvas = document.getElementById(id)
    if (!canvas) {
      missingCanvas.push(id)
    }
  }

  return {
    allExist: missingCanvas.length === 0,
    missing: missingCanvas
  }
}

// 모든 차트 초기화
const initAllCharts = async () => {
  // 클라이언트 사이드에서만 실행
  if (typeof window === 'undefined') {
    return
  }

  // 이미 초기화 중이면 중복 실행 방지
  if (isChartsInitialized.value) {
    return
  }

  try {
    isChartsInitialized.value = true

    // Chart.js 초기화 확인
    if (!isChartJsInitialized) {
      initializeChartJs()
    }

    // 기존 차트 인스턴스 완전히 정리
    const charts = [
      { ref: barChart, name: 'barChart' },
      { ref: lineChart, name: 'lineChart' },
      { ref: pieChart, name: 'pieChart' },
      { ref: peakTimeChart, name: 'peakTimeChart' }
    ]

    charts.forEach(({ ref, name }) => {
      if (ref.value) {
        try {
          // 차트 이벤트 리스너 완전 제거
          ref.value.destroy()
          ref.value = null
        } catch (e) {
          // 차트 파괴 실패 시 무시
        }
      }

      // Canvas 요소 완전 초기화
      const canvas = document.getElementById(name) as HTMLCanvasElement
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    })

    // DOM과 이벤트 정리 대기
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Canvas 요소들이 존재하는지 확인
    const canvasCheck = checkCanvasElements()

    if (!canvasCheck.allExist) {
      isChartsInitialized.value = false
      // 재시도
      setTimeout(() => {
        isChartsInitialized.value = false
        initAllCharts()
      }, 300)
      return
    }

    // 데이터가 있는지 확인
    if (!orderList.value || orderList.value.length === 0) {
      isChartsInitialized.value = false
      return
    }

    // 차트 초기화 시 hydration 문제 해결을 위해 순차적으로 초기화

    try {
      initBarChart()
      await new Promise(resolve => setTimeout(resolve, 50))

      initLineChart()
      await new Promise(resolve => setTimeout(resolve, 50))

      initPieChart()
      await new Promise(resolve => setTimeout(resolve, 50))

      initPeakTimeChart()
      await new Promise(resolve => setTimeout(resolve, 50))
    } catch (chartError) {
      // 차트 초기화 실패 시 무시
    }
  } catch (error) {
    // 차트 초기화 실패 시 무시
  } finally {
    // 초기화 완료 후 상태 리셋 (다음 초기화를 위해)
    setTimeout(() => {
      isChartsInitialized.value = false
    }, 1000)
  }
}

// 토글 변경 핸들러 - 툴팁 문제 해결
const toggleViewType = async (type: 'weekly' | 'monthly') => {
  if (!isUserInfoLoaded.value || !isMounted.value) {
    // 사용자 정보가 아직 로드되지 않았거나 컴포넌트가 마운트되지 않음
    return
  }

  // 이미 선택된 탭이면 아무것도 하지 않음
  if (viewType.value === type) {
    return
  }

  // 기존 차트 정리
  isChartsInitialized.value = false

  // 탭 타입 변경
  viewType.value = type

  // 강제 새로고침으로 데이터 가져오기
  await fetchOrderData(true)

  // 충분한 대기 시간 후 차트 재초기화
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))

  // 데이터가 있으면 차트 초기화
  if (orderList.value && orderList.value.length > 0) {
    await initAllCharts()
  }
}

// orderList가 변경되면 차트 업데이트
watch(() => orderList.value, async (newVal, oldVal) => {
  // 클라이언트 사이드에서만 실행
  if (typeof window === 'undefined') { return }

  // 데이터가 실제로 변경되었는지 확인
  if (!isLoading.value && newVal && newVal.length > 0 && newVal !== oldVal && isMounted.value) {
    await nextTick()
    setTimeout(() => {
      initAllCharts()
    }, 200)
  }
}, { deep: true, flush: 'post' })

// 로딩 상태 변경 감지
watch(() => isLoading.value, async (loading, wasLoading) => {
  // 클라이언트 사이드에서만 실행
  if (typeof window === 'undefined') { return }

  if (!loading && wasLoading && orderList.value && orderList.value.length > 0 && isMounted.value) {
    // 로딩이 완료되고 데이터가 있을 때만 차트 초기화
    await nextTick()
    setTimeout(() => {
      initAllCharts()
    }, 250)
  }
}, { flush: 'post' })

// userInfo가 로드되면 데이터를 가져오는 watcher
watch(isUserInfoLoaded, async (loaded, oldLoaded) => {
  // 클라이언트 사이드에서만 실행
  if (typeof window === 'undefined') { return }

  if (loaded && !oldLoaded && isMounted.value) {
    // userInfo 최초 로드 완료, 데이터 가져오기 시작
    await fetchOrderData(false)
    if (orderList.value && orderList.value.length > 0) {
      await nextTick()
      setTimeout(() => {
        initAllCharts()
      }, 300)
    }
  }
}, { immediate: true })

onMounted(async () => {
  // Chart.js 초기화
  if (typeof window !== 'undefined') {
    initializeChartJs()
  }

  // 클라이언트 마운트 상태 설정
  isMounted.value = true

  // DOM이 완전히 마운트된 후 데이터 로드
  await nextTick()

  // 추가 대기 시간으로 DOM 안정화
  await new Promise(resolve => setTimeout(resolve, 100))

  // userInfo가 이미 로드되어 있다면 바로 데이터 가져오기
  if (isUserInfoLoaded.value) {
    await fetchOrderData(false)
    if (orderList.value && orderList.value.length > 0) {
      setTimeout(() => {
        initAllCharts()
      }, 400)
    }
  }
})

// 컴포넌트가 언마운트될 때 차트 정리
onUnmounted(() => {
  const charts = [
    { ref: barChart, name: 'barChart' },
    { ref: lineChart, name: 'lineChart' },
    { ref: pieChart, name: 'pieChart' },
    { ref: peakTimeChart, name: 'peakTimeChart' }
  ]

  charts.forEach(({ ref }) => {
    if (ref.value) {
      try {
        ref.value.destroy()
      } catch (error) {
      } finally {
        ref.value = null
      }
    }
  })
})
</script>

<template>
  <q-page class="main-container-box">
    <ClientOnly>
      <div class="dashboard-container">
        <!-- 사용자 정보 로딩 중 -->
        <div v-if="!isUserInfoLoaded || !isMounted" class="loading-container">
          <q-spinner color="primary" size="3em" />
          <p class="q-mt-md">
            사용자 정보를 불러오는 중...
          </p>
        </div>

        <!-- 데이터 로딩 중 -->
        <div v-else-if="isLoading" class="loading-container">
          <q-spinner color="primary" size="3em" />
          <p class="q-mt-md">
            데이터를 불러오는 중...
          </p>
        </div>

        <!-- 차트 영역 -->
        <template v-else>
          <!-- 토글 버튼 -->
          <div class="toggle-container">
            <q-btn
              :flat="viewType !== 'weekly'"
              :unelevated="viewType === 'weekly'"
              :color="viewType === 'weekly' ? 'primary' : 'grey-7'"
              :loading="isLoading && viewType === 'weekly'"
              :disable="isLoading"
              label="주별"
              @click="toggleViewType('weekly')"
            />
            <q-btn
              :flat="viewType !== 'monthly'"
              :unelevated="viewType === 'monthly'"
              :color="viewType === 'monthly' ? 'primary' : 'grey-7'"
              :loading="isLoading && viewType === 'monthly'"
              :disable="isLoading"
              label="월별"
              @click="toggleViewType('monthly')"
            />
          </div>

          <!-- 차트 그리드 -->
          <div class="charts-grid">
            <!-- 장사 잘되는 테이블 -->
            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">
                  장사 잘되는 테이블 <span class="chart-title-sub">(주문: 건)</span>
                </h3>
              </div>
              <div class="chart-body" :class="{ 'loading': isLoading }">
                <div v-if="isLoading" class="chart-loading">
                  <q-spinner color="primary" size="2em" />
                  <p>데이터 로딩 중...</p>
                </div>
                <div v-else-if="!orderList || orderList.length === 0" class="no-data">
                  <q-icon name="bar_chart" size="3em" color="grey-5" />
                  <p>주문 내역이 없습니다</p>
                </div>
                <div v-else class="chart-canvas-container">
                  <canvas id="barChart" />
                </div>
              </div>
            </div>

            <!-- 최근 1주 주문 금액 -->
            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">
                  {{ viewType === 'weekly' ? '최근 1주' : '최근 1개월' }} 주문 금액 <span class="chart-title-sub">(주문: 원)</span>
                </h3>
              </div>
              <div class="chart-body" :class="{ 'loading': isLoading }">
                <div v-if="isLoading" class="chart-loading">
                  <q-spinner color="primary" size="2em" />
                  <p>데이터 로딩 중...</p>
                </div>
                <div v-else-if="!orderList || orderList.length === 0" class="no-data">
                  <q-icon name="show_chart" size="3em" color="grey-5" />
                  <p>주문 내역이 없습니다</p>
                </div>
                <div v-else class="chart-canvas-container">
                  <canvas id="lineChart" />
                </div>
              </div>
            </div>

            <!-- 1주일간 판매 메뉴 수 -->
            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">
                  {{ viewType === 'weekly' ? '1주일간' : '1개월간' }} 판매 메뉴 수 <span class="chart-title-sub">(주문: 개)</span>
                </h3>
              </div>
              <div class="chart-body" :class="{ 'loading': isLoading }">
                <div v-if="isLoading" class="chart-loading">
                  <q-spinner color="primary" size="2em" />
                  <p>데이터 로딩 중...</p>
                </div>
                <div v-else-if="!orderList || orderList.length === 0" class="no-data">
                  <q-icon name="pie_chart" size="3em" color="grey-5" />
                  <p>주문 내역이 없습니다</p>
                </div>
                <div v-else class="chart-canvas-container">
                  <canvas id="pieChart" />
                </div>
              </div>
            </div>

            <!-- 최근 1주 피크타임 분석 -->
            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">
                  {{ viewType === 'weekly' ? '최근 1주' : '최근 1개월' }} 피크타임 분석 <span class="chart-title-sub">(주문: 건)</span>
                </h3>
              </div>
              <div class="chart-body" :class="{ 'loading': isLoading }">
                <div v-if="isLoading" class="chart-loading">
                  <q-spinner color="primary" size="2em" />
                  <p>데이터 로딩 중...</p>
                </div>
                <div v-else-if="!orderList || orderList.length === 0" class="no-data">
                  <q-icon name="schedule" size="3em" color="grey-5" />
                  <p>주문 내역이 없습니다</p>
                </div>
                <div v-else class="chart-canvas-container">
                  <canvas id="peakTimeChart" />
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </ClientOnly>
  </q-page>
</template>

<style scoped lang="scss">
.main-container-box {
  height: 100%;
  overflow: hidden;
}

.dashboard-container {
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #f5f3f2;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.toggle-container {
  display: flex;
  justify-content: flex-start;
  padding: 10px 20px;
  flex-shrink: 0;
  background: white;
  margin: 8px 35px 8px 20px;
  margin-bottom: 10px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.charts-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 0px 20px;
  margin-bottom: 150px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  align-content: start;

  @media (max-width: 1600px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}

.chart-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: calc((100vh - 180px) / 2);
  min-height: 450px;
  overflow: hidden;
  box-sizing: border-box;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 1600px) {
    height: auto;
    min-height: 400px;
  }
}

.chart-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e8e8e8;
  flex-shrink: 0;
}

.chart-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: -0.3px;
  .chart-title-sub {
    font-size: 12px;
    font-weight: 400;
    color: #666;
    margin-left: 3px;
    letter-spacing: -0.3px;
  }
}

.chart-body {
  flex: 1;
  position: relative;
  min-height: 0;
  width: 100%;

  canvas {
    max-height: 100%;
    max-width: 100%;
    width: 100% !important;
    height: 100% !important;
  }

  &.loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.chart-canvas-container {
  width: 100%;
  height: 100%;
  position: relative;

  canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
    max-width: 100%;
    max-height: 100%;
  }
}

.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #666;
  font-size: 14px;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #999;
  font-size: 14px;
  height: 100%;

  p {
    margin: 0;
    font-weight: 500;
  }
}
</style>

<style lang="scss">
// :has() 선택자로 ShopDashboard가 있을 때만 적용
.main-content:has(.dashboard-container) {
  padding: 0 !important;
  background: #f5f3f2;
}

.main-container:has(.dashboard-container) {
  .main-container-box {
    padding: 0 40px !important;
  }
}
</style>
