import sys
import nagisa

text = '使う'
words = nagisa.tagging(text)
print(words.words)
print(words.postags)