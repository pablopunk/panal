import { test, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { POST as createStack } from '../src/pages/api/stacks/create'
import { GET as listStacks } from '../src/pages/api/stacks/index'
import { GET as getStack, DELETE as deleteStack } from '../src/pages/api/stacks/[id]'
import { GET as getFiles, PUT as putFiles } from '../src/pages/api/stacks/[id]/files'
import { POST as actionStack } from '../src/pages/api/stacks/[id]/action'
import { GET as getLog } from '../src/pages/api/stacks/[id]/log'

const docker = spawnSync('docker', ['--version'], { stdio: 'ignore' })
const compose = spawnSync('docker-compose', ['--version'], { stdio: 'ignore' })
const available = docker.status === 0 && compose.status === 0

const integrationTest = available ? test : test.skip

async function json(res: Response) {
  return (await res.json()) as any
}

integrationTest('stack lifecycle via API', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'panal-api-'))
  process.env.STACKS_DIR = dir
  const id = 'apitest'

  const composeFile = `version: '3'
services:
  hello:
    image: alpine
    command: ['sleep', '60']
`

  // create stack
  let req = new Request('http://localhost/api/stacks/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: id, compose: composeFile })
  })
  let res = await createStack({ request: req })
  let data = await json(res)
  expect(data.success).toBe(true)

  await new Promise(r => setTimeout(r, 5000))

  // list stacks and ensure ours exists
  res = await listStacks({})
  data = await json(res)
  expect(data.data.find((s: any) => s.id === id)).toBeDefined()

  // update stack
  const updatedCompose = `version: '3'
services:
  hello:
    image: alpine
    command: ['sleep', '30']
`
  req = new Request('http://localhost/api/stacks/'+id+'/files', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ compose: updatedCompose })
  })
  res = await putFiles({ params: { id }, request: req })
  data = await json(res)
  expect(data.success).toBe(true)

  await new Promise(r => setTimeout(r, 5000))

  // restart stack
  req = new Request('http://localhost/api/stacks/'+id+'/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'restart' })
  })
  res = await actionStack({ params: { id }, request: req })
  data = await json(res)
  expect(data.success).toBe(true)

  await new Promise(r => setTimeout(r, 5000))

  // remove stack via delete
  res = await deleteStack({ params: { id } })
  data = await json(res)
  expect(data.success).toBe(true)

  await new Promise(r => setTimeout(r, 5000))

  // ensure stack gone
  res = await listStacks({})
  data = await json(res)
  expect(data.data.find((s: any) => s.id === id)).toBeUndefined()

  await fs.rm(dir, { recursive: true, force: true })
}, 60_000)

integrationTest('files and log endpoints', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'panal-api-'))
  process.env.STACKS_DIR = dir
  const id = 'apifiles'

  const composeFile = `version: '3'
services:
  hello:
    image: alpine
    command: ['echo','hi']
`
  const createReq = new Request('http://localhost/api/stacks/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: id, compose: composeFile })
  })
  let res = await createStack({ request: createReq })
  let data = await json(res)
  expect(data.success).toBe(true)

  await new Promise(r => setTimeout(r, 5000))

  res = await getFiles({ params: { id } })
  data = await json(res)
  expect(data.data.compose).toContain('echo')

  res = await getLog({ params: { id }, request: new Request('http://localhost') })
  data = await json(res)
  expect(data.success).toBe(true)

  await deleteStack({ params: { id } })
  await fs.rm(dir, { recursive: true, force: true })
}, 60_000)

integrationTest('invalid create request fails', async () => {
  const req = new Request('http://localhost/api/stacks/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'bad*name', compose: '' })
  })
  const res = await createStack({ request: req })
  expect(res.status).toBe(400)
}, 10_000)

