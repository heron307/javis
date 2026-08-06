/** Command Interface(Ticker · Live Intel)에서 모니터링하는 통화 */
export type MonitorCurrency = {
  code: string
  labelKo: string
  pair?: string
}

export const MONITOR_CURRENCIES: MonitorCurrency[] = [
  { code: 'KRW', labelKo: '대한민국 원' },
  { code: 'USD', labelKo: '미국 달러', pair: 'USD/KRW' },
  { code: 'EUR', labelKo: '유로', pair: 'EUR/KRW' },
  { code: 'JPY', labelKo: '일본 엔', pair: 'JPY/KRW' },
  { code: 'GBP', labelKo: '영국 파운드', pair: 'GBP/KRW' },
  { code: 'THB', labelKo: '태국 밧', pair: 'THB/KRW' },
]

export function isMonitorCurrency(code: string): boolean {
  return MONITOR_CURRENCIES.some((c) => c.code === code.toUpperCase())
}
