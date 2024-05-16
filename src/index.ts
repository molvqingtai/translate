#!/usr/bin/env node

import path from 'node:path'
import arg, { Result } from 'arg'
import { search as bingSearch } from './dictionaries/bing/engine'
import { search as cobuildSearch } from './dictionaries/cobuild/engine'
import { search as cambridgeSearch } from './dictionaries/cambridge/engine'
import { search as googleSearch } from './dictionaries/google/engine'
import { useHttpProxy } from './helpers/useHttpProxy'
import { runTask } from './helpers/runTask'
import { writeFile } from './helpers/writeFile'

console.log(process.env.https_proxy)

if (process.env.https_proxy) {
  useHttpProxy(process.env.https_proxy)
}

const args = arg({
  '--words': String
})

const main = async () => {
  const words = args['--words']

  if (!words) {
    throw new Error('No words provided')
  }

  const outDirname = path.join(process.cwd(), 'output')

  await Promise.all([
    runTask('bing', async () => {
      const { cut, origin } = await bingSearch(words)
      await writeFile(path.resolve(outDirname, `${words}-bing-origin.html`), origin)
      await writeFile(path.resolve(outDirname, `${words}-bing-cut.json`), JSON.stringify(cut))
    }),
    runTask('cobuild', async () => {
      const { cut, origin } = await cobuildSearch(words)
      await writeFile(path.resolve(outDirname, `${words}-cobuild-origin.html`), origin)
      await writeFile(path.resolve(outDirname, `${words}-cobuild-cut.json`), JSON.stringify(cut))
    }),
    runTask('cambridge', async () => {
      const { cut, origin } = await cambridgeSearch(words)
      await writeFile(path.resolve(outDirname, `${words}-cambridge-origin.html`), origin)
      await writeFile(path.resolve(outDirname, `${words}-cambridge-cut.json`), JSON.stringify(cut))
    }),
    runTask('google', async () => {
      const { cut, origin } = await googleSearch(words)
      await writeFile(path.resolve(outDirname, `${words}-google-origin.html`), origin)
      await writeFile(path.resolve(outDirname, `${words}-google-cut.json`), JSON.stringify(cut))
    })
  ])
}

void (async () => {
  await main()
  process.exit(0)
})().catch((error) => {
  console.error((error as any).message)
  process.exit(1)
})
