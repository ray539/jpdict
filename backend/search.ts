import { PrismaClient } from "@prisma/client";
import fs from 'fs'
import { Word } from "../global";
const prisma = new PrismaClient();

const hirToKat = {
	あ: 'ア',
  い: 'イ',
  う: 'ウ',
  え: 'エ',
  お: 'オ',
  か: 'カ',
  き: 'キ',
  く: 'ク',
  け: 'ケ',
  こ: 'コ',
  さ: 'サ',
  し: 'シ',
  す: 'ス',
  せ: 'セ',
  そ: 'ソ',
  た: 'タ',
  ち: 'チ',
  つ: 'ツ',
  て: 'テ',
  と: 'ト',
  な: 'ナ',
  に: 'ニ',
  ぬ: 'ヌ',
  ね: 'ネ',
  の: 'ノ',
  は: 'ハ',
  ひ: 'ヒ',
  ふ: 'フ',
  へ: 'ヘ',
  ほ: 'ホ',
  ま: 'マ',
  み: 'ミ',
  む: 'ム',
  め: 'メ',
  も: 'モ',
  や: 'ヤ',
  ゆ: 'ユ',
  よ: 'ヨ',
  ら: 'ラ',
  り: 'リ',
  る: 'ル',
  れ: 'レ',
  ろ: 'ロ',
  わ: 'ワ',
  を: 'ヲ',
  ん: 'ン',
  が: 'ガ',
  ぎ: 'ギ',
  ぐ: 'グ',
  げ: 'ゲ',
  ご: 'ゴ',
  ざ: 'ザ',
  じ: 'ジ',
  ず: 'ズ',
  ぜ: 'ゼ',
  ぞ: 'ゾ',
  だ: 'ダ',
  ぢ: 'ヂ',
  づ: 'ヅ',
  で: 'デ',
  ど: 'ド',
  ば: 'バ',
  び: 'ビ',
  ぶ: 'ブ',
  べ: 'ベ',
  ぼ: 'ボ',
  ぱ: 'パ',
  ぴ: 'ピ',
  ぷ: 'プ',
  ぺ: 'ペ',
  ぽ: 'ポ',
  ぁ: 'ァ',
  ぃ: 'ィ',
  ぅ: 'ゥ',
  ぇ: 'ェ',
  ぉ: 'ォ',
  っ: 'ッ',
  ゃ: 'ャ',
  ゅ: 'ュ',
  ょ: 'ョ',
  ゎ: 'ヮ',
  ゐ: 'ヰ',
  ゑ: 'ヱ',
}

const romToKat = {
  a: 'ア',
  i: 'イ',
  u: 'ウ',
  e: 'エ',
  o: 'オ',
  ka: 'カ',
  ki: 'キ',
  ku: 'ク',
  ke: 'ケ',
  ko: 'コ',
  sa: 'サ',
  shi: 'シ',
  su: 'ス',
  se: 'セ',
  so: 'ソ',
  ta: 'タ',
  chi: 'チ',
  tsu: 'ツ',
  te: 'テ',
  to: 'ト',
  na: 'ナ',
  ni: 'ニ',
  nu: 'ヌ',
  ne: 'ネ',
  no: 'ノ',
  ha: 'ハ',
  hi: 'ヒ',
  hu: 'フ',
  he: 'ヘ',
  ho: 'ホ',
  ma: 'マ',
  mi: 'ミ',
  mu: 'ム',
  me: 'メ',
  mo: 'モ',
  ya: 'ヤ',
  yu: 'ユ',
  yo: 'ヨ',
  ra: 'ラ',
  ri: 'リ',
  ru: 'ル',
  re: 'レ',
  ro: 'ロ',
  wa: 'ワ',
  wo: 'ヲ',
  n: 'ン',
  ga: 'ガ',
  gi: 'ギ',
  gu: 'グ',
  ge: 'ゲ',
  go: 'ゴ',
  za: 'ザ',
  ji: 'ジ',
  zu: 'ズ',
  ze: 'ゼ',
  zo: 'ゾ',
  va: 'ヴァ',
  vi: 'ヴィ',
  vu: 'ヴ',
  ve: 'ヴェ',
  vo: 'ヴォ',
  da: 'ダ',
  di: 'ヂ',
  du: 'ヅ',
  de: 'デ',
  do: 'ド',
  ba: 'バ',
  bi: 'ビ',
  bu: 'ブ',
  be: 'ベ',
  bo: 'ボ',
  pa: 'パ',
  pi: 'ピ',
  pu: 'プ',
  pe: 'ペ',
  po: 'ポ',
  kya: 'キャ',
  kyu: 'キュ',
  kyo: 'キョ',
  sha: 'シャ',
  shu: 'シュ',
  sho: 'ショ',
  cha: 'チャ',
  chu: 'チュ',
  cho: 'チョ',
  nya: 'ニャ',
  nyu: 'ニュ',
  nyo: 'ニョ',
  hya: 'ヒャ',
  hyu: 'ヒュ',
  hyo: 'ヒョ',
  mya: 'ミャ',
  myu: 'ミュ',
  myo: 'ミョ',
  rya: 'リャ',
  ryu: 'リュ',
  ryo: 'リョ',
  gya: 'ギャ',
  gyu: 'ギュ',
  gyo: 'ギョ',
  jya: 'ジャ',
  jyu: 'ジュ',
  jyo: 'ジョ',
  dya: 'ヂャ',
  dyu: 'ヂュ',
  dyo: 'ヂョ',
  bya: 'ビャ',
  byu: 'ビュ',
  byo: 'ビョ',
  pya: 'ピャ',
  pyu: 'ピュ',
  pyo: 'ピョ',
}

const MOKUHYOU = {
  "id": "00a2eae8-c4a0-4b7e-aede-4fcf148814ea",
  "seqNum": 0,
  "entrySeq": "1535650",
  "kanji": "目標",
  "kanjiOther": [],
  "reading": "もくひょう",
  "readingOther": [],
  "definitions": [
      {
          "xrefs": [],
          "glosses": [
              "goal",
              "target",
              "aim",
              "objective",
          ],
          "antonyms": [],
          "extraInfo": [],
          "positions": [
              "noun (common) (futsuumeishi)"
          ]
      },
      {
          "xrefs": [],
          "glosses": [
              "mark",
              "sign",
              "landmark"
          ],
          "antonyms": [],
          "extraInfo": [],
          "positions": [
              "noun (common) (futsuumeishi)"
          ]
      }
  ]
};

function hiraToKata(s: string) {
  return s.split('').map(c => (c in hirToKat ? hirToKat[c as keyof typeof hirToKat] : '?')).join('')
}

const ROM = Object.keys(romToKat);
ROM.sort((a, b) => -(a.length - b.length));

const KATA = ROM.map(r => romToKat[r as keyof typeof romToKat]);
const HIRA = Object.keys(hirToKat)

function toKata(s: string) {
  let res = ''
  let N = s.length;
  let i = 0;
  // console.log(HIRA);
  // console.log(KATA);
  
  
  while (i < N) {
    if (KATA.includes(s[i])) {
      res += s[i];
      i++;
      continue;
    }

    if (HIRA.includes(s[i])) {
      // console.log('here');
      res += hiraToKata(s[i]);
      i++;
      continue;
    }

    let fnd = false
    for (let key of ROM) {
      if (s.substring(i, i + key.length) === key) {
        i += key.length
        res += romToKat[key as keyof typeof romToKat]
        fnd = true;
        break;
      }
    }
    if (!fnd) break; // parse failed, return what we sucessfully parsed
  }
  return res + s.substring(i, N);
}

function beginsWith(s: string, pre: string) {
  let N = s.length
  let M = pre.length
  if (M > N) return false
  return s.substring(0, M) === pre;
}

// given a list of terms, and a word
// determine the 'level' that a word matches the terms
function getMatchlevel(terms: string[], word: Word) {
  terms = terms.filter(t => t.length >= 2) // filter out single character terms
  let kataTerms = terms.map(t => toKata(t));
  let kataReadings = word.readingOther.concat(word.reading).map(r => toKata(r))
  let allKanji = word.kanjiOther.concat(word.kanji)
  // check if any terms is an exact match
  let res1 = terms
    .map(term => allKanji.find(kanji => term == kanji) != undefined)
    .reduce((c, n) => c || n)
  if (res1) return 1;

  // check if any kata(any term) is an exact match
  let res2 = kataTerms
    .map(term => kataReadings.find(kataReading => term == kataReading) != undefined)
    .reduce((c, n) => c || n)
  if (res2) return 2;
  
  // check if any term is the prefix of the word
  let res3 = terms
    .map(term => allKanji.find(kanji => beginsWith(kanji, term)))
    .reduce((c, n) => c || n)
  if (res3) return 3;

  // check if any kata(term) is a prefix of kata(reading)
  let res4 = kataTerms
    .map(term => kataReadings.find(kr => beginsWith(kr, term)))
    .reduce((c, n) => c || n)
  if (res4) return 4;

  // check if term appears as an english word
  let english = word.definitions
    .flatMap(def => def.glosses
      .flatMap(gloss => gloss
        .split(/\s+/)))
    .map(w => w
      .replace(/[^a-z\d]/, '')
      .toLowerCase()
    )
  
  let res5 = terms
    .map(term => english.find(word => word == term) != undefined)
    .reduce((c, n) => c || n)
  if (res5) return 5;

  return null
}

export async function searchDictionary(queryStr: string, skip: number, take: number) {
  let terms = queryStr.split(/\s+/).map(t => t.toLowerCase())
  let allWords = await prisma.word.findMany();
  let result = allWords.map(w => {
    return {
      word: w,
      matchLvl: getMatchlevel(terms, w as any)
    }
  });
  result = result.filter(obj => obj.matchLvl !== null)
  result.sort((obj1, obj2) => -(obj1.matchLvl! - obj2.matchLvl!))
  // skip..skip + take
  result = result.slice(skip, skip + take)
  return result;
}

async function test() {
  // const res = await search('bumon')
  // console.log(res);
}
test()