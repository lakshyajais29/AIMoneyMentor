from collections import defaultdict

# ── Category mapping for top 50 Indian mutual funds ───────────────────────
# Categories: large_cap, mid_cap, small_cap, flexi_cap, elss,
#             debt, hybrid, international, index, liquid
FUND_CATEGORY_MAP: dict[str, str] = {
    # Large Cap
    "mirae asset large cap fund":          "large_cap",
    "axis bluechip fund":                  "large_cap",
    "sbi bluechip fund":                   "large_cap",
    "hdfc top 100 fund":                   "large_cap",
    "icici prudential bluechip fund":      "large_cap",
    "nippon india large cap fund":         "large_cap",
    "kotak bluechip fund":                 "large_cap",
    "dsp top 100 equity fund":             "large_cap",
    "tata large cap fund":                 "large_cap",
    "uti mastershare fund":                "large_cap",

    # Mid Cap
    "axis midcap fund":                    "mid_cap",
    "kotak emerging equity fund":          "mid_cap",
    "dsp midcap fund":                     "mid_cap",
    "hdfc mid-cap opportunities fund":     "mid_cap",
    "nippon india growth fund":            "mid_cap",
    "sbi magnum midcap fund":              "mid_cap",
    "edelweiss mid cap fund":              "mid_cap",
    "pgim india midcap opportunities":     "mid_cap",

    # Small Cap
    "sbi small cap fund":                  "small_cap",
    "axis small cap fund":                 "small_cap",
    "nippon india small cap fund":         "small_cap",
    "kotak small cap fund":                "small_cap",
    "hdfc small cap fund":                 "small_cap",
    "canara robeco small cap fund":        "small_cap",
    "quant small cap fund":                "small_cap",

    # Flexi Cap
    "parag parikh flexi cap fund":         "flexi_cap",
    "axis flexi cap fund":                 "flexi_cap",
    "hdfc flexi cap fund":                 "flexi_cap",
    "sbi flexicap fund":                   "flexi_cap",
    "kotak flexi cap fund":                "flexi_cap",
    "dsp flexi cap fund":                  "flexi_cap",
    "canara robeco flexi cap fund":        "flexi_cap",
    "uti flexi cap fund":                  "flexi_cap",

    # ELSS
    "axis long term equity fund":          "elss",
    "mirae asset elss tax saver fund":     "elss",
    "quant elss tax saver fund":           "elss",
    "sbi long term equity fund":           "elss",
    "dsp elss tax saver fund":             "elss",
    "canara robeco equity tax saver":      "elss",
    "kotak elss tax saver fund":           "elss",

    # Index
    "uti nifty 50 index fund":             "index",
    "hdfc index fund nifty 50 plan":       "index",
    "sbi nifty index fund":                "index",
    "nippon india index fund nifty 50":    "index",
    "motilal oswal nifty 50 index fund":   "index",
    "icici prudential nifty 50 index":     "index",

    # Hybrid
    "hdfc balanced advantage fund":        "hybrid",
    "icici prudential balanced advantage": "hybrid",
    "sbi equity hybrid fund":              "hybrid",
    "kotak equity hybrid fund":            "hybrid",
    "mirae asset aggressive hybrid fund":  "hybrid",

    # Debt
    "hdfc short term debt fund":           "debt",
    "icici prudential corporate bond":     "debt",
    "sbi magnum medium duration fund":     "debt",
    "kotak corporate bond fund":           "debt",
    "nippon india short term fund":        "debt",

    # International
    "parag parikh flexi cap fund":         "flexi_cap",   # has intl exposure
    "motilal oswal nasdaq 100 fund":       "international",
    "mirae asset s&p 500 top 50 etf fof": "international",
    "dsp us flexible equity fund":         "international",
    "edelweiss us technology equities":    "international",

    # Liquid
    "sbi liquid fund":                     "liquid",
    "hdfc liquid fund":                    "liquid",
    "nippon india liquid fund":            "liquid",
}

# Human-readable labels
_CATEGORY_LABELS: dict[str, str] = {
    "large_cap":      "Large Cap",
    "mid_cap":        "Mid Cap",
    "small_cap":      "Small Cap",
    "flexi_cap":      "Flexi Cap",
    "elss":           "ELSS / Tax Saver",
    "index":          "Index Fund",
    "hybrid":         "Hybrid",
    "debt":           "Debt",
    "international":  "International",
    "liquid":         "Liquid",
}


def detect_overlap(fund_names: list[str]) -> list[dict]:
    """
    Given a list of fund names, detect category overlap.

    Returns a list of overlap records for categories where 2+ funds exist:
    [
      {
        "category": "large_cap",
        "category_label": "Large Cap",
        "funds": ["SBI Bluechip Fund", "HDFC Top 100 Fund"],
        "overlap_level": "high"    # high ≥ 3 funds, medium = 2 funds
      }
    ]
    """
    # Map each fund name to its category (case-insensitive fuzzy match)
    category_to_funds: dict[str, list[str]] = defaultdict(list)

    for name in fund_names:
        category = _lookup_category(name)
        category_to_funds[category].append(name)

    overlaps = []
    for category, funds in category_to_funds.items():
        if len(funds) >= 2:
            overlap_level = "high" if len(funds) >= 3 else "medium"
            overlaps.append({
                "category": category,
                "category_label": _CATEGORY_LABELS.get(category, category.replace("_", " ").title()),
                "funds": funds,
                "overlap_level": overlap_level,
            })

    # Sort by number of funds descending
    overlaps.sort(key=lambda x: len(x["funds"]), reverse=True)
    return overlaps


def _lookup_category(fund_name: str) -> str:
    """
    Look up fund category by name. Case-insensitive substring match.
    Falls back to 'equity' if not found.
    """
    lower = fund_name.lower().strip()

    # Exact match first
    if lower in FUND_CATEGORY_MAP:
        return FUND_CATEGORY_MAP[lower]

    # Substring match
    for key, category in FUND_CATEGORY_MAP.items():
        if key in lower or lower in key:
            return category

    # Keyword heuristics for unknown funds
    if any(k in lower for k in ["liquid", "overnight", "money market"]):
        return "liquid"
    if any(k in lower for k in ["debt", "bond", "gilt", "duration", "credit"]):
        return "debt"
    if any(k in lower for k in ["index", "nifty", "sensex", "etf"]):
        return "index"
    if any(k in lower for k in ["elss", "tax saver", "long term equity"]):
        return "elss"
    if any(k in lower for k in ["small cap", "smallcap"]):
        return "small_cap"
    if any(k in lower for k in ["mid cap", "midcap"]):
        return "mid_cap"
    if any(k in lower for k in ["large cap", "largecap", "bluechip", "top 100"]):
        return "large_cap"
    if any(k in lower for k in ["flexi", "multi cap", "multicap"]):
        return "flexi_cap"
    if any(k in lower for k in ["hybrid", "balanced", "equity savings"]):
        return "hybrid"
    if any(k in lower for k in ["nasdaq", "s&p", "global", "us ", "international"]):
        return "international"

    return "equity"  # generic fallback
