import os
from datetime import datetime, timedelta
from typing import List, Dict
from database import get_newsletters_by_date_range, save_digest

DIGEST_DIR = "digests"

def generate_daily_digest(date: str = None) -> str:
    """Generate daily digest of newsletters."""
    if not date:
        date = datetime.utcnow().strftime('%Y-%m-%d')
    
    # Get newsletters for the day
    start_date = f"{date}T00:00:00"
    end_date = f"{date}T23:59:59"
    
    newsletters = get_newsletters_by_date_range(start_date, end_date)
    
    if not newsletters:
        return f"# Daily Digest - {date}\n\nNo newsletters processed today."
    
    # Generate digest content
    digest_content = f"""# Daily Digest - {date}

**Newsletter Count:** {len(newsletters)}
**Generated:** {datetime.utcnow().isoformat()}

---

"""
    
    for newsletter in newsletters:
        digest_content += f"""## {newsletter['subject']}

**From:** {newsletter['sender']}

### Summary
{newsletter['summary']}

### Tags
{newsletter['tags']}

### Key Ideas
{newsletter['key_ideas']}

### Actionable Insights
{newsletter['actionable_insights']}

---

"""
    
    # Save digest to database
    save_digest('daily', date, digest_content, len(newsletters))
    
    # Save digest to file
    os.makedirs(DIGEST_DIR, exist_ok=True)
    digest_file = os.path.join(DIGEST_DIR, f"daily-{date}.md")
    with open(digest_file, 'w', encoding='utf-8') as f:
        f.write(digest_content)
    
    return digest_content

def generate_weekly_report(date: str = None) -> str:
    """Generate weekly intelligence report."""
    if not date:
        date = datetime.utcnow().strftime('%Y-%m-%d')
    
    # Calculate week range
    dt = datetime.strptime(date, '%Y-%m-%d')
    start_of_week = dt - timedelta(days=dt.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    start_date = start_of_week.strftime('%Y-%m-%dT00:00:00')
    end_date = end_of_week.strftime('%Y-%m-%dT23:59:59')
    
    # Get newsletters for the week
    newsletters = get_newsletters_by_date_range(start_date, end_date)
    
    if not newsletters:
        return f"# Weekly Intelligence Report - Week of {start_of_week.strftime('%Y-%m-%d')}\n\nNo newsletters processed this week."
    
    # Extract all tags
    all_tags = set()
    for newsletter in newsletters:
        tags = newsletter.get('tags', '').split(',')
        all_tags.update([tag.strip() for tag in tags])
    
    # Generate report content
    report_content = f"""# Weekly Intelligence Report

**Week:** {start_of_week.strftime('%Y-%m-%d')} to {end_of_week.strftime('%Y-%m-%d')}
**Newsletter Count:** {len(newsletters)}
**Generated:** {datetime.utcnow().isoformat()}

## Top Themes

{', '.join(sorted(all_tags))}

---

## Newsletter Summaries

"""
    
    for newsletter in newsletters:
        report_content += f"""### {newsletter['subject']}
**From:** {newsletter['sender']} | **Date:** {newsletter['received_at']}

{newsletter['summary']}

**Key Ideas:**
{newsletter['key_ideas']}

**Actionable Insights:**
{newsletter['actionable_insights']}

---

"""
    
    # Save report to database
    save_digest('weekly', date, report_content, len(newsletters))
    
    # Save report to file
    os.makedirs(DIGEST_DIR, exist_ok=True)
    report_file = os.path.join(DIGEST_DIR, f"weekly-{date}.md")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report_content)
    
    return report_content
