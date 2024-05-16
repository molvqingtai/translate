import { getHTML } from './getHTML'

export interface GetHTMLConfig {
  /** innerHTML or outerHTML */
  mode?: 'innerHTML' | 'outerHTML'
  /** Select child node */
  selector?: string
  /** transform text */
  transform?: null | ((text: string) => string)
  /** Give url and src a host */
  host?: string
  /** DOM Purify config */
  config?: DOMPurify.Config
}

export function getInnerHTML(
  host: string,
  parent: ParentNode,
  selectorOrConfig: string | Omit<GetHTMLConfig, 'mode' | 'host'> = {}
) {
  return getHTML(
    parent,
    typeof selectorOrConfig === 'string'
      ? { selector: selectorOrConfig, host, mode: 'innerHTML' }
      : { ...selectorOrConfig, host, mode: 'innerHTML' }
  )
}
