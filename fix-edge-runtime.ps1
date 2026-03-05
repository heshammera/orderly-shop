
$filesToModify = New-Object System.Collections.Generic.List[string]

$fixedList = @(
    "src/app/api/admin/copyright-requests/route.ts",
    "src/app/api/admin/impersonate/route.ts",
    "src/app/api/admin/login/route.ts",
    "src/app/api/admin/logout/route.ts",
    "src/app/api/admin/me/route.ts",
    "src/app/api/admin/plans/route.ts",
    "src/app/api/admin/store-commission/route.ts",
    "src/app/api/admin/users/delete/route.ts",
    "src/app/api/checkout/place-order/route.ts",
    "src/app/api/checkout/quick-order/route.ts",
    "src/app/api/dashboard/products/duplicate/route.ts",
    "src/app/api/integrations/google-sheets/test/route.ts",
    "src/app/auth/callback/route.ts",
    "src/app/admin/(dashboard)/stores/[storeId]/page.tsx",
    "src/app/store-suspended/page.tsx",
    "src/app/api/revalidate/route.ts",
    "src/app/api/ai/route.ts",
    "src/app/api/integrations/google-sheets/sync/route.ts"
)

foreach ($f in $fixedList) { $filesToModify.Add((Resolve-Path $f -ErrorAction Silently).Path) }

# Recursive search for all page.tsx in dashboard and store slugs
Get-ChildItem -Path "src/app/dashboard" -Recurse -Filter "page.tsx" | ForEach-Object { $filesToModify.Add($_.FullName) }
Get-ChildItem -Path "src/app/s" -Recurse -Filter "page.tsx" | ForEach-Object { $filesToModify.Add($_.FullName) }

$runtimeLine = "export const runtime = 'edge';"

foreach ($filePath in $filesToModify | Select-Object -Unique) {
    if ($filePath -and (Test-Path $filePath)) {
        $content = Get-Content $filePath -Raw
        if ($content -notmatch "export const runtime = 'edge';") {
            Write-Host "Updating: $filePath"
            
            if ($content -match "^'use client'") {
                $newContent = $content -replace "^'use client'(\s|;)*", ("'use client';`n`n" + $runtimeLine + "`n")
            } elseif ($content -match '^"use client"') {
                $newContent = $content -replace '^"use client"(\s|;)*', ('"use client";`n`n' + $runtimeLine + "`n")
            } else {
                $newContent = $runtimeLine + "`n`n" + $content
            }
            [System.IO.File]::WriteAllText($filePath, $newContent)
        }
    }
}
Write-Host "Done."
