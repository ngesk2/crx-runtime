# Replay — Capabilities

| Capability | Produces | Consumes |
|------------|----------|----------|
| ReplayTranscript | Ordered event sequence | Raw events |
| ReplayExecution | ReplayResult, WitnessRoot | ReplayTranscript |
| ReplayVerification | VerificationResult | ReplayResult ×2 |
| ReplayWitness | WitnessRoot | Event stream |
| CertificateIssuance | ReplayCertificate | Hash bytes |
