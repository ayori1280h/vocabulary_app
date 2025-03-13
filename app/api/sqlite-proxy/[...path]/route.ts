import { NextRequest, NextResponse } from 'next/server';

// SQLiteバックエンドAPIのベースURL
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * SQLite APIへのプロキシハンドラー
 * Next.jsからバックエンドへのリクエストを中継する
 */
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // パスパラメータからAPIパスを構築
    const path = params.path.join('/');
    
    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // リクエストURLを構築
    const url = `${API_BASE_URL}/${path}${queryString ? `?${queryString}` : ''}`;
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // バックエンドからのレスポンスを返却
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('SQLite API プロキシエラー:', error);
    return NextResponse.json(
      { error: 'SQLite APIへのリクエストに失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POSTリクエストのプロキシハンドラー
 */
export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // パスパラメータからAPIパスを構築
    const path = params.path.join('/');
    
    // リクエストボディを取得
    const body = await request.json();
    
    // リクエストURLを構築
    const url = `${API_BASE_URL}/${path}`;
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // バックエンドからのレスポンスを返却
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('SQLite API プロキシエラー:', error);
    return NextResponse.json(
      { error: 'SQLite APIへのリクエストに失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCHリクエストのプロキシハンドラー
 */
export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // パスパラメータからAPIパスを構築
    const path = params.path.join('/');
    
    // リクエストボディを取得
    const body = await request.json();
    
    // リクエストURLを構築
    const url = `${API_BASE_URL}/${path}`;
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // バックエンドからのレスポンスを返却
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('SQLite API プロキシエラー:', error);
    return NextResponse.json(
      { error: 'SQLite APIへのリクエストに失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETEリクエストのプロキシハンドラー
 */
export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // パスパラメータからAPIパスを構築
    const path = params.path.join('/');
    
    // リクエストURLを構築
    const url = `${API_BASE_URL}/${path}`;
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    
    // バックエンドからのレスポンスを返却
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('SQLite API プロキシエラー:', error);
    return NextResponse.json(
      { error: 'SQLite APIへのリクエストに失敗しました' },
      { status: 500 }
    );
  }
} 