#!/usr/bin/env python3
"""Verify that the Windows ZIP contains only the intended Monero daemon runtime."""

import hashlib
import json
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path, PurePosixPath


def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)


def source_pins():
    with open('src/node-manager.js', encoding='utf-8') as source_file:
        source = source_file.read()
    version = re.search(r"const MONERO_VERSION = '([^']+)'", source)
    digest = re.search(r"const MONERO_ARCHIVE_SHA256 = '([a-f0-9]{64})'", source)
    if not version or not digest:
        raise RuntimeError('Could not read the pinned Monero source archive version and SHA-256 from node-manager.js')
    return version.group(1), digest.group(1)


def allowed_runtime_name(name):
    if name in ('monerod.exe', 'MONERO-LICENSE.txt', 'UPSTREAM-NOTICE.txt'):
        return True
    return bool(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,123}\.dll', name, re.IGNORECASE))


def list_asar_paths(release, asar_path):
    with tempfile.TemporaryDirectory(prefix='josimi-release-asar-') as temp_dir:
        local_asar = Path(temp_dir) / 'app.asar'
        local_asar.write_bytes(release.read(asar_path))
        command = "const asar=require('@electron/asar'); process.stdout.write(JSON.stringify(asar.listPackage(process.argv[1])))"
        result = subprocess.run(['node', '-e', command, str(local_asar)], check=True, capture_output=True, text=True, timeout=30)
        paths = json.loads(result.stdout)
        if not isinstance(paths, list) or not all(isinstance(item, str) for item in paths):
            raise RuntimeError('Could not read a valid file listing from packaged app.asar.')
        return paths


def main():
    if len(sys.argv) != 2:
        fail('Usage: verify-release-bundle.py <windows-release.zip>')
    version, expected_archive_sha = source_pins()
    archive_path = sys.argv[1]
    try:
        with zipfile.ZipFile(archive_path) as release:
            names = release.namelist()
            normalized = [name.replace('\\', '/') for name in names]
            if len(normalized) != len(set(normalized)):
                raise RuntimeError('Windows release ZIP contains duplicate normalized member names.')
            if any('/../' in f'/{name}/' or name.startswith('/') for name in normalized):
                raise RuntimeError('Windows release ZIP contains an unsafe member path.')
            manifest_suffix = 'resources/app.asar.unpacked/assets/runtime/monero/manifest.json'
            manifests = [name for name in normalized if name.endswith(manifest_suffix)]
            if len(manifests) != 1:
                raise RuntimeError(f'Expected exactly one staged Monero runtime manifest in the Windows ZIP; found {len(manifests)}.')
            manifest_path = manifests[0]
            runtime_root = str(PurePosixPath(manifest_path).parent)
            manifest = json.loads(release.read(manifest_path))
            if manifest.get('schemaVersion') != 1 or manifest.get('project') != 'monero-project/monero':
                raise RuntimeError('Monero runtime manifest has an unsupported schema or upstream project.')
            if manifest.get('version') != version or manifest.get('sourceArchiveSha256') != expected_archive_sha:
                raise RuntimeError('Monero runtime manifest version or official source archive SHA-256 does not match the source pin.')
            if manifest.get('sourceArchive') != f'monero-win-x64-v{version}.zip':
                raise RuntimeError('Monero runtime manifest names an unexpected source archive.')
            files = manifest.get('files')
            if not isinstance(files, list) or len(files) < 3 or len(files) > 64:
                raise RuntimeError('Monero runtime manifest has an invalid file list.')
            expected_names = set()
            for record in files:
                if not isinstance(record, dict) or set(record) != {'name', 'sha256'}:
                    raise RuntimeError('Monero runtime manifest has an unsupported file record.')
                name, digest = record['name'], record['sha256']
                if not isinstance(name, str) or not allowed_runtime_name(name) or name in expected_names:
                    raise RuntimeError(f'Monero runtime manifest contains an unsafe or duplicate file name: {name!r}')
                if not isinstance(digest, str) or not re.fullmatch(r'[a-f0-9]{64}', digest):
                    raise RuntimeError(f'Monero runtime manifest contains an invalid SHA-256 for {name}.')
                expected_names.add(name)
                member = f'{runtime_root}/{name}'
                try:
                    data = release.read(member)
                except KeyError as error:
                    raise RuntimeError(f'Bundled Monero runtime file is missing: {member}') from error
                actual = hashlib.sha256(data).hexdigest()
                if actual != digest:
                    raise RuntimeError(f'Bundled Monero runtime file hash mismatch: {name}')
            if 'monerod.exe' not in expected_names or 'MONERO-LICENSE.txt' not in expected_names or 'UPSTREAM-NOTICE.txt' not in expected_names:
                raise RuntimeError('The bundled runtime must contain monerod.exe and both upstream license notices.')
            prefix = runtime_root + '/'
            runtime_entries = [name for name in normalized if name.startswith(prefix) and not name.endswith('/')]
            if any('/' in name[len(prefix):] for name in runtime_entries):
                raise RuntimeError('Monero runtime folder must not contain nested directories or files.')
            actual_names = {name[len(prefix):] for name in runtime_entries}
            if actual_names != expected_names | {'manifest.json'}:
                difference = sorted(actual_names ^ (expected_names | {'manifest.json'}))
                raise RuntimeError(f'Monero runtime folder contains missing or unmanifested entries: {difference}')
            if any(name.lower().endswith('.zip') for name in actual_names):
                raise RuntimeError('The full Monero CLI archive must not be shipped in the Windows ZIP.')
            if any(name.lower().endswith('.exe') and name.lower() != 'monerod.exe' for name in actual_names):
                raise RuntimeError('The daemon-only runtime must not ship other Monero CLI executables.')
            archive_name = f'monero-win-x64-v{version}.zip'.lower()
            if any(PurePosixPath(name).suffix.lower() == '.zip' for name in normalized):
                raise RuntimeError('Nested ZIP archives, including the full Monero CLI archive, must not appear anywhere in the Windows ZIP.')
            if any(PurePosixPath(name).name.lower().startswith('monero-') and PurePosixPath(name).name.lower().endswith('.exe') for name in normalized):
                raise RuntimeError('The Windows ZIP unexpectedly contains other Monero CLI executables.')
            asar_paths = [name for name in normalized if PurePosixPath(name).name.lower() == 'app.asar']
            if len(asar_paths) != 1:
                raise RuntimeError(f'Expected exactly one packaged app.asar in the Windows ZIP; found {len(asar_paths)}.')
            for member in list_asar_paths(release, asar_paths[0]):
                clean_member = member.replace('\\', '/').lstrip('/').lower()
                basename = PurePosixPath(clean_member).name
                if clean_member.startswith('assets/runtime/monero/'):
                    raise RuntimeError('Monero runtime files must be unpacked from app.asar and verified as separate package files.')
                if basename.endswith('.zip') or basename == archive_name or basename == 'monerod.exe' or (basename.startswith('monero-') and basename.endswith('.exe')):
                    raise RuntimeError(f'app.asar unexpectedly contains a Monero CLI archive or executable: {member}')
    except (OSError, zipfile.BadZipFile, json.JSONDecodeError, RuntimeError) as error:
        fail(str(error))
    print(f'Verified monerod-only Monero v{version} runtime, file hashes, notices, and exclusion of the full CLI archive in {archive_path}.')


if __name__ == '__main__':
    main()
