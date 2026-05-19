# Windows launcher

This folder contains the small Windows launcher used by the portable package.

Build a Windows-only portable package on Windows:

```powershell
npm install
npm run build:portable:win
```

Run `npm install` once before the first build. Otherwise the frontend build tool
Vite will not be available.

The output is:

```text
dist-portable\Cost-Dashboard.exe
```

The build script automatically generates a project-logo icon and embeds it into
`Cost-Dashboard.exe`. The system tray icon uses the same embedded icon.

The launcher starts the bundled Node.js server in the background, waits for
`/api/health`, then opens the dashboard in the default browser. It stays in the
Windows system tray while the service is running. Double-click the tray icon to
open the dashboard again, or right-click it and choose `退出服务` to stop the
server and quit.

Data remains in `dist-portable\data`, uploads remain in `dist-portable\uploads`,
and the existing `start.bat` / `stop.bat` scripts stay available as fallback
tools.
