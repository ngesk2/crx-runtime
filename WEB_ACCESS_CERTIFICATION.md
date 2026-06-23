# WEB ACCESS CERTIFICATION

**Date:** 2026-06-22  
**Phase:** Phase 2 - Web Access  
**Purpose:** Configure web search access for Open WebUI agents  
**Status:** ⚠️ CONFIGURATION REQUIRED

---

## EXECUTIVE SUMMARY

**Objective:** Enable Open WebUI agents to search and retrieve web content using existing MCP web search servers.

**Constraints:**
- NO browser automation
- NO Chrome scraping
- NO new RAG system
- Use existing MCP server (Brave/Tavily/Serper)

**Required Tools:**
- search_web
- fetch_url

---

## RECOMMENDED MCP SERVERS

### Option 1: Brave Search MCP
**Pros:**
- Free tier available
- Good search quality
- Privacy-focused

**Setup:**
```bash
npm install -g @modelcontextprotocol/server-brave-search
```

**Configuration:**
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Option 2: Tavily MCP
**Pros:**
- Designed for AI agents
- Good for research
- Free tier available

**Setup:**
```bash
npm install -g @modelcontextprotocol/server-tavily-search
```

**Configuration:**
```json
{
  "mcpServers": {
    "tavily-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-tavily-search"],
      "env": {
        "TAVILY_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Option 3: Serper MCP
**Pros:**
- Google Search API
- Good results
- Low cost

**Setup:**
```bash
npm install -g @modelcontextprotocol/server-serper
```

**Configuration:**
```json
{
  "mcpServers": {
    "serper": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-serper"],
      "env": {
        "SERPER_API_KEY": "your-api-key"
      }
    }
  }
}
```

---

## IMPLEMENTATION STATUS

**Current Status:** CONFIGURATION REQUIRED

**Completed:**
- ✅ Research on available MCP servers
- ✅ Configuration templates prepared

**Pending:**
- ⏳ Select MCP server (Brave/Tavily/Serper)
- ⏳ Obtain API key
- ⏳ Configure MCP server
- ⏳ Test search_web("latest qdrant release")
- ⏳ Verify results

---

## INTEGRATION STEPS

1. **Select MCP Server**
   - Choose Brave, Tavily, or Serper based on preference
   - Sign up for API key

2. **Install MCP Server**
   ```bash
   npm install -g @modelcontextprotocol/server-[selected]
   ```

3. **Configure Open WebUI**
   - Add MCP server configuration to Open WebUI settings
   - Set API key in environment

4. **Test Integration**
   ```python
   # Test from Open WebUI
   search_web("latest qdrant release")
   ```

5. **Verify Results**
   - Confirm search returns relevant results
   - Confirm fetch_url works

---

## VERIFICATION CRITERIA

| Criterion | Status | Evidence |
|-----------|--------|----------|
| MCP server selected | ❌ PENDING | User to select |
| API key obtained | ❌ PENDING | User to obtain |
| MCP server configured | ❌ PENDING | Configuration pending |
| search_web works | ❌ PENDING | Test pending |
| fetch_url works | ❌ PENDING | Test pending |

---

## CONCLUSION

**Status:** ⚠️ CONFIGURATION REQUIRED

**Summary:** Web access requires user to select an MCP server (Brave/Tavily/Serper), obtain API key, and configure the server. No code changes required - only configuration.

**Next Phase:** Phase 3 - Google Drive Survivability
