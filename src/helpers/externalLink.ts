/**
 * Will jump to the website instead of searching
 * when clicking on the dict panel
 */
export function externalLink($a: HTMLElement) {
  $a.setAttribute('target', '_blank')
  $a.setAttribute('rel', 'nofollow noopener noreferrer')
}
