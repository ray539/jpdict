import express from 'express'
import { spawn, spawnSync } from 'child_process'
import morgan from 'morgan'

const app = express()
app.use(morgan('short'))
app.use(express.json())

app.get('/', async(req, res) => {
  const inpStr = req.query.inputStr as string
  console.log(inpStr);

  // spawn vs spawnSync: 
  // - spawn doesn't block rest of code
  // - spawnSync does the thing then resumes (even without await)
  const process = spawnSync('python3', ['../python/compute.py', inpStr]);
  const ret = process.stdout.toString();
  const err = process.stderr.toString();
  if (err != '') {
    res.status(403).json({error: err})
  } else {
    res.json({output: ret})
  }
})

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`); 
})