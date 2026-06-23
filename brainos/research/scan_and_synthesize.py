#!/usr/bin/env python3
"""
Research and synthesis pipeline for Replayable Internet Relationship Infrastructure.
Scans GitHub trending, arXiv, and Hacker News for relevant developments.
Produces a daily briefing.
"""

import os
import sys
import json
import datetime
import re
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode, quote_plus

# Configuration
GITHUB_API_URL = "https://api.github.com/search/repositories"
ARXIV_API_URL = "http://export.arxiv.org/api/query"
HACKERNEWS_API_URL = "https://hn.algolia.com/api/v1/search_by_date"

# Keywords for topics (lowercase)
KEYWORDS = {
    "deterministic_replay": ["deterministic replay", "replay", "deterministic execution", "record and replay"],
    "event_sourcing": ["event sourcing", "event-sourcing", "event sourced"],
    "immutable_lineage": ["immutable lineage", "lineage", "provenance", "immutable"],
    "witness_provenance": ["witness", "provenance", "attestation"],
    "canonical_serialization": ["canonical serialization", "canonical", "serialization", "deterministic serialization"],
    "replayable_state_machines": ["replayable state machine", "state machine", "finite state machine", "FSM"],
    "constitutional_kernels": ["constitutional kernel", "kernel", "constitutional"],
    "browser_native_semantic_objects": ["browser native", "semantic object", "semantic HTML", "structured data"],
    "web_components_declarative_hydration": ["Web Components", "declarative hydration", "hydration"],
    "ai_readable_web_infrastructure": ["AI readable", "machine readable web", "semantic web"],
    "semantic_relationship_graphs": ["semantic relationship", "relationship graph", "knowledge graph"],
    "signed_event_protocols": ["signed event", "signature", "protocol"],
    "portable_identity_systems": ["portable identity", "decentralized identity", "DID", "self-sovereign"],
    "ai_agent_interoperability": ["AI agent", "agent interoperability", "agent communication"],
    "edge_native_runtime_infrastructure": ["edge native", "edge runtime", "edge computing"],
    "attribution_infrastructure": ["attribution", "attribution infrastructure"],
    "provenance_aware_ai_systems": ["provenance aware", "AI provenance"],
    "trust_graphs": ["trust graph", "trust"],
    "replayable_social_infrastructure": ["replayable social", "social infrastructure"],
    "mcp_compatible_interaction_layers": ["MCP", "model context protocol"],
    "programmable_semantic_objects": ["programmable semantic object"],
    "structured_attribution_systems": ["structured attribution"],
    "cryptographic_replay_validation": ["cryptographic replay", "replay validation"],
    "event_ledger_architectures": ["event ledger", "ledger"],
    "projection_rebuild_systems": ["projection rebuild"],
    "edge_hydrated_semantic_runtimes": ["edge hydrated", "semantic runtime"],
    "passkey_webauthn_identity": ["passkey", "WebAuthn", "identity infrastructure"],
    "activitypub_nostr_did": ["ActivityPub", "Nostr", "DID"],
    "cloudflare_workers_edge_object": ["Cloudflare Workers", "edge object resolution"],
    "stripe_programmable_attribution": ["Stripe", "programmable attribution"],
    "git_like_immutable_relationship": ["Git-like", "immutable relationship history"]
}

def fetch_github_trending(since_days=7):
    """Fetch trending repositories from GitHub API."""
    try:
        # Calculate date N days ago
        date_from = (datetime.datetime.now() - datetime.timedelta(days=since_days)).strftime("%Y-%m-%d")
        query = f"pushed:>{date_from}"
        params = {
            "q": query,
            "sort": "stars",
            "order": "desc",
            "per_page": 20
        }
        # Build query string
        query_string = urlencode(params)
        url = f"{GITHUB_API_URL}?{query_string}"
        req = Request(url, headers={'User-Agent': 'Hermes-Agent-Research-Pipeline'})
        response = urlopen(req, timeout=10)
        data = json.load(response)
        return data.get('items', [])
    except Exception as e:
        print(f"Error fetching GitHub trending: {e}", file=sys.stderr)
        return []

def fetch_arxiv_recent(max_results=20):
    """Fetch recent papers from arXiv."""
    try:
        # Query for relevant categories
        query = "cat:cs.DL OR cat:cs.AI OR cat:cs.IR OR cat:cs.SE OR cat:cs.CY OR cat:cs.DB"
        params = {
            "search_query": query,
            "start": 0,
            "max_results": max_results,
            "sortBy": "submittedDate",
            "sortOrder": "descending"
        }
        query_string = urlencode(params)
        url = f"{ARXIV_API_URL}?{query_string}"
        req = Request(url, headers={'User-Agent': 'Hermes-Agent-Research-Pipeline'})
        response = urlopen(req, timeout=10)
        # Parse the XML response (simplified, we'll just get the entry tags)
        import xml.etree.ElementTree as ET
        data = response.read()
        root = ET.fromstring(data)
        entries = []
        for entry in root.findall('.//{http://www.w3.org/2005/Atom}entry'):
            title = entry.find('./{http://www.w3.org/2005/Atom}title').text
            summary = entry.find('./{http://www.w3.org/2005/Atom}summary').text
            link = entry.find('./{http://www.w3.org/2005/Atom}id').text
            published = entry.find('./{http://www.w3.org/2005/Atom}published').text
            entries.append({
                'title': title.strip(),
                'summary': summary.strip(),
                'link': link.strip(),
                'published': published.strip()
            })
        return entries
    except Exception as e:
        print(f"Error fetching arXiv: {e}", file=sys.stderr)
        return []

def fetch_hackernews_recent(keywords_list, hours=24):
    """Fetch recent Hacker News stories matching keywords."""
    try:
        # We'll search for each keyword and combine results
        stories = []
        for keyword in keywords_list:
            params = {
                "query": keyword,
                "tags": "story",
                "numericFilters": f"created_at_i>{int((datetime.datetime.now() - datetime.timedelta(hours=hours)).timestamp())}"
            }
            query_string = urlencode(params)
            url = f"{HACKERNEWS_API_URL}?{query_string}"
            req = Request(url, headers={'User-Agent': 'Hermes-Agent-Research-Pipeline'})
            response = urlopen(req, timeout=10)
            data = json.load(response)
            for hit in data.get('hits', []):
                stories.append({
                    'title': hit.get('title', ''),
                    'url': hit.get('url', ''),
                    'author': hit.get('author', ''),
                    'points': hit.get('points', 0),
                    'num_comments': hit.get('num_comments', 0),
                    'objectID': hit.get('objectID', '')
                })
        # Deduplicate by objectID
        seen = set()
        unique_stories = []
        for story in stories:
            if story['objectID'] not in seen:
                seen.add(story['objectID'])
                unique_stories.append(story)
        return unique_stories
    except Exception as e:
        print(f"Error fetching Hacker News: {e}", file=sys.stderr)
        return []

def classify_item(title, description=""):
    """Classify an item based on keywords and simple heuristics."""
    text = (title + " " + description).lower()
    matches = []
    for category, kwlist in KEYWORDS.items():
        for kw in kwlist:
            if kw in text:
                matches.append(category)
                break
    # For simplicity, we'll assign to the first matching category's broad classification
    # In a real system, we would have a more sophisticated classification.
    if not matches:
        return "future_compatible"  # default
    # Map some categories to our classification buckets (simplified)
    if any(c in matches for c in ["deterministic_replay", "event_sourcing", "immutable_lineage", "witness_provenance"]):
        return "constitutional_layer_relevant"
    elif any(c in matches for c in ["browser_native_semantic_objects", "web_components_declarative_hydration", "ai_readable_web_infrastructure"]):
        return "layer_1_semantic_object_relevant"
    elif any(c in matches for c in ["edge_native_runtime_infrastructure", "edge_hydrated_semantic_runtimes", "passkey_webauthn_identity", "cloudflare_workers_edge_object"]):
        return "edge_infrastructure_relevant"
    elif any(c in matches for c in ["ai_agent_interoperability", "mcp_compatible_interaction_layers", "programmable_semantic_objects"]):
        return "ai_agent_fabric_relevant"
    elif any(c in matches for c in ["attribution_infrastructure", "stripe_programmable_attribution", "structured_attribution_systems"]):
        return "ai_agent_fabric_relevant"  # or edge? we'll put in ai_agent for now
    else:
        return "future_compatible"

def generate_report(github_items, arxiv_items, hn_items):
    """Generate a markdown report."""
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report = f"# Replayable Internet Relationship Infrastructure Daily Briefing\n\n"
    report += f"**Generated at:** {now}\n\n"
    
    # GitHub Trending
    report += "## 🔥 GitHub Trending (Last 7 Days)\n\n"
    if github_items:
        for repo in github_items[:10]:  # Top 10
            name = repo.get('full_name', 'Unknown')
            description = repo.get('description', 'No description')
            url = repo.get('html_url', '#')
            stars = repo.get('stargazers_count', 0)
            report += f"- **[{name}]({url})** ⭐ {stars}\n"
            report += f"  - {description}\n"
            # Classify
            classification = classify_item(name, description)
            report += f"  - *Classification:* {classification}\n\n"
    else:
        report += "No data available.\n\n"
    
    # arXiv Recent
    report += "## 📄 arXiv Recent Papers (Last 20)\n\n"
    if arxiv_items:
        for paper in arxiv_items[:10]:
            title = paper.get('title', 'No title')
            summary = paper.get('summary', 'No summary')
            link = paper.get('link', '#')
            report += f"- **[{title}]({link})**\n"
            report += f"  - {summary[:200]}...\n"
            classification = classify_item(title, summary)
            report += f"  - *Classification:* {classification}\n\n"
    else:
        report += "No data available.\n\n"
    
    # Hacker News
    report += "## 💬 Hacker News Recent (Last 24 Hours)\n\n"
    if hn_items:
        for item in hn_items[:10]:
            title = item.get('title', 'No title')
            url = item.get('url', '#')
            author = item.get('author', 'Unknown')
            points = item.get('points', 0)
            comments = item.get('num_comments', 0)
            report += f"- **[{title}]({url})** by {author} (👍 {points}, 💬 {comments})\n"
            classification = classify_item(title, "")
            report += f"  - *Classification:* {classification}\n\n"
    else:
        report += "No data available.\n\n"
    
    # Summary
    report += "## 📊 Summary\n\n"
    report += f"- Total GitHub repos scanned: {len(github_items)}\n"
    report += f"- Total arXiv papers scanned: {len(arxiv_items)}\n"
    report += f"- Total HN stories scanned: {len(hn_items)}\n"
    report += "\n"
    report += "## 📝 Notes\n\n"
    report += "This is an automated briefing. For more details, visit the sources.\n"
    return report

def main():
    """Main function."""
    print("Fetching GitHub trending...")
    github_items = fetch_github_trending()
    print(f"Found {len(github_items)} repositories.")
    
    print("Fetching arXiv recent papers...")
    arxiv_items = fetch_arxiv_recent()
    print(f"Found {len(arxiv_items)} papers.")
    
    # Flatten all keywords for HN search
    all_keywords = []
    for kwlist in KEYWORDS.values():
        all_keywords.extend(kwlist)
    # Deduplicate
    all_keywords = list(set(all_keywords))
    print("Fetching Hacker News recent stories...")
    hn_items = fetch_hackernews_recent(all_keywords[:10])  # Limit to first 10 keywords to avoid too many requests
    print(f"Found {len(hn_items)} stories.")
    
    report = generate_report(github_items, arxiv_items, hn_items)
    
    # Output to stdout (which will be captured by the cron job and sent to the user)
    print(report)
    
    # Also save to a file for record
    os.makedirs('reports', exist_ok=True)
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    report_file = f"reports/briefing_{date_str}.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f"\nReport saved to {report_file}")

if __name__ == "__main__":
    main()