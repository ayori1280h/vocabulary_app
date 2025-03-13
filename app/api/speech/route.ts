import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';

// 音声ファイルを保存するディレクトリ
const AUDIO_DIR = path.join(process.cwd(), 'server', 'audio');

// ディレクトリが存在しない場合は作成する
async function ensureAudioDir() {
  try {
    await mkdir(AUDIO_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create audio directory:', error);
  }
}

/**
 * テキストを音声に変換するエンドポイント
 * このサンプルではサーバー側でエミュレートした実装を示しています
 * 本番環境では、Google Text-to-Speech APIなどの外部サービスを利用することをお勧めします
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json();
    const { text, voice = 'english', speed = 1.0, pitch = 1.0, language = 'en-US' } = body;

    // テキストが指定されていない場合はエラー
    if (!text) {
      return NextResponse.json(
        { error: 'テキストが指定されていません' },
        { status: 400 }
      );
    }

    // ディレクトリの存在を確認
    await ensureAudioDir();
    
    // 一意のファイル名を生成
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const filename = `speech_${timestamp}_${randomSuffix}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    // ダミーの音声ファイルを生成（実際の実装ではここで外部APIを呼び出す）
    const success = await generateSpeechFile(text, filepath, { voice, speed, pitch, language });
    
    if (!success) {
      return NextResponse.json(
        { error: '音声生成に失敗しました' },
        { status: 500 }
      );
    }

    // ファイルを読み込み、レスポンスとして返却
    const audioBuffer = fs.readFileSync(filepath);
    
    // レスポンスヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mp3');
    headers.set('Content-Length', audioBuffer.length.toString());
    headers.set('Cache-Control', 'public, max-age=86400'); // 1日キャッシュ

    return new NextResponse(audioBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('音声生成エラー:', error);
    return NextResponse.json(
      { error: '音声生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 音声ファイルを生成する関数
 * 本実装ではダミーのファイルを作成していますが、
 * 実際の実装ではGoogle Text-to-Speech APIなどを使用します
 */
async function generateSpeechFile(
  text: string,
  outputPath: string,
  options: { voice: string; speed: number; pitch: number; language: string }
): Promise<boolean> {
  try {
    // NOTE: これはサンプル実装です。実際の実装では以下を適切に置き換えてください。
    // 例: Google Cloud Text-to-Speech APIを使用する場合:
    // const [response] = await textToSpeechClient.synthesizeSpeech({...});
    // const audioContent = response.audioContent;
    // fs.writeFileSync(outputPath, audioContent);

    // ダミーの音声ファイルをコピー (開発用)
    const sampleAudioPath = path.join(process.cwd(), 'public', 'sample-audio.mp3');
    
    if (fs.existsSync(sampleAudioPath)) {
      fs.copyFileSync(sampleAudioPath, outputPath);
      return true;
    }
    
    // サンプル音声がない場合は、空のファイルを作成
    fs.writeFileSync(outputPath, Buffer.from(''));
    return true;
  } catch (error) {
    console.error('音声ファイル生成エラー:', error);
    return false;
  }
} 