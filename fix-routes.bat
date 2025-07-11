@echo off
REM This script removes conflicting API routes

REM Remove the [id] folders
rmdir /s /q "app\api\documents\[id]"
rmdir /s /q "app\api\proposal-documents\[id]"

echo "Conflicting routes removed"
