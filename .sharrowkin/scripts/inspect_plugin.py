"""Безопасная инспекция и распаковка архива 2d-video.plugin.

Использование:
    python .sharrowkin/scripts/inspect_plugin.py            # только отчёт
    python .sharrowkin/scripts/inspect_plugin.py --extract  # отчёт + распаковка в original/

Скрипт никогда не изменяет исходный архив и отказывается писать за пределы
целевой папки (защита от path traversal и абсолютных путей в архиве).
"""

from __future__ import annotations

import argparse
import os
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ARCHIVE = ROOT / "2d-video.plugin"
TARGET = ROOT / "original"


def detect_format(path: Path) -> str:
    with path.open("rb") as fh:
        head = fh.read(8)
    if head.startswith(b"PK\x03\x04") or head.startswith(b"PK\x05\x06"):
        return "zip"
    if head.startswith(b"\x1f\x8b"):
        return "gzip"
    if head.startswith(b"ustar") or path.suffix in {".tar"}:
        return "tar"
    return "unknown"


def unsafe_reason(name: str) -> str | None:
    normalized = name.replace("\\", "/")
    if normalized.startswith("/") or (len(normalized) > 1 and normalized[1] == ":"):
        return "абсолютный путь"
    parts = [p for p in normalized.split("/") if p not in ("", ".")]
    if any(p == ".." for p in parts):
        return "выход из целевой папки (..)"
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--extract", action="store_true", help="распаковать в original/")
    args = parser.parse_args()

    if not ARCHIVE.is_file():
        print(f"FAIL: архив не найден: {ARCHIVE}")
        return 2

    size = ARCHIVE.stat().st_size
    fmt = detect_format(ARCHIVE)
    print(f"Архив: {ARCHIVE}")
    print(f"Размер: {size} байт")
    print(f"Формат: {fmt}")

    if fmt != "zip":
        print("FAIL: поддерживается только zip-контейнер; дальнейшая распаковка не выполнялась")
        return 3

    with zipfile.ZipFile(ARCHIVE) as zf:
        bad = zf.testzip()
        print(f"CRC-проверка: {'OK' if bad is None else 'FAIL на ' + str(bad)}")
        infos = zf.infolist()
        print(f"Записей: {len(infos)}")
        total = sum(i.file_size for i in infos)
        print(f"Суммарный размер после распаковки: {total} байт")

        problems = []
        for info in infos:
            reason = unsafe_reason(info.filename)
            if reason:
                problems.append((info.filename, reason))
        if problems:
            print("FAIL: небезопасные записи в архиве:")
            for name, reason in problems:
                print(f"  - {name}: {reason}")
            return 4
        print("Проверка путей: OK (нет абсолютных путей и ..)")

        print("\nСодержимое:")
        for info in sorted(infos, key=lambda i: i.filename):
            kind = "dir " if info.is_dir() else "file"
            print(f"  [{kind}] {info.file_size:>8}  {info.filename}")

        if not args.extract:
            print("\nРежим отчёта: распаковка не выполнялась (--extract чтобы распаковать)")
            return 0

        if TARGET.exists() and any(TARGET.iterdir()):
            print(f"\nFAIL: {TARGET} уже существует и не пуста — распаковка отменена")
            return 5

        TARGET.mkdir(parents=True, exist_ok=True)
        target_root = TARGET.resolve()
        extracted = 0
        for info in infos:
            dest = (TARGET / info.filename).resolve()
            if os.path.commonpath([str(dest), str(target_root)]) != str(target_root):
                print(f"FAIL: запись вне цели: {info.filename}")
                return 6
            if info.is_dir():
                dest.mkdir(parents=True, exist_ok=True)
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(info) as src, dest.open("wb") as out:
                out.write(src.read())
            extracted += 1
        print(f"\nРаспаковано файлов: {extracted} -> {TARGET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
