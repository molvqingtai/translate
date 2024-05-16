export function handleNetWorkError(): Promise<never> {
  return Promise.reject(new Error('NETWORK_ERROR'))
}
