import express, {Request, Response} from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import prettier from 'prettier'
import UglifyJS from 'uglify-js'

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3000

app.use(bodyParser.json({
  strict: true,
  limit: process.env.UGLIFYJS_BODY_LIMIT || '2048kb', // 2mb
}))

app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Hi'
  })
})

app.post('/minify', (req: Request, res: Response) => {
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(400).send('Invalid body data');
  }

  if (typeof req.body !== 'object') {
    return res.status(400).send('Invalid body data');
  }

  const result = UglifyJS.minify(req.body.code, {
    compress: {
      drop_console: req.body.options?.drop_console ?? true,
    },
    mangle: true,
    keep_fnames: false,
  })
  if (result.error) {
    return res.status(500).send(result.error)
  }

  return res.setHeader('Content-Type', 'text/plain').send(result.code)
})

app.post('/prettier', async (req: Request, res: Response) => {
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

  const output = await prettier.format(payload.contents, prettierOptions)

  return res.status(200).setHeader('Content-Type', 'text/plain').send(output)
})

server.listen(port, () => {
  console.log(`App started at: http://localhost:${port}`)
})
