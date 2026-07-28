# Replay — Examples

## Verifying replay determinism

```typescript
const engine = new DeterministicReplayEngine(eventStream, stateMachine, witnessAuthority);
const result1 = engine.replay();
const result2 = engine.replay();
// result1.witnessRoot === result2.witnessRoot
```

## Using ReplayVerification

```typescript
const verification = new ReplayVerification();
const result = verification.verifyDeterminism(result1, result2);
// result.isDeterministic === true
```
