"""
Automated Verification Suite for Jaijitesh Suryaprakash's Portfolio
Checks:
- HTML existence and parsing
- Local asset and internal link integrity
- Verification of zero placeholder / fake counter / broken claims
- Viewport and CSS integrity
"""

import os
import re
import sys
from html.parser import HTMLParser

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PAGES = ['index.html', 'personal.html', 'contact.html', '404.html']

class LinkExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.images = []
        self.scripts = []
        self.styles = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'a' and 'href' in attrs_dict:
            self.links.append(attrs_dict['href'])
        elif tag == 'img' and 'src' in attrs_dict:
            self.images.append(attrs_dict['src'])
        elif tag == 'script' and 'src' in attrs_dict:
            self.scripts.append(attrs_dict['src'])
        elif tag == 'link' and attrs_dict.get('rel') == 'stylesheet' and 'href' in attrs_dict:
            self.styles.append(attrs_dict['href'])


def test_html_files_exist():
    print("--> Checking HTML files existence...")
    for page in PAGES:
        path = os.path.join(ROOT_DIR, page)
        assert os.path.exists(path), f"Missing page: {page}"
        size = os.path.getsize(path)
        assert size > 500, f"Page {page} appears suspiciously small ({size} bytes)"
        print(f"  [OK] {page} ({size} bytes)")


def test_local_assets_and_links():
    print("\n--> Checking local asset links and targets across pages...")
    for page in PAGES:
        path = os.path.join(ROOT_DIR, page)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        parser = LinkExtractor()
        parser.feed(content)

        # Check images
        for src in parser.images:
            if not src.startswith(('http://', 'https://', 'data:')):
                clean_src = src.split('?')[0]
                img_path = os.path.join(ROOT_DIR, clean_src)
                assert os.path.exists(img_path), f"In {page}: image not found: {clean_src}"
                assert os.path.getsize(img_path) > 0, f"In {page}: image is 0 bytes: {clean_src}"

        # Check local scripts
        for src in parser.scripts:
            if not src.startswith(('http://', 'https://')):
                clean_src = src.split('?')[0]
                script_path = os.path.join(ROOT_DIR, clean_src)
                assert os.path.exists(script_path), f"In {page}: script not found: {clean_src}"

        # Check stylesheets
        for href in parser.styles:
            if not href.startswith(('http://', 'https://')):
                clean_href = href.split('?')[0]
                css_path = os.path.join(ROOT_DIR, clean_href)
                assert os.path.exists(css_path), f"In {page}: stylesheet not found: {clean_href}"

        # Check internal links
        for href in parser.links:
            if not href.startswith(('http://', 'https://', 'mailto:', '#', 'tel:')):
                clean_href = href.split('#')[0].split('?')[0]
                if clean_href:
                    link_path = os.path.join(ROOT_DIR, clean_href)
                    assert os.path.exists(link_path), f"In {page}: internal link broken: {clean_href}"

        print(f"  [OK] {page} all referenced images, styles, scripts, and local links exist.")


def test_no_placeholders_or_fake_features():
    print("\n--> Verifying elimination of placeholders, fabricated metrics, and AI design tropes...")
    forbidden_terms = [
        'INSERT MEDIA',
        'visitorCounter.js',
        'visitorTicker',
        'upcountBtn',
        'SATQuery-AI',
        'Thank you! Your message was sent.',
        '04+ Years Engineering',
        '24+ Projects Built',
        '12+ Deployed Systems',
        '01 /',
        '02 /',
        '03 /',
        'status-badge',
        'status-dot',
        'Plus Jakarta Sans',
        'JetBrains Mono',
        'VERIFIED TRAJECTORY',
        'TRANSMISSION CHANNEL',
        'CURATED ARTIFACTS'
    ]

    for page in PAGES:
        path = os.path.join(ROOT_DIR, page)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        for term in forbidden_terms:
            assert term not in content, f"Forbidden term '{term}' found in {page}!"

    print("  [OK] Zero placeholder frames, fabricated metrics, pills, or numbering tropes in all production pages.")


def test_zero_visible_slashes_and_photo_placement():
    print("\n--> Checking zero visible slashes in text nodes and strict archive photo placement...")
    # 1. Zero visible slashes in user-facing text
    for page in PAGES:
        path = os.path.join(ROOT_DIR, page)
        with open(path, 'r', encoding='utf-8') as f:
            raw = f.read()
        no_scripts = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', raw, flags=re.DOTALL)
        clean_text = re.sub(r'<[^>]+>', ' ', no_scripts)
        for line_num, line in enumerate(clean_text.splitlines(), 1):
            line_str = line.strip()
            if '/' in line_str and not any(k in line_str for k in ['http:', 'https:', '//']):
                assert False, f"In {page}:{line_num}: visible slash '/' found in text: {line_str}"

    # 2. Portrait placement: excluded from index.html, present in personal.html
    with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
        index_content = f.read()
    assert 'portrait_full_body.jpg' not in index_content, "Personal portrait still found in index.html (must be in archive only)!"

    with open(os.path.join(ROOT_DIR, 'personal.html'), 'r', encoding='utf-8') as f:
        personal_content = f.read()
    assert 'portrait_full_body.jpg' in personal_content, "Personal portrait missing from personal.html archive!"

    print("  [OK] Zero visible slashes in content and archive portrait placement verified.")


def test_cinematic_work_slides():
    print("\n--> Verifying cinematic work slides, alternating directions, and telemetry canvases...")
    with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
        html = f.read()

    slides = ['proj-windsim', 'proj-autobot', 'proj-berry', 'proj-perfmon']
    for slide_id in slides:
        assert f'id="{slide_id}"' in html, f"Missing cinematic slide: {slide_id}"

    assert 'data-slide-dir="left"' in html, "Missing left-slide animation direction"
    assert 'data-slide-dir="right"' in html, "Missing right-slide animation direction"
    assert 'id="windsimCanvas"' in html, "Missing WindSim canvas"
    assert 'id="autobotCanvas"' in html, "Missing AutoBot canvas"
    assert 'id="perfmonCanvas"' in html, "Missing Performance-Monitor canvas"

    print("  [OK] All 4 cinematic work slides, alternating lateral directions, and interactive canvases verified.")


def test_design_system_and_a11y():
    print("\n--> Checking design system tokens, typography stack, and anti-slop rules in style.css...")
    css_path = os.path.join(ROOT_DIR, 'style.css')
    assert os.path.exists(css_path), "style.css missing!"
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()

    assert '--bg: #090a0c;' in css, "Missing primary background token"
    assert '--accent: #e5a93c;' in css, "Missing accent token"
    assert 'prefers-reduced-motion' in css, "Missing prefers-reduced-motion media query"
    assert ':focus-visible' in css, "Missing :focus-visible accessibility rule"
    assert 'Clash Display' in css, "Missing Clash Display font specification"
    assert 'General Sans' in css, "Missing General Sans font specification"
    assert 'Syne' in css, "Missing Syne font specification"
    assert 'Epilogue' in css, "Missing Epilogue font specification"
    assert 'Instrument Serif' in css, "Missing Instrument Serif font specification"
    assert 'Fraunces' in css, "Missing Fraunces font specification"
    assert 'Space Mono' in css, "Missing Space Mono font specification"
    assert '999px' not in css, "Found forbidden 999px pill border-radius in style.css!"
    assert 'Plus Jakarta Sans' not in css, "Forbidden Plus Jakarta Sans found in style.css!"
    assert 'JetBrains Mono' not in css, "Forbidden JetBrains Mono found in style.css!"

    print("  [OK] Design system tokens, European grotesque & designer serif typography, zero-pill geometry, and accessibility rules verified.")


if __name__ == '__main__':
    print("==================================================")
    print(" JAIJITESH SURYAPRAKASH PORTFOLIO VERIFICATION    ")
    print("==================================================")
    try:
        test_html_files_exist()
        test_local_assets_and_links()
        test_no_placeholders_or_fake_features()
        test_zero_visible_slashes_and_photo_placement()
        test_cinematic_work_slides()
        test_design_system_and_a11y()
        print("\n==================================================")
        print(" ALL VERIFICATION CHECKS PASSED (6/6 TEST SUITES) ")
        print("==================================================")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAIL] Assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        sys.exit(2)
