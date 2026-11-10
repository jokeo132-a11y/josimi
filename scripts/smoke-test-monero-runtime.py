#!/usr/bin/env python3
"""Launch the packaged Monero daemon on Windows without starting network sync."""

import json
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path, PurePosixPath


def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)


def main():
    if sys.platform != 'win32':
        fail('The packaged monerod runtime smoke test must run on Windows.')
    if len(sys.argv) != 2:
        fail('Usage: smoke-test-monero-runtime.py <windows-release.zip>')

    archive_path = sys.argv[1]
    try:
        with zipfile.ZipFile(archive_path) as archive:
            manifests = [name for name in archive.namelist() if name.replace('\\', '/').endswith('/resources/app.asar.unpacked/assets/runtime/monero/manifest.json')]
            if len(manifests) != 1:
                raise RuntimeError(f'Expected one packaged Monero runtime manifest; found {len(manifests)}.')
            manifest_path = manifests[0]
            runtime_root = PurePosixPath(manifest_path).parent
            manifest = json.loads(archive.read(manifest_path))
            version = manifest.get('version')
            files = manifest.get('files')
            if not isinstance(version, str) or not version or not isinstance(files, list):
                raise RuntimeError('Packaged Monero runtime manifest is incomplete.')
            names = [item.get('name') for item in files if isinstance(item, dict)]
            if len(names) != len(files) or 'monerod.exe' not in names:
                raise RuntimeError('Packaged runtime does not list monerod.exe and its required files.')

            with tempfile.TemporaryDirectory(prefix='josimi-monerod-smoke-') as temp_dir:
                runtime_dir = Path(temp_dir)
                for name in names:
                    if not isinstance(name, str) or PurePosixPath(name).name != name or name in ('.', '..'):
                        raise RuntimeError(f'Unsafe Monero runtime file name: {name!r}')
                    member = f'{runtime_root.as_posix()}/{name}'
                    (runtime_dir / name).write_bytes(archive.read(member))
                daemon = runtime_dir / 'monerod.exe'
                result = subprocess.run([str(daemon), '--version'], cwd=runtime_dir, capture_output=True, timeout=30, check=False)
                output = (result.stdout + result.stderr).decode('utf-8', errors='replace')
                if result.returncode != 0:
                    raise RuntimeError(f'Packaged monerod --version exited with code {result.returncode}: {output.strip()}')
                if version not in output:
                    raise RuntimeError(f'Packaged monerod version output did not contain {version}: {output.strip()}')
    except (OSError, zipfile.BadZipFile, json.JSONDecodeError, subprocess.TimeoutExpired, RuntimeError) as error:
        fail(str(error))

    print(f'Windows successfully launched packaged monerod v{version} with --version; no node sync was started.')


if __name__ == '__main__':
    main()
