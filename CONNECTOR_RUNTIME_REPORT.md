# CONNECTOR RUNTIME REPORT

## Scope
This report records only connectors that can be evidenced from runtime artifacts or compose definitions.

## Connector inventory
| Connector | Evidence | Status |
|---|---|---|
| GitHub | Config present in [.env.base](.env.base) | CONFIGURED / UNVERIFIED |
| Filesystem | Compose and repo mount definitions in [compose.yaml](compose.yaml) | CONFIGURED / UNVERIFIED |
| Drive | Configuration in [.env.base](.env.base) | CONFIGURED / UNVERIFIED |
| Slack | No runtime evidence observed | UNVERIFIED |
| Discord | No runtime evidence observed | UNVERIFIED |
| RSS | Compose-defined digestion worker suggests an RSS-related path | CONFIGURED / UNVERIFIED |
| OpenAI | No runtime evidence observed | UNVERIFIED |
| Ollama | Compose-defined service and healthcheck in [compose.yaml](compose.yaml) | CONFIGURED / UNVERIFIED |
| LiteLLM | No runtime evidence observed | UNVERIFIED |
| Email | No runtime evidence observed | UNVERIFIED |
| MCP | Source registry exists, but no live registration evidence observed | UNVERIFIED |

## Connector runtime conclusion
The repository and compose files indicate connector intent, but no live connector health, authentication, subscription, or event-production state could be proven from the available evidence.
