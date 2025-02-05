import MeCab
import sys

f = open('text.txt', 'r')
text = f.read()
tagger = MeCab.Tagger('')
output : str = tagger.parse(text)
print(output)
output = output.splitlines()

readings = set()
for line in output:
  columns = line.split('\t')
  if len(columns) >= 3 and columns[2] != '':
    readings.add(columns[2])

