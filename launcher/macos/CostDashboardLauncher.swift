import AppKit
import Foundation
import UserNotifications

private let defaultPort = 3113
private let appTitle = "Cost Dashboard __VERSION__"
private let bundleIdentifier = "com.yunshu.cost-dashboard.launcher"

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem!
    var serverProcess: Process?
    var port: Int
    var url: String
    var rootDir: String
    var isRunning = false

    override init() {
        port = Int(ProcessInfo.processInfo.environment["PORT"] ?? "") ?? defaultPort
        url = "http://localhost:\(port)"

        let executablePath = Bundle.main.executablePath ?? ""
        let exeURL = URL(fileURLWithPath: executablePath)
        rootDir = exeURL.deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().path

        super.init()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        if !acquireSingleInstanceLock() {
            openBrowser(url)
            NSApp.terminate(nil)
            return
        }

        let icon = createStatusBarIcon()
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        statusItem.button?.image = icon
        statusItem.button?.image?.size = NSSize(width: 18, height: 18)

        let menu = NSMenu()
        menu.addItem(withTitle: "打开看板", action: #selector(openDashboard(_:)), keyEquivalent: "o")
        menu.addItem(NSMenuItem.separator())
        menu.addItem(withTitle: "退出服务", action: #selector(quitApp(_:)), keyEquivalent: "q")
        statusItem.menu = menu

        if isDashboardHealthy(url) {
            showNotification("Cost Dashboard 已在运行")
            openBrowser(url)
            isRunning = true
            return
        }

        if isPortInUse(port) {
            showError("端口 \(port) 已被占用，但健康检查未响应。\n\n请关闭占用端口的程序或运行 stop.sh，然后重试。")
            NSApp.terminate(nil)
            return
        }

        let nodeBin = findNodeBinary()
        guard let nodeBin = nodeBin else {
            showError("未找到 Node.js 运行时。\n\n请重新构建便携版包。")
            NSApp.terminate(nil)
            return
        }

        let serverBundle = rootDir + "/app/server.bundle.js"
        if !FileManager.default.fileExists(atPath: serverBundle) {
            showError("未找到应用文件:\n\(serverBundle)\n\n请重新构建便携版包。")
            NSApp.terminate(nil)
            return
        }

        let dataDir = rootDir + "/data"
        let uploadsDir = rootDir + "/uploads"
        let logsDir = rootDir + "/logs"

        for dir in [dataDir, uploadsDir, logsDir] {
            try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        }

        startServer(nodeBin: nodeBin, serverBundle: serverBundle, dataDir: dataDir, uploadsDir: uploadsDir, logsDir: logsDir)

        if waitForDashboard(url, timeoutMs: 30000) {
            openBrowser(url)
            showNotification("Cost Dashboard 已在菜单栏运行")
            isRunning = true
        } else {
            showError("服务进程已启动，但未在 30 秒内就绪。\n\n请使用 start.sh 查看详细控制台输出。")
            stopServer()
            NSApp.terminate(nil)
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        stopServer()
        releaseSingleInstanceLock()
    }

    @objc func openDashboard(_ sender: Any?) {
        openBrowser(url)
    }

    @objc func quitApp(_ sender: Any?) {
        NSApp.terminate(nil)
    }

    private func findNodeBinary() -> String? {
        let arch = ProcessInfo.processInfo.machineHardwareName
        let nodeDir: String
        if arch == "arm64" {
            nodeDir = rootDir + "/node/macos-arm64/bin/node"
        } else {
            nodeDir = rootDir + "/node/macos-x64/bin/node"
        }
        if FileManager.default.fileExists(atPath: nodeDir) {
            return nodeDir
        }
        let fallback = rootDir + "/node/macos-x64/bin/node"
        if FileManager.default.fileExists(atPath: fallback) {
            return fallback
        }
        return nil
    }

    private func startServer(nodeBin: String, serverBundle: String, dataDir: String, uploadsDir: String, logsDir: String) {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: nodeBin)
        process.arguments = [serverBundle]
        process.currentDirectoryURL = URL(fileURLWithPath: rootDir + "/app")

        var env = ProcessInfo.processInfo.environment
        env["DB_MODE"] = "sqljs"
        env["DB_PATH"] = dataDir + "/cost_dashboard.db"
        env["UPLOADS_DIR"] = uploadsDir
        env["NODE_ENV"] = "production"
        env["PORT"] = String(port)
        process.environment = env

        let logPath = logsDir + "/server.log"
        if let logFile = FileHandle(forWritingAtPath: logPath) {
            process.standardOutput = logFile
            process.standardError = logFile
        }

        do {
            try process.run()
            serverProcess = process
        } catch {
            showError("启动服务失败:\n\(error.localizedDescription)")
        }
    }

    private func stopServer() {
        if let process = serverProcess, process.isRunning {
            process.terminate()
            serverProcess = nil
        }

        killProcessesOnPort(port)
    }

    private func killProcessesOnPort(_ port: Int) {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/lsof")
        task.arguments = ["-ti", ":\(port)"]

        let pipe = Pipe()
        task.standardOutput = pipe

        do {
            try task.run()
            task.waitUntilExit()
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

            for pidStr in output.components(separatedBy: "\n") {
                if let pid = Int32(pidStr.trimmingCharacters(in: .whitespaces)) {
                    kill(pid, SIGTERM)
                }
            }
        } catch {}
    }

    private func waitForDashboard(_ baseUrl: String, timeoutMs: Int) -> Bool {
        let startTime = Date()
        let timeout = TimeInterval(timeoutMs) / 1000.0

        while Date().timeIntervalSince(startTime) < timeout {
            if isDashboardHealthy(baseUrl) {
                return true
            }
            Thread.sleep(forTimeInterval: 0.5)
        }
        return false
    }

    private func isDashboardHealthy(_ baseUrl: String) -> Bool {
        guard let url = URL(string: baseUrl + "/api/health") else { return false }

        var request = URLRequest(url: url)
        request.timeoutInterval = 1.0
        request.httpMethod = "GET"

        let semaphore = DispatchSemaphore(value: 0)
        var isHealthy = false

        let task = URLSession.shared.dataTask(with: request) { data, response, _ in
            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200,
               let data = data,
               let body = String(data: data, encoding: .utf8),
               body.contains("\"success\":true") {
                isHealthy = true
            }
            semaphore.signal()
        }
        task.resume()
        semaphore.wait()
        return isHealthy
    }

    private func isPortInUse(_ port: Int) -> Bool {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/lsof")
        task.arguments = ["-ti", ":\(port)"]

        let pipe = Pipe()
        task.standardOutput = pipe

        do {
            try task.run()
            task.waitUntilExit()
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            return !output.isEmpty
        } catch {
            return false
        }
    }

    private func openBrowser(_ url: String) {
        guard let url = URL(string: url) else { return }
        NSWorkspace.shared.open(url)
    }

    private func showNotification(_ message: String) {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert]) { _, _ in }
        let content = UNMutableNotificationContent()
        content.title = appTitle
        content.body = message
        content.sound = nil
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        center.add(request)
    }

    private func showError(_ message: String) {
        let alert = NSAlert()
        alert.messageText = appTitle
        alert.informativeText = message
        alert.alertStyle = .critical
        alert.addButton(withTitle: "确定")
        alert.runModal()
    }

    private func createStatusBarIcon() -> NSImage {
        let size = NSSize(width: 36, height: 36)
        let image = NSImage(size: size)

        image.lockFocus()

        guard let context = NSGraphicsContext.current?.cgContext else {
            image.unlockFocus()
            return NSImage(named: NSImage.statusAvailableName)!
        }

        let rect = CGRect(x: 2, y: 2, width: 32, height: 32)
        let radius: CGFloat = 8

        let path = CGMutablePath()
        path.move(to: CGPoint(x: rect.minX + radius, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - radius, y: rect.minY))
        path.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.minY), tangent2End: CGPoint(x: rect.maxX, y: rect.minY + radius), radius: radius)
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - radius))
        path.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.maxY), tangent2End: CGPoint(x: rect.maxX - radius, y: rect.maxY), radius: radius)
        path.addLine(to: CGPoint(x: rect.minX + radius, y: rect.maxY))
        path.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.maxY), tangent2End: CGPoint(x: rect.minX, y: rect.maxY - radius), radius: radius)
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + radius))
        path.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.minY), tangent2End: CGPoint(x: rect.minX + radius, y: rect.minY), radius: radius)
        path.closeSubpath()

        let colors = [
            CGColor(red: 37/255, green: 99/255, blue: 235/255, alpha: 1.0),
            CGColor(red: 96/255, green: 165/255, blue: 250/255, alpha: 1.0)
        ]
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        if let gradient = CGGradient(colorsSpace: colorSpace, colors: colors as CFArray, locations: [0, 1]) {
            context.addPath(path)
            context.clip()
            context.drawLinearGradient(gradient,
                                       start: CGPoint(x: rect.minX, y: rect.minY),
                                       end: CGPoint(x: rect.maxX, y: rect.maxY),
                                       options: [])
        }

        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .center

        let attrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: 20, weight: .bold),
            .foregroundColor: NSColor.white,
            .paragraphStyle: paragraphStyle
        ]

        let text = "云" as NSString
        let textSize = text.size(withAttributes: attrs)
        let textRect = CGRect(
            x: (rect.width - textSize.width) / 2 + rect.minX,
            y: (rect.height - textSize.height) / 2 + rect.minY,
            width: textSize.width,
            height: textSize.height
        )
        text.draw(in: textRect, withAttributes: attrs)

        image.unlockFocus()
        image.isTemplate = false

        return image
    }

    private func acquireSingleInstanceLock() -> Bool {
        let lockPath = NSTemporaryDirectory() + "cost-dashboard-launcher.lock"
        let fd = open(lockPath, O_RDWR | O_CREAT, 0o644)
        if fd < 0 { return true }

        let result = flock(fd, LOCK_EX | LOCK_NB)
        if result != 0 {
            close(fd)
            return false
        }
        return true
    }

    private func releaseSingleInstanceLock() {
        let lockPath = NSTemporaryDirectory() + "cost-dashboard-launcher.lock"
        let fd = open(lockPath, O_RDWR, 0o644)
        if fd >= 0 {
            flock(fd, LOCK_UN)
            close(fd)
        }
    }
}

extension ProcessInfo {
    var machineHardwareName: String {
        var sysinfo = utsname()
        uname(&sysinfo)
        return withUnsafePointer(to: &sysinfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                String(cString: $0)
            }
        }
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
