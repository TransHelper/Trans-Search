#!/usr/bin/env python3
"""
Trans-Search 批量索引脚本
用法：python indexer.py --repo ./MtF-wiki/content/zh-cn --source MtFwiki --api https://search-api.transhelper.org --key YOUR_ADMIN_KEY

参数：
  --repo    本地仓库的内容目录（包含 _index.md 和子文件夹）
  --source  来源站点名称（如 MtFwiki、RLEwiki）
  --api     后端 API 地址
  --key     Admin Key
  --cat     顶层分类（可选，默认从路径推断）
  --dry     仅扫描文件，不实际上传（预览模式）
  --delay   每次请求间隔秒数（默认 0.3，避免速率限制）
"""

import os
import re
import sys
import time
import json
import argparse
import requests
from pathlib import Path

# ── frontmatter 解析（不依赖 yaml 库也能用）────────────────
def parse_frontmatter(text: str) -> tuple[dict, str]:
    """返回 (meta dict, body str)"""
    if not text.startswith('---'):
        return {}, text
    end = text.find('\n---', 3)
    if end == -1:
        return {}, text
    fm_text = text[3:end].strip()
    body = text[end+4:].strip()
    meta = {}
    for line in fm_text.splitlines():
        if ':' not in line:
            continue
        k, _, v = line.partition(':')
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if v.startswith('[') and v.endswith(']'):
            # 简单列表解析
            v = [x.strip().strip('"').strip("'") for x in v[1:-1].split(',') if x.strip()]
        meta[k] = v
    return meta, body

def clean_body(text: str) -> str:
    """去掉 Hugo shortcodes 和多余空行"""
    # 去掉 {{< ... >}} 和 {{% ... %}} shortcodes
    text = re.sub(r'\{\{[<%%].*?[>%%]\}\}', '', text, flags=re.DOTALL)
    # 去掉 HTML 注释
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    # 合并多余空行
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def build_dir_meta(repo_dir: str) -> dict:
    """递归读取所有 _index.md，建立文件夹路径 -> {title,...} 的映射"""
    root = Path(repo_dir)
    dir_meta = {}
    for idx in sorted(root.rglob('_index.md')):
        folder = idx.parent
        rel = str(folder.relative_to(root)).replace(os.sep, '/')
        if rel == '.': rel = ''
        try:
            text = idx.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        meta, _ = parse_frontmatter(text)
        dir_meta[rel] = meta
    return dir_meta

def folder_title(folder_rel: str, folder_name: str, dir_meta: dict) -> str:
    """取 _index.md 的 title，没有就用文件夹英文名"""
    m = dir_meta.get(folder_rel, {})
    t = m.get('title') or folder_name
    return str(t).strip()

def resolve_path_meta(rel_path, dir_meta, default_cat=None, **kwargs):
    parts = list(Path(rel_path).parts)
    folders = parts[:-1]
    if not folders:
        return dict(category=default_cat, chapter=None)
    cat_rel = folders[0]
    category = default_cat or folder_title(cat_rel, folders[0], dir_meta)
    if len(folders) == 1:
        return dict(category=category, chapter=None)
    chapter_parts = []
    for depth in range(1, len(folders)):
        rel = '/'.join(folders[:depth+1])
        if rel in dir_meta:
            chapter_parts.append(folder_title(rel, folders[depth], dir_meta))
    return dict(category=category, chapter='/'.join(chapter_parts) or None)

def scan_files(repo_dir: str) -> list:
    """递归扫描所有非 _index.md 的 .md 文件"""
    result = []
    for p in sorted(Path(repo_dir).rglob('*.md')):
        if p.name.startswith('_index'):
            continue
        result.append(p)
    return result

def upload(api: str, key: str, article: dict, dry: bool, retries: int = 3) -> tuple[bool, str]:
    if dry:
        return True, 'dry-run'
    last_err = ''
    for attempt in range(1, retries + 1):
        try:
            r = requests.post(
                f'{api.rstrip("/")}/articles',
                json=article,
                headers={'Content-Type': 'application/json', 'X-Admin-Key': key},
                timeout=60,
            )
            if r.ok:
                d = r.json()
                msg = f"{d.get('chunks_indexed', '?')} chunks"
                if attempt > 1:
                    msg = f"{msg} (重试成功 {attempt}/{retries})"
                return True, msg
            else:
                try:
                    detail = r.json().get('detail', r.text[:120])
                except Exception:
                    detail = r.text[:120]
                return False, f"HTTP {r.status_code}: {detail}"
        except Exception as e:
            last_err = str(e)
            if attempt < retries:
                wait = attempt * 2
                print(f'      ⚠ 连接错误，{wait}s 后重试（{attempt}/{retries}）：{e}')
                time.sleep(wait)
    return False, f'重试 {retries} 次均失败：{last_err}' 

def main():
    ap = argparse.ArgumentParser(description='Trans-Search 批量索引脚本')
    ap.add_argument('--repo',   required=True,  help='本地内容目录路径')
    ap.add_argument('--source', required=True,  help='来源站点名称')
    ap.add_argument('--api',    required=True,  help='后端 API 地址')
    ap.add_argument('--key',    default='',     help='Admin Key')
    ap.add_argument('--cat',    default=None,   help='强制指定顶层分类')
    ap.add_argument('--dry',    action='store_true', help='预览模式，不实际上传')
    ap.add_argument('--delay',  type=float, default=0.3, help='请求间隔秒数')
    ap.add_argument('--min-len', type=int, default=50, help='正文最短字符数，过短跳过')
    ap.add_argument('--chapter-depth', type=int, default=1, help='chapter 最多保留几层文件夹（默认 1）')
    args = ap.parse_args()

    dir_meta = build_dir_meta(args.repo)
    files = scan_files(args.repo)


    ok_count = 0
    fail_count = 0
    skip_count = 0
    failures = []

    for i, fpath in enumerate(files, 1):
        rel = str(fpath.relative_to(args.repo))
        try:
            text = fpath.read_text(encoding='utf-8', errors='ignore')
        except Exception as e:
            print(f'[{i}/{len(files)}] ✗ 读取失败 {rel}: {e}')
            fail_count += 1
            failures.append((rel, str(e)))
            continue

        meta, body = parse_frontmatter(text)
        body = clean_body(body)

        # 跳过正文太短的文件（通常是目录页）
        if len(body) < args.min_len:
            skip_count += 1
            print(f'[{i}/{len(files)}] ⊘ 跳过（正文过短 {len(body)}字）{rel}')
            continue

        title = meta.get('title') or meta.get('name') or fpath.stem
        if not title or not title.strip():
            title = fpath.stem

        path_meta = resolve_path_meta(rel, dir_meta, default_cat=args.cat, chapter_depth=args.chapter_depth)

        tags_raw = meta.get('tags', [])
        tags = tags_raw if isinstance(tags_raw, list) else [tags_raw] if tags_raw else []
        tags = [str(t) for t in tags if t][:20]

        article = {
            'title':       str(title).strip()[:200],
            'content':     body[:100000],
            'url':         meta.get('url') or meta.get('link') or None,
            'source_site': args.source,
            'category':    path_meta['category'],
            'chapter':     path_meta['chapter'],
            'tags':        tags,
            'flags':       [],
        }

        success, msg = upload(args.api, args.key, article, args.dry)
        status = '✓' if success else '✗'
        cat_ch = f"{article['category'] or ''}/{article['chapter'] or ''}".strip('/')
        print(f'[{i}/{len(files)}] {status} {rel}  [{cat_ch}]  →  {msg}')

        if success:
            ok_count += 1
        else:
            fail_count += 1
            failures.append((rel, msg))

        if not args.dry and i < len(files):
            time.sleep(args.delay)

    print(f'\n{"="*50}')
    print(f'完成：成功 {ok_count}，跳过 {skip_count}，失败 {fail_count}')
    if failures:
        print('\n失败列表：')
        for rel, reason in failures:
            print(f'  {rel}: {reason}')
        # 输出失败列表到文件，方便重试
        fail_path = Path('indexer_failures.json')
        fail_path.write_text(json.dumps(failures, ensure_ascii=False, indent=2))
        print(f'\n失败列表已保存到 {fail_path}，可用 --retry 重试')

if __name__ == '__main__':
    main()
