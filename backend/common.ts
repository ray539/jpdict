

let offSet = 0
export function now_() {
  return (new Date(offSet))
}

export function increment_days(d: number) {
  offSet += 24 * 3600 * 1000 * d
  return (new Date(offSet))
}

export function increment_hours(d: number) {
  offSet += 3600 * 1000 * d
  return (new Date(offSet))
}
