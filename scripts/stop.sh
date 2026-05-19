#!/bin/bash

echo "============================================"
echo "   Stopping Cost Dashboard"
echo "============================================"
echo

PORT="${PORT:-3113}"
STOP_PORT=$((PORT + 1))

FOUND=0

PIDS=$(lsof -ti :$PORT 2>/dev/null)
if [ -n "$PIDS" ]; then
    for PID in $PIDS; do
        echo "[INFO] Found process on port $PORT, PID: $PID"
        kill -9 "$PID" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "[INFO] Process $PID terminated successfully."
            FOUND=1
        else
            echo "[WARNING] Failed to terminate process $PID. Try running with sudo."
        fi
    done
fi

PIDS=$(lsof -ti :$STOP_PORT 2>/dev/null)
if [ -n "$PIDS" ]; then
    for PID in $PIDS; do
        echo "[INFO] Found process on port $STOP_PORT, PID: $PID"
        kill -9 "$PID" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "[INFO] Process $PID terminated successfully."
            FOUND=1
        else
            echo "[WARNING] Failed to terminate process $PID. Try running with sudo."
        fi
    done
fi

if [ "$FOUND" -eq 0 ]; then
    echo "[INFO] No process found on port $PORT or $STOP_PORT."
fi

echo
echo "Done."
