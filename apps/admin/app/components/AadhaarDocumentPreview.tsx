'use client';

import React, { useState } from 'react';
import { Eye, ExternalLink, ZoomIn, ZoomOut, X, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AadhaarDocumentPreviewProps {
  document?: {
    id: string;
    originalFilename: string;
    originalFilenameBack?: string;
    mimeType?: string;
    sizeBytes?: number;
    storageKeyBack?: string; // Presence indicates back image exists
  };
  token?: string;
  directUrlFront?: string;
  directUrlBack?: string;
  filename?: string;
}

export function AadhaarDocumentPreview({ document, token, directUrlFront, directUrlBack, filename }: AadhaarDocumentPreviewProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [imageError, setImageError] = useState({ front: false, back: false });
  const [imageLoading, setImageLoading] = useState({ front: true, back: true });

  if (!document?.id && !directUrlFront) {
    return null;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  const docFrontUrl = directUrlFront || `${apiBase}/uploads/document/${document?.id}?side=front${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  const docBackUrl = directUrlBack || `${apiBase}/uploads/document/${document?.id}?side=back${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  const isPdf = document?.mimeType?.includes('pdf') || document?.originalFilename?.toLowerCase().endsWith('.pdf') || directUrlFront?.toLowerCase().endsWith('.pdf');
  const hasBackImage = !!document?.storageKeyBack || !!directUrlBack;
  const displayFilename = filename || document?.originalFilename || 'Aadhaar Document';

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
            href={docFrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#6E5336] text-[11px] font-semibold flex items-center space-x-1 transition shadow-sm"
          >
            <ExternalLink className="w-3 h-3 text-[#8C6019]" />
            <span>Open Front</span>
          </a>
          <a
            href={docBackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#6E5336] text-[11px] font-semibold flex items-center space-x-1 transition shadow-sm"
          >
            <ExternalLink className="w-3 h-3 text-[#8C6019]" />
            <span>Open Back</span>
          </a>
        </div>
      </div>

      {/* Inline Document Preview Box */}
      <div className="relative rounded-xl overflow-hidden bg-[#FAF6EE] border border-[#EAD9B8] flex items-center justify-center min-h-[160px] max-h-[300px]">
        {isPdf ? (
          <div className="p-6 text-center space-y-3">
            <FileText className="w-12 h-12 text-[#D99427] mx-auto animate-bounce" />
            <div>
              <p className="text-xs font-bold text-[#2D1F0E]">{document?.originalFilename || 'Document'}</p>
              <p className="text-[10px] text-[#8C6019]">PDF Document Upload</p>
            </div>
            <a
              href={docFrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs shadow-sm hover:opacity-95 transition mb-2"
            >
              <span>View Front PDF</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={docBackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs shadow-sm hover:opacity-95 transition ml-2 mb-2"
            >
              <span>View Back PDF</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
            <div className="relative">
              {imageLoading.front && !imageError.front && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#FAF6EE]">
                  <div className="w-6 h-6 border-2 border-[#D99427] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {imageError.front ? (
                <div className="p-6 text-center space-y-2">
                  <FileText className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-xs font-semibold text-[#2D1F0E]">Front Preview Unavailable</p>
                  <a
                    href={docFrontUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#D99427] underline font-bold"
                  >
                    Click to open front directly
                  </a>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={docFrontUrl}
                  alt={`Aadhaar Front - ${displayFilename}`}
                  onLoad={() => setImageLoading(p => ({ ...p, front: false }))}
                  onError={() => {
                    setImageLoading(p => ({ ...p, front: false }));
                    setImageError(p => ({ ...p, front: true }));
                  }}
                  onClick={() => setIsZoomed(true)}
                  className="w-full h-auto max-h-[280px] object-contain rounded-xl cursor-zoom-in hover:scale-[1.01] transition-transform duration-200 bg-white"
                />
              )}
            </div>

            {hasBackImage && (
              <div className="relative">
              {imageLoading.back && !imageError.back && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#FAF6EE]">
                  <div className="w-6 h-6 border-2 border-[#D99427] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {imageError.back ? (
                <div className="p-6 text-center space-y-2">
                  <FileText className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-xs font-semibold text-[#2D1F0E]">Back Preview Unavailable</p>
                  <p className="text-[10px] text-amber-700/80">Not provided or failed to load.</p>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={docBackUrl}
                  alt={`Aadhaar Back - ${document?.originalFilenameBack || displayFilename}`}
                  onLoad={() => setImageLoading(p => ({ ...p, back: false }))}
                  onError={() => {
                    setImageLoading(p => ({ ...p, back: false }));
                    setImageError(p => ({ ...p, back: true }));
                  }}
                  onClick={() => setIsZoomed(true)}
                  className="w-full h-auto max-h-[280px] object-contain rounded-xl cursor-zoom-in hover:scale-[1.01] transition-transform duration-200 bg-white"
                />
              )}
            </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] text-[#6E5336] px-1">
        <span className="truncate max-w-[200px]">{displayFilename}</span>
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
                Aadhaar Document Inspection • {displayFilename}
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
          <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center overflow-auto p-4 bg-white/10 rounded-3xl border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <h4 className="text-white mb-2 font-bold text-sm">Front</h4>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={docFrontUrl}
                  alt="High Resolution Aadhaar Front"
                  style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center top' }}
                  className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-150 bg-white"
                />
              </div>
              {hasBackImage && (
              <div className="text-center">
                <h4 className="text-white mb-2 font-bold text-sm">Back</h4>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={docBackUrl}
                  alt="High Resolution Aadhaar Back"
                  style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center top' }}
                  className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-150 bg-white"
                />
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
