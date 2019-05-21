#!/bin/bash

set -ev

# Install Rust and Cargo
curl https://sh.rustup.rs -sSf > /tmp/rustup.sh
sh /tmp/rustup.sh -y
export PATH="$HOME/.cargo/bin:$PATH"
source "$HOME/.cargo/env"

# Install NPM packages
export SODIUM_STATIC=true
cd $TRAVIS_BUILD_DIR
rustc --version
node -v
npm -v
npm install && npm run build
