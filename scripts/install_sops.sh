#!/bin/bash
# Put the pinned sops in ~/bin, verifying the checksum, unless it is there
# already. Idempotent: the deploy runs it every time.
set -euo pipefail

VERSION=v3.13.3
TARGET=${1:-$HOME/bin/sops}

if [ -x "$TARGET" ] && "$TARGET" --version 2>/dev/null | grep -q "${VERSION#v}"; then
  echo "sops ${VERSION#v} already at $TARGET"
  exit 0
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
cd "$work"

base="https://github.com/getsops/sops/releases/download/$VERSION"
curl -fsSLO "$base/sops-$VERSION.linux.amd64"
curl -fsSLO "$base/sops-$VERSION.checksums.txt"

# Without this the deploy would install whatever the network handed it.
grep "sops-$VERSION.linux.amd64\$" "sops-$VERSION.checksums.txt" | sha256sum -c -

mkdir -p "$(dirname "$TARGET")"
install -m 755 "sops-$VERSION.linux.amd64" "$TARGET"
echo "installed $("$TARGET" --version | head -1) at $TARGET"
