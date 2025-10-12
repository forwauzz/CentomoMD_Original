# Copy R&D artifacts to backend directory for deployment
Write-Host "Copying R&D artifacts to backend/rd-artifacts/..."

# Create the rd-artifacts directory
New-Item -ItemType Directory -Path "backend/rd-artifacts" -Force | Out-Null

# Copy all artifact directories
Copy-Item -Path "configs" -Destination "backend/rd-artifacts/" -Recurse -Force
Copy-Item -Path "prompts" -Destination "backend/rd-artifacts/" -Recurse -Force
Copy-Item -Path "system" -Destination "backend/rd-artifacts/" -Recurse -Force
Copy-Item -Path "training" -Destination "backend/rd-artifacts/" -Recurse -Force
Copy-Item -Path "eval" -Destination "backend/rd-artifacts/" -Recurse -Force
Copy-Item -Path "scripts" -Destination "backend/rd-artifacts/" -Recurse -Force

Write-Host "✅ R&D artifacts copied successfully!"
Write-Host "Artifacts are now in: backend/rd-artifacts/"
