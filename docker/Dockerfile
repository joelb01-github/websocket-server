FROM node:14-alpine

# Install bash
RUN apk add --no-cache bash
# Install sequelize-cli
RUN npm install -g sequelize-cli

ENV APPLICATION_DIRECTORY /srv/app

RUN mkdir $APPLICATION_DIRECTORY

COPY package.json $APPLICATION_DIRECTORY/package.json

WORKDIR $APPLICATION_DIRECTORY

RUN yarn

COPY . $APPLICATION_DIRECTORY

CMD ["npm", "run", "start:server"]
