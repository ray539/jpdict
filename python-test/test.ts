import axios from 'axios'
import fs from 'fs'

async function main() {
  let text = fs.readFileSync('text.txt').toString();
  const res = await axios.post('http://localhost:5000/api/get_words_in_text/', text)
  const wordInfos = res.data.wordInfos
  for (let o of wordInfos) {
    console.log(JSON.stringify(o));
  }
}

main();