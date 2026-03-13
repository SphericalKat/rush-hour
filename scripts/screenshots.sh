#!/usr/bin/env nix-shell
#! nix-shell -i bash -p oxipng
# shellcheck shell=bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
SCREENSHOT_DIR="${SCRIPT_DIR}"/../screenshots
FASTLANE_DIR="${SCRIPT_DIR}"/../fastlane/metadata/android/en-US/images/phoneScreenshots

# Pick a device if multiple are connected
if [[ -z "${ANDROID_SERIAL:-}" ]]; then
  DEVICES=()
  while IFS= read -r line; do
    DEVICES+=("$line")
  done < <(adb devices | awk 'NR>1 && /device$/ {print $1}')

  if [[ ${#DEVICES[@]} -eq 0 ]]; then
    echo "No devices found" >&2
    exit 1
  elif [[ ${#DEVICES[@]} -eq 1 ]]; then
    export ANDROID_SERIAL="${DEVICES[0]}"
  else
    echo "Multiple devices found. Pick one:"
    for i in "${!DEVICES[@]}"; do
      echo "  $((i + 1))) ${DEVICES[$i]}"
    done
    read -rp "> " choice
    export ANDROID_SERIAL="${DEVICES[$((choice - 1))]}"
  fi
  echo "Using device: ${ANDROID_SERIAL}"
fi

function run_maestro_flow() {
  local MAESTRO_FLOW="${1:?}"

  mkdir -p "${SCREENSHOT_DIR}"
  pushd "${SCREENSHOT_DIR}" || exit 1
  rm -rf ./*.png

  # Enable demo mode
  adb -s "${ANDROID_SERIAL}" shell settings put global sysui_demo_allowed 1
  adb -s "${ANDROID_SERIAL}" shell am broadcast -a com.android.systemui.demo \
    -e command enter \
    -e command notifications -e visible false \
    -e command clock -e hhmm 1200

  # Clear app data for consistent runs
  adb -s "${ANDROID_SERIAL}" shell pm clear com.sphericalkat.rushhour

  ANDROID_SERIAL="${ANDROID_SERIAL}" maestro test "${SCRIPT_DIR}"/../maestro/"${MAESTRO_FLOW}"

  # Disable demo mode
  adb -s "${ANDROID_SERIAL}" shell am broadcast -a com.android.systemui.demo -e command exit

  popd || exit 1
}

function capture_screenshots() {
  local START_NUMBER="${1:?}"

  run_maestro_flow screenshots.yaml

  mkdir -p "${FASTLANE_DIR}"

  local COUNTER="${START_NUMBER}"
  for screenshot in DeparturesList TrainDetail FavoritesTab SettingsScreen; do
    if [[ -f "${SCREENSHOT_DIR}/${screenshot}.png" ]]; then
      cp "${SCREENSHOT_DIR}/${screenshot}.png" "${FASTLANE_DIR}/$(printf '%02d' "${COUNTER}").png"
      ((COUNTER++))
    fi
  done

  oxipng -o 4 --strip safe --alpha -p -t 3 -r "${FASTLANE_DIR}/"
}

# Light mode
adb -s "${ANDROID_SERIAL}" shell "cmd uimode night no"
capture_screenshots 1

# Dark mode
adb -s "${ANDROID_SERIAL}" shell "cmd uimode night yes"
capture_screenshots 5
