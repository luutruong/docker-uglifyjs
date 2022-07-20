FROM node:16.15-alpine

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile --ignore-scripts

COPY . .
RUN yarn build

ENV PORT 3000
EXPOSE 3000

CMD ["yarn", "start"]