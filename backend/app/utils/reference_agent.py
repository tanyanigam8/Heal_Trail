# ✅ app/utils/reference_agent.py

import requests
from bs4 import BeautifulSoup

def get_reference_range(metric_name: str) -> list:
    """
    Scrapes MedlinePlus or other medical board sites for reference ranges.
    This simulates a national-board-backed value.
    """
    query = f"{metric_name} normal reference range site:medlineplus.gov"
    url = f"https://html.duckduckgo.com/html?q={query}"

    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(response.text, "html.parser")
        results = soup.find_all("a", {"class": "result__a"}, limit=1)

        if results:
            snippet = results[0].text
            # Attempt basic extraction of numerical range
            import re
            match = re.findall(r"(\d+\.?\d*)\s*[-to–]\s*(\d+\.?\d*)", snippet)
            if match:
                return [float(match[0][0]), float(match[0][1])]
    except Exception as e:
        print("❌ Reference Agent Error:", e)

    return [0.0, 0.0]  # fallback if nothing found
