import { Env } from "./types"

/** 取北京时间的日期 (YYYY-MM-DD) 与月份 (YYYY-MM) */
function beijingDateParts(): { day: string; month: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const day = fmt.format(new Date()) // en-CA -> YYYY-MM-DD
  return { day, month: day.slice(0, 7) }
}

const DAY_TTL = 60 * 60 * 24 * 3 // 保留 3 天足够覆盖"当日"
const MONTH_TTL = 60 * 60 * 24 * 40 // 保留 40 天足够覆盖"当月"

/** 记录一次搜索（供 /search 每次请求调用，不阻塞响应） */
export async function recordSearch(env: Env): Promise<void> {
  const { day, month } = beijingDateParts()
  const dayKey = `stat:search:day:${day}`
  const monthKey = `stat:search:month:${month}`
  const [dayCount, monthCount] = await Promise.all([
    env.CONFIG_KV.get(dayKey),
    env.CONFIG_KV.get(monthKey),
  ])
  await Promise.all([
    env.CONFIG_KV.put(dayKey, String((parseInt(dayCount ?? "0", 10) || 0) + 1), { expirationTtl: DAY_TTL }),
    env.CONFIG_KV.put(monthKey, String((parseInt(monthCount ?? "0", 10) || 0) + 1), { expirationTtl: MONTH_TTL }),
  ])
}

export async function getSearchStats(env: Env): Promise<{ searches_today: number; searches_this_month: number }> {
  const { day, month } = beijingDateParts()
  const [dayCount, monthCount] = await Promise.all([
    env.CONFIG_KV.get(`stat:search:day:${day}`),
    env.CONFIG_KV.get(`stat:search:month:${month}`),
  ])
  return {
    searches_today: parseInt(dayCount ?? "0", 10) || 0,
    searches_this_month: parseInt(monthCount ?? "0", 10) || 0,
  }
}
