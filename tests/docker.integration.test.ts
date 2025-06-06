import { test, expect } from 'vitest'
import { runStackDeployOrUpdate, runStackAction, runStackRemove } from '../src/lib/docker/services'
import { getStackById } from '../src/lib/docker/stacks'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const docker = spawnSync('docker', ['--version'], { stdio: 'ignore' })
const compose = spawnSync('docker-compose', ['--version'], { stdio: 'ignore' })
const available = docker.status === 0 && compose.status === 0

const integrationTest = available ? test : test.skip

integrationTest(
  'stack lifecycle via Docker',
  async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'panal-'))
    process.env.STACKS_DIR = dir
    const id = 'panaltest'
    const composeFile = `version: '3'
services:
  hello:
    image: alpine
    command: ['sleep', '60']
`

    let result = await runStackDeployOrUpdate({ id, name: id, compose: composeFile })
    expect(result.success).toBe(true)

    await new Promise(r => setTimeout(r, 5000))
    let stack = await getStackById(id)
    expect(stack).toBeDefined()

    const updatedCompose = `version: '3'
services:
  hello:
    image: alpine
    command: ['sleep', '30']
`
    result = await runStackDeployOrUpdate({ id, compose: updatedCompose })
    expect(result.success).toBe(true)
    await new Promise(r => setTimeout(r, 5000))

    result = await runStackAction({ id, action: 'restart' })
    expect(result.success).toBe(true)
    await new Promise(r => setTimeout(r, 5000))

    result = await runStackRemove({ id })
    expect(result.success).toBe(true)
    await new Promise(r => setTimeout(r, 5000))

    stack = await getStackById(id)
    expect(stack).toBeUndefined()

    await fs.rm(dir, { recursive: true, force: true })
  },
  60_000,
)
