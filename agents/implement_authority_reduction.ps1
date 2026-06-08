# Implement Authority Reduction
# Move files into authoritative/derived/experimental directories

param(
    [string]$RootPath = $PSScriptRoot
)

$ErrorActionPreference = "Stop"

# Classification functions
function ClassifyFileType {
    param([string]$path, [string]$ext)
    
    $pathLower = $path.ToLower()
    
    # Infrastructure files
    if ($ext -in '.sh', '.bash', '.ps1' -or $path -in 'Makefile', 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml') {
        return 'Infrastructure'
    }
    
    # Schema files
    if ($pathLower -like '*schema*' -or $ext -in '.json', '.yaml', '.yml') {
        if ($pathLower -like '*schema*') {
            return 'Schema'
        }
        return 'Interface'
    }
    
    # Runtime files
    if ($ext -in '.ts', '.tsx', '.js', '.jsx', '.mjs', '.py', '.go', '.rs', '.java') {
        if ($pathLower -like '*lib*' -or $pathLower -like '*utils*' -or $pathLower -like '*helper*' -or $pathLower -like '*common*') {
            return 'Library'
        }
        return 'Runtime'
    }
    
    # Documentation vs Governance
    if ($ext -in '.md', '.txt', '.rst', '.adoc') {
        $governanceKeywords = @('constitution', 'governance', 'audit', 'authority', 'policy', 
                                'compliance', 'security', 'threat', 'verdict', 'reconstruction',
                                'primitive', 'mutation', 'lifecycle', 'protocol', 'decision')
        
        foreach ($keyword in $governanceKeywords) {
            if ($pathLower -like "*$keyword*") {
                return 'Governance'
            }
        }
        return 'Documentation'
    }
    
    return 'Unknown'
}

function ClassifyAuthority {
    param([string]$path, [string]$fileType)
    
    $pathLower = $path.ToLower()
    
    # Experimental files
    if ($pathLower -like '*experimental*' -or $pathLower -like '*sandbox*' -or $pathLower -like '*test*' -or $pathLower -like '*draft*') {
        return 'Experimental'
    }
    
    # Derived files
    if ($fileType -in 'Documentation', 'Governance' -and $pathLower -like '*audit*') {
        return 'Derived'
    }
    
    if ($fileType -eq 'Governance') {
        return 'Authoritative'
    }
    
    # Schema files are authoritative
    if ($fileType -eq 'Schema') {
        return 'Authoritative'
    }
    
    return 'Derived'
}

# Get all files
$files = Get-ChildItem -Path $RootPath -File | Where-Object { 
    $_.Name -notlike 'inventory.json' -and 
    $_.Name -notlike '*indexer*' -and 
    $_.Name -notlike '*authority*' -and
    -not $_.Name.StartsWith('.')
}

$moves = @{
    Authoritative = [System.Collections.Generic.List[string]]::new()
    Derived = [System.Collections.Generic.List[string]]::new()
    Experimental = [System.Collections.Generic.List[string]]::new()
}

foreach ($file in $files) {
    $relativePath = $file.Name
    $ext = $file.Extension.ToLower()
    
    $fileType = ClassifyFileType -path $relativePath -ext $ext
    $authority = ClassifyAuthority -path $relativePath -fileType $fileType
    
    $targetDir = Join-Path $RootPath $authority.ToLower()
    
    if (Test-Path $targetDir) {
        $targetPath = Join-Path $targetDir $file.Name
        Write-Host "Moving $($file.Name) -> $authority"
        Move-Item -Path $file.FullName -Destination $targetPath -Force
        $moves[$authority].Add($file.Name)
    }
}

Write-Host "`nAuthority Reduction Complete:"
Write-Host "  Authoritative: $($moves.Authoritative.Count) files"
Write-Host "  Derived: $($moves.Derived.Count) files"
Write-Host "  Experimental: $($moves.Experimental.Count) files"
