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
    // AIを使用して単語情報を取得（実際の実装ではAI APIを呼び出す）
    const wordData = await fetchAIWordInfo(word);
    
    return NextResponse.json(wordData);
  } catch (error) {
    console.error('Error fetching AI word information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI word information' },
      { status: 500 }
    );
  }
}

// AIを使用して単語情報を取得する関数
async function fetchAIWordInfo(word: string) {
  // 実際の実装では、ここでOpenAI APIやGemini APIなどのAI APIを呼び出します
  // この例では、単語に基づいて生成的な情報を返すダミー実装を行います
  
  // AIに渡すプロンプトの例
  // const prompt = `
  //   Please provide information about the English word "${word}" in the following format:
  //   - Japanese meaning: [detailed meaning in Japanese]
  //   - Etymology: [brief history of the word]
  //   - Usage examples: [3 example sentences using the word in different contexts]
  // `;
  
  // 実際の実装例（OpenAI APIの場合）:
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-4',
  //     messages: [
  //       { role: 'system', content: 'You are a helpful assistant that provides information about English words.' },
  //       { role: 'user', content: prompt }
  //     ],
  //     temperature: 0.7
  //   })
  // });
  // const data = await response.json();
  // const aiResult = data.choices[0].message.content;
  // ここで aiResult をパースして構造化データに変換する処理が必要
  
  // ダミーのAI生成データを返す
  // 実際のアプリでは、ここで本物のAI APIからのレスポンスを処理します
  await new Promise(resolve => setTimeout(resolve, 1500)); // リクエスト遅延をシミュレート
  
  // 例として一部の単語にはより詳細な情報を設定
  const aiGeneratedData: Record<string, any> = {
    'apple': {
      word: 'apple',
      meaning: 'りんご。赤色や緑色の丸い果物で、甘酸っぱい味がする。栄養価が高く、健康によいとされる。',
      examples: [
        'I eat an apple every day to stay healthy.',
        'She prefers green apples over red ones.',
        'The apple pie my grandmother makes is delicious.'
      ],
      etymology: '古英語の「æppel」に由来し、印欧祖語の「*abel-」（果物）が語源とされています。'
    },
    'book': {
      word: 'book',
      meaning: '本、書籍（複数の紙を綴じて表紙をつけたもの）。また、予約する、記録するという動詞の意味もある。',
      examples: [
        'I\'m reading an interesting book about space exploration.',
        'Please book the restaurant for tonight at 8pm.',
        'He wrote his experiences in a book that became a bestseller.'
      ],
      etymology: '古英語の「bōc」は「樹皮の板」を意味し、初期の書き物が樹皮に記されていたことに由来します。'
    }
  };
  
  const lowerWord = word.toLowerCase();
  
  if (aiGeneratedData[lowerWord]) {
    return aiGeneratedData[lowerWord];
  }
  
  // 未知の単語の場合は、パターンに基づく生成データを返す
  return {
    word: word,
    meaning: `${word}は英語の単語で、日本語での意味は現在調査中です。`,
    examples: [
      `The ${word} was something everyone talked about.`,
      `She studied the concept of ${word} in her research.`,
      `Many people don't understand what ${word} really means.`
    ],
    etymology: `この単語の語源は様々な言語に由来しています。詳細は追加調査中です。`
  };
} 