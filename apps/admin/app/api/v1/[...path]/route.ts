import { NextRequest, NextResponse } from 'next/server';

async function handleProxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const rawApiTarget = process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000/api/v1';
  const API_TARGET = rawApiTarget.replace('localhost', '127.0.0.1');
  const subPath = params.path ? params.path.join('/') : '';
  const search = req.nextUrl.search || '';
  const targetUrl = `${API_TARGET}/${subPath}${search}`;
  console.log('PROXYING TO:', targetUrl, 'using API_TARGET:', API_TARGET);

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const bodyBuf = await req.arrayBuffer();
      if (bodyBuf.byteLength > 0) {
        fetchOptions.body = bodyBuf;
      }
    }

    const backendRes = await fetch(targetUrl, fetchOptions);
    const resHeaders = new Headers(backendRes.headers);
    resHeaders.delete('content-encoding');

    const resData = await backendRes.arrayBuffer();

    return new NextResponse(resData, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error(`[API Proxy Error] Failed to proxy ${req.method} ${targetUrl}:`, err);
    return NextResponse.json(
      { success: false, message: `Proxy error: ${err.message}` },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
