#!/usr/bin/env python3
"""모바일 청첩장 빌드 및 로컬 미리보기 도구.

사용법:
  python manage.py build
  python manage.py preview
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None
    ImageOps = None
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from datetime import datetime
from typing import Any
from urllib.parse import quote

from wedding_config import WEDDING

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
TEMPLATE = ROOT / 'templates' / 'index.html'
STATIC = ROOT / 'static'
ASSETS = ROOT / 'assets'
PHOTOS = ROOT / 'photos'
SUPPORTED_IMAGES = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'}
OPTIMIZABLE_IMAGES = {'.jpg', '.jpeg', '.png', '.webp'}


def natural_key(path: Path) -> list[Any]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r'(\d+)', path.name)]


def image_files(folder: Path) -> list[Path]:
    if not folder.exists():
        return []
    return sorted(
        [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED_IMAGES],
        key=natural_key,
    )


def copy_file(source: Path, relative_target: Path) -> str:
    target = DIST / relative_target
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    return relative_target.as_posix()


def fingerprint_file(relative_path: str) -> str:
    """사진 내용이 바뀔 때만 URL을 바꿔 이전 캐시와 섞이지 않게 합니다."""
    source = DIST / relative_path
    digest = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
    target = source.with_name(f'{source.stem}-{digest}{source.suffix}')
    source.rename(target)
    return target.relative_to(DIST).as_posix()


def optimize_image(
    source: Path,
    relative_target: Path,
    *,
    max_edge: int,
    quality: int,
) -> str:
    if Image is None or ImageOps is None:
        raise RuntimeError('사진 최적화에 Pillow가 필요합니다.')

    target = DIST / relative_target
    target.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as opened:
        # 스마트폰 JPG의 MPO 보조 프레임은 시간에 따른 애니메이션이 아닙니다.
        if opened.format == 'MPO':
            opened.seek(0)
        elif getattr(opened, 'is_animated', False):
            raise ValueError('움직이는 이미지는 WebP 최적화 대상에서 제외합니다.')

        normalized = ImageOps.exif_transpose(opened)
        if normalized.mode in {'RGBA', 'LA'} or 'transparency' in normalized.info:
            rgba = normalized.convert('RGBA')
            prepared = Image.new('RGB', rgba.size, '#ffffff')
            prepared.paste(rgba, mask=rgba.getchannel('A'))
        else:
            prepared = normalized.convert('RGB')

        prepared.thumbnail(
            (max_edge, max_edge),
            Image.Resampling.LANCZOS,
            reducing_gap=3.0,
        )
        prepared.save(
            target,
            format='WEBP',
            quality=quality,
            method=6,
            optimize=True,
        )

    return relative_target.as_posix()


def optimize_or_copy(
    source: Path,
    relative_target: Path,
    *,
    max_edge: int,
    quality: int,
) -> str:
    if source.suffix.lower() in OPTIMIZABLE_IMAGES:
        try:
            return fingerprint_file(optimize_image(
                source,
                relative_target,
                max_edge=max_edge,
                quality=quality,
            ))
        except Exception as error:
            print(f'[경고] {source.name} 최적화 실패, 원본을 사용합니다: {error}')

    fallback_target = relative_target.with_suffix(source.suffix.lower())
    return fingerprint_file(copy_file(source, fallback_target))


def build_image_data() -> dict[str, Any]:
    cover_candidates = image_files(PHOTOS / 'cover')
    cover = ''
    if cover_candidates:
        cover = optimize_or_copy(
            cover_candidates[0],
            Path('images/cover/cover.webp'),
            max_edge=1600,
            quality=72,
        )

    gallery = []
    for index, image in enumerate(image_files(PHOTOS / 'gallery'), start=1):
        file_number = f'{index:02d}'
        full = optimize_or_copy(
            image,
            Path(f'images/gallery/full/{file_number}.webp'),
            max_edge=1280,
            quality=72,
        )
        thumbnail = optimize_or_copy(
            image,
            Path(f'images/gallery/thumb/{file_number}.webp'),
            max_edge=480,
            quality=68,
        )
        gallery.append({
            'src': full,
            'thumbnail_src': thumbnail,
            'alt': f'{WEDDING["couple"]["groom"]}와 {WEDDING["couple"]["bride"]}의 웨딩 사진 {index}',
        })

    map_candidates = image_files(PHOTOS / 'map')
    map_image = ''
    map_width = map_height = 0
    if map_candidates:
        source = map_candidates[0]
        map_image = copy_file(source, Path('images/map') / source.name)
        if source.suffix.lower() in OPTIMIZABLE_IMAGES:
            with Image.open(source) as opened:
                map_width, map_height = opened.size
                if source.suffix.lower() == '.png':
                    opened.save(DIST / map_image, format='PNG', optimize=True)
        map_image = fingerprint_file(map_image)

    return {
        'cover': cover,
        'cover_alt': f'{WEDDING["couple"]["groom"]}와 {WEDDING["couple"]["bride"]}의 웨딩 대표 사진',
        'gallery': gallery,
        'map_image': map_image,
        'map_width': map_width,
        'map_height': map_height,
        'map_is_draft': False,
    }


def derive_links(config: dict[str, Any]) -> None:
    venue = config['venue']
    kakao_place_id = str(venue.get('kakao_place_id', '')).strip()
    latitude = venue.get('latitude')
    longitude = venue.get('longitude')

    if kakao_place_id:
        venue['kakao_directions_url'] = f'https://map.kakao.com/link/to/{quote(kakao_place_id)}'
    elif latitude is not None and longitude is not None:
        name = quote(str(venue['name']))
        venue['kakao_directions_url'] = (
            f"https://map.kakao.com/link/to/{name},{latitude},{longitude}"
        )
    else:
        venue['kakao_directions_url'] = str(
            venue.get('kakao_place_url', '#')
        )

    # 네이버는 사용자가 제공한 장소 링크를 기본 연결로 사용합니다.
    # 해당 링크에서 길찾기를 바로 선택할 수 있으며 앱·모바일웹 환경에 따라 연결됩니다.
    venue['naver_directions_url'] = venue['naver_place_url']


def build() -> Path:
    if Image is None or ImageOps is None:
        raise RuntimeError('사진 최적화에 Pillow가 필요합니다. requirements.txt를 먼저 설치하세요.')
    datetime.strptime(f'{WEDDING["wedding"]["date"]} {WEDDING["wedding"]["time"]}', '%Y-%m-%d %H:%M')
    if DIST.exists():
        if DIST.resolve() != ROOT.resolve() / 'dist':
            raise RuntimeError('빌드 출력 경로가 올바르지 않습니다.')
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    shutil.copytree(STATIC, DIST / 'static')

    config = json.loads(json.dumps(WEDDING, ensure_ascii=False))
    for side in ('groom_side', 'bride_side'):
        config['accounts'][side] = [account for account in config['accounts'].get(side, [])
                                     if account.get('show', True)]
    config['images'] = build_image_data()
    derive_links(config)

    site = config['site']
    site_url = str(site.get('url', '')).rstrip('/') + '/'
    share_url = str(site.get('share_url', '') or site_url)
    share_image = str(site.get('share_image', '')).lstrip('/')
    og_image = f'{site_url}{share_image}' if site.get('url') and share_image else ''
    asset_digest = hashlib.sha256(json.dumps(config, ensure_ascii=False, sort_keys=True).encode('utf-8'))
    for path in sorted(STATIC.glob('*')):
        if path.is_file():
            asset_digest.update(path.read_bytes())
    asset_version = f'{site.get("asset_version", "1")}-{asset_digest.hexdigest()[:12]}'
    cover = config['images']['cover']

    template = TEMPLATE.read_text(encoding='utf-8')
    replacements = {
        '{{TITLE}}': html.escape(str(site['title'])),
        '{{DESCRIPTION}}': html.escape(str(site['description'])),
        '{{CANONICAL_URL}}': html.escape(site_url),
        '{{SHARE_URL}}': html.escape(share_url),
        '{{OG_IMAGE}}': html.escape(og_image),
        '{{ASSET_VERSION}}': html.escape(asset_version),
        '{{COVER_PRELOAD}}': f'<link rel="preload" as="image" href="{html.escape(cover)}" fetchpriority="high" />' if cover else '',
        '{{FALLBACK_DATE}}': html.escape(f'{config["wedding"]["display_date"]} {config["wedding"]["display_time"]}'),
        '{{FALLBACK_VENUE}}': html.escape(f'{config["venue"]["name"]} · {config["venue"]["hall"]}'),
        '{{FALLBACK_ADDRESS}}': html.escape(config['venue']['address']),
        '{{FALLBACK_MAP_URL}}': html.escape(config['venue']['naver_place_url']),
        '{{OG_ALT}}': html.escape(f'{config["couple"]["groom"]} · {config["couple"]["bride"]} 결혼식 초대'),
    }
    for old, new in replacements.items():
        template = template.replace(old, new)

    (DIST / 'index.html').write_text(template, encoding='utf-8')
    (DIST / '404.html').write_text(
        '<!doctype html><html lang="ko"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>청첩장 안내</title><body style="margin:0;padding:64px 24px;background:#f7f3ed;'
        'color:#3e3a36;text-align:center;font-family:sans-serif">'
        '<h1>청첩장 안내</h1><p>주소를 찾을 수 없습니다. 아래 링크에서 청첩장을 확인해 주세요.</p>'
        f'<a href="{html.escape(site_url)}">청첩장 열기</a></body></html>', encoding='utf-8')
    (DIST / 'site-data.js').write_text(
        'window.WEDDING_DATA = ' + json.dumps(config, ensure_ascii=False, indent=2) + ';\n',
        encoding='utf-8',
    )
    (DIST / '.nojekyll').write_text('', encoding='utf-8')

    validate_output(config)

    print(f'[완료] 청첩장을 생성했습니다: {DIST}')
    print(f'[사진] 커버 {1 if cover else 0}장 / 갤러리 {len(config["images"]["gallery"])}장')
    return DIST


def validate_output(config: dict[str, Any]) -> None:
    paths = ['index.html', 'site-data.js', 'static/app.js', 'static/styles.css', config['site']['share_image']]
    paths += [config['images']['cover'], config['images']['map_image']]
    for image in config['images']['gallery']:
        paths += [image['src'], image['thumbnail_src']]
        for key, edge in (('src', 1280), ('thumbnail_src', 480)):
            if not image[key].endswith('.svg'):
                with Image.open(DIST / image[key]) as opened:
                    opened.verify()
            if image[key].endswith('.webp'):
                with Image.open(DIST / image[key]) as opened:
                    if max(opened.size) > edge:
                        raise RuntimeError(f'사진 크기 검증 실패: {image[key]}')
    for path in filter(None, paths):
        if not (DIST / path).is_file() or not (DIST / path).stat().st_size:
            raise RuntimeError(f'배포 파일 누락: {path}')
    if '{{' in (DIST / 'index.html').read_text(encoding='utf-8'):
        raise RuntimeError('HTML 템플릿에 미완성 항목이 있습니다.')
    gallery = config['images']['gallery']
    optimized = sum(image['src'].endswith('.webp') for image in gallery)
    full_bytes = sum((DIST / image['src']).stat().st_size for image in gallery)
    thumb_bytes = sum((DIST / image['thumbnail_src']).stat().st_size for image in gallery)
    print(f'[검증] 갤러리 WebP {optimized}/{len(gallery)}장 / 전체 {full_bytes:,}B / 썸네일 {thumb_bytes:,}B')


def preview(port: int) -> None:
    build()

    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, format: str, *args: object) -> None:
            return

    handler = lambda *args, **kwargs: QuietHandler(*args, directory=str(DIST), **kwargs)
    server = ThreadingHTTPServer(('127.0.0.1', port), handler)
    url = f'http://127.0.0.1:{port}/'

    print(f'[미리보기] {url}')
    print('브라우저가 열리지 않으면 위 주소를 직접 입력하세요.')
    print('종료하려면 이 창에서 Ctrl+C를 누르세요.')
    threading.Timer(0.7, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[종료] 미리보기 서버를 닫았습니다.')
    finally:
        server.server_close()


def main() -> int:
    parser = argparse.ArgumentParser(description='모바일 청첩장 빌드 도구')
    subparsers = parser.add_subparsers(dest='command')
    subparsers.add_parser('build', help='dist 폴더에 배포용 파일 생성')
    preview_parser = subparsers.add_parser('preview', help='빌드 후 로컬 미리보기 실행')
    preview_parser.add_argument('--port', type=int, default=8000)

    args = parser.parse_args()
    command = args.command or 'preview'

    if command == 'build':
        build()
        return 0
    if command == 'preview':
        preview(args.port)
        return 0

    parser.print_help()
    return 1


if __name__ == '__main__':
    sys.exit(main())
