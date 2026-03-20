<script setup lang="ts">
import { computed } from 'vue'
import type { HoShopMenuboardVo } from '~/types'

const props = defineProps<{
  menuboardList: HoShopMenuboardVo[] | null,
  hoveredBoardSeq: number | null | undefined
}>()

const emits = defineEmits<{
  'openMenuboardModal' : [HoShopMenuboardVo | undefined]
}>()

interface TimeTableItem {
  shopMenuboardSeq : number | undefined
  menuboardName: string
  dayOfWeekList: number[]
  everydayYn: boolean
  startTime: string // HHmm
  endTime: string // HHmm
  color?: string
  priority?: number
}

interface SlotEntry {
  shopMenuboardSeq: number | undefined
  name: string
  color: string
  priority: number
  start: number
  end: number
}

const generateRandomColor = (): string => {
  const hue = Math.floor(Math.random() * 360) // 0~359
  const saturation = Math.floor(Math.random() * 30) + 30 // 60~89% (채도)
  const lightness = Math.floor(Math.random() * 20) + 70 // 50~69% (명도)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

const timetable = ref<TimeTableItem[]>(props.menuboardList?.filter(item => item.useYn).map(item =>
  ({ ...item, color: generateRandomColor() })).sort((a, b) => a.priority - b.priority) || [])

const days = [$t('COMMON.066'), $t('COMMON.067'), $t('COMMON.068'), $t('COMMON.069'), $t('COMMON.070'), $t('COMMON.071'), $t('COMMON.072')]

const timeSlots = computed(() => {
  const slots: string[] = []
  for (let h = 0; h < 24; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }
  return slots
})

//  겹치는 시간대를 priority 기준으로 필터링하고 연속 구간 병합
const getMergedEntriesForDay = (dayIndex: number) => {
  const totalMinutes = 24 * 60
  const slotSize = 30
  const slotCount = totalMinutes / slotSize
  const slots: (SlotEntry | null)[] = Array(slotCount).fill(null)

  const yesterday = (dayIndex - 1) % 8 || 7
  const currentDay = (dayIndex) % 8
  // const nextDay = (dayIndex + 1) % 8 || 7

  const assignToSlots = (item: TimeTableItem, startMin: number, endMin: number) => {
    const startSlot = Math.floor(startMin / slotSize)
    const endSlot = Math.floor(endMin / slotSize)
    for (let s = startSlot; s < endSlot; s++) {
      const existing = slots[s]
      if (!existing || item.priority! < existing.priority) {
        slots[s] = {
          shopMenuboardSeq: item.shopMenuboardSeq,
          name: item.menuboardName,
          color: item.color!,
          priority: item.priority!,
          start: s * slotSize,
          end: (s + 1) * slotSize
        }
      }
    }
  }

  for (const item of timetable.value) {
    const days = item.everydayYn ? [1, 2, 3, 4, 5, 6, 7] : item.dayOfWeekList
    const startMin = parseInt(item.startTime.slice(0, 2)) * 60 + parseInt(item.startTime.slice(2))
    const endMin = parseInt(item.endTime.slice(0, 2)) * 60 + parseInt(item.endTime.slice(2))
    const crossesMidnight = startMin > endMin

    if (!crossesMidnight && days.includes(currentDay)) {
      assignToSlots(item, startMin, endMin)
    }
    if (crossesMidnight) {
      if (days.includes(currentDay)) {
        assignToSlots(item, startMin, 1440)
      }
      if (days.includes(yesterday)) {
        assignToSlots(item, 0, endMin)
      }
    }
  }

  const merged: {
    shopMenuboardSeq: number | undefined,
    name: string
    color: string
    priority: number
    start: number
    end: number
    top: number
    height: number
  }[] = []

  let current: SlotEntry | null = null

  for (let i = 0; i <= slotCount; i++) {
    const slot = slots[i] ?? null
    if (!current && slot) {
      current = { ...slot }
    } else if (
      current &&
      (!slot || slot.name !== current.name || slot.priority !== current.priority)
    ) {
      const duration = current.end - current.start
      const top = (current.start / totalMinutes) * 100
      const height = (duration / totalMinutes) * 100
      merged.push({ ...current, top, height })
      current = slot ? { ...slot } : null
    } else if (current && slot) {
      current.end = slot.end
    }
  }

  return merged
}

const currentDayIndex = new Date().getDay() // 0 (일) ~ 6 (토)

const getCurrentTimeSlotIndex = (): number => {
  const now = new Date()
  const hour = now.getHours()
  // const minutes = now.getMinutes()
  // return hour + (minutes >= 30 ? 1 : 0)
  return hour
}

</script>

<template>
  <q-card flat bordered class="q-pa-sm timetable" style="padding:0">
    <!-- 헤더 -->
    <div class="header">
      <q-card-section class="cell time">
        Time
      </q-card-section>
      <q-card-section
        v-for="(day, i) in days"
        :key="i"
        class="cell day"
      >
        {{ day }}
      </q-card-section>
    </div>

    <!-- 본문 -->
    <div class="body">
      <!-- 시간 라벨 -->
      <div class="col time-column">
        <div
          v-for="(slot, i) in timeSlots"
          :key="i"
          class="cell time"
        >
          {{ slot }}
        </div>
      </div>

      <!-- 요일별 시간표 -->
      <div
        v-for="dayIndex in 7"
        :key="dayIndex"
        class="col day-column"
      >
        <div
          v-for="(slot, i) in timeSlots"
          :key="i"
          class="cell day-slot"
          :class="{
            'is-current-slot': dayIndex - 1 === currentDayIndex && i === getCurrentTimeSlotIndex()
          }"
        >
          <q-chip
            v-if="dayIndex - 1 === currentDayIndex && i === getCurrentTimeSlotIndex()"
            :label="$t('SHOP_MENUBOARD.007')"
            size="sm"
            dense
            color="primary"
            style="top:-15px; left:-10px;color:white; font-weight: bold;"
          />
        </div>

        <div
          v-for="(item, idx) in getMergedEntriesForDay(dayIndex)"
          :key="idx"
          class="entry"
          :class="{'highlighted-entry':props.hoveredBoardSeq === item.shopMenuboardSeq}"
          :style="{
            backgroundColor: item.color,
            top: `${item.top}%`,
            height: `${item.height}%`,
            zIndex: 100 - item.priority,
            cursor: 'pointer'
          }"
          @click="() => {emits('openMenuboardModal', menuboardList?.find((menuboard)=>menuboard.shopMenuboardSeq === item.shopMenuboardSeq))}"
        >
          <template v-if="item.height > 3">
            <div class="entry-label">
              {{ item.name }}
            </div>
          </template>
          <template v-else>
            <div
              class="entry-label outside"
              :style="{ top: '100%' }"
            >
              {{ item.name }}
            </div>
          </template>
        </div>
      </div>
    </div>
  </q-card>
</template>

<style scoped lang="scss">
.timetable {
  display: flex;
  flex-direction: column;
  font-size: 10px;
}
.header {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
}
.body {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  position: relative;
  height: 650px;
}
.cell {
  border: 1px solid #ddd;
  padding: 2px 4px;
  min-height: 21px;
  position: relative;
  height: calc(100% / 24);
}
.header .cell {
  background: #f5f5f5;
  font-weight: bold;
  text-align: center;
}
.day-column {
  position: relative;
  height: 100%;
}
.time-column {
  display: flex;
  flex-direction: column;
}

.day-slot {
  flex: 1;
  height: calc(100% / 24);
  border-bottom: 1px solid #eee;
}
.entry {
  position: absolute;
  left: 0;
  right: 0;
  padding: 0;
  color: #000;
  text-align: center;
  z-index: 1;
  border: 1px solid #999;
  box-sizing: border-box;
}

.entry-label {
  position: absolute;
  top: 50%;
  left: 2px;
  right: 2px;
  transform: translateY(-50%);
  font-size: 1.1em;
  line-height:1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-label.outside {
  transform: translateY(-80%);  /* top: 100% 이므로 그대로 아래 */
  color: #333;
  z-index: 10;
}
.is-current-slot {
  border: 2px solid var(--handorder-color);
  box-sizing: border-box;
  z-index: 10000;
  position: relative;
  background-color: transparent;
  pointer-events: none;
}
.highlighted-entry {
  border: 2px solid var(--handorder-color);
  box-shadow: 0 0 3px var(--handorder-color);
}
</style>
