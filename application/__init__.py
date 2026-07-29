"""
Application Service Layer

This layer provides application services that orchestrate business logic
and coordinate between the API layer and the runtime layer.

Application services own:
- Canonical serialization and hashing
- Business logic orchestration
- Infrastructure coordination
- Transaction management

The API layer should only handle HTTP concerns and delegate to these services.
"""
