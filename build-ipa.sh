#!/bin/bash
set -e

# SpeedSpeak iOS Build & Upload Script
# Usage: ./build-ipa.sh
# Requires: fastlane (brew install fastlane)

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
IOS_DIR="$PROJECT_DIR/ios"
APP_DIR="$IOS_DIR/App"
EXPORT_DIR="$HOME/Desktop/南木潤/SpeedSpeakExport"
ARCHIVE_PATH="$EXPORT_DIR/SpeedSpeak.xcarchive"
EXPORT_OPTIONS="$EXPORT_DIR/ExportOptions.plist"
SPM_CACHE="/tmp/spm-packages"
TEAM_ID="CQ45UMBK28"
BUNDLE_ID="jp.speedspeak.app"

echo "================================================"
echo "  SpeedSpeak iOS Build & Upload"
echo "================================================"

# Step 1: Create distribution cert + provisioning profile via fastlane
echo ""
echo "[1/4] Creating Apple Distribution certificate & profile..."
cd "$IOS_DIR"
fastlane run cert \
  development:false \
  team_id:"$TEAM_ID" \
  output_path:"$EXPORT_DIR/certs" \
  generate_apple_certs:true

echo ""
echo "[1.5/4] Fetching App Store provisioning profile..."
fastlane run sigh \
  app_identifier:"$BUNDLE_ID" \
  team_id:"$TEAM_ID" \
  output_path:"$EXPORT_DIR/profiles"

# Get the profile name
PROFILE_PATH=$(ls -t "$EXPORT_DIR/profiles/"*.mobileprovision 2>/dev/null | head -1)
if [ -z "$PROFILE_PATH" ]; then
  echo "ERROR: No provisioning profile found"
  exit 1
fi

# Install the profile
PROFILE_UUID=$(grep -aA1 UUID "$PROFILE_PATH" | grep -o '[-A-Fa-f0-9]\{36\}')
mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
cp "$PROFILE_PATH" "$HOME/Library/MobileDevice/Provisioning Profiles/${PROFILE_UUID}.mobileprovision" 2>/dev/null || true

echo "  Profile: $(basename "$PROFILE_PATH")"
echo "  UUID: $PROFILE_UUID"

# Step 2: Build archive
echo ""
echo "[2/4] Building archive..."
cd "$APP_DIR"
xcodebuild clean archive \
  -project App.xcodeproj \
  -scheme App \
  -archivePath "$ARCHIVE_PATH" \
  -configuration Release \
  -clonedSourcePackagesDirPath "$SPM_CACHE" \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  -allowProvisioningUpdates \
  | tail -5

echo "  Archive: $ARCHIVE_PATH"

# Step 3: Export IPA
echo ""
echo "[3/4] Exporting IPA..."

# Create export options
cat > "$EXPORT_OPTIONS" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>
	<string>app-store-connect</string>
	<key>teamID</key>
	<string>${TEAM_ID}</string>
	<key>signingStyle</key>
	<string>automatic</string>
	<key>uploadBitcode</key>
	<false/>
	<key>uploadSymbols</key>
	<true/>
</dict>
</plist>
EOF

# Remove old export
rm -f "$EXPORT_DIR/SpeedSpeak.ipa" "$EXPORT_DIR/DistributionSummary.plist" "$EXPORT_DIR/Packaging.log"

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -allowProvisioningUpdates \
  | tail -5

echo "  IPA: $EXPORT_DIR/SpeedSpeak.ipa"

# Step 4: Upload via fastlane
echo ""
echo "[4/4] Uploading to App Store Connect..."
cd "$IOS_DIR"
fastlane run upload_to_testflight \
  ipa:"$EXPORT_DIR/SpeedSpeak.ipa" \
  team_id:"$TEAM_ID" \
  skip_waiting_for_build_processing:true

echo ""
echo "================================================"
echo "  Done! Build uploaded to App Store Connect."
echo "  Check status at: https://appstoreconnect.apple.com"
echo "================================================"
