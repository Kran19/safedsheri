'use client';

import React, { useState } from 'react';
import { Eye, ExternalLink, ZoomIn, ZoomOut, X, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AadhaarDocumentPreviewProps {
  document: {
    id: string;
    originalFilename: string;
    mimeType?: string;
    sizeBytes?: number;
  };
  token?: string;
}

export function AadhaarDocumentPreview({ document, token }: AadhaarDocumentPreviewProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!document || !document.id) {
    return null;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  const docUrl = `${apiBase}/uploads/document/${document.id}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  const isPdf = document.mimeType?.includes('pdf') || document.originalFilename?.toLowerCase().endsWith('.pdf');

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-white border border-[#EAD9B8] shadow-sm space-y-3">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6019]">
            Uploaded Aadhaar Document
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="px-2.5 py-1 rounded-lg bg-[#FFF9EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#2D1F0E] text-[11px] font-semibold flex items-center space-x-1 transition shadow-sm"
          >
            <ZoomIn className="w-3 h-3 text-[#D99427]" />
            <span>Enlarge</span>
          </button>
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#6E5336] text-[11px] font-semibold flex items-center space-x-1 transition shadow-sm"
          >
            <ExternalLink className="w-3 h-3 text-[#8C6019]" />
            <span>Open Tab</span>
          </a>
        </div>
      </div>

      {/* Inline Document Preview Box */}
      <div className="relative rounded-xl overflow-hidden bg-[#FAF6EE] border border-[#EAD9B8] flex items-center justify-center min-h-[160px] max-h-[300px]">
        {isPdf ? (
          <div className="p-6 text-center space-y-3">
            <FileText className="w-12 h-12 text-[#D99427] mx-auto animate-bounce" />
            <div>
              <p className="text-xs font-bold text-[#2D1F0E]">{document.originalFilename}</p>
              <p className="text-[10px] text-[#8C6019]">PDF Document Upload</p>
            </div>
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs shadow-sm hover:opacity-95 transition"
            >
              <span>View PDF Document in Secure Viewer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <>
            {imageLoading && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#FAF6EE]">
                <div className="w-6 h-6 border-2 border-[#D99427] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {imageError ? (
              <div className="p-6 text-center space-y-2">
                <FileText className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="text-xs font-semibold text-[#2D1F0E]">Preview Unavailable</p>
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#D99427] underline font-bold"
                >
                  Click to open document directly
                </a>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={docUrl}
                alt={`Aadhaar Document - ${document.originalFilename}`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
                onClick={() => setIsZoomed(true)}
                className="w-full h-auto max-h-[280px] object-contain rounded-xl cursor-zoom-in hover:scale-[1.01] transition-transform duration-200"
              />
            )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] text-[#6E5336] px-1">
        <span className="truncate max-w-[200px]">{document.originalFilename}</span>
        <span className="italic">Click image to inspect in high resolution</span>
      </div>

      {/* FULLSCREEN / ZOOM MODAL */}
      {isZoomed && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          {/* Top Bar Controls */}
          <div className="w-full max-w-4xl flex items-center justify-between p-4 bg-white/95 rounded-2xl border border-[#EAD9B8] shadow-2xl mb-4 text-[#2D1F0E]">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-serif font-bold">
                Aadhaar Document Inspection • {document.originalFilename}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(0.5, prev - 0.25))}
                className="p-2 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] hover:bg-[#F3ECE0] transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-[#2D1F0E]" />
              </button>
              <span className="text-xs font-mono font-bold min-w-[50px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(3, prev + 0.25))}
                className="p-2 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] hover:bg-[#F3ECE0] transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-[#2D1F0E]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsZoomed(false);
                  setZoomScale(1);
                }}
                className="p-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition ml-2"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Image Box */}
          <div className="relative max-w-4xl max-h-[80vh] w-full flex items-center justify-center overflow-auto p-4 bg-white/10 rounded-3xl border border-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={docUrl}
              alt="High Resolution Aadhaar Document"
              style={{ transform: `scale(${zoomScale})` }}
              className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-150"
            />
          </div>
        </div>
      )}
    </div>
  );
}
