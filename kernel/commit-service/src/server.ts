import express from "express"
import { commitArtifact } from "./api/commit_controller"

const app = express()

app.use(express.json())

app.post("/kernel/commit", commitArtifact)

const port = 8080

app.listen(port, () => {
  console.log(`CRX kernel running on ${port}`)
})
