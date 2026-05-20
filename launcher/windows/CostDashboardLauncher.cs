using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
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
        private const string StandaloneMagic = "CDSE";
        internal const string AppDataName = "Cost Dashboard";

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

        internal static bool IsStandaloneMode()
        {
            try
            {
                using (FileStream fs = new FileStream(Application.ExecutablePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    if (fs.Length < 12) return false;
                    fs.Seek(-4, SeekOrigin.End);
                    byte[] magic = new byte[4];
                    fs.Read(magic, 0, 4);
                    return Encoding.ASCII.GetString(magic) == StandaloneMagic;
                }
            }
            catch { return false; }
        }

        internal static string GetStandaloneAppDir()
        {
            string appDataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                AppDataName);
            return Path.Combine(appDataDir, "v" + Version);
        }

        internal static string GetStandaloneDataDir()
        {
            return Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                AppDataName, "data");
        }

        internal static string GetStandaloneUploadsDir()
        {
            return Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                AppDataName, "uploads");
        }

        internal static string GetStandaloneLogsDir()
        {
            return Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                AppDataName, "logs");
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
            string rootDir;
            string appDir;
            string dataDir;
            string uploadsDir;
            string logsDir;
            string nodeExe;
            string serverBundle;
            string dbPath;

            port = Program.GetPort();
            url = "http://localhost:" + port;

            if (Program.IsStandaloneMode())
            {
                rootDir = EnsureExtractedFiles();
                appDir = Path.Combine(rootDir, "app");
                dataDir = Program.GetStandaloneDataDir();
                uploadsDir = Program.GetStandaloneUploadsDir();
                logsDir = Program.GetStandaloneLogsDir();
                nodeExe = Path.Combine(rootDir, "node", "win-x64", "node.exe");
                serverBundle = Path.Combine(appDir, "server.bundle.js");
                dbPath = Path.Combine(dataDir, "cost_dashboard.db");
            }
            else
            {
                rootDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(
                    Path.DirectorySeparatorChar,
                    Path.AltDirectorySeparatorChar
                );
                appDir = Path.Combine(rootDir, "app");
                dataDir = Path.Combine(rootDir, "data");
                uploadsDir = Path.Combine(rootDir, "uploads");
                logsDir = Path.Combine(rootDir, "logs");
                nodeExe = Path.Combine(rootDir, "node", "win-x64", "node.exe");
                serverBundle = Path.Combine(appDir, "server.bundle.js");
                dbPath = Path.Combine(dataDir, "cost_dashboard.db");
            }

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
                if (Program.IsStandaloneMode())
                {
                    ShowError("Application files are incomplete. Please re-download Cost Dashboard.");
                }
                else
                {
                    ShowError("Node.js runtime was not found:\n" + nodeExe + "\n\nPlease rebuild the portable package.");
                }
                ExitCode = 3;
                ShouldRun = false;
                return;
            }

            if (!File.Exists(serverBundle))
            {
                if (Program.IsStandaloneMode())
                {
                    ShowError("Application files are incomplete. Please re-download Cost Dashboard.");
                }
                else
                {
                    ShowError("Application bundle was not found:\n" + serverBundle + "\n\nPlease rebuild the portable package.");
                }
                ExitCode = 4;
                ShouldRun = false;
                return;
            }

            Directory.CreateDirectory(dataDir);
            Directory.CreateDirectory(uploadsDir);
            Directory.CreateDirectory(logsDir);

            if (Program.IsStandaloneMode())
            {
                CopySeedDataIfNeeded(rootDir, dataDir);
            }

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

        private static string EnsureExtractedFiles()
        {
            string versionDir = Program.GetStandaloneAppDir();
            string markerFile = Path.Combine(versionDir, ".extracted");

            if (File.Exists(markerFile)
                && File.Exists(Path.Combine(versionDir, "node", "win-x64", "node.exe"))
                && File.Exists(Path.Combine(versionDir, "app", "server.bundle.js")))
            {
                CleanupOldVersions(versionDir);
                return versionDir;
            }

            Form extractForm = CreateExtractForm();
            extractForm.Show();
            Application.DoEvents();

            try
            {
                if (Directory.Exists(versionDir))
                {
                    Directory.Delete(versionDir, true);
                }
                Directory.CreateDirectory(versionDir);

                long zipSize;
                string tempZip = Path.Combine(Path.GetTempPath(), "CostDashboard_" + Program.Version + ".zip");

                try
                {
                    using (FileStream srcFs = new FileStream(Application.ExecutablePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                    {
                        byte[] footer = new byte[12];
                        srcFs.Seek(-12, SeekOrigin.End);
                        srcFs.Read(footer, 0, 12);
                        zipSize = BitConverter.ToInt64(footer, 0);

                        srcFs.Seek(-(12 + zipSize), SeekOrigin.End);

                        using (FileStream dstFs = new FileStream(tempZip, FileMode.Create, FileAccess.Write))
                        {
                            byte[] buffer = new byte[81920];
                            long remaining = zipSize;
                            while (remaining > 0)
                            {
                                int toRead = (int)Math.Min(buffer.Length, remaining);
                                int read = srcFs.Read(buffer, 0, toRead);
                                if (read == 0) break;
                                dstFs.Write(buffer, 0, read);
                                remaining -= read;
                            }
                        }
                    }

                    ExtractZipToDirectory(tempZip, versionDir);
                    File.WriteAllText(markerFile, DateTime.UtcNow.ToString("O"));
                }
                finally
                {
                    try { if (File.Exists(tempZip)) File.Delete(tempZip); } catch { }
                }

                CleanupOldVersions(versionDir);
            }
            catch (Exception ex)
            {
                extractForm.Close();
                ShowError("Failed to extract application files:\n" + ex.Message + "\n\nPlease try running as administrator or re-download the application.");
                return versionDir;
            }
            finally
            {
                extractForm.Close();
            }

            return versionDir;
        }

        private static Form CreateExtractForm()
        {
            Form form = new Form();
            form.Text = "Cost Dashboard " + Program.Version;
            form.FormBorderStyle = FormBorderStyle.FixedDialog;
            form.StartPosition = FormStartPosition.CenterScreen;
            form.ClientSize = new Size(380, 90);
            form.MaximizeBox = false;
            form.MinimizeBox = false;
            form.ControlBox = false;

            Label label = new Label();
            label.Text = "首次运行，正在解压文件，请稍候...";
            label.Location = new Point(12, 15);
            label.Size = new Size(356, 20);
            form.Controls.Add(label);

            ProgressBar progress = new ProgressBar();
            progress.Location = new Point(12, 45);
            progress.Size = new Size(356, 23);
            progress.Style = ProgressBarStyle.Marquee;
            form.Controls.Add(progress);

            return form;
        }

        private static void ExtractZipToDirectory(string zipPath, string destPath)
        {
            try
            {
                Assembly compressionFs = Assembly.LoadWithPartialName("System.IO.Compression.FileSystem");
                if (compressionFs != null)
                {
                    Type zipFileType = compressionFs.GetType("System.IO.Compression.ZipFile");
                    if (zipFileType != null)
                    {
                        MethodInfo method = zipFileType.GetMethod("ExtractToDirectory",
                            new[] { typeof(string), typeof(string) });
                        if (method != null)
                        {
                            method.Invoke(null, new object[] { zipPath, destPath });
                            return;
                        }
                    }
                }
            }
            catch { }

            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = "powershell.exe";
            psi.Arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command \"Expand-Archive -LiteralPath '"
                + zipPath.Replace("'", "''") + "' -DestinationPath '"
                + destPath.Replace("'", "''") + "' -Force\"";
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            using (Process p = Process.Start(psi))
            {
                p.WaitForExit();
                if (p.ExitCode != 0)
                {
                    throw new Exception("Extraction failed with exit code " + p.ExitCode);
                }
            }
        }

        private static void CopySeedDataIfNeeded(string versionDir, string dataDir)
        {
            string seedDb = Path.Combine(versionDir, "data", "cost_dashboard.db");
            string targetDb = Path.Combine(dataDir, "cost_dashboard.db");
            if (File.Exists(seedDb) && !File.Exists(targetDb))
            {
                File.Copy(seedDb, targetDb);
            }
        }

        private static void CleanupOldVersions(string currentVersionDir)
        {
            try
            {
                string appDataDir = Path.GetDirectoryName(currentVersionDir);
                foreach (string dir in Directory.GetDirectories(appDataDir, "v*"))
                {
                    if (!dir.Equals(currentVersionDir, StringComparison.OrdinalIgnoreCase))
                    {
                        try { Directory.Delete(dir, true); }
                        catch { }
                    }
                }
            }
            catch { }
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
            menu.Items.Add("-");
            ToolStripMenuItem moreMenu = new ToolStripMenuItem("更多");
            moreMenu.DropDownItems.Add("卸载", null, delegate { Uninstall(); });
            menu.Items.Add(moreMenu);
            menu.Items.Add("-");
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

        private void Uninstall()
        {
            DialogResult result = MessageBox.Show(
                "确定要完全卸载 Cost Dashboard 吗？\n\n"
                + "将删除以下内容：\n"
                + "• 应用程序文件\n"
                + "• 数据库及所有数据\n"
                + "• 上传文件\n"
                + "• 日志文件\n\n"
                + "此操作不可恢复！",
                AppTitle, MessageBoxButtons.YesNo, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2);

            if (result != DialogResult.Yes) return;

            StopServer();
            trayIcon.Visible = false;

            string appDataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                AppDataName);

            if (Program.IsStandaloneMode())
            {
                string exePath = Application.ExecutablePath;
                string deleteCmd = "cmd.exe";
                string deleteArgs = "/c ping localhost -n 3 > nul & rmdir /s /q \""
                    + appDataDir + "\" & del /f /q \"" + exePath + "\"";

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = deleteCmd;
                psi.Arguments = deleteArgs;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                try { Process.Start(psi); } catch { }
            }
            else
            {
                try
                {
                    if (Directory.Exists(appDataDir))
                    {
                        Directory.Delete(appDataDir, true);
                    }
                }
                catch { }
            }

            ExitCode = 0;
            ExitThread();
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
