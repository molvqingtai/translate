export type Languages = 'chinese' | 'english' | 'japanese' | 'korean' | 'french' | 'spanish' | 'deutsch'

export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

export type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}

export type SupportedLangs = {
  [key in Languages | 'others' | 'matchAll']: boolean
}

export interface DictItemBase {
  /**
   * Supported language: en, zh-CN, zh-TW, ja, kor, fr, de, es
   * `1` for supported
   */
  lang: string
  /** Show this dictionary when selection contains words in the chosen languages. */
  selectionLang: SupportedLangs
  /**
   * If set to true, the dict start searching automatically.
   * Otherwise it'll only start seaching when user clicks the unfold button.
   * Default MUST be true and let user decide.
   */
  defaultUnfold: SupportedLangs
  /**
   * This is the default height when the dict first renders the result.
   * If the content height is greater than the preferred height,
   * the preferred height is used and a mask with a view-more button is shown.
   * Otherwise the content height is used.
   */
  selectionWC: {
    min: number
    max: number
  }
  /** Word count to start searching */
  preferredHeight: number
}

/**
 * Optional dict custom options. Can only be boolean, number or string.
 * For string, add additional `options_sel` field to list out choices.
 */
type DictItemWithOptions<Options extends { [option: string]: number | boolean | string } | undefined = undefined> =
  Options extends undefined ? DictItemBase : DictItemBase & { options: Options }

/**
 * If an option is of `string` type there will be an array
 * of options in `options_sel` field.
 */
export type DictItem<
  Options extends { [option: string]: number | boolean | string } | undefined = undefined,
  Key extends keyof Options = Options extends undefined ? never : keyof Options
> = Options extends undefined
  ? DictItemWithOptions
  : DictItemWithOptions<Options> &
      ((Key extends any ? (Options[Key] extends string ? Key : never) : never) extends never
        ? {}
        : {
            options_sel: SelectOptions<Options, Key>
          })

export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T

/** Infer selectable options type */
export type SelectOptions<
  Options extends { [option: string]: number | boolean | string } | undefined = undefined,
  Key extends keyof Options = Options extends undefined ? never : keyof Options
> = {
  [opt in Key extends any ? (Options[Key] extends string ? Key : never) : never]: Options[opt][]
}

export interface DictSearchResult<Result> {
  /** search result */
  result: Result
  /** auto play sound */
  audio?: {
    uk?: string
    us?: string
    py?: string
  }
  /** generate menus on dict titlebars */
  catalog?: Array<
    | {
        // <button>
        key: string
        value: string
        label: string
        options?: undefined
      }
    | {
        // <select>
        key: string
        value: string
        options: Array<{
          value: string
          label: string
        }>
        title?: string
      }
  >
}
