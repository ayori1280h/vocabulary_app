import { NextRequest, NextResponse } from 'next/server';

// SQLiteバックエンドAPIのベースURL
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * SQLite APIへのプロキシハンドラー
 * Next.jsからバックエンドへのリクエストを中継する
 */
export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  try {
    // Next.js 15ではparamsオブジェクト自体をawaitする必要がある
    const params = await context.params;
    const path = params.path.join('/');
    
    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const queryParam = queryString ? `?${queryString}` : '';
    
    // リクエストURLを構築
    const url = `${API_BASE_URL}/${path}${queryParam}`;
    
    console.log(`[SQLite Proxy] GETリクエスト: ${url}`);
    
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
    console.error('[SQLite Proxy] エラー:', error);
    return NextResponse.json(
      { error: 'SQLite APIへのリクエストに失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POSTリクエストのプロキシハンドラー
 */
export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  try {
    // Next.js 15ではparamsオブジェクト自体をawaitする必要がある
    const params = await context.params;
    const path = params.path.join('/');
    
    // リクエストボディを取得
    const body = await request.json();
    
    // リクエストURLを構築
    const url = `${API_BASE_URL}/${path}`;
    
    console.log(`[SQLite Proxy] POSTリクエスト: ${url}`, body);
    
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
    console.error('[SQLite Proxy] エラー:', error);
    return NextResponse.json(
      { error: 'SQLite APIへのリクエストに失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCHリクエストのプロキシハンドラー
 */
export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  try {
    // Next.js 15ではparamsオブジェクト自体をawaitする必要がある
    const params = await context.params;
    const path = params.path.join('/');
    
    // リクエストボディを取得
    const body = await request.json();
    
    // リクエストURLを構築
    const url = `${API_BASE_URL}/${path}`;
    
    console.log(`[SQLite Proxy] PATCHリクエスト: ${url}`, body);
    
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
    console.error('[SQLite Proxy] エラー:', error);
    return NextResponse.json(
      { error: 'SQLite APIへのリクエストに失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETEリクエストのプロキシハンドラー
 */
export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  try {
    // Next.js 15ではparamsオブジェクト自体をawaitする必要がある
    const params = await context.params;
    const path = params.path.join('/');
    
    // リクエストURLを構築
    const url = `${API_BASE_URL}/${path}`;
    
    console.log(`[SQLite Proxy] DELETEリクエスト: ${url}`);
    
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
    console.error('[SQLite Proxy] エラー:', error);
    return NextResponse.json(
      { error: 'SQLite APIへのリクエストに失敗しました' },
      { status: 500 }
    );
  }
} 