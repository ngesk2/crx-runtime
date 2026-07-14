# Sandboxes

Every worker gets one sandbox.

Each sandbox is a complete clone of the repository, not partial, not branch.

## Structure

```
sandbox/
    hermes/          # Hermes agent workspace
    builder/         # Builder agent workspace
    testing/         # Testing agent workspace
    docs/            # Documentation agent workspace
    migration/       # Migration workspace
    refactor/        # Refactoring workspace
    experiment/      # Experimental workspace
```

## Permissions

**Hermes**
- read: repository
- write: sandbox/hermes/**

**Builder**
- write: sandbox/builder/**

**Testing**
- write: sandbox/testing/**

**Oracle**
- READ ONLY (Oracle literally cannot edit)

## Work Claims

Before work begins, agents must claim subsystems via work_claims.json.

If claimed: STOP - No editing, no duplicate work.
