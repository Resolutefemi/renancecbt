$filePath = 'c:\Users\ariyo\OneDrive\Desktop\COS 101 quiz\cos101.html'
$content = Get-Content $filePath -Raw

$content = $content -replace 'answer: "0"', 'answer: "A"'
$content = $content -replace 'answer: "1"', 'answer: "B"'
$content = $content -replace 'answer: "2"', 'answer: "C"'
$content = $content -replace 'answer: "3"', 'answer: "D"'

Set-Content -Path $filePath -Value $content
Write-Host 'Replacement completed successfully'
