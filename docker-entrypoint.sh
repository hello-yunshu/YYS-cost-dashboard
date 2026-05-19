#!/bin/sh
set -e

echo "=== Cost Dashboard Docker Startup ==="

if [ -f "$DB_PATH" ]; then
  echo "Database already exists, skipping initialization."
else
  echo "Database will be initialized by the backend."
fi

echo "Starting backend server..."
node server.bundle.js &
BACKEND_PID=$!

echo "Starting nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

echo "Cost Dashboard is running on port 8080"

while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $NGINX_PID 2>/dev/null; do
  sleep 1
done

echo "A service has exited, shutting down..."
kill $BACKEND_PID $NGINX_PID 2>/dev/null
wait
