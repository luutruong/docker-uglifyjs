FROM node:22.11.0-alpine

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile --ignore-scripts

COPY . .
RUN yarn build

ENV PORT 3000
ENV NODE_ENV production

EXPOSE 3000

CMD ["yarn", "start"]