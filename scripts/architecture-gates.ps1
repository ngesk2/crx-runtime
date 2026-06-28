param([switch]$Quiet)

$global:exitCode = 0
$script:failures = @()

function Check-Gate {
    param($Name, $Pattern, $Path, $Allowed, [switch]$ExcludeNodeModules)
    $files = Get-ChildItem $Path -Recurse -File | Where-Object {
        $_.Extension -match '\.(py|ts|js)$' -and
        (-not $ExcludeNodeModules -or $_.FullName -notmatch 'node_modules')
    }
    $matches = $files | Select-String -Pattern $Pattern -SimpleMatch:$false
    $violations = @()
    if ($Allowed) {
        $violations = $matches | Where-Object { $_.Path -notmatch $Allowed }
    } else {
        $violations = $matches
    }
    if ($violations.Count -gt 0) {
        Write-Host "❌ $Name : $($violations.Count)" -ForegroundColor Red
        if (-not $Quiet) {
            $violations | ForEach-Object { Write-Host "    $($_.Path):$($_.LineNumber)" -ForegroundColor DarkRed }
        }
        $global:exitCode = 1
        $script:failures += $Name
    } else {
        Write-Host "✅ $Name" -ForegroundColor Green
    }
}

Write-Host "=== Architecture Gates ===" -ForegroundColor Cyan
Write-Host ""

# P1: CONFIGURATION SOVEREIGNTY — DONE
Check-Gate -Name "P1: os.getenv" -Pattern 'os\.getenv' -Path "runtime" -Allowed 'configuration_authority|secret_adapter' -ExcludeNodeModules
Check-Gate -Name "P1: process.env" -Pattern 'process\.env' -Path "runtime" -Allowed 'config|forensics|commit-service' -ExcludeNodeModules

# P2: REPOSITORY AUTHORITY — DONE (tools route through RepositoryAdapter)
Check-Gate -Name "P2: psycopg2.connect" -Pattern 'psycopg2\.connect' -Path "runtime" -Allowed 'adapter|event_store|worker|authority' -ExcludeNodeModules

# P3: PROJECTION AUTHORITY — workers are legitimate Qdrant clients until P6 AuthorityRouter
Check-Gate -Name "P3: QdrantClient" -Pattern 'QdrantClient|qdrant_client' -Path "runtime" -Allowed 'retrieval|adapter|tool|worker|projection' -ExcludeNodeModules

# P4: IDENTITY AUTHORITY — scattered uuid calls remain (P6 gap)
Check-Gate -Name "P4: uuid.uuid4" -Pattern 'uuid\.uuid4' -Path "runtime" -Allowed 'identity|canonical|event_store|event_chain|repository_client|worker|supervisor|cognitive|drive' -ExcludeNodeModules

# P5: CANONICAL HASH AUTHORITY — scattered hashlib calls remain (P6 gap)
Check-Gate -Name "P5: hashlib.sha256" -Pattern 'hashlib\.sha256' -Path "runtime" -Allowed 'certificate|authority|projection|integrity|event_chain|cache|adapter|cognitive|model' -ExcludeNodeModules
Check-Gate -Name "P5: crypto.createHash" -Pattern 'crypto\.createHash' -Path "runtime" -Allowed 'certificate|replay' -ExcludeNodeModules

# P9: SUBPROCESS — tools use subprocess for execution (P8 Temporal gap)
Check-Gate -Name "P9: subprocess" -Pattern 'subprocess\.run|subprocess\.Popen|os\.system' -Path "runtime" -ExcludeNodeModules

Write-Host ""
if ($global:exitCode -eq 0) {
    Write-Host "=== ALL PASS ===" -ForegroundColor Green
} else {
    Write-Host "=== FAILED: $($script:failures.Count) ===" -ForegroundColor Yellow
    Write-Host "Remaining: $($script:failures -join ', ')" -ForegroundColor DarkYellow
    Write-Host "See documentation above for known P6-P8 gaps." -ForegroundColor DarkYellow
}
exit $global:exitCode
