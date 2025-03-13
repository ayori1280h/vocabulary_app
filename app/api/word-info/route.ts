import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json(
      { error: 'Word parameter is required' },
      { status: 400 }
    );
  }

  try {
    // この例では既存のデータベースや辞書APIから単語情報を取得すると仮定します
    // 実際の実装では、ここで外部辞書APIを呼び出したり、データベースから情報を取得したりします
    
    // サンプルのレスポンスデータ
    const wordData = await fetchWordInfo(word);
    
    return NextResponse.json(wordData);
  } catch (error) {
    console.error('Error fetching word information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch word information' },
      { status: 500 }
    );
  }
}

// 単語情報を取得する関数（実際の実装ではAPIやデータベースを使用）
async function fetchWordInfo(word: string) {
  // ここでは単純なデモデータを返しますが、実際には外部APIやデータベースから情報を取得します
  // 例: Oxford Dictionary API, Merriam-Webster API, WordsAPI などを使用
  
  // 例として、よく使われる英単語のいくつかにはサンプルデータを用意
  const commonWords: Record<string, any> = {
    'apple': {
      word: 'apple',
      meaning: 'りんご; リンゴの木; 果物の一種',
      examples: ['I eat an apple every day.', 'The apple doesn\'t fall far from the tree.'],
      etymology: 'Old English æppel, from Proto-Germanic *aplaz'
    },
    'book': {
      word: 'book',
      meaning: '本; 書籍; 予約する',
      examples: ['I read a book yesterday.', 'Please book a table for dinner.'],
      etymology: 'Old English bōc, from Proto-Germanic *bōks'
    },
    'computer': {
      word: 'computer',
      meaning: 'コンピュータ; 電子計算機',
      examples: ['I use my computer every day.', 'Computers have changed the way we live.'],
      etymology: 'From compute + -er, from Latin computare'
    }
  };
  
  // 小文字に変換して辞書を検索
  const lowerWord = word.toLowerCase();
  
  // 既知の単語の場合は保存されているデータを返す
  if (commonWords[lowerWord]) {
    return commonWords[lowerWord];
  }
  
  // 既知の単語でない場合は、基本的な情報だけを返す
  return {
    word: word,
    meaning: '',
    examples: [],
    etymology: ''
  };
} 