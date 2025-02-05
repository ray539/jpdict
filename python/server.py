from flask import Flask, url_for, request
import json as JSON #no name conflict with flask
import MeCab
import sys
import regex as re

# pattern to check if character is japanese
pattern = re.compile(r'[^\p{IsHan}\p{IsBopo}\p{IsHira}\p{IsKatakana}]', re.UNICODE)
app = Flask(__name__)

# write data in post request directly, without wrapping it in an object
# returns
# {
#   wordInfos: [{
#     kanji: string,
#     reading: string
#   }]
# }
@app.post('/api/get_words_in_text/')
def get_words_in_text():
  text = request.get_data(as_text=True)
  tagger = MeCab.Tagger('')
  output: str = tagger.parse(text)
  output: list[str] = output.splitlines()
  objs = set()
  for line in output:
    columns = line.split('\t')
    dictReading = ''
    dictForm = ''
    if len(columns) >= 3 and columns[2] != '':
      dictReading = columns[2]
    if len(columns) >= 4 and columns[4] != '':
      dictForm = columns[3]
      # remove all non hiragana / katakana characters from dictForm
      dictForm = pattern.sub('', dictForm)
    
    if dictReading == '' or dictForm == '':
      continue
    objs.add((dictReading, dictForm))
  
  wordInfos = []
  for r, f in objs:
    wordInfos.append({
      'reading': r,
      'kanji': f
    })
  return {
    'wordInfos': wordInfos
  }
