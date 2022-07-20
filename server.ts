import express, {Request, Response} from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import prettier from 'prettier'
import UglifyJS from 'uglify-js'

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3000

app.use(bodyParser.json())

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

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello world!')
})

app.post('/minify', (req: Request, res: Response) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const rawBody = req.rawBody
  if (!rawBody) {
    return res.status(400).send('')
  }

  const result = UglifyJS.minify(rawBody, {
    compress: {
      drop_console: true,
    },
    mangle: true,
    keep_fnames: false,
  })
  if (result.error) {
    return res.status(500).send(result.error)
  }

  return res.setHeader('Content-Type', 'text/plain').send(result.code)
})

app.post('/prettier', (req: Request, res: Response) => {
  const payload = req.body
  if (typeof payload !== 'object') {
    return res.status(400).send('')
  }

  const prettierOptions = Object.assign({
    trailingComma: "es5",
    tabWidth: 4,
    semi: true,
    singleQuote: true,
    printWidth: 120,
    bracketSpacing: true,
    endOfLine: "lf",
  }, payload.options, {
    parser: 'babel'
  })

  const output = prettier.format(payload.contents, prettierOptions)

  return res.status(200).setHeader('Content-Type', 'text/plain').send(output)
})

server.listen(port, () => {
  console.log(`App started at: http://localhost:${port}`)
})
