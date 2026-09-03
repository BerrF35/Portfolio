import subprocess
import time

cmd = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "--headless=new",
    "--enable-logging=stderr",
    "--v=1",
    "http://127.0.0.1:8088/"
]

proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
time.sleep(5)
proc.terminate()
stdout, stderr = proc.communicate()
print("STDOUT:")
print(stdout[:1000])
print("STDERR:")
for line in stderr.splitlines():
    if "CONSOLE" in line or "error" in line.lower() or "fail" in line.lower():
        print(line)
