$content = Get-Content 'index.html' -Raw
$pattern = '(\s+)<script type="module" src="/main\.js"></script>'
$replacement = '$1<script src="/translations.js"></script>' + "`r`n" + '$1<script src="/apply-i18n.js"></script>' + "`r`n" + '$1<script type="module" src="/main.js"></script>'
$newContent = $content -replace $pattern, $replacement
$newContent | Set-Content 'index.html' -NoNewline
Write-Host "Scripts adicionados com sucesso!"
