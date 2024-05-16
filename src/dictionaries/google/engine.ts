// https://www.google.com/search?hl=en&safe=off&hl=en&gl=en&q=meaning:test

import { Window } from 'happy-dom'
import { getChsToChz } from '../../helpers/getChsToChz'
import { handleNoResult } from '../../helpers/handleNoResult'
import { getInnerHTML } from '../../helpers/getInnerHTML'
import { removeChildren } from '../../helpers/removeChildren'
import { removeChild } from '../../helpers/removeChild'
import { getFullLink } from '../../helpers/getFullLink'
import { getText } from '../../helpers/getText'

import config from './config'
import { DictSearchResult } from '../../types/index'

export interface GoogleDictResult {
  entry: string
  styles: string[]
}

type GoogleDictSearchResult = DictSearchResult<GoogleDictResult>

const DICT_LINK = 'https://www.google.com/search?hl=en&safe=off&hl=en&gl=en&q=meaning:'

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

  return { cut: await handleDOM(html, doc), origin: html }
}

function handleDOM(bodyText: string, doc: Document): GoogleDictSearchResult | Promise<GoogleDictSearchResult> {
  // mend fragments
  extFragements(bodyText).forEach(({ id, innerHTML }) => {
    try {
      const el = doc.querySelector(`#${id}`)
      if (el) {
        el.innerHTML = innerHTML
      }
    } catch (e) {
      // ignore
    }
  })

  const $obcontainer = doc.querySelector('.lr_container')
  if ($obcontainer) {
    $obcontainer.querySelectorAll<HTMLDivElement>('.vkc_np').forEach(($block) => {
      if (
        $block.querySelector('.zbA8Me') || // Dictionary title
        $block.querySelector('#dw-siw') || // Search box
        $block.querySelector('#tl_select') // Translate to
      ) {
        $block.remove()
      }
    })

    removeChildren($obcontainer, '.lr_dct_trns_h') // other Translate to blocks
    removeChildren($obcontainer, '.S5TwIf') // Learn to pronounce
    removeChildren($obcontainer, '.VZVCid') // From Oxford
    removeChildren($obcontainer, '.u7XA4b') // footer
    removeChild($obcontainer, '[jsname=L4Nn5e]') // remove translate to

    // tts
    $obcontainer.querySelectorAll('audio').forEach(($audio) => {
      const $source = $audio.querySelector('source')

      let src = $source && getFullLink('https://ssl.gstatic.com', $source, 'src')

      if (!src) {
        src =
          'https://www.google.com/speech-api/v1/synthesize?enc=mpeg&lang=zh-cn&speed=0.4&client=lr-language-tts&use_google_only_voices=1&text=' +
          encodeURIComponent(text)
      }

      // $audio.replaceWith(getStaticSpeaker(src))
    })

    $obcontainer.querySelectorAll('[role=listitem] > [jsname=F457ec]').forEach(($word) => {
      // let saladict jump into the words
      const $a = document.createElement('a')
      $a.textContent = getText($word)
      Array.from($word.childNodes).forEach(($child) => {
        $child.remove()
      })
      $word.appendChild($a)
      // always appeared available
      $word.removeAttribute('style')
      $word.classList.add('MR2UAc')
      $word.classList.add('I6a0ee')
      $word.classList.remove('cO53qb')
    })

    $obcontainer.querySelectorAll('g-img > img').forEach(($img) => {
      const src = $img.getAttribute('title')
      if (src) {
        $img.setAttribute('src', src)
      }
    })

    // extractImg(bodyText).forEach(({ id, src }) => {
    //   try {
    //     const el = $obcontainer.querySelector(`#${id}`)
    //     if (el) {
    //       el.setAttribute('src', src)
    //     }
    //   } catch (e) {
    //     // ignore
    //   }
    // })

    const cleanText = getInnerHTML('https://www.google.com', $obcontainer, {
      config: {
        ADD_TAGS: ['g-img'],
        ADD_ATTR: ['jsname', 'jsaction']
      }
    })
      .replace(/synonyms:/g, 'syn:')
      .replace(/antonyms:/g, 'ant:')

    const styles: string[] = []
    doc.querySelectorAll('style').forEach(($style) => {
      const textContent = getText($style)
      if (textContent && /\.xpdxpnd|\.lr_container/.test(textContent)) {
        styles.push(textContent)
      }
    })

    return { result: { entry: cleanText, styles } }
  }

  return handleNoResult<GoogleDictSearchResult>()
}

function extFragements(text: string): Array<{ id: string; innerHTML: string }> {
  const result: Array<{ id: string; innerHTML: string }> = []
  const matcher = /\(function\(\)\{window\.jsl\.dh\('([^']+)','([^']+)'\);\}\)\(\);/g
  let match: RegExpExecArray | null | undefined
  while ((match = matcher.exec(text))) {
    result.push({
      id: match[1],
      innerHTML: match[2]
        // escape \x
        .replace(/\\x([\da-f]{2})/gi, decodeHex)
        // escape \u
        .replace(/\\[u]([\da-f]{4})/gi, decodeHex)
    })
  }
  return result
}

function extractImg(text: string): Array<{ id: string; src: string }> {
  const kvPairMatch = /google.ldi={([^}]+)}/.exec(text)
  if (kvPairMatch) {
    try {
      const json = JSON.parse(`{${kvPairMatch[1]}}`)
      return Object.keys(json).map((key) => ({ id: key, src: json[key] }))
    } catch (e) {
      // ignore
    }
  }
  return []
}

function decodeHex(m: string, code: string): string {
  return String.fromCharCode(parseInt(code, 16))
}
