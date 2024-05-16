import { Abortable } from 'node:events'
import { existsSync, mkdirSync, Mode, ObjectEncodingOptions, OpenMode } from 'node:fs'
import { writeFile as _writeFile } from 'node:fs/promises'
import { parse } from 'node:path'
import { Stream } from 'node:stream'

/**
 * Write file, create if not dir
 */
export const writeFile = async (
  path: string,
  file:
    | string
    | NodeJS.ArrayBufferView
    | Iterable<string | NodeJS.ArrayBufferView>
    | AsyncIterable<string | NodeJS.ArrayBufferView>
    | Stream,
  options?:
    | (ObjectEncodingOptions & {
        mode?: Mode | undefined
        flag?: OpenMode | undefined
      } & Abortable)
    | BufferEncoding
    | null
) => {
  const { dir } = parse(path)
  !existsSync(dir) && mkdirSync(dir, { recursive: true })
  await _writeFile(path, file, options)
  return path
}
