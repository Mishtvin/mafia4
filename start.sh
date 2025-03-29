#!/bin/bash

# This script starts the WebRTC Video Conference server

# Get the project directory
WORK_DIR="$HOME/$(basename $REPL_SLUG)"

# Change to the project directory
cd "$WORK_DIR"

# Start the Node.js server
node "$WORK_DIR/server.js"
