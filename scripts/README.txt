============================================
  Cost Dashboard - User Guide
============================================

1. QUICK START
--------------

  Windows:
    Double-click Cost-Dashboard.exe
    Or run in Command Prompt: start.bat
    Cost-Dashboard.exe stays in the Windows system tray while running.
    Double-click the tray icon to open the dashboard again.

  Windows fallback:
    If the launcher exe is not present, double-click start.bat.

  macOS / Linux:
    Open Terminal, then:
      chmod +x start.sh stop.sh   (first time only)
      ./start.sh

  The dashboard will be available at: http://localhost:3113


2. STOP THE DASHBOARD
---------------------

  Windows:
    Right-click the Cost Dashboard tray icon, then choose "退出服务"
    Double-click stop.bat
    Or press Ctrl+C in the running terminal window if started with start.bat

  macOS / Linux:
    ./stop.sh
    Or press Ctrl+C in the running terminal


3. DATA MANAGEMENT
------------------

  Database Location:
    - data/cost_dashboard.db

  First portable build:
    - The builder copies the project database from data/cost_dashboard.db
      into dist-portable/data/cost_dashboard.db when the portable database
      does not already exist.
    - Rebuilding the portable package keeps the existing portable database
      and does not overwrite imported data.

  Backup:
    - Stop the dashboard first
    - Copy data/cost_dashboard.db to a safe location

  Restore:
    - Stop the dashboard
    - Replace data/cost_dashboard.db with your backup file
    - Restart the dashboard

  Reset:
    - Stop the dashboard
    - Delete data/cost_dashboard.db
    - Restart the dashboard (database will be re-initialized)

  If only 2025-12 and 2026-01 appear after building:
    - Stop the dashboard
    - Copy your original cost_dashboard.db into data/cost_dashboard.db
    - Restart the dashboard


4. EXCEL IMPORT
---------------

  1. Open the dashboard in your browser
  2. Navigate to the Admin section (gear icon)
  3. Click "Data Import"
  4. Select an Excel file (.xlsx) with cost data
  5. Select the month for the data
  6. Click "Upload" to import

  Uploaded files are stored in: uploads/

  Import History:
    - View all past imports in the "Import History" section
    - Check import status and error messages if any


5. SYSTEM REQUIREMENTS
----------------------

  - No installation required - Node.js runtime is included
  - Windows 10/11 (64-bit)
  - macOS 12+ (Intel or Apple Silicon)
  - Linux (x64, glibc 2.28+)
  - ~200MB disk space
  - Modern web browser (Chrome, Firefox, Edge, Safari)


6. PORTABILITY NOTE
-------------------

  This is a portable application. You can:
    - Move the entire folder to any location
    - Run from a USB drive
    - Copy to another computer

  Important:
    - Keep all files and folders together
    - Do not modify files in the app/ directory
    - Your data is in data/ and uploads/ folders
    - Runtime logs are in logs/server.log when started by the exe launcher

  If you need to change the port, set the PORT
  environment variable before starting:

    Windows:
      set PORT=8080
      start.bat

    macOS / Linux:
      PORT=8080 ./start.sh
