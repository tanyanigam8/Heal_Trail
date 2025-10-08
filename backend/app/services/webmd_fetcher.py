from __future__ import annotations

import os
import re
import html
import logging
from typing import Optional, List
from urllib.parse import unquote, quote, urlparse

import httpx

__all__ = ["fetch_webmd_suggestions"]

# -------------------- Settings --------------------
ENABLED = os.getenv("WEBMD_SUGGESTIONS_ENABLED", "true").lower() == "true"
TIMEOUT = float(os.getenv("WEBMD_TIMEOUT_SECONDS", "8") or 8.0)
DEBUG = os.getenv("WEBMD_DEBUG", "false").lower() == "true"

# -------------------- Logger --------------------
logger = logging.getLogger("webmd_fetcher")
if DEBUG:
    logger.setLevel(logging.DEBUG)
    if not logger.handlers:
        _h = logging.StreamHandler()
        _h.setFormatter(logging.Formatter("[webmd] %(levelname)s: %(message)s"))
        logger.addHandler(_h)
else:
    logger.addHandler(logging.NullHandler())

def _log(msg: str) -> None:
    logger.debug(msg)

# -------------------- HTTP --------------------
_client = httpx.Client(
    follow_redirects=True,
    timeout=TIMEOUT,
    headers={
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/123.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    },
)

_DDG_HTML = "https://duckduckgo.com/html"
_DDG_LITE = "https://lite.duckduckgo.com/lite/"
_WEBMD_SEARCH = "https://www.webmd.com/search/search_results/default.aspx"
_JINA_PROXY = "https://r.jina.ai/http/"
_WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/"

# -------------------- Synonyms / term helpers --------------------
_SYNONYMS = [
    (r"\blow platelets?\b", "thrombocytopenia"),
    (r"\bhigh platelets?\b", "thrombocytosis"),
    (r"\blow wbc\b|\blow white blood cell", "leukopenia"),
    (r"\bhigh wbc\b|\bhigh white blood cell", "leukocytosis"),
    (r"\blow hemoglobin\b|\blow rbc\b|\blow hematocrit\b", "anemia"),
    (r"\bhigh hemoglobin\b|\bhigh rbc\b|\bhigh hematocrit\b", "polycythemia"),
    (r"\bhigh glucose\b|\bhigh blood sugar\b|\bhyperglycemia\b", "hyperglycemia"),
    (r"\blow glucose\b|\blow blood sugar\b|\bhypoglycemia\b", "hypoglycemia"),
    (r"\blow mcv\b", "microcytic anemia"),
    (r"\bhigh mcv\b", "macrocytosis"),
    (r"\blow mchc\b", "hypochromia"),
]

_KEY_TERMS = {
    "hemoglobin","hematocrit","platelet","glucose","wbc","white-blood-cell",
    "rbc","red-blood-cell","mcv","mch","mchc","thrombocytopenia","thrombocytosis",
    "leukopenia","leukocytosis","polycythemia","anemia","hyperglycemia","hypoglycemia",
    "macrocytosis","microcytic","hypochromia",
}

def _terms_for(query: str) -> List[str]:
    terms = set()
    q = re.sub(r"[^a-z0-9\s\-]+", " ", query.lower())
    for t in q.split():
        if len(t) >= 3:
            terms.add(t)
    for pat, syn in _SYNONYMS:
        if re.search(pat, query.lower()):
            for t in syn.lower().split():
                terms.add(t)
    # keep only known-ish medical tokens or the original words
    whitelisted = set()
    for t in terms:
        if t in _KEY_TERMS or t in q:
            whitelisted.add(t)
    # always include original query tokens
    for t in q.split():
        if len(t) >= 3:
            whitelisted.add(t)
    return [t for t in whitelisted if t]

# -------------------- URL filters --------------------
_BAD_PATH_TOKENS = {
    "duckduckgo.com","opensearch","search","symptom-checker","rx","providers",
    "find-a-doctor","drugs","login","video","terms","privacy",
    "health-topics","a-to-z-guides/health-topics","default.htm",
}

def _clean_html(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"(?is)<script.*?>.*?</script>|<style.*?>.*?</style>", "", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"^WebMD Health Search .*? View All ", "", text, flags=re.I)
    return text

def _valid_webmd_path(path: str) -> bool:
    if not path or path == "/":
        return False
    p = path.lower()
    if any(tok in p for tok in _BAD_PATH_TOKENS):
        return False
    parts = [s for s in p.split("/") if s]
    return len(parts) >= 2

def _is_article_url(url: str, required_terms: List[str]) -> bool:
    try:
        u = urlparse(url)
        if "webmd.com" not in (u.netloc or ""):
            return False
        if not _valid_webmd_path(u.path or ""):
            return False
        p = (u.path or "").lower()
        # NEW: require at least one relevant term or synonym to appear in path
        if not any(t in p for t in required_terms):
            return False
        return True
    except Exception:
        return False

def _rank(url: str, query_terms: List[str]) -> int:
    # simple scoring: contain more terms, deeper path wins slightly
    p = urlparse(url).path.lower()
    score = sum(1 for t in query_terms if t in p) * 5
    score += p.count("/")
    return score

def _extract_webmd_link(html_text: str, query_terms: List[str]) -> Optional[str]:
    if not html_text:
        return None
    candidates: list[str] = []

    # absolute links
    for m in re.finditer(r'href=["\'](https?://(?:www\.)?webmd\.com[^"\']+)["\']', html_text, re.I):
        cand = m.group(1)
        if _is_article_url(cand, query_terms):
            candidates.append(cand)

    # DDG encoded (?uddg=)
    for m in re.finditer(r'href=["\'][^"\']*uddg=([^"&]+)', html_text, re.I):
        cand = unquote(m.group(1))
        if _is_article_url(cand, query_terms):
            candidates.append(cand)

    # WebMD site search anchors
    for m in re.finditer(
        r'<a[^>]+class="[^"]*search-results-doc-title-link[^"]*"[^>]+href="([^"]+)"',
        html_text, re.I,
    ):
        href = m.group(1)
        cand = href if href.startswith("http") else f"https://www.webmd.com{href}"
        if _is_article_url(cand, query_terms):
            candidates.append(cand)

    candidates = [c for c in candidates if not any(b in c.lower() for b in _BAD_PATH_TOKENS)]
    if not candidates:
        return None
    best = sorted(set(candidates), key=lambda u: _rank(u, query_terms), reverse=True)[0]
    return best

def _meta_description(html_text: str) -> Optional[str]:
    if not html_text:
        return None
    m = re.search(
        r'<meta\s+(?:name|property)=["\'](?:description|og:description)["\']\s+content=["\']([^"\']+)["\']',
        html_text, re.I,
    )
    return html.unescape(m.group(1)).strip() if m else None

# -------------------- Search strategies --------------------
def _search_webmd_once(query: str, terms: List[str]) -> Optional[str]:
    q = f"site:webmd.com {query}"
    _log(f"Searching DDG html: {q}")
    try:
        r = _client.post(_DDG_HTML, data={"q": q})
        _log(f"DDG html status={r.status_code}, len={len(r.text)}")
        r.raise_for_status()
        link = _extract_webmd_link(r.text, terms)
        if link:
            _log(f"WebMD link from DDG html: {link}")
            return link
    except Exception as e:
        _log(f"DDG html failed: {e}")

    _log(f"Searching DDG lite: {q}")
    try:
        r = _client.get(_DDG_LITE, params={"q": q})
        _log(f"DDG lite status={r.status_code}, len={len(r.text)}")
        r.raise_for_status()
        link = _extract_webmd_link(r.text, terms)
        if link:
            _log(f"WebMD link from DDG lite: {link}")
            return link
    except Exception as e:
        _log(f"DDG lite failed: {e}")

    _log(f"Searching WebMD site search: {query}")
    try:
        r = _client.get(_WEBMD_SEARCH, params={"query": query})
        _log(f"WebMD search status={r.status_code}, len={len(r.text)}")
        r.raise_for_status()
        link = _extract_webmd_link(r.text, terms)
        if link:
            _log(f"WebMD link from site search: {link}")
            return link
    except Exception as e:
        _log(f"WebMD site search failed: {e}")

    return None

def _search_webmd(query: str) -> Optional[str]:
    """Try with raw query, then with synonyms-expanded query."""
    terms = _terms_for(query)
    link = _search_webmd_once(query, terms)
    if link:
        return link

    # Expand with synonyms (join terms so they appear in path scoring)
    expanded = " ".join(sorted(set(terms)))
    if expanded and expanded != query.lower():
        _log(f"Retry WebMD search with expanded terms: {expanded}")
        link = _search_webmd_once(expanded, terms)
        if link:
            return link

    _log("No WebMD link found after retries")
    return None

def _wiki_term(query: str) -> str:
    for pat, syn in _SYNONYMS:
        if re.search(pat, query.lower()):
            return syn
    return query

def _wiki_summary_text(query: str) -> str:
    term = _wiki_term(query)
    url = _WIKI_SUMMARY + quote(term)
    _log(f"Wikipedia fallback for '{query}' as '{term}' -> {url}")
    try:
        r = _client.get(url)
        _log(f"Wikipedia status={r.status_code}")
        if r.status_code == 200:
            data = r.json()
            return (data.get("extract") or "").strip()
    except Exception as e:
        _log(f"Wikipedia fetch failed: {e}")
    return ""

# -------------------- Public API --------------------
def fetch_webmd_suggestions(query: str, *, max_chars: int = 1200) -> str:
    """
    Return a short paragraph for `query`.
    Order: WebMD (with strict link gating) -> Wikipedia.
    Returns "" on errors or when disabled.
    """
    if not ENABLED or not query:
        _log(f"Disabled or empty query (ENABLED={ENABLED})")
        return ""

    _log(f"=== fetch_webmd_suggestions('{query}') ===")

    # 1) WebMD
    link = _search_webmd(query)
    if link:
        _log(f"Fetching WebMD article: {link}")
        try:
            resp = _client.get(link)
            _log(f"WebMD article status={resp.status_code}, len={len(resp.text)}")
            if resp.status_code < 400:
                meta = _meta_description(resp.text)
                if meta:
                    _log(f"Using meta description len={len(meta)}")
                    return meta[:max_chars]
                try:
                    prox = _JINA_PROXY + link.replace("://", "://", 1)
                    _log(f"Fetching via proxy: {prox}")
                    rj = _client.get(prox)
                    _log(f"Proxy status={rj.status_code}, len={len(rj.text)}")
                    if rj.status_code < 400 and rj.text.strip():
                        return rj.text.strip()[:max_chars]
                except Exception as e:
                    _log(f"Proxy fetch failed: {e}")
                cleaned = _clean_html(resp.text)
                _log(f"Returning cleaned WebMD len={len(cleaned)}")
                return cleaned[:max_chars]
        except Exception as e:
            _log(f"WebMD fetch error: {e}")

    # 2) Wikipedia fallback (kept because it’s reliable and concise)
    txt = _wiki_summary_text(query)
    if txt:
        return txt[:max_chars]

    _log("All strategies returned empty text")
    return ""
