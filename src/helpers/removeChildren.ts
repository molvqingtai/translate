/**
 * Remove all the matching child nodes from a parent node
 */
export function removeChildren(parent: ParentNode, selector: string) {
  parent.querySelectorAll(selector).forEach((el) => el.remove())
}
