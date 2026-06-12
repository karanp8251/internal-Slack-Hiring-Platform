# start_platform.ps1
# Setup process-level environment paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$runtimes = Join-Path $scriptDir "runtimes"

$env:JAVA_HOME = Join-Path $runtimes "java"
$env:PATH = "$(Join-Path $runtimes 'java\bin');$(Join-Path $runtimes 'maven\bin');$runtimes\node;$env:PATH"

# Load .env file if present
$envFile = Join-Path $scriptDir ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
        $name, $value = $_ -split '=', 2
        [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim())
    }
}

Write-Host "=== Talent Platform Development Environment ===" -ForegroundColor Green
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Cyan
Write-Host "PATH updated to include local runtimes." -ForegroundColor Cyan
Write-Host ""

Write-Host "Verifying toolchains:" -ForegroundColor Yellow
Write-Host "1. Java:" -ForegroundColor White
java -version
Write-Host ""
Write-Host "2. Maven:" -ForegroundColor White
mvn -version
Write-Host ""
Write-Host "3. Node.js:" -ForegroundColor White
node -v
Write-Host ""
Write-Host "4. npm:" -ForegroundColor White
npm -v
Write-Host "=============================================" -ForegroundColor Green

function Start-ServiceProcess {
    param (
        [string]$Name,
        [string]$Path,
        [string]$Executable,
        [string]$Arguments
    )
    Write-Host "Starting $Name in the background (hidden)..." -ForegroundColor Green
    # Start process with inherited environment variables, completely hidden
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c $Executable $Arguments" -WorkingDirectory $Path -WindowStyle Hidden
}

if ($args.Length -gt 0 -and $args[0] -eq "run") {
    # 1. Start Consolidated Monolith Backend (port 8080)
    Start-ServiceProcess "Monolith Backend" (Join-Path $scriptDir "backend") "mvn.cmd" "spring-boot:run"
    
    Write-Host "Waiting 8 seconds for backend service to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8

    # 2. Start React Frontend (port 5173)
    Start-ServiceProcess "React Frontend" (Join-Path $scriptDir "frontend") "npm.cmd" "run dev"

    Write-Host "=== Platform launched in the background successfully! ===" -ForegroundColor Green
    Write-Host "Access Portal: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "To stop the services, run: .\start_platform.ps1 stop" -ForegroundColor Yellow
}
elseif ($args.Length -gt 0 -and $args[0] -eq "stop") {
    Write-Host "=== Stopping Talent Platform Services ===" -ForegroundColor Yellow
    
    $ports = @(8080, 5173)
    foreach ($port in $ports) {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            if ($conn.OwningProcess) {
                $procId = $conn.OwningProcess
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Host "Stopped process $procId listening on port $port" -ForegroundColor Green
            }
        }
    }
    # Also stop any H2 TCP database servers on port 9092
    $h2connections = Get-NetTCPConnection -LocalPort 9092 -ErrorAction SilentlyContinue
    foreach ($conn in $h2connections) {
        if ($conn.OwningProcess) {
            $procId = $conn.OwningProcess
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped H2 database process $procId on port 9092" -ForegroundColor Green
        }
    }
    Write-Host "=== All services stopped successfully ===" -ForegroundColor Green
}
else {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\start_platform.ps1 run   - Starts backend and frontend in the background (hidden)" -ForegroundColor White
    Write-Host "  .\start_platform.ps1 stop  - Stops all running backend and frontend services" -ForegroundColor White
}
