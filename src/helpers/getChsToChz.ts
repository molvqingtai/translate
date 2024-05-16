/**
 * Get chs-chz transform function on-demand.
 * The dict object is huge.
 * @param langCode
 */
export async function getChsToChz(): Promise<(text: string) => string>
export async function getChsToChz(langCode: string): Promise<null | ((text: string) => string)>
export async function getChsToChz(langCode?: string): Promise<null | ((text: string) => string)> {
  return langCode == null || /zh-TW|zh-HK/i.test(langCode) ? (await import('./chs-to-chz')).chsToChz : null
}
