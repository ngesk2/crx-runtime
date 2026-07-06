# Windows Service Installation Script
#
# Phase 3.19 — Windows Service
#
# Supports:
# - NSSM (Non-Sucking Service Manager)
# - WinSW (Windows Service Wrapper)
#
# Features:
# - Automatic restart
# - Log rotation
# - Recovery policies

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName,
    
    [Parameter(Mandatory=$true)]
    [string]$ExecutablePath,
    
    [Parameter(Mandatory=$false)]
    [string]$DisplayName = $ServiceName,
    
    [Parameter(Mandatory=$false)]
    [string]$Description = "Second Brain Inference Service",
    
    [Parameter(Mandatory=$false)]
    [string]$WorkingDirectory = (Split-Path -Parent $ExecutablePath),
    
    [Parameter(Mandatory=$false)]
    [string]$LogDirectory = "C:\logs\$ServiceName",
    
    [Parameter(Mandatory=$false)]
    [string]$Wrapper = "nssm", # Options: nssm, winsw
    
    [Parameter(Mandatory=$false)]
    [string]$NodePath = "node",
    
    [Parameter(Mandatory=$false)]
    [hashtable]$EnvironmentVariables = @{}
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

# Create log directory
if (-not (Test-Path $LogDirectory)) {
    New-Item -ItemType Directory -Path $LogDirectory -Force
    Write-Host "Created log directory: $LogDirectory"
}

function Install-NSSM {
    Write-Host "Installing service using NSSM..."
    
    # Check if NSSM is available
    $nssmPath = Get-Command nssm -ErrorAction SilentlyContinue
    
    if (-not $nssmPath) {
        Write-Error "NSSM not found. Please install NSSM from https://nssm.cc/download"
        exit 1
    }
    
    # Install service
    & nssm install $ServiceName $NodePath $ExecutablePath
    
    # Configure service
    & nssm set $ServiceName DisplayName $DisplayName
    & nssm set $ServiceName Description $Description
    & nssm set $ServiceName AppDirectory $WorkingDirectory
    & nssm set $ServiceName AppStdout "$LogDirectory\stdout.log"
    & nssm set $ServiceName AppStderr "$LogDirectory\stderr.log"
    & nssm set $ServiceName AppRotateFiles 1
    & nssm set $ServiceName AppRotateBytes 10485760  # 10MB
    & nssm set $ServiceName AppEnvironmentExtra "NODE_ENV=production"
    
    # Set environment variables
    foreach ($var in $EnvironmentVariables.GetEnumerator()) {
        & nssm set $ServiceName AppEnvironmentExtra "$($var.Key)=$($var.Value)"
    }
    
    # Configure recovery
    & nssm set $ServiceName AppRestartDelay 60000  # 1 minute
    & nssm set $ServiceName AppThrottle 1500  # 1500ms
    & nssm set $ServiceName AppExit Default Restart
    & nssm set $ServiceName AppRestart 1000  # Restart after 1 second
    
    # Configure service startup
    & nssm set $ServiceName Start SERVICE_AUTO_START
    
    Write-Host "Service $ServiceName installed successfully using NSSM"
}

function Install-WinSW {
    Write-Host "Installing service using WinSW..."
    
    # Check if WinSW is available
    $winswPath = "$WorkingDirectory\winsw.exe"
    
    if (-not (Test-Path $winswPath)) {
        Write-Error "WinSW not found at $winswPath. Please download WinSW from https://github.com/winsw/winsw/releases"
        exit 1
    }
    
    # Create WinSW configuration
    $configPath = "$WorkingDirectory\$ServiceName.xml"
    
    $config = @"
<service>
    <id>$ServiceName</id>
    <name>$DisplayName</name>
    <description>$Description</description>
    <executable>$NodePath</executable>
    <arguments>$ExecutablePath</arguments>
    <workingdirectory>$WorkingDirectory</workingdirectory>
    <log mode="roll-by-size">
        <sizeThreshold>10240</sizeThreshold>
        <keepFiles>8</keepFiles>
    </log>
    <onfailure action="restart" delay="10 sec"/>
    <onfailure action="restart" delay="20 sec"/>
    <onfailure action="restart" delay="30 sec"/>
    <resetfailure>1 hour</resetfailure>
    <startmode>Automatic</startmode>
    <stopparentprocessfirst>true</stopparentprocessfirst>
"@

    # Add environment variables
    if ($EnvironmentVariables.Count -gt 0) {
        $config += "`n    <env>"
        foreach ($var in $EnvironmentVariables.GetEnumerator()) {
            $config += "`n        <env name=`"$($var.Key)`" value=`"$($var.Value)`"/>"
        }
        $config += "`n    </env>"
    }

    $config += "`n</service>"
    
    $config | Out-File -FilePath $configPath -Encoding UTF8
    
    # Install service
    & $winswPath install
    
    Write-Host "Service $ServiceName installed successfully using WinSW"
}

# Main installation logic
switch ($Wrapper.ToLower()) {
    "nssm" {
        Install-NSSM
    }
    "winsw" {
        Install-WinSW
    }
    default {
        Write-Error "Unknown wrapper: $Wrapper. Use 'nssm' or 'winsw'"
        exit 1
    }
}

# Start service
Write-Host "Starting service $ServiceName..."
Start-Service -Name $ServiceName

Write-Host "Service $ServiceName installed and started successfully"
Write-Host "Logs are available at: $LogDirectory"
