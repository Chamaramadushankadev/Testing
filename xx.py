import os
import shutil

# Set correct source and destination
source_root = "."
destination_root = "./cold_email_copy"

# Clear old copy if exists
if os.path.exists(destination_root):
    shutil.rmtree(destination_root)

# Cold email related files
include_paths = [
    # Backend
    "server/index.js",
    "server/middleware/auth.js",
    "server/models/ColdEmail.js",
    "server/models/ColdEmailSystem.js",
    "server/models/LeadCategory.js",
    "server/routes/coldEmail.js",
    "server/routes/coldEmailSystem.js",

    # Frontend
    "src/components/ColdEmail/AnalyticsTab.tsx",
    "src/components/ColdEmail/CampaignsTab.tsx",
    "src/components/ColdEmail/ColdEmailManager.tsx",
    "src/components/ColdEmail/EmailAccountsTab.tsx",
    "src/components/ColdEmail/InboxTab.tsx",
    "src/components/ColdEmail/LeadsTab.tsx",
    "src/data/coldEmailMockData.ts",
    "src/services/api.ts"
]

# Copy files to destination
copied = 0
for path in include_paths:
    src = os.path.join(source_root, path)
    dst = os.path.join(destination_root, path)
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        copied += 1
    else:
        print(f"[⚠️ MISSING] {src}")

print(f"✅ Copied {copied} files to '{destination_root}'")
