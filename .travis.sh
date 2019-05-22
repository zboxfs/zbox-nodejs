#!/bin/bash

set -ev

sodium=libsodium-1.0.17
base_dir=$TRAVIS_BUILD_DIR/libsodium
sodium_dir=$base_dir/$sodium

# Install libsodium
mkdir -p $base_dir
if [ ! -f $sodium_dir/Makefile  ]; then
    wget https://download.libsodium.org/libsodium/releases/$sodium.tar.gz
    tar -xzf $sodium.tar.gz -C $base_dir
    cd $sodium_dir && ./configure --prefix=/usr && make
fi
cd $sodium_dir && sudo make install
export SODIUM_LIB_DIR=/usr/lib
export SODIUM_STATIC=true

# Install Rust and Cargo
curl https://sh.rustup.rs -sSf > /tmp/rustup.sh
sh /tmp/rustup.sh -y
export PATH="$HOME/.cargo/bin:$PATH"
source "$HOME/.cargo/env"

# Install NPM packages
cd $TRAVIS_BUILD_DIR
rustc --version
node -v
npm -v
npm install && npm run build
