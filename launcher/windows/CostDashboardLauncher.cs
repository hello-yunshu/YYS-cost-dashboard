using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace CostDashboardLauncher
{
    internal static class Program
    {
        private const int DefaultPort = 3113;
        private const string MutexName = "CostDashboardLauncher.Portable";
        internal static readonly string Version = "__VERSION__";

        [STAThread]
        private static int Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            bool createdNew;
            using (Mutex mutex = new Mutex(true, MutexName, out createdNew))
            {
                if (!createdNew)
                {
                    LauncherContext.OpenBrowser("http://localhost:" + GetPort());
                    return 0;
                }

                LauncherContext context = new LauncherContext();
                if (context.ShouldRun)
                {
                    Application.Run(context);
                }
                else
                {
                    context.Dispose();
                }
                return context.ExitCode;
            }
        }

        internal static int GetPort()
        {
            string raw = Environment.GetEnvironmentVariable("PORT");
            int port;
            if (!string.IsNullOrWhiteSpace(raw) && int.TryParse(raw, out port) && port > 0 && port < 65536)
            {
                return port;
            }
            return DefaultPort;
        }
    }

    internal sealed class LauncherContext : ApplicationContext
    {
        private const string AppTitle = "Cost Dashboard __VERSION__";

        private readonly NotifyIcon trayIcon;
        private Process serverProcess;
        private string url;
        private int port;
        public int ExitCode { get; private set; }
        public bool ShouldRun { get; private set; }

        public LauncherContext()
        {
            ShouldRun = true;
            trayIcon = CreateTrayIcon();
            Start();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
                if (serverProcess != null)
                {
                    serverProcess.Dispose();
                }
            }
            base.Dispose(disposing);
        }

        private void Start()
        {
            string rootDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(
                Path.DirectorySeparatorChar,
                Path.AltDirectorySeparatorChar
            );
            string appDir = Path.Combine(rootDir, "app");
            string dataDir = Path.Combine(rootDir, "data");
            string uploadsDir = Path.Combine(rootDir, "uploads");
            string logsDir = Path.Combine(rootDir, "logs");
            string nodeExe = Path.Combine(rootDir, "node", "win-x64", "node.exe");
            string serverBundle = Path.Combine(appDir, "server.bundle.js");
            string dbPath = Path.Combine(dataDir, "cost_dashboard.db");
            port = Program.GetPort();
            url = "http://localhost:" + port;

            if (IsDashboardHealthy(url))
            {
                trayIcon.Visible = true;
                OpenBrowser(url);
                ShowInfo("Cost Dashboard is already running.");
                return;
            }

            if (IsPortOpen("127.0.0.1", port))
            {
                ShowError("Port " + port + " is already in use, but the dashboard health check did not respond.\n\nClose the other program or run stop.bat, then try again.");
                ExitCode = 2;
                ShouldRun = false;
                return;
            }

            if (!File.Exists(nodeExe))
            {
                ShowError("Node.js runtime was not found:\n" + nodeExe + "\n\nPlease rebuild the portable package.");
                ExitCode = 3;
                ShouldRun = false;
                return;
            }

            if (!File.Exists(serverBundle))
            {
                ShowError("Application bundle was not found:\n" + serverBundle + "\n\nPlease rebuild the portable package.");
                ExitCode = 4;
                ShouldRun = false;
                return;
            }

            Directory.CreateDirectory(dataDir);
            Directory.CreateDirectory(uploadsDir);
            Directory.CreateDirectory(logsDir);

            serverProcess = StartServer(appDir, nodeExe, serverBundle, dbPath, uploadsDir, logsDir, port);
            if (serverProcess == null)
            {
                ExitCode = 5;
                ShouldRun = false;
                return;
            }

            if (WaitForDashboard(url, 30000))
            {
                trayIcon.Visible = true;
                OpenBrowser(url);
                ShowInfo("Cost Dashboard is running in the system tray.");
                return;
            }

            ShowError("The dashboard process started, but it did not become ready within 30 seconds.\n\nTry start.bat for detailed console output.");
            StopServer();
            ExitCode = 6;
            ShouldRun = false;
        }

        private static Process StartServer(string appDir, string nodeExe, string serverBundle, string dbPath, string uploadsDir, string logsDir, int port)
        {
            string logFile = Path.Combine(logsDir, "server.log");
            string runnerFile = Path.Combine(logsDir, "run-server.cmd");
            string runner = string.Join("\r\n", new[]
            {
                "@echo off",
                "chcp 65001 >nul 2>&1",
                "cd /d \"" + appDir + "\"",
                "\"" + nodeExe + "\" \"" + serverBundle + "\" >> \"" + logFile + "\" 2>&1",
                ""
            });

            ProcessStartInfo info = new ProcessStartInfo();
            info.FileName = Environment.GetEnvironmentVariable("ComSpec") ?? "cmd.exe";
            info.Arguments = "/c \"" + runnerFile + "\"";
            info.WorkingDirectory = appDir;
            info.UseShellExecute = false;
            info.CreateNoWindow = true;
            info.EnvironmentVariables["DB_MODE"] = "sqljs";
            info.EnvironmentVariables["DB_PATH"] = dbPath;
            info.EnvironmentVariables["UPLOADS_DIR"] = uploadsDir;
            info.EnvironmentVariables["NODE_ENV"] = "production";
            info.EnvironmentVariables["PORT"] = port.ToString();

            try
            {
                File.WriteAllText(runnerFile, runner, new UTF8Encoding(true));
                return Process.Start(info);
            }
            catch (Exception ex)
            {
                ShowError("Failed to start the dashboard server:\n" + ex.Message);
                return null;
            }
        }

        private NotifyIcon CreateTrayIcon()
        {
            ContextMenuStrip menu = new ContextMenuStrip();
            menu.Items.Add("打开看板", null, delegate { OpenBrowser(url ?? ("http://localhost:" + Program.GetPort())); });
            menu.Items.Add("退出服务", null, delegate { ExitService(); });

            NotifyIcon icon = new NotifyIcon();
            icon.Text = AppTitle;
            icon.Icon = LoadAppIcon();
            icon.ContextMenuStrip = menu;
            icon.DoubleClick += delegate { OpenBrowser(url ?? ("http://localhost:" + Program.GetPort())); };
            return icon;
        }

        private static Icon LoadAppIcon()
        {
            try
            {
                Icon icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                return icon ?? SystemIcons.Application;
            }
            catch
            {
                return SystemIcons.Application;
            }
        }

        private void ExitService()
        {
            StopServer();
            trayIcon.Visible = false;
            ExitCode = 0;
            ExitThread();
        }

        private void StopServer()
        {
            if (serverProcess != null && !serverProcess.HasExited)
            {
                try
                {
                    KillProcessTree(serverProcess.Id);
                    serverProcess.WaitForExit(5000);
                }
                catch
                {
                }
            }

            foreach (int pid in GetListeningPids(port))
            {
                try
                {
                    KillProcessTree(pid);
                }
                catch
                {
                }
            }
        }

        private static void KillProcessTree(int pid)
        {
            ProcessStartInfo info = new ProcessStartInfo();
            info.FileName = "taskkill";
            info.Arguments = "/T /F /PID " + pid;
            info.UseShellExecute = false;
            info.CreateNoWindow = true;
            using (Process taskkill = Process.Start(info))
            {
                taskkill.WaitForExit(3000);
            }
        }

        private static IEnumerable<int> GetListeningPids(int port)
        {
            List<int> pids = new List<int>();
            ProcessStartInfo info = new ProcessStartInfo();
            info.FileName = "netstat";
            info.Arguments = "-ano";
            info.UseShellExecute = false;
            info.CreateNoWindow = true;
            info.RedirectStandardOutput = true;

            try
            {
                using (Process process = Process.Start(info))
                {
                    string output = process.StandardOutput.ReadToEnd();
                    process.WaitForExit(3000);

                    foreach (string rawLine in output.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries))
                    {
                        string line = rawLine.Trim();
                        if (!line.StartsWith("TCP", StringComparison.OrdinalIgnoreCase)
                            || line.IndexOf("LISTENING", StringComparison.OrdinalIgnoreCase) < 0)
                        {
                            continue;
                        }

                        string[] parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length < 5 || !EndpointMatchesPort(parts[1], port))
                        {
                            continue;
                        }

                        int pid;
                        if (int.TryParse(parts[4], out pid) && !pids.Contains(pid))
                        {
                            pids.Add(pid);
                        }
                    }
                }
            }
            catch
            {
                return pids;
            }

            return pids;
        }

        private static bool EndpointMatchesPort(string endpoint, int port)
        {
            int lastColon = endpoint.LastIndexOf(':');
            if (lastColon < 0) return false;
            string portPart = endpoint.Substring(lastColon + 1);
            int epPort;
            return int.TryParse(portPart, out epPort) && epPort == port;
        }

        private static bool WaitForDashboard(string baseUrl, int timeoutMs)
        {
            Stopwatch watch = Stopwatch.StartNew();
            while (watch.ElapsedMilliseconds < timeoutMs)
            {
                if (IsDashboardHealthy(baseUrl))
                {
                    return true;
                }
                Thread.Sleep(500);
            }
            return false;
        }

        private static bool IsDashboardHealthy(string baseUrl)
        {
            try
            {
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(baseUrl + "/api/health");
                request.Timeout = 1000;
                request.ReadWriteTimeout = 1000;
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                using (Stream stream = response.GetResponseStream())
                using (StreamReader reader = new StreamReader(stream))
                {
                    string body = reader.ReadToEnd();
                    return response.StatusCode == HttpStatusCode.OK
                        && body.IndexOf("\"success\":true", StringComparison.OrdinalIgnoreCase) >= 0;
                }
            }
            catch
            {
                return false;
            }
        }

        private static bool IsPortOpen(string host, int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    IAsyncResult result = client.BeginConnect(host, port, null, null);
                    bool ok = result.AsyncWaitHandle.WaitOne(500);
                    if (!ok)
                    {
                        return false;
                    }
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        public static void OpenBrowser(string url)
        {
            try
            {
                ProcessStartInfo info = new ProcessStartInfo();
                info.FileName = url;
                info.UseShellExecute = true;
                Process.Start(info);
            }
            catch (Exception ex)
            {
                ShowError("The dashboard is running, but the browser could not be opened automatically.\n\nOpen this address manually:\n" + url + "\n\n" + ex.Message);
            }
        }

        private static void ShowError(string message)
        {
            MessageBox.Show(message, AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }

        private void ShowInfo(string message)
        {
            trayIcon.BalloonTipTitle = AppTitle;
            trayIcon.BalloonTipText = message;
            trayIcon.ShowBalloonTip(3000);
        }
    }
}
