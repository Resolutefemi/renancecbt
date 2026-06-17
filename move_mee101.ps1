if (Test-Path mee101s.html) {
    $content = Get-Content -Path mee101s.html -Raw
    $content = $content -replace '(<script src="env-loader.js">|<script src="env-loader.js"></script>)', '<script src="../env-loader.js"></script>'
    $content = $content -replace '(<script src="cbt-ai-bridge.js">|<script src="cbt-ai-bridge.js"></script>)', '<script src="../cbt-ai-bridge.js"></script>'
    $content = $content -replace 'href="logo.png"', 'href="../logo.png"'
    Set-Content -Path mee101s.html -Value $content -Encoding utf8
    Move-Item -Path mee101s.html -Destination first_semester/ -Force
    Write-Host "Moved mee101s.html successfully"
}
