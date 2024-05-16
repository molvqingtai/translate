import { Window } from 'happy-dom'
import { getChsToChz } from '../../helpers/getChsToChz'
import { getText } from '../../helpers/getText'
import { handleNoResult } from '../../helpers/handleNoResult'
import { getInnerHTML } from '../../helpers/getInnerHTML'
import { getFullLink } from '../../helpers/getFullLink'
import { removeChild } from '../../helpers/removeChild'
import { externalLink } from '../../helpers/externalLink'
import config, { CambridgeConfig } from './config'
import { DictSearchResult } from '../../types/index'

const HOST = 'https://dictionary.cambridge.org'
const DICT_LINK = 'https://dictionary.cambridge.org/dictionary/english/'

type CambridgeResultItem = {
  id: string
  html: string
}

const bingConfig = config()

export type CambridgeResult = CambridgeResultItem[]

type CambridgeSearchResult = DictSearchResult<CambridgeResult>

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

function handleDOM(doc: Document): CambridgeSearchResult | Promise<CambridgeSearchResult> {
  const options = bingConfig['options']
  const result: CambridgeResult = []
  const catalog: NonNullable<CambridgeSearchResult['catalog']> = []
  const audio: { us?: string; uk?: string } = {}

  doc.querySelectorAll('.entry-body__el').forEach(($entry, i) => {
    if (!getText($entry, '.headword')) {
      return
    }

    const $posHeader = $entry.querySelector('.pos-header')
    if ($posHeader) {
      $posHeader.querySelectorAll('.dpron-i').forEach(($pron) => {
        const $daud = $pron.querySelector<HTMLSpanElement>('.daud')
        if (!$daud) return
        const $source = $daud.querySelector<HTMLSourceElement>('source[type="audio/mpeg"]')
        if (!$source) return

        const src = getFullLink(HOST, $source, 'src')

        if (src) {
          // $daud.replaceWith(getStaticSpeaker(src))

          if (!audio.uk && $pron.classList.contains('uk')) {
            audio.uk = src
          }

          if (!audio.us && $pron.classList.contains('us')) {
            audio.us = src
          }
        }
      })
      removeChild($posHeader, '.share')
    }

    sanitizeEntry($entry)

    const entryId = `d-cambridge-entry${i}`

    result.push({
      id: entryId,
      html: getInnerHTML(HOST, $entry)
    })

    catalog.push({
      key: `#${i}`,
      value: entryId,
      label: '#' + getText($entry, '.di-title') + ' ' + getText($entry, '.posgram')
    })
  })

  if (result.length <= 0) {
    // check idiom
    const $idiom = doc.querySelector('.idiom-block')
    if ($idiom) {
      removeChild($idiom, '.bb.hax')

      sanitizeEntry($idiom)

      result.push({
        id: 'd-cambridge-entry-idiom',
        html: getInnerHTML(HOST, $idiom)
      })
    }
  }

  if (result.length <= 0 && options.related) {
    const $link = doc.querySelector('link[rel=canonical]')
    if ($link && /dictionary\.cambridge\.org\/([^/]+\/)?spellcheck\//.test($link.getAttribute('href') || '')) {
      const $related = doc.querySelector('.hfl-s.lt2b.lmt-10.lmb-25.lp-s_r-20')
      if ($related) {
        result.push({
          id: 'd-cambridge-entry-related',
          html: getInnerHTML(HOST, $related)
        })
      }
    }
  }

  if (result.length > 0) {
    return { result, audio, catalog }
  }

  return handleNoResult()
}

function sanitizeEntry<E extends Element>($entry: E): E {
  // expand button
  $entry.querySelectorAll('.daccord_h').forEach(($btn) => {
    $btn.parentElement!.classList.add('amp-accordion')
  })

  // replace amp-img
  $entry.querySelectorAll('amp-img').forEach(($ampImg) => {
    const $img = document.createElement('img')

    $img.setAttribute('src', getFullLink(HOST, $ampImg, 'src'))

    const attrs = ['width', 'height', 'title']
    for (const attr of attrs) {
      const val = $ampImg.getAttribute(attr)
      if (val) {
        $img.setAttribute(attr, val)
      }
    }

    $ampImg.replaceWith($img)
  })

  // replace amp-audio
  $entry.querySelectorAll('amp-audio').forEach(($ampAudio) => {
    const $source = $ampAudio.querySelector('source')
    if ($source) {
      const src = getFullLink(HOST, $source, 'src')
      if (src) {
        // $ampAudio.replaceWith(getStaticSpeaker(src))
        return
      }
    }
    $ampAudio.remove()
  })

  // See more results
  $entry.querySelectorAll<HTMLAnchorElement>('a.had').forEach(externalLink)

  return $entry
}
