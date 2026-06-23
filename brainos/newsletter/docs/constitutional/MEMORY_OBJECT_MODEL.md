# MEMORY OBJECT MODEL

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Define the minimum memory objects required for a real intelligence system. Classify each as REQUIRED, OPTIONAL, or UNNECESSARY.

---

## EXECUTIVE SUMMARY

**Only 2 memory objects are REQUIRED.** Newsletter and Article are REQUIRED because they are the primary data sources. Digest, Topic, Insight, Tag, Theme are OPTIONAL because they are derived from primary data. Project, Decision, Task, Person, Company are UNNECESSARY because they are not currently tracked and have no clear use case.

---

## MEMORY OBJECT: Newsletter

**Current Status:** EXISTS (SQLite newsletters table)

**Definition:** An email newsletter received from Yahoo Mail containing subject, sender, body, word count, received_at, processed_at, summary, tags, key_ideas, actionable_insights, archived.

**Purpose:** Primary data source for newsletter ingestion and processing.

**Classification:** REQUIRED

**Justification:**
- Newsletter is the primary input to the system
- Newsletter is the source of truth for all derived data (summary, topics, insights, tags)
- Newsletter is required for digest generation
- Newsletter is required for archival
- Newsletter is required for retrieval

**Required Fields:**
- message_id (UNIQUE)
- subject
- sender
- body
- word_count
- received_at
- processed_at
- summary
- tags
- key_ideas
- actionable_insights
- archived

**Optional Fields:**
- NONE (all fields are required)

**Evidence:**
- SQLite newsletters table exists
- crx-newsletter-brain/worker.py processes newsletters
- crx-newsletter-brain/database.py stores newsletters
- crx-newsletter-brain/dashboard.py displays newsletters

---

## MEMORY OBJECT: Article

**Current Status:** EXISTS (SQLite articles table)

**Definition:** An article fetched from RSS feeds containing url, title, summary, source, published_at, processed_at, tags.

**Purpose:** Primary data source for article ingestion and processing.

**Classification:** REQUIRED

**Justification:**
- Article is the primary input to the digestion worker
- Article is the source of truth for all derived data (summary, tags)
- Article is required for archival
- Article is required for retrieval

**Required Fields:**
- url (UNIQUE)
- title
- summary
- source
- published_at
- processed_at
- tags

**Optional Fields:**
- NONE (all fields are required)

**Evidence:**
- SQLite articles table exists
- crx-digestion-worker/worker.py processes articles
- crx-digestion-worker/database.py stores articles

---

## MEMORY OBJECT: Digest

**Current Status:** EXISTS (SQLite digests table)

**Definition:** A digest generated from newsletters containing type, date, content, generated_at, newsletter_count.

**Purpose:** Derived data source for daily and weekly summaries.

**Classification:** OPTIONAL

**Justification:**
- Digest is derived from newsletters
- Digest can be regenerated from newsletters at any time
- Digest is not required for core functionality
- Digest is a convenience for quick access to summaries

**Required Fields:**
- type
- date
- content
- generated_at
- newsletter_count

**Optional Fields:**
- NONE (all fields are required)

**Evidence:**
- SQLite digests table exists
- crx-newsletter-brain/digest_generator.py generates digests
- crx-newsletter-brain/database.py stores digests

---

## MEMORY OBJECT: Topic

**Current Status:** EXISTS (SQLite newsletter_topics table, SQLite newsletters.tags field)

**Definition:** A topic extracted from a newsletter containing article_id, topic, confidence, created_at.

**Purpose:** Derived data source for topic classification and search.

**Classification:** OPTIONAL

**Justification:**
- Topic is derived from newsletters
- Topic can be regenerated from newsletters at any time
- Topic is not required for core functionality
- Topic is a convenience for topic-based search

**Required Fields:**
- article_id
- topic
- confidence
- created_at

**Optional Fields:**
- NONE (all fields are required)

**Evidence:**
- SQLite newsletter_topics table exists
- SQLite newsletters.tags field exists
- crx-newsletter-brain/summarizer.py extracts topics
- crx-newsletter-brain/database.py stores topics

---

## MEMORY OBJECT: Insight

**Current Status:** EXISTS (SQLite newsletters.key_ideas field, SQLite newsletters.actionable_insights field)

**Definition:** An insight extracted from a newsletter containing key_ideas, actionable_insights.

**Purpose:** Derived data source for insight-based search and recommendations.

**Classification:** OPTIONAL

**Justification:**
- Insight is derived from newsletters
- Insight can be regenerated from newsletters at any time
- Insight is not required for core functionality
- Insight is a convenience for insight-based search

**Required Fields:**
- key_ideas
- actionable_insights

**Optional Fields:**
- NONE (all fields are required)

**Evidence:**
- SQLite newsletters.key_ideas field exists
- SQLite newsletters.actionable_insights field exists
- crx-newsletter-brain/summarizer.py extracts insights
- crx-newsletter-brain/database.py stores insights

---

## MEMORY OBJECT: Tag

**Current Status:** EXISTS (SQLite newsletters.tags field, SQLite articles.tags field)

**Definition:** A tag extracted from a newsletter or article containing tags.

**Purpose:** Derived data source for tag-based search and filtering.

**Classification:** OPTIONAL

**Justification:**
- Tag is derived from newsletters and articles
- Tag can be regenerated from newsletters and articles at any time
- Tag is not required for core functionality
- Tag is a convenience for tag-based search

**Required Fields:**
- tags

**Optional Fields:**
- NONE (all fields are required)

**Evidence:**
- SQLite newsletters.tags field exists
- SQLite articles.tags field exists
- crx-newsletter-brain/summarizer.py extracts tags
- crx-digestion-worker/summarizer.py extracts tags
- crx-newsletter-brain/database.py stores tags
- crx-digestion-worker/database.py stores tags

---

## MEMORY OBJECT: Theme

**Current Status:** DOES NOT EXIST

**Definition:** A theme extracted from multiple newsletters containing name, frequency, last_seen, related_newsletters.

**Purpose:** Derived data source for theme-based search and trend analysis.

**Classification:** OPTIONAL

**Justification:**
- Theme is derived from newsletters
- Theme can be regenerated from newsletters at any time
- Theme is not required for core functionality
- Theme is a convenience for theme-based search and trend analysis

**Required Fields:**
- name
- frequency
- last_seen
- related_newsletters

**Optional Fields:**
- NONE (all fields are required)

**Evidence:**
- Theme does not exist
- No theme extraction exists
- No theme tracking exists

---

## MEMORY OBJECT: Project

**Current Status:** DOES NOT EXIST

**Definition:** A project containing name, description, status, created_at, updated_at, dependencies, blockers.

**Purpose:** Project tracking and management.

**Classification:** UNNECESSARY

**Justification:**
- Project is not currently tracked
- Project has no clear use case in the current system
- Project is not required for core functionality
- Project is not derived from newsletters or articles
- Project is user-defined metadata that is not currently captured

**Required Fields:**
- name
- description
- status
- created_at
- updated_at

**Optional Fields:**
- dependencies
- blockers

**Evidence:**
- Project does not exist
- No project tracking exists
- No project management exists

---

## MEMORY OBJECT: Decision

**Current Status:** DOES NOT EXIST

**Definition:** A decision containing context, rationale, outcome, created_at, related_newsletters, related_articles.

**Purpose:** Decision tracking and management.

**Classification:** UNNECESSARY

**Justification:**
- Decision is not currently tracked
- Decision has no clear use case in the current system
- Decision is not required for core functionality
- Decision is not derived from newsletters or articles
- Decision is user-defined metadata that is not currently captured

**Required Fields:**
- context
- rationale
- outcome
- created_at

**Optional Fields:**
- related_newsletters
- related_articles

**Evidence:**
- Decision does not exist
- No decision tracking exists
- No decision management exists

---

## MEMORY OBJECT: Task

**Current Status:** DOES NOT EXIST

**Definition:** A task containing description, priority, deadline, status, created_at, updated_at, dependencies, blockers.

**Purpose:** Task tracking and management.

**Classification:** UNNECESSARY

**Justification:**
- Task is not currently tracked
- Task has no clear use case in the current system
- Task is not required for core functionality
- Task is not derived from newsletters or articles
- Task is user-defined metadata that is not currently captured

**Required Fields:**
- description
- priority
- deadline
- status
- created_at
- updated_at

**Optional Fields:**
- dependencies
- blockers

**Evidence:**
- Task does not exist
- No task tracking exists
- No task management exists

---

## MEMORY OBJECT: Person

**Current Status:** DOES NOT EXIST

**Definition:** A person containing name, email, organization, role, related_newsletters, related_articles.

**Purpose:** Person tracking and relationship management.

**Classification:** UNNECESSARY

**Justification:**
- Person is not currently tracked
- Person has no clear use case in the current system
- Person is not required for core functionality
- Person is not derived from newsletters or articles
- Person is user-defined metadata that is not currently captured

**Required Fields:**
- name
- email

**Optional Fields:**
- organization
- role
- related_newsletters
- related_articles

**Evidence:**
- Person does not exist
- No person tracking exists
- No entity extraction exists

---

## MEMORY OBJECT: Company

**Current Status:** DOES NOT EXIST

**Definition:** A company containing name, domain, industry, related_newsletters, related_articles.

**Purpose:** Company tracking and relationship management.

**Classification:** UNNECESSARY

**Justification:**
- Company is not currently tracked
- Company has no clear use case in the current system
- Company is not required for core functionality
- Company is not derived from newsletters or articles
- Company is user-defined metadata that is not currently captured

**Required Fields:**
- name
- domain

**Optional Fields:**
- industry
- related_newsletters
- related_articles

**Evidence:**
- Company does not exist
- No company tracking exists
- No entity extraction exists

---

## CRITICAL FINDINGS

1. **Only 2 memory objects are REQUIRED.** Newsletter and Article are REQUIRED because they are the primary data sources. All other memory objects are OPTIONAL or UNNECESSARY.

2. **Digest, Topic, Insight, Tag, Theme are OPTIONAL.** These are derived from primary data and can be regenerated at any time. They are not required for core functionality.

3. **Project, Decision, Task, Person, Company are UNNECESSARY.** These are user-defined metadata that are not currently tracked and have no clear use case in the current system.

4. **No entity extraction exists.** Person and Company are UNNECESSARY because no entity extraction exists and there is no clear use case for entity tracking.

5. **No project tracking exists.** Project is UNNECESSARY because no project tracking exists and there is no clear use case for project management.

6. **No decision tracking exists.** Decision is UNNECESSARY because no decision tracking exists and there is no clear use case for decision management.

7. **No task tracking exists.** Task is UNNECESSARY because no task tracking exists and there is no clear use case for task management.

8. **Theme does not exist.** Theme is OPTIONAL because it can be derived from newsletters but does not currently exist.

---

## ANSWER

**Newsletter:** REQUIRED
- Current Status: EXISTS (SQLite newsletters table)
- Justification: Primary data source, source of truth for derived data, required for digest generation, archival, retrieval

**Article:** REQUIRED
- Current Status: EXISTS (SQLite articles table)
- Justification: Primary data source, source of truth for derived data, required for archival, retrieval

**Digest:** OPTIONAL
- Current Status: EXISTS (SQLite digests table)
- Justification: Derived from newsletters, can be regenerated, not required for core functionality

**Topic:** OPTIONAL
- Current Status: EXISTS (SQLite newsletter_topics table, SQLite newsletters.tags field)
- Justification: Derived from newsletters, can be regenerated, not required for core functionality

**Insight:** OPTIONAL
- Current Status: EXISTS (SQLite newsletters.key_ideas field, SQLite newsletters.actionable_insights field)
- Justification: Derived from newsletters, can be regenerated, not required for core functionality

**Tag:** OPTIONAL
- Current Status: EXISTS (SQLite newsletters.tags field, SQLite articles.tags field)
- Justification: Derived from newsletters and articles, can be regenerated, not required for core functionality

**Theme:** OPTIONAL
- Current Status: DOES NOT EXIST
- Justification: Can be derived from newsletters, not required for core functionality

**Project:** UNNECESSARY
- Current Status: DOES NOT EXIST
- Justification: Not currently tracked, no clear use case, not derived from newsletters or articles

**Decision:** UNNECESSARY
- Current Status: DOES NOT EXIST
- Justification: Not currently tracked, no clear use case, not derived from newsletters or articles

**Task:** UNNECESSARY
- Current Status: DOES NOT EXIST
- Justification: Not currently tracked, no clear use case, not derived from newsletters or articles

**Person:** UNNECESSARY
- Current Status: DOES NOT EXIST
- Justification: Not currently tracked, no clear use case, not derived from newsletters or articles

**Company:** UNNECESSARY
- Current Status: DOES NOT EXIST
- Justification: Not currently tracked, no clear use case, not derived from newsletters or articles
