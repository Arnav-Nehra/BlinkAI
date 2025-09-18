import express from "express";
import cors from "cors";

import aiRouter from "./routes/ai"

const app = express();
app.use(cors());
app.use(express.json());

app.use('/ai',aiRouter);


app.listen(3000);