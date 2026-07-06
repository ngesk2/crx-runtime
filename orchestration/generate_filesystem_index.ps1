$root = "c:\Users\nolan\PING"
$files = Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue
$results = @()

foreach ($file in $files) {
    $relative = $file.FullName.Substring($root.Length + 1)
    $checksum = (Get-FileHash -Path $file.FullName -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash
    $lang = "Unknown"
    
    switch ($file.Extension) {
        ".js" { $lang = "JavaScript" }
        ".ts" { $lang = "TypeScript" }
        ".py" { $lang = "Python" }
        ".json" { $lang = "JSON" }
        ".yaml" { $lang = "YAML" }
        ".yml" { $lang = "YAML" }
        ".md" { $lang = "Markdown" }
        ".sql" { $lang = "SQL" }
        ".sh" { $lang = "Shell" }
        ".ps1" { $lang = "PowerShell" }
    }
    
    $results += [PSCustomObject]@{
        AbsolutePath = $file.FullName
        RelativePath = $relative
        Extension = $file.Extension
        Size = $file.Length
        Checksum = $checksum
        Created = $file.CreationTimeUtc.ToString("o")
        Modified = $file.LastWriteTimeUtc.ToString("o")
        Language = $lang
    }
}

$results | ConvertTo-Json -Depth 10 | Out-File -FilePath "c:\Users\nolan\PING\orchestration\RepositoryKnowledgeIndex_Filesystem.json" -Encoding UTF8
