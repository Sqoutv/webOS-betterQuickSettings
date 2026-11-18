#!/usr/bin/env python3
"""Builds an installable webOS .ipk package (WebApp + JS Service) without ares-cli."""

import hashlib
import io
import json
import tarfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP_DIR = ROOT / "app"
SERVICE_DIR = ROOT / "service"
DIST_DIR = ROOT / "dist"


def make_tar_gz(entries):
    """Create an in-memory gzipped ustar archive with root ownership."""
    buf = io.BytesIO()
    now = int(time.time())
    with tarfile.open(fileobj=buf, mode="w:gz", format=tarfile.USTAR_FORMAT) as tf:
        for arcname, data, mode, is_dir in entries:
            info = tarfile.TarInfo(name=arcname)
            info.uid = 0
            info.gid = 0
            info.uname = "root"
            info.gname = "root"
            info.mtime = now
            info.mode = mode
            if is_dir:
                info.type = tarfile.DIRTYPE
                info.size = 0
                tf.addfile(info)
            else:
                info.type = tarfile.REGTYPE
                info.size = len(data)
                tf.addfile(info, io.BytesIO(data))
    return buf.getvalue()


def make_ar_archive(members):
    """Assemble a Debian-style ar archive used by webOS .ipk packages."""
    now = int(time.time())
    out = bytearray(b"!<arch>\n")
    for name, data in members:
        header = (
            f"{name:<16}"
            f"{now:<12}"
            f"{0:<6}"
            f"{0:<6}"
            f"{'100644':<8}"
            f"{len(data):<10}"
            f"`\n"
        ).encode("ascii")
        assert len(header) == 60
        out.extend(header)
        out.extend(data)
        if len(data) % 2 == 1:
            out.extend(b"\n")
    return bytes(out)


def add_dir_tree(entries, src_dir, target_prefix):
    """Recursively collect files and directories from src_dir for packaging."""
    entries.append((f"{target_prefix}/", b"", 0o755, True))
    for path in sorted(src_dir.rglob("*")):
        rel = path.relative_to(src_dir).as_posix()
        arc = f"{target_prefix}/{rel}"
        if path.is_dir():
            entries.append((arc + "/", b"", 0o755, True))
        else:
            entries.append((arc, path.read_bytes(), 0o644, False))


def build():
    """Package the WebApp and bundled services into dist/<id>_<version>_all.ipk."""
    appinfo = json.loads((APP_DIR / "appinfo.json").read_text(encoding="utf-8"))
    app_id = appinfo["id"]
    version = appinfo["version"]

    service_ids = []
    if SERVICE_DIR.exists():
        for d in sorted(SERVICE_DIR.iterdir()):
            if d.is_dir() and (d / "services.json").exists():
                service_ids.append(d.name)

    data_entries = [
        ("./", b"", 0o755, True),
        ("./usr/", b"", 0o755, True),
        ("./usr/palm/", b"", 0o755, True),
        ("./usr/palm/applications/", b"", 0o755, True),
    ]
    add_dir_tree(data_entries, APP_DIR, f"./usr/palm/applications/{app_id}")

    if service_ids:
        data_entries.append(("./usr/palm/services/", b"", 0o755, True))
        for sid in service_ids:
            add_dir_tree(data_entries, SERVICE_DIR / sid, f"./usr/palm/services/{sid}")

    # Generate packageinfo.json for appInstallService (app + bundled services)
    packageinfo = {
        "app": app_id,
        "id": app_id,
        "loc_name": appinfo.get("title", app_id),
        "package_format_version": 2,
        "vendor": appinfo.get("vendor", "mscha"),
        "version": version,
    }
    if service_ids:
        packageinfo["services"] = service_ids

    data_entries.extend([
        ("./usr/palm/packages/", b"", 0o755, True),
        (f"./usr/palm/packages/{app_id}/", b"", 0o755, True),
        (
            f"./usr/palm/packages/{app_id}/packageinfo.json",
            (json.dumps(packageinfo, indent=2) + "\n").encode("utf-8"),
            0o644,
            False,
        ),
    ])

    data_tar = make_tar_gz(data_entries)
    installed_size = sum(len(d) for _, d, _, is_dir in data_entries if not is_dir)

    control_text = (
        f"Package: {app_id}\n"
        f"Version: {version}\n"
        f"Section: misc\n"
        f"Priority: optional\n"
        f"Architecture: all\n"
        f"Installed-Size: {installed_size}\n"
        f"Maintainer: {appinfo.get('vendor', 'mscha')}\n"
        f"Description: {appinfo.get('title', app_id)}\n"
        f"webOS-Package-Format-Version: 2\n"
        f"webOS-Application-ID: {app_id}\n"
    ).encode("utf-8")

    control_tar = make_tar_gz([
        ("./", b"", 0o755, True),
        ("./control", control_text, 0o644, False),
    ])

    ipk_bytes = make_ar_archive([
        ("debian-binary", b"2.0\n"),
        ("control.tar.gz", control_tar),
        ("data.tar.gz", data_tar),
    ])

    DIST_DIR.mkdir(parents=True, exist_ok=True)
    ipk_name = f"{app_id}_{version}_all.ipk"
    ipk_path = DIST_DIR / ipk_name
    ipk_path.write_bytes(ipk_bytes)
    sha256 = hashlib.sha256(ipk_bytes).hexdigest()

    manifest = {
        "id": app_id,
        "version": version,
        "type": appinfo.get("type", "web"),
        "title": "G5 Quick Settings",
        "appDescription": "HDR-friendly Apple Control Center quick settings overlay",
        "iconUri": "https://raw.githubusercontent.com/Sqoutv/webOS-betterQuickSettings/main/app/largeIcon.png",
        "sourceUrl": "https://github.com/Sqoutv/webOS-betterQuickSettings",
        "rootRequired": True,
        "ipkUrl": f"https://github.com/Sqoutv/webOS-betterQuickSettings/releases/download/{version}/{ipk_name}",
        "ipkHash": {"sha256": sha256},
        "ipkSize": len(ipk_bytes),
    }
    manifest_path = DIST_DIR / f"{app_id}.manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"Built: {ipk_path} ({len(ipk_bytes)} bytes, sha256: {sha256}, services: {service_ids})")
    print(f"Built: {manifest_path}")


if __name__ == "__main__":
    build()
