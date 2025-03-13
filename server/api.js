const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config(); // 環境変数を読み込む

// SQLiteリポジトリをインポート
const wordRepository = require('./repositories/wordRepository');
const { circIn } = require('framer-motion');
// Express アプリケーションの初期化
const app = express();
const port = process.env.PORT || 5000;

// ミドルウェアの設定
app.use(express.json());
app.use(cors());
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// 音声ファイル保存ディレクトリ
const AUDIO_DIR = path.join(__dirname, 'audio');

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// 環境変数からGemini API Keyを取得
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * テキストから音声ファイルを生成し、そのパスを返す
 * @param {string} text 音声に変換するテキスト
 * @param {object} config 音声設定
 * @returns {Promise<string>} 生成された音声ファイルのパス
 */
async function generateSpeech(text, config = {}) {
  // 設定パラメータ
  const voice = config.voice || 'english'; // 英語ネイティブの声をデフォルトに
  const speed = config.speed || 1.0;
  const pitch = config.pitch || 1.0;
  const volume = config.volume || 1.0;
  const language = config.language || 'en-US'; // 米国英語をデフォルトに
  
  // 一意のファイル名を生成
  // const timestamp = Date.now(); 
  const timestamp = 'sample'
  const filename = `speech_${timestamp}.mp3`;
  const outputPath = path.join(AUDIO_DIR, filename);
  
  // 実際のローカル音声エンジンとの連携
  // 注: 実際の音声エンジンによってコマンドは変わる
  
  // 音声エンジンを選択（環境に合わせて変更してください）
  const useMockEngine = true; // 実際の音声エンジンがないときはtrue
  
  if (useMockEngine) {
    // モック：実際の音声エンジンがない場合、テキストをファイルに書き出すだけ
    // fs.writeFileSync(path.join(AUDIO_DIR, `${timestamp}.txt`), 
    //   `テキスト：${text}\n設定：${JSON.stringify({...config, language})}`);
    
    // 音声ファイルを模倣（または他の方法で音声ファイルを取得）
    return new Promise((resolve, reject) => {
      // 空のMP3ファイルを作成（または、サンプルMP3をコピーするなど）
      // fs.copyFileSync(path.join(__dirname, 'sample.mp3'), outputPath);
      resolve(filename);
    });

  } else {
    // 実際の音声エンジンを使用する場合のサンプルコード（英語ネイティブの発音用）
    
    // Google Text-to-Speech（英語ネイティブの場合）
    // const command = `gtts-cli "${text}" --lang en --output ${outputPath}`;
    
    // Amazon Polly（英語ネイティブの場合）
    // const command = `aws polly synthesize-speech --output-format mp3 --voice-id Joanna --text "${text}" ${outputPath}`;
    
    // eSpeak（英語ネイティブの場合）
    // const command = `espeak -v en-us -s ${speed * 100} -p ${pitch * 50} -a ${volume * 100} "${text}" -w ${outputPath}`;
    
    // 実行例
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`エラー: ${error.message}`);
          reject(error);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        resolve(filename);
      });
    });
  }
}

// 音声合成エンドポイント
app.post('/api/speech', async (req, res) => {
  try {
    const { text, ...config } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'テキストが必要です' });
    }
    
    // 音声ファイルを生成
    const filename = await generateSpeech(text, config);
    
    // ファイルを送信
    // res.sendFile(path.join(AUDIO_DIR, filename));
    res.status(200).json();
  } catch (error) {
    console.error('音声生成エラー:', error);
    res.status(500).json({ error: '音声生成に失敗しました' });
  }
});

// SQLite APIエンドポイント

// 全単語を取得
app.get('/api/words', async (req, res) => {
  try {
    const words = await wordRepository.getAllWords();
    res.json(words);
  } catch (error) {
    console.error('単語取得エラー:', error);
    res.status(500).json({ error: '単語の取得に失敗しました' });
  }
});

// 単語の詳細情報を取得
app.get('/api/words/:id', async (req, res) => {
  try {
    const wordId = parseInt(req.params.id);
    const wordDetails = await wordRepository.getWordDetails(wordId);
    
    if (!wordDetails) {
      return res.status(404).json({ error: '単語が見つかりません' });
    }
    
    res.json(wordDetails);
  } catch (error) {
    console.error('単語詳細取得エラー:', error);
    res.status(500).json({ error: '単語詳細の取得に失敗しました' });
  }
});

// 単語検索
app.get('/api/search', async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ error: '検索キーワードが必要です' });
    }
    
    const words = await wordRepository.searchWords(term);
    res.json(words);
  } catch (error) {
    console.error('単語検索エラー:', error);
    res.status(500).json({ error: '単語の検索に失敗しました' });
  }
});

// 新しい単語を追加
app.post('/api/words', async (req, res) => {
  try {
    const wordData = req.body;
    
    if (!wordData.word) {
      return res.status(400).json({ error: '単語が必要です' });
    }
    
    const wordId = await wordRepository.createWord(wordData);
    const newWord = await wordRepository.getWordDetails(wordId);
    
    res.status(201).json(newWord);
  } catch (error) {
    console.error('単語追加エラー:', error);
    res.status(500).json({ error: '単語の追加に失敗しました' });
  }
});

// 単語の状態を更新
app.patch('/api/words/:id/status', async (req, res) => {
  try {
    const wordId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !['unknown', 'learning', 'mastered'].includes(status)) {
      return res.status(400).json({ error: '有効な状態が必要です: unknown, learning, mastered' });
    }
    
    await wordRepository.updateWordStatus(wordId, status);
    const updatedWord = await wordRepository.getWordDetails(wordId);
    
    res.json(updatedWord);
  } catch (error) {
    console.error('単語状態更新エラー:', error);
    res.status(500).json({ error: '単語状態の更新に失敗しました' });
  }
});

// 単語を削除
app.delete('/api/words/:id', async (req, res) => {
  try {
    const wordId = parseInt(req.params.id);
    await wordRepository.deleteWord(wordId);
    
    res.status(204).end();
  } catch (error) {
    console.error('単語削除エラー:', error);
    res.status(500).json({ error: '単語の削除に失敗しました' });
  }
});

// 状態別に単語を取得
app.get('/api/words-by-status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['unknown', 'learning', 'mastered'].includes(status)) {
      return res.status(400).json({ error: '有効な状態が必要です: unknown, learning, mastered' });
    }
    
    const words = await wordRepository.getWordsByStatus(status);
    res.json(words);
  } catch (error) {
    console.error('状態別単語取得エラー:', error);
    res.status(500).json({ error: '状態別単語の取得に失敗しました' });
  }
});

// データベースの移行API（ローカルストレージからSQLiteへの移行）
app.post('/api/migrate-data', async (req, res) => {
  try {
    const { words } = req.body;
    
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: '単語データが必要です' });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    // トランザクションでマイグレーション
    for (const word of words) {
      try {
        // 単語データの変換（古い形式から新しい形式へ）
        const newWordData = {
          word: word.word,
          phonetic: word.phonetic || '',
          part_of_speech: word.partOfSpeech || '',
          status: (word.proficiency || 'unknown').toLowerCase(), // ProficiencyLevel を status に変換
          definitions: [{
            definition: word.meaning || '',
            part_of_speech: word.partOfSpeech || ''
          }],
          examples: word.examples ? word.examples.map(ex => ({
            example: ex,
            translation: ''
          })) : [],
          etymologies: word.etymology ? [{
            etymology: word.etymology
          }] : [],
          related_words: word.relatedWords ? word.relatedWords.map(rel => ({
            related_word: rel,
            relationship_type: ''
          })) : []
        };
        
        await wordRepository.createWord(newWordData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          word: word.word,
          error: error.message
        });
      }
    }
    
    res.json({
      message: `${results.success}個の単語を移行しました。${results.failed}個の単語が失敗しました。`,
      results
    });
  } catch (error) {
    console.error('データ移行エラー:', error);
    res.status(500).json({ error: 'データ移行に失敗しました' });
  }
});

// 単語の詳細情報を更新
app.put('/api/words/:id/details', async (req, res) => {
  try {
    const wordId = parseInt(req.params.id);
    const wordData = req.body;
    
    if (!wordId) {
      return res.status(400).json({ error: '単語IDが必要です' });
    }
    
    // 指定されたIDの単語が存在するか確認
    const existingWord = await wordRepository.getWordDetails(wordId);
    if (!existingWord) {
      return res.status(404).json({ error: '単語が見つかりません' });
    }
    
    // 単語詳細を更新
    await wordRepository.updateWordDetails(wordId, wordData);
    
    // 更新後の単語情報を取得
    const updatedWord = await wordRepository.getWordDetails(wordId);
    
    res.json(updatedWord);
  } catch (error) {
    console.error('単語詳細更新エラー:', error);
    res.status(500).json({ error: '単語詳細の更新に失敗しました' });
  }
});

// GeminiAPIエンドポイント
app.get('/api/gemini-word-info', async (req, res) => {
  try {
    const { word } = req.query;
    
    if (!word) {
      return res.status(400).json({ error: '単語が必要です' });
    }
    
    // GeminiにAPIリクエストを送信
    const prompt = `
以下の英単語について詳細情報を提供してください:
"${word}"

JSON形式で、以下の情報を含めてください:
{
  "word": "単語",
  "meaning": "意味の詳細な説明（日本語）",
  "phonetic": "発音記号",
  "partOfSpeech": "品詞",
  "examples": ["例文1", "例文2", "例文3"],
  "examplesTranslation": ["例文1の日本語訳", "例文2の日本語訳", "例文3の日本語訳"],
  "etymology": "語源についての詳細",
  "relatedWords": ["関連語1", "関連語2", "関連語3"]
}

例文は実用的なものを選び、それぞれに正確な日本語訳をつけてください。JSON形式以外の文章は含めないでください。
    `;
    
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );
    
    // レスポンスからテキストを抽出
    const textResponse = response.data.candidates[0].content.parts[0].text;
    
    // JSONを抽出（テキストにJSON以外の文字列が含まれている場合に対応）
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('有効なJSONレスポンスが見つかりませんでした');
    }
    
    const wordInfo = JSON.parse(jsonMatch[0]);
    res.json(wordInfo);
  } catch (error) {
    console.error('Gemini API エラー:', error);
    res.status(500).json({ 
      error: 'Gemini APIでの単語情報取得に失敗しました',
      details: error.message
    });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました`);
}); 