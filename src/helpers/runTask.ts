import { createSpinner } from 'nanospinner'

export const runTask = async <T extends Function>(name: string, task: T) => {
  const spinner = createSpinner(`${name}`).start()
  try {
    const res = await task()
    spinner.success({ text: `${name} Translation completed!` })
    return res
  } catch (error) {
    spinner.error({ text: `${name} Translation failed!` })
  }
}
