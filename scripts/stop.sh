#!/bin/bash

echo "============================================"
echo "   Stopping MTC Cost Dashboard"
echo "============================================"
echo

FOUND=0

PIDS=$(lsof -ti :3113 2>/dev/null)
if [ -n "$PIDS" ]; then
    for PID in $PIDS; do
        echo "[INFO] Found process on port 3113, PID: $PID"
        kill -9 "$PID" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "[INFO] Process $PID terminated successfully."
            FOUND=1
        else
            echo "[WARNING] Failed to terminate process $PID. Try running with sudo."
        fi
    done
fi

PIDS=$(lsof -ti :3114 2>/dev/null)
if [ -n "$PIDS" ]; then
    for PID in $PIDS; do
        echo "[INFO] Found process on port 3114, PID: $PID"
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
    echo "[INFO] No process found on port 3113 or 3114."
fi

echo
echo "Done."
