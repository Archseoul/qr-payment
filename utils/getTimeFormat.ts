import dayjs from 'dayjs'

export const getTimeFormat = (time:string) => {
  return dayjs(time).format('HH : mm')
}
