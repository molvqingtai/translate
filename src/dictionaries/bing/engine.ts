import { Window } from 'happy-dom'
import { getChsToChz } from '../../helpers/getChsToChz'
import { getText } from '../../helpers/getText'
import { handleNoResult } from '../../helpers/handleNoResult'
import { getInnerHTML } from '../../helpers/getInnerHTML'
import config, { BingConfig } from './config'
import { DictSearchResult } from '../../types/index'

export interface BingResultLex {
  type: 'lex'
  title: string
  /** phonetic symbols */
  phsym?: Array<{
    /** Phonetic Alphabet, UK|US|PY */
    lang: string
    /** pronunciation */
    pron: string
  }>
  /** common definitions */
  cdef?: Array<{
    /** part of speech */
    pos: string
    /** definition */
    def: string
  }>
  /** infinitive */
  infs?: string[]
  sentences?: Array<{
    en?: string
    chs?: string
    source?: string
    mp3?: string
  }>
}

export interface BingResultMachine {
  type: 'machine'
  /** machine translation */
  mt: string
}

export interface BingResultRelated {
  type: 'related'
  title: string
  defs: Array<{
    title: string
    meanings: Array<{
      href: string
      word: string
      def: string
    }>
  }>
}

type BingSearchResultLex = DictSearchResult<BingResultLex>
type BingSearchResultMachine = DictSearchResult<BingResultMachine>
type BingSearchResultRelated = DictSearchResult<BingResultRelated>

export type BingResult = BingResultLex | BingResultMachine | BingResultRelated

const HOST = 'https://cn.bing.com'
const DICT_LINK = 'https://cn.bing.com/dict/clientsearch?mkt=zh-CN&setLang=zh&form=BDVEHC&ClientVer=BDDTV3.5.1.4320&q='

const bingConfig = config()

function handleLexResult(
  doc: Document,
  options: BingConfig['options'],
  transform: null | ((text: string) => string)
): BingSearchResultLex | Promise<BingSearchResultLex> {
  const searchResult: DictSearchResult<BingResultLex> = {
    result: {
      type: 'lex',
      title: getText(doc, '.client_def_hd_hd', transform)
    }
  }

  // pronunciation
  if (options.phsym) {
    const $prons = Array.from(doc.querySelectorAll('.client_def_hd_pn_list'))
    if ($prons.length > 0) {
      searchResult.result.phsym = $prons.map((el) => {
        let pron = ''
        const $audio = el.querySelector('.client_aud_o')
        if ($audio) {
          pron = (($audio.getAttribute('onclick') || '').match(/https.*\.mp3/) || [''])[0]
        }
        return {
          lang: getText(el, '.client_def_hd_pn'),
          pron
        }
      })

      searchResult.audio = searchResult.result.phsym.reduce((audio: any, { lang, pron }) => {
        if (/us|美/i.test(lang)) {
          audio['us'] = pron
        } else if (/uk|英/i.test(lang)) {
          audio['uk'] = pron
        }
        return audio
      }, {})
    }
  }

  // definitions
  if (options.cdef) {
    const $container = doc.querySelector('.client_def_container')
    if ($container) {
      const $defs = Array.from($container.querySelectorAll('.client_def_bar'))
      if ($defs.length > 0) {
        searchResult.result.cdef = $defs.map((el) => ({
          pos: getText(el, '.client_def_title_bar', transform),
          def: getText(el, '.client_def_list', transform)
        }))
      }
    }
  }

  // tense
  if (options.tense) {
    const $infs = Array.from(doc.querySelectorAll('.client_word_change_word'))
    if ($infs.length > 0) {
      searchResult.result.infs = $infs.map((el) => (el.textContent || '').trim())
    }
  }

  if (options.sentence > 0) {
    const $sens = doc.querySelectorAll('.client_sentence_list')
    const sentences: typeof searchResult.result.sentences = []
    for (let i = 0; i < $sens.length && sentences.length < options.sentence; i++) {
      const el = $sens[i]
      let mp3 = ''
      const $audio = el.querySelector('.client_aud_o')
      if ($audio) {
        mp3 = (($audio.getAttribute('onclick') || '').match(/https.*\.mp3/) || [''])[0]
      }
      el.querySelectorAll('.client_sen_en_word').forEach(($word) => {
        $word.outerHTML = getText($word)
      })
      el.querySelectorAll('.client_sen_cn_word').forEach(($word) => {
        $word.outerHTML = getText($word, transform)
      })
      el.querySelectorAll('.client_sentence_search').forEach(($word) => {
        $word.outerHTML = `<span class="dictBing-SentenceItem_HL">${getText($word)}</span>`
      })
      sentences.push({
        en: getInnerHTML(HOST, el, '.client_sen_en'),
        chs: getInnerHTML(HOST, el, {
          selector: '.client_sen_cn',
          transform
        }),
        source: getText(el, '.client_sentence_list_link'),
        mp3
      })
    }
    searchResult.result.sentences = sentences
  }

  if (Object.keys(searchResult.result).length > 2) {
    return searchResult
  }
  return handleNoResult()
}

function handleMachineResult(
  doc: Document,
  transform: null | ((text: string) => string)
): BingSearchResultMachine | Promise<BingSearchResultMachine> {
  const mt = getText(doc, '.client_sen_cn', transform)

  if (mt) {
    return {
      result: {
        type: 'machine',
        mt
      }
    }
  }

  return handleNoResult()
}

function handleRelatedResult(
  doc: Document,
  config: BingConfig,
  transform: null | ((text: string) => string)
): BingSearchResultRelated | Promise<BingSearchResultRelated> {
  const searchResult: DictSearchResult<BingResultRelated> = {
    result: {
      type: 'related',
      title: getText(doc, '.client_do_you_mean_title_bar', transform),
      defs: []
    }
  }

  doc.querySelectorAll('.client_do_you_mean_area').forEach(($area) => {
    const $defsList = $area.querySelectorAll('.client_do_you_mean_list')
    if ($defsList.length > 0) {
      searchResult.result.defs.push({
        title: getText($area, '.client_do_you_mean_title', transform),
        meanings: Array.from($defsList).map(($list) => {
          const word = getText($list, '.client_do_you_mean_list_word', transform)
          return {
            href: `https://cn.bing.com/dict/search?q=${word}`,
            word,
            def: getText($list, '.client_do_you_mean_list_def', transform)
          }
        })
      })
    }
  })

  if (searchResult.result.defs.length > 0) {
    return searchResult
  }
  return handleNoResult()
}

export const handleDOM = async (doc: Document): Promise<DictSearchResult<BingResult>> => {
  const transform = await getChsToChz('zh-CN')
  if (doc.querySelector('.client_def_hd_hd')) {
    return await handleLexResult(doc, bingConfig.options, transform)
  }

  if (doc.querySelector('.client_trans_head')) {
    return await handleMachineResult(doc, transform)
  }

  if (bingConfig.options.related) {
    if (doc.querySelector('.client_do_you_mean_title_bar')) {
      return await handleRelatedResult(doc, bingConfig, transform)
    }
  }
  return await handleNoResult<DictSearchResult<BingResult>>()
}

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
