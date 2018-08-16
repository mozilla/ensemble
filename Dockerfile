FROM node:8.11.3-alpine

# Add a non-privileged user for installing and running the application, but
# don't switch to it just yet
RUN addgroup -g 10001 app && \
    adduser -D -G app -h /app -u 10001 app

WORKDIR /app

# Install Git (it's needed to generate version.json)
RUN apk add --no-cache git

# Install requirements
#
# devDependencies will never be installed on production because the --production
# flag to "npm install" is inferred when NODE_ENV=production.
COPY package.json /app
COPY package-lock.json /app
USER app
RUN npm install

# Copy in the app's source files
COPY . /app

# Make "app" the owner of all source files. It's important that we switch back
# to the "app" user after this is done. We want the "app" user to run the
# application, among other things.
USER root
RUN chown -R app /app
USER app

# Build the application
RUN npm run build

# Remove devDependencies. We don't need them in our container.
#
# We could have used the --production flag to "npm install" above, but
# apparently that excludes even sub-devDependencies, including the
# devDependencies of create-react-app, and create-react-app builds fail when its
# own copy of eslint is not present.
RUN npm prune --dev

# Clear the NPM cache to keep the Docker image small. (We don't need to clear
# the apk cache because we use apk's --no-cache flag above.)
RUN npm cache clean --force

CMD ["npm", "start"]
