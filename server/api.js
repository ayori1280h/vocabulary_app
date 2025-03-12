const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  const timestamp = Date.now();
  const filename = `speech_${timestamp}.mp3`;
  const outputPath = path.join(AUDIO_DIR, filename);
  
  // 実際のローカル音声エンジンとの連携
  // 注: 実際の音声エンジンによってコマンドは変わる
  
  // 音声エンジンを選択（環境に合わせて変更してください）
  const useMockEngine = true; // 実際の音声エンジンがないときはtrue
  
  if (useMockEngine) {
    // モック：実際の音声エンジンがない場合、テキストをファイルに書き出すだけ
    fs.writeFileSync(path.join(AUDIO_DIR, `${timestamp}.txt`), 
      `テキスト：${text}\n設定：${JSON.stringify({...config, language})}`);
    
    // 音声ファイルを模倣（または他の方法で音声ファイルを取得）
    return new Promise((resolve, reject) => {
      // 空のMP3ファイルを作成（または、サンプルMP3をコピーするなど）
      fs.copyFileSync(path.join(__dirname, 'sample.mp3'), outputPath);
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
    res.sendFile(path.join(AUDIO_DIR, filename));
  } catch (error) {
    console.error('音声生成エラー:', error);
    res.status(500).json({ error: '音声生成に失敗しました' });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`音声APIサーバーが http://localhost:${port} で起動しました`);
}); 