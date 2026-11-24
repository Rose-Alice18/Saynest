import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

/**
 * Live camera view for laptops and desktops. Phones use their own camera app
 * through <input capture>, but desktop browsers ignore that and open a file
 * picker instead, so here we show the webcam and take the picture ourselves.
 */
export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't open the camera. Use “Choose a photo” instead.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((err) => {
        const name = err?.name;
        setError(
          name === 'NotAllowedError'
            ? 'Camera access is blocked. Click the camera icon in the address bar, allow it, then try again.'
            : name === 'NotFoundError'
              ? 'No camera was found. Use “Choose a photo” instead.'
              : 'Could not open the camera. It may be in use by another app.'
        );
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onCapture(new File([blob], 'camera.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden bg-stone-900 aspect-[4/3] flex items-center justify-center">
        {error ? (
          <p role="alert" className="text-xs text-white/90 text-center px-6 leading-relaxed">{error}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              onLoadedData={() => setReady(true)}
              className="w-full h-full object-cover"
            />
            {!ready && <p className="absolute text-xs text-white/80">Opening camera…</p>}
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="py-2.5 px-4 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
        <button
          type="button"
          onClick={capture}
          disabled={!ready || !!error}
          className="py-2.5 px-5 bg-[#FFE042] hover:bg-[#F7D836] disabled:opacity-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <Camera className="w-4 h-4" />
          <span>Take picture</span>
        </button>
      </div>
      <p className="text-[11px] text-stone-500 text-center">Hold the page up to the camera, flat and well lit.</p>
    </div>
  );
};
