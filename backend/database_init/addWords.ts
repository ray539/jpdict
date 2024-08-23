import { PrismaClient } from "@prisma/client";
import fs from 'fs'
const prisma = new PrismaClient()
// await prisma.word.deleteMany()

// this shows the schema defined in the nf01.dict.json file
interface Definition {
  positions: [string]
  extraInfo: [string]
  glosses: [string]
  antonyms: [string]
  xrefs: [string]
}

interface ExampleSentence {
  word: string
  jpn: string
  eng: string
}

interface Entry {
  entrySeq: string
  kanji: string
  kanjiOther: [string]
  reading: string
  readingOther: [string]
  definitions: [Definition]
  exampleSentences: [ExampleSentence]
}

async function loadnf01() {
  const entries = JSON.parse(fs.readFileSync('../dictionary/json/nf01.dict.json').toString()) as Entry[]

  for (let entry of entries) {

    let exampleSentencesData = entry.exampleSentences.map(s => {
      let newS = {
        jpn: s.jpn,
        eng: s.eng,
        default_word_wordForm: s.word
      }
      return newS
    })

    const word = await prisma.word.create({
      data: {
        entrySeq: entry.entrySeq,
        kanji: entry.kanji,
        kanjiOther: entry.kanjiOther,
        reading: entry.reading,
        readingOther: entry.readingOther,
        definitions: entry.definitions as any,
        exampleSentences: {
          createMany: {
            data: exampleSentencesData
          }
        }
      }
    })
  }
}

async function main() {
  await prisma.exampleSentence.deleteMany()
  await prisma.word.deleteMany()
  await loadnf01()
  console.log('done')
}
main()