import DOMPurify from 'isomorphic-dompurify'
import { getFullLink } from './getFullLink'
import { isTagName } from './isTagName'

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

const defaultDOMPurifyConfig: DOMPurify.Config = {
  FORBID_TAGS: ['style'],
  FORBID_ATTR: ['style']
}

export function getHTML(
  parent: ParentNode,
  { mode = 'innerHTML', selector, transform, host, config = defaultDOMPurifyConfig }: GetHTMLConfig = {}
): string {
  const node = selector ? parent.querySelector<HTMLElement>(selector) : (parent as HTMLElement)
  if (!node) {
    return ''
  }

  if (host) {
    const fillLink = (el: HTMLElement) => {
      if (el.getAttribute('href')) {
        el.setAttribute('href', getFullLink(host!, el, 'href'))
      }
      if (el.getAttribute('src')) {
        el.setAttribute('src', getFullLink(host!, el, 'src'))
      }
    }

    if (isTagName(node, 'a') || isTagName(node, 'img')) {
      fillLink(node)
    }
    node.querySelectorAll('a').forEach(fillLink)
    node.querySelectorAll('img').forEach(fillLink)
  }

  const fragment = DOMPurify.sanitize(node, {
    ...config,
    RETURN_DOM_FRAGMENT: true
  })

  const content = fragment.firstChild ? fragment.firstChild[mode] : ''

  return transform ? transform(content) : content
}
