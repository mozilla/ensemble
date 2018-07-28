FROM node:8.11.3-alpine

# Add a non-privileged user for installing and running the application, but
# don't switch to it just yet
RUN addgroup -g 10001 app && \
    adduser -D -G app -h /app -u 10001 app

WORKDIR /app

# Install Git (it's needed to generate version.json)
RUN apk add --no-cache git

# Install requirements
COPY package.json /app
COPY package-lock.json /app
USER app
RUN npm install --production

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

# Clear the NPM cache to keep the Docker image small. (We don't need to clear
# the apk cache because we use apk's --no-cache flag above.)
RUN npm cache clean --force

ENTRYPOINT ["npm"]
CMD ["start"]
