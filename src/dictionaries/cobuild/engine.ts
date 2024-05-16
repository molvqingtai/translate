import { Window } from 'happy-dom'
import { getChsToChz } from '../../helpers/getChsToChz'
import { handleNoResult } from '../../helpers/handleNoResult'
import { getInnerHTML } from '../../helpers/getInnerHTML'
import config from './config'
import { DictSearchResult } from '../../types/index'

export interface COBUILDCibaResult {
  type: 'ciba'
  title: string
  defs: string[]
  level?: string
  star?: number
  prons?: Array<{
    phsym: string
    audio: string
  }>
}

export interface COBUILDColResult {
  type: 'collins'
  sections: Array<{
    id: string
    className: string
    type: string
    title: string
    num: string
    content: string
  }>
}

export type COBUILDResult = COBUILDCibaResult | COBUILDColResult

const DICT_LINK = 'https://www.collinsdictionary.com/zh/dictionary/english/'

export const search = async (text: string) => {
  const url = `${DICT_LINK}${encodeURIComponent(text.replace(/\s+/g, ' '))}`
  const window = new Window({
    settings: {
      disableCSSFileLoading: true,
      disableJavaScriptFileLoading: true,
      disableComputedStyleRendering: true,
      disableJavaScriptEvaluation: true
    }
  })

  const doc = window.document as any as Document

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: '*/*',
      priority: 'u=1, i',
      'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin'
    }
  })
  const html = await response.text()
  doc.write(html)

  return { cut: await handleDOM(doc), origin: html }
}

async function handleDOM(doc: Document): Promise<DictSearchResult<COBUILDColResult>> {
  const transform = await getChsToChz('zh-CN')

  const result: COBUILDColResult = {
    type: 'collins',
    sections: []
  }
  const audio: { uk?: string; us?: string } = {}

  result.sections = [...doc.querySelectorAll<HTMLDivElement>(`[data-type-block]`)]
    .filter(($section) => {
      const type = $section.dataset.typeBlock || ''
      return type && type !== 'Video' && type !== 'Trends' && type !== '英语词汇表' && type !== '趋势'
    })
    .map(($section) => {
      const type = $section.dataset.typeBlock || ''
      const title = $section.dataset.titleBlock || ''
      const num = $section.dataset.numBlock || ''
      const id = type + title + num
      const className = $section.className || ''

      return {
        id,
        className,
        type,
        title,
        num,
        content: getInnerHTML('https://www.collinsdictionary.com', $section, {
          transform
        })
      }
    })

  if (result.sections.length > 0) {
    return { result, audio }
  }

  console.log('result.sections.length', result.sections.length)

  return handleNoResult()
}
