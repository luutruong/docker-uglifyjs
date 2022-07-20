import express, {Request, Response} from 'express'
import http from 'http'
import path from 'path'
import {writeFileSync, mkdirSync, unlinkSync, existsSync, readFileSync} from 'fs'
import {execSync} from 'child_process'

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3000

const dir = __dirname
let rootDir: string;

if (existsSync(`${dir}/node_modules`)) {
  rootDir = dir;
} else if (existsSync(`${path.dirname(dir)}/node_modules`)) {
  rootDir = path.dirname(dir);
} else {
  throw new Error('Cannot resolve rootDir');
}

app.use((req: Request, _res: Response, next: () => void) => {
  const contentType = req.headers['content-type'] || ''
  const mime = contentType.split(';')[0]

  if (mime !== 'text/plain') {
    return next()
  }

  let data = ''
  req.setEncoding('utf-8')
  req.on('data', (chunk) => {
    data += chunk
  })

  req.on('end', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    req.rawBody = data
    next()
  })
})

app.get('/', (req: Request, res: Response) => {
  res.send('Hello world!')
})

function escapeCmdArg(arg: string): string {
  return `'` + arg.replace(/'/g, `'"'`) + `'`
}

app.post('/minify', (req: Request, res: Response) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const rawBody = req.rawBody
  if (!rawBody) {
    return res.status(400).send('')
  }

  const uglify = path.join(__dirname, 'node_modules', '.bin', 'uglifyjs')
  const options = {
    compress: true,
    mangle: true,
    comments: false,
    'keep-fargs': false,
    'keep-fnames': false,
  }

  const cmdArgs: string[] = []
  Object.keys(options).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const value = options[key]
    if (!value) {
      return
    }

    cmdArgs.push(`--${key}`)
  })

  const tempFile = `${rootDir}/.data/temp/${Date.now()}.js`
  const outputFile = `${rootDir}/.data/temp/${Date.now()}-minified.js`

  const tempDir = path.dirname(tempFile)
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, {
      recursive: true,
    })
  }

  writeFileSync(tempFile, rawBody, 'utf-8')

  console.log(
    'run minified command',
    `${uglify} ${escapeCmdArg(tempFile)} -o ${escapeCmdArg(outputFile)} ${cmdArgs.join(' ')}`
  )
  execSync(`${uglify} ${escapeCmdArg(tempFile)} -o ${escapeCmdArg(outputFile)} ${cmdArgs.join(' ')}`)

  const minified = readFileSync(outputFile, 'utf-8')

  unlinkSync(tempFile)
  unlinkSync(outputFile)

  if (minified.length === 0) {
    // minified error
    return res.status(400).send('')
  }

  return res.send(minified)
})

server.listen(port, () => {
  console.log(`App started at: http://localhost:${port}`)
})
