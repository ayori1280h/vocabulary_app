'use client';

import axios from 'axios';
import { ApiService } from '../services/api';

// サーバー側の音声APIエンドポイント - 直接使用しなくなるのでコメントアウト
// const SPEECH_API_ENDPOINT = '/api/sqlite-proxy/speech';

/**
 * 音声エンジンAPIの設定
 */
interface SpeechEngineConfig {
  voice?: string;      // 声の種類（男性/女性/etc）
  speed?: number;      // 再生速度 (0.5 - 2.0)
  pitch?: number;      // 音の高さ (0.5 - 2.0)
  volume?: number;     // 音量 (0.0 - 1.0)
  language?: string;   // 言語コード (例: 'en-US', 'en-GB', etc)
}

/**
 * テキストを音声に変換する
 * @param text 読み上げるテキスト
 * @param config 音声設定
 * @returns 音声データのURL
 */
export async function textToSpeech(text: string, config: SpeechEngineConfig = {}): Promise<string> {
  try {
    // ApiServiceを使用して発音を取得
    return await ApiService.getPronunciation(text);
  } catch (error) {
    console.error('Error generating speech:', error);
    
    // フォールバック: ブラウザの音声合成APIを使用
    return useBrowserSpeechSynthesis(text, config);
  }
}

/**
 * ブラウザの音声合成APIを使用してテキストを読み上げる（フォールバック）
 * @param text 読み上げるテキスト
 * @param config 音声設定
 * @returns 音声が再生されたかどうかを示すPromise
 */
function useBrowserSpeechSynthesis(text: string, config: SpeechEngineConfig = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    // SpeechSynthesis APIが利用可能かチェック
    if (!('speechSynthesis' in window)) {
      reject(new Error('このブラウザは音声合成をサポートしていません'));
      return;
    }
    
    // 音声を停止
    window.speechSynthesis.cancel();
    
    // 音声合成のインスタンスを作成
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 英語を設定
    utterance.lang = config.language || 'en-US';
    
    // 設定を適用
    if (config.speed) utterance.rate = config.speed;
    if (config.pitch) utterance.pitch = config.pitch;
    if (config.volume) utterance.volume = config.volume;
    
    // 利用可能な声を取得
    const voices = window.speechSynthesis.getVoices();
    
    // 英語ネイティブの声を優先して選択
    const preferredVoices = [
      'Google US English',     // Chrome
      'Microsoft David',       // Windows (米国英語男性)
      'Microsoft Zira',        // Windows (米国英語女性)
      'Alex',                  // MacOS
      'Samantha',              // MacOS/iOS
    ];
    
    // 1. 優先声リストから検索
    let selectedVoice = voices.find(voice => 
      preferredVoices.includes(voice.name)
    );
    
    // 2. それでも見つからない場合は英語の声を検索
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang.startsWith('en')
      );
    }
    
    // 3. 最後のフォールバック（日本語の声は明示的に避ける）
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        !voice.lang.startsWith('ja')
      );
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`選択された音声: ${selectedVoice.name} (${selectedVoice.lang})`);
    }
    
    // 音声再生開始時のハンドラ
    utterance.onstart = () => {
      console.log('音声再生開始');
    };
    
    // 音声再生終了時のハンドラ
    utterance.onend = () => {
      console.log('音声再生終了');
      resolve('音声再生完了'); // 再生完了を通知
    };
    
    // エラーハンドラ
    utterance.onerror = (event) => {
      console.error('音声合成エラー:', event);
      reject(new Error('音声再生中にエラーが発生しました'));
    };
    
    // 音声再生
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * 単語を発音する
 * @param word 発音する単語
 * @param config 音声設定
 * @returns 音声データのURL
 */
export async function pronounceWord(word: string, config: SpeechEngineConfig = {}): Promise<string> {
  // 英語ネイティブの発音を優先
  const englishConfig: SpeechEngineConfig = {
    ...config,
    language: 'en-US',
    voice: 'english'
  };
  return textToSpeech(word, englishConfig);
}

/**
 * 音声マークがある文章から音声マークを検出して処理する
 * 例: "これは[発音:example]テストです" → "example"を発音
 * @param text 処理する文章
 * @param config 音声設定
 */
export async function processSpeechMarkers(text: string, config: SpeechEngineConfig = {}): Promise<void> {
  // 音声マークのパターン: [発音:テキスト]
  const speechMarkerPattern = /\[発音:(.*?)\]/g;
  let match;
  
  // すべての音声マークを処理
  while ((match = speechMarkerPattern.exec(text)) !== null) {
    const wordToSpeak = match[1];
    if (wordToSpeak) {
      await pronounceWord(wordToSpeak, config);
      // 短い間隔をあけて次の音声を再生
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
} 