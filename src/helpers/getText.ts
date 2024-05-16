/**
 * Get the textContent of a node or its child.
 */
export function getText(
  parent: ParentNode | null,
  selector?: string,
  transform?: null | ((text: string) => string)
): string
export function getText(
  parent: ParentNode | null,
  transform?: null | ((text: string) => string),
  selector?: string
): string
export function getText(
  parent: ParentNode | null,
  ...args: [string?, (null | ((text: string) => string))?] | [(null | ((text: string) => string))?, string?]
): string {
  if (!parent) {
    return ''
  }

  let selector = ''
  let transform: null | ((text: string) => string) = null
  for (let i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'string') {
      selector = args[i] as string
    } else if (typeof args[i] === 'function') {
      transform = args[i] as (text: string) => string
    }
  }

  const child = selector ? parent.querySelector(selector) : (parent as HTMLElement)
  if (!child) {
    return ''
  }

  const textContent = child.textContent || ''
  return transform ? transform(textContent) : textContent
}
