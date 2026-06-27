import express from "express"
import { commitArtifact } from "./api/commit_controller"
import { auditArtifacts, auditSystem } from "./api/audit_controller"

const app = express()

app.use(express.json())

app.post("/kernel/commit", commitArtifact)
app.get("/kernel/audit", auditArtifacts)
app.get("/kernel/audit/system", auditSystem)

const port = 8080

app.listen(port, () => {
  console.log(`CRX kernel running on ${port}`)
})
