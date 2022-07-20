# Docker Uglify Web Service

## Build with docker

```bash
docker build -t docker-uglify .

docker run --rm --name docker-uglify -p 3000:3000 docker-uglify
```

## API

```bash
curl -X POST -H 'content-type: text/plain' --data-raw '<JS content here>' 'http://localhost:3000/minify'
```
