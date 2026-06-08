# CRX Workspace Indexer
# Scans all files in the repository and generates inventory.json

param(
    [string]$RootPath = $PSScriptRoot
)

$ErrorActionPreference = "Stop"

class CRXWorkspaceIndexer {
    [string]$RootPath
    [System.Collections.Generic.List[hashtable]]$Files
    [hashtable]$DependencyGraph
    [hashtable]$WorkspaceGraph
    [hashtable]$AuthorityMap
    
    CRXWorkspaceIndexer([string]$rootPath) {
        $this.RootPath = $rootPath
        $this.Files = [System.Collections.Generic.List[hashtable]]::new()
        $this.DependencyGraph = @{}
        $this.WorkspaceGraph = @{
            nodes = [System.Collections.Generic.List[hashtable]]::new()
            edges = [System.Collections.Generic.List[hashtable]]::new()
        }
        $this.AuthorityMap = @{}
    }
    
    [void] ScanFiles() {
        Write-Host "Scanning files in $($this.RootPath)..."
        
        $excludedDirs = @('.git', 'node_modules', '__pycache__', 'venv', '.vscode', '.idea')
        
        Get-ChildItem -Path $this.RootPath -Recurse -File | ForEach-Object {
            $relativePath = $_.FullName.Substring($this.RootPath.Length + 1).Replace('\', '/')
            
            # Skip excluded directories
            $skip = $false
            foreach ($dir in $excludedDirs) {
                if ($relativePath -like "$dir/*" -or $relativePath -like "*/$dir/*") {
                    $skip = $true
                    break
                }
            }
            
            if (-not $skip -and -not $_.Name.StartsWith('.')) {
                $this.Files.Add([ordered]@{
                    path = $relativePath
                    absolute_path = $_.FullName
                    size = $_.Length
                    extension = $_.Extension.ToLower()
                    modified = $_.LastWriteTime.ToString("o")
                })
            }
        }
        
        Write-Host "Found $($this.Files.Count) files"
    }
    
    [string] ClassifyFileType([hashtable]$fileInfo) {
        $ext = $fileInfo.extension
        $path = $fileInfo.path.ToLower()
        
        # Infrastructure files
        if ($ext -in '.sh', '.bash', '.ps1' -or $fileInfo.path -in 'Makefile', 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml') {
            return 'Infrastructure'
        }
        
        # Schema files
        if ($path -like '*schema*' -or $ext -in '.json', '.yaml', '.yml') {
            if ($path -like '*schema*') {
                return 'Schema'
            }
            return 'Interface'
        }
        
        # Runtime files
        if ($ext -in '.ts', '.tsx', '.js', '.jsx', '.mjs', '.py', '.go', '.rs', '.java') {
            if ($path -like '*lib*' -or $path -like '*utils*' -or $path -like '*helper*' -or $path -like '*common*') {
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
                if ($path -like "*$keyword*") {
                    return 'Governance'
                }
            }
            return 'Documentation'
        }
        
        return 'Unknown'
    }
    
    [string] ClassifyAuthority([hashtable]$fileInfo, [string]$fileType) {
        $path = $fileInfo.path.ToLower()
        
        # Experimental files
        if ($path -like '*experimental*' -or $path -like '*sandbox*' -or $path -like '*test*' -or $path -like '*draft*') {
            return 'Experimental'
        }
        
        # Derived files
        if ($fileType -in 'Documentation', 'Governance' -and $path -like '*audit*') {
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
    
    [System.Collections.Generic.List[string]] ExtractDependencies([hashtable]$fileInfo) {
        $dependencies = [System.Collections.Generic.List[string]]::new()
        $path = $fileInfo.path
        $ext = $fileInfo.extension
        
        try {
            $content = Get-Content -Path $fileInfo.absolute_path -Raw -Encoding UTF8
            
            if ($ext -eq '.md') {
                # Extract markdown links
                $links = [regex]::Matches($content, '\[([^\]]+)\]\(([^)]+)\)')
                foreach ($match in $links) {
                    $link = $match.Groups[2].Value
                    if (-not $link.StartsWith('http')) {
                        $dependencies.Add($link)
                    }
                }
                # Extract wiki-style links
                $wikiLinks = [regex]::Matches($content, '\[\[([^\]]+)\]\]')
                foreach ($match in $wikiLinks) {
                    $dependencies.Add($match.Groups[1].Value)
                }
            }
            elseif ($ext -in '.ts', '.tsx', '.js', '.jsx', '.mjs') {
                # Extract import statements
                $imports = [regex]::Matches($content, 'import.*from\s+[''"]([^''"]+)[''"]')
                foreach ($match in $imports) {
                    $dependencies.Add($match.Groups[1].Value)
                }
                # Extract require statements
                $requires = [regex]::Matches($content, 'require\([''"]([^''"]+)[''"]\)')
                foreach ($match in $requires) {
                    $dependencies.Add($match.Groups[1].Value)
                }
            }
            elseif ($ext -eq '.py') {
                # Extract import statements
                $imports = [regex]::Matches($content, '^import\s+(\S+)', [System.Text.RegularExpressions.RegexOptions]::Multiline)
                foreach ($match in $imports) {
                    $dependencies.Add($match.Groups[1].Value)
                }
                $fromImports = [regex]::Matches($content, '^from\s+(\S+)\s+import', [System.Text.RegularExpressions.RegexOptions]::Multiline)
                foreach ($match in $fromImports) {
                    $dependencies.Add($match.Groups[1].Value)
                }
            }
        }
        catch {
            # Ignore files that can't be read
        }
        
        return $dependencies
    }
    
    [void] BuildDependencyGraph() {
        Write-Host "Building dependency graph..."
        
        foreach ($fileInfo in $this.Files) {
            $dependencies = $this.ExtractDependencies($fileInfo)
            $this.DependencyGraph[$fileInfo.path] = [System.Collections.Generic.HashSet[string]]::new([string[]]$dependencies)
        }
    }
    
    [void] BuildWorkspaceGraph() {
        Write-Host "Building workspace graph..."
        
        # Add file nodes
        foreach ($fileInfo in $this.Files) {
            $this.WorkspaceGraph.nodes.Add([ordered]@{
                id = $fileInfo.path
                type = 'file'
                file_type = $fileInfo.classified_type
                authority = $fileInfo.authority
                size = $fileInfo.size
            })
        }
        
        # Add folder nodes
        $folders = [System.Collections.Generic.HashSet[string]]::new()
        foreach ($fileInfo in $this.Files) {
            $folderPath = Split-Path -Parent $fileInfo.path
            if ($folderPath -and $folderPath -ne '.') {
                $folders.Add($folderPath.Replace('\', '/'))
            }
        }
        
        foreach ($folder in $folders) {
            $this.WorkspaceGraph.nodes.Add([ordered]@{
                id = $folder
                type = 'folder'
            })
        }
        
        # Add dependency edges
        foreach ($source in $this.DependencyGraph.Keys) {
            foreach ($target in $this.DependencyGraph[$source]) {
                $this.WorkspaceGraph.edges.Add([ordered]@{
                    source = $source
                    target = $target
                    type = 'imports'
                })
            }
        }
    }
    
    [hashtable] GenerateInventory() {
        Write-Host "Generating inventory..."
        
        $summaryByType = @{}
        $summaryByAuthority = @{}
        $summaryByExtension = @{}
        
        foreach ($fileInfo in $this.Files) {
            $fileType = $this.ClassifyFileType($fileInfo)
            $authority = $this.ClassifyAuthority($fileInfo, $fileType)
            
            $fileInfo.classified_type = $fileType
            $fileInfo.authority = $authority
            $fileInfo.dependencies = [System.Collections.Generic.List[string]]::new([string[]]$this.DependencyGraph[$fileInfo.path])
            
            if (-not $summaryByType.ContainsKey($fileType)) { $summaryByType[$fileType] = 0 }
            $summaryByType[$fileType]++
            
            if (-not $summaryByAuthority.ContainsKey($authority)) { $summaryByAuthority[$authority] = 0 }
            $summaryByAuthority[$authority]++
            
            if (-not $summaryByExtension.ContainsKey($fileInfo.extension)) { $summaryByExtension[$fileInfo.extension] = 0 }
            $summaryByExtension[$fileInfo.extension]++
        }
        
        $inventory = [ordered]@{
            metadata = [ordered]@{
                generated_at = (Get-Date).ToString("o")
                root_path = $this.RootPath
                total_files = $this.Files.Count
            }
            files = $this.Files
            summary = [ordered]@{
                by_type = $summaryByType
                by_authority = $summaryByAuthority
                by_extension = $summaryByExtension
            }
            dependency_graph = $this.DependencyGraph
            workspace_graph = @{
                nodes = $this.WorkspaceGraph.nodes
                edges = $this.WorkspaceGraph.edges
            }
            dead_files = @()
            entry_points = @()
        }
        
        return $inventory
    }
    
    [hashtable] Run() {
        $this.ScanFiles()
        $this.BuildDependencyGraph()
        $this.BuildWorkspaceGraph()
        return $this.GenerateInventory()
    }
}

# Main execution
$indexer = [CRXWorkspaceIndexer]::new($RootPath)
$inventory = $indexer.Run()

$outputPath = Join-Path $RootPath "inventory.json"
$inventory | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "Inventory written to $outputPath"
