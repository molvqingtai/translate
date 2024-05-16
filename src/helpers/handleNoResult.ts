export function handleNoResult<T = any>(): Promise<T> {
  return Promise.reject(new Error('NO_RESULT'))
}
