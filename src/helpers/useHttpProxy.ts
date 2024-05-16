import { ProxyAgent, setGlobalDispatcher } from 'undici'

export const useHttpProxy = (url: string) => {
  const dispatcher = new ProxyAgent({
    uri: new URL(url).toString()
  })
  setGlobalDispatcher(dispatcher)
}
