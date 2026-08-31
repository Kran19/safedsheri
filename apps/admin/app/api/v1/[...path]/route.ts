import { NextRequest, NextResponse } from 'next/server';

// This is the ONLY proxy mechanism for /api/v1/* → NestJS backend.
// next.config.js rewrites() are dead code because App Router file-system routes
// take priority over rewrites. This file IS the proxy.
//
// REQUIRED ENV VAR (server-side only, no NEXT_PUBLIC_ prefix):
//   INTERNAL_API_URL=http://localhost:4000/api/v1      (local dev)
//   INTERNAL_API_URL=https://api.safedsheri.com/api/v1  (production)

const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

if (!INTERNAL_API_URL) {
  console.error(
    '[API Proxy] CRITICAL: INTERNAL_API_URL is not set. ' +
    'All /api/v1/* requests will fail. ' +
    'Set INTERNAL_API_URL in apps/admin/.env.local (local) or your deployment env vars (production).'
  );
}

async function handleProxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  // Resolve the API target — replace 'localhost' with '127.0.0.1' to avoid
  // IPv6 resolution issues on Node.js 18+
  const rawApiTarget = INTERNAL_API_URL || 'http://127.0.0.1:4000/api/v1';
  const API_TARGET = rawApiTarget.replace('localhost', '127.0.0.1');

  const subPath = params.path ? params.path.join('/') : '';
  const search = req.nextUrl.search || '';
  const targetUrl = `${API_TARGET}/${subPath}${search}`;

  console.log(`[API Proxy] ${req.method} /api/v1/${subPath} → ${targetUrl}`);

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

    const contentType = backendRes.headers.get('content-type') || '';

    // If the backend returned a non-JSON text response (e.g. an HTML error page
    // from nginx/reverse-proxy when the API server is down), wrap it in a
    // proper JSON error so the frontend doesn't choke on `res.json()`.
    if (
      !contentType.includes('application/json') &&
      !contentType.includes('image') &&
      !contentType.includes('octet')
    ) {
      const textBody = await backendRes.text();
      console.error(
        `[API Proxy] Backend returned non-JSON response (${contentType || 'no content-type'}): ${textBody.slice(0, 200)}`
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPSTREAM_ERROR',
            statusCode: backendRes.status,
            message: 'API server returned an unexpected response. It may be down or unreachable.',
          },
        },
        { status: backendRes.status >= 400 ? backendRes.status : 502 }
      );
    }

    const resData = await backendRes.arrayBuffer();

    return new NextResponse(resData, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: resHeaders,
    });
  } catch (err: any) {
    const msg = err?.cause?.code === 'ECONNREFUSED'
      ? `Cannot reach API server at ${API_TARGET}. Is the NestJS server running?`
      : err.message;

    console.error(`[API Proxy Error] ${req.method} ${targetUrl}: ${msg}`);
    return NextResponse.json(
      { success: false, message: msg },
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
