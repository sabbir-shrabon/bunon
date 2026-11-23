/**
 * 1. Purpose: In-app camera screen (Screen 39) with rectangular viewfinder and Sheet 49 fallback.
 * 2. Spec Ref: Stitch Screen 39 (Camera) and Sheet 49 (Permission denied).
 * 3. Called By: Create proof page and Today Hero Card Beat 2 camera tap.
 * 4. Calls: HTML5 getUserMedia, Canvas photo capture, and native file input fallback.
 */

'use client';

import { useEffect, useRef, useState } from 'react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, previewUrl: string) => void;
}

export function CameraModal({
  isOpen,
  onClose,
  onCapture,
}: Readonly<CameraModalProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }

    startCamera();

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setIsLoading(true);
    setHasPermissionError(false);
    stopStream();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setHasPermissionError(true);
        setIsLoading(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoading(false);
    } catch {
      setHasPermissionError(true);
      setIsLoading(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        stopStream();
        onCapture(blob, previewUrl);
      },
      'image/jpeg',
      0.85
    );
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onCapture(file, previewUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black text-white" role="dialog" aria-modal="true">
      {/* Hidden file input for native camera/gallery fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeFileChange}
      />

      {/* Top Controls */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 pt-safe">
        <button
          type="button"
          aria-label="Close camera"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {!hasPermissionError && (
          <button
            type="button"
            aria-label="Flip camera"
            onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
            className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
              <polyline points="15 2 20 2 20 7" />
              <line x1="10" y1="14" x2="20" y2="4" />
            </svg>
          </button>
        )}
      </div>

      {/* Viewfinder or Permission Fallback */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {hasPermissionError ? (
          /* Sheet 49: Camera Permission Blocked Fallback */
          <div className="flex flex-col items-center justify-center px-6 text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[20px] mb-3">
              📷
            </div>
            <h3 className="text-[17px] font-semibold text-white mb-2">Camera access unavailable</h3>
            <p className="text-[13px] text-zinc-400 mb-6 leading-relaxed">
              Use your device camera or upload a photo from your gallery instead.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-[52px] rounded-full bg-white text-black text-[14px] font-medium transition-transform active:scale-95 cursor-pointer"
            >
              Use phone camera / upload from Gallery
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm">
                Starting camera…
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Shutter Action */}
      {!hasPermissionError && (
        <div className="relative z-10 flex items-center justify-center pb-safe py-6">
          <button
            type="button"
            aria-label="Capture photo"
            onClick={handleCapture}
            className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
          >
            <span className="w-full h-full rounded-full bg-white" />
          </button>
        </div>
      )}
    </div>
  );
}
