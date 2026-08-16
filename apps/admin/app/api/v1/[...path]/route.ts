import { NextRequest, NextResponse } from 'next/server';

const API_TARGET = process.env.INTERNAL_API_URL || 'http://api:4000/api/v1';

async function handleProxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const subPath = params.path ? params.path.join('/') : '';
  const search = req.nextUrl.search || '';
  const targetUrl = `${API_TARGET}/${subPath}${search}`;

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
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        fetchOptions.body = formData;
        headers.delete('content-type'); // Allow fetch to set boundary automatically
      } else {
        const bodyBuf = await req.arrayBuffer();
        if (bodyBuf.byteLength > 0) {
          fetchOptions.body = bodyBuf;
        }
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
