#───────────────────────────────────────────────────────────────────────────────
# ─── Dockerfile Template for Node.js Applications ─────────────────────────────
#───────────────────────────────────────────────────────────────────────────────
# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7
#───────────────────────────────────────────────────────────────────────────────
# ─── Base Image ───────────────────────────────────────────────────────────────
#───────────────────────────────────────────────────────────────────────────────
ARG NODE_VERSION=22.14.0
# Use an official Node.js runtime as a parent image.
FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV=production
# Set the working directory inside the container.
WORKDIR /usr/src/app

# ─── Copy Application Source Code ──────────────────────────────────────────────
# Copy the rest of the source files into the image.

COPY . .

# ─── Enable Corepack + prepare the exact Yarn version your project wants ─────
RUN corepack enable && \
    corepack prepare yarn@4.6.0 --activate

# Copy only the necessary files to run the application.
# This helps keep the image size down and improves build times.
# First, copy over any files needed for building native dependencies.
#COPY package.json yarn.lock ./

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.yarn to speed up subsequent builds.
# Leverage a bind mounts to package.json and yarn.lock to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=yarn.lock,target=yarn.lock \
    --mount=type=cache,target=/root/.yarn \
    yarn workspaces focus


# Run the application as a non-root user.
USER node


# Expose the port that the application listens on.
EXPOSE 3023

# Run the application.
CMD ["yarn", "start"]
