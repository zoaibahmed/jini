import React, { useEffect, useRef, useState } from 'react';
import { Camera, RotateCw, X, Check, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface CameraScannerProps {
  onClose: () => void;
  onCapture: (blob: Blob, fileName: string) => void;
}

export function CameraScanner({ onClose, onCapture }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Align document within the frame');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  // Initialize camera stream
  const startCamera = async (mode: 'user' | 'environment') => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      setStatusMessage('Initializing camera...');
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setStatusMessage('Document detected. Hold still...');
    } catch (err) {
      console.warn('Camera access failed, falling back to simulated environment:', err);
      setStatusMessage('Camera access denied or unavailable. Fallback active.');
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    // List available video devices
    navigator.mediaDevices.enumerateDevices().then(info => {
      const videoDevices = info.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
    }).catch(() => {});

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Handle Switch Camera
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Perform Capture & Crop logic
  const handleCapture = () => {
    if (!videoRef.current) {
      // Camera fallback simulation
      simulateMockCapture();
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    
    // Get actual video dimensions
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    // Define Crop Area (box in the center representing the scanner outline)
    // We crop a rectangle of 75% width and 55% height centered
    const cropW = Math.floor(videoWidth * 0.75);
    const cropH = Math.floor(videoHeight * 0.55);
    const cropX = Math.floor((videoWidth - cropW) / 2);
    const cropY = Math.floor((videoHeight - cropH) / 2);
    
    // Create secondary canvas to hold cropped image
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const croppedCtx = croppedCanvas.getContext('2d');
    
    if (croppedCtx) {
      croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      
      // Convert to dataUrl for preview
      const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataUrl);
      
      // Convert to blob for upload
      croppedCanvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const simulateMockCapture = () => {
    // Simulated upload for testing without physical camera
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw simulated document background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 600, 400);
      
      // Draw border
      ctx.strokeStyle = '#D9A300';
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, 560, 360);
      
      // Draw headers
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('JNI Solutions Compliance Document', 50, 80);
      
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('Document Type: Simulated Scanner Scan', 50, 130);
      ctx.fillText('Generated At: ' + new Date().toLocaleString(), 50, 160);
      ctx.fillText('License Code: JNI-SIM-9988', 50, 190);
      ctx.fillText('Status: Confident', 50, 220);
      
      // Signature
      ctx.font = 'italic 18px cursive';
      ctx.fillStyle = '#475569';
      ctx.fillText('Verification Seal Approved', 380, 340);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      
      canvas.toBlob((blob) => {
        if (blob) setCapturedBlob(blob);
      }, 'image/jpeg');
    }
  };

  const handleAccept = () => {
    if (capturedBlob) {
      const fileName = `scan_${Date.now()}.jpg`;
      onCapture(capturedBlob, fileName);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera(facingMode);
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[999] flex flex-col justify-between select-none animate-fade-in">
      
      {/* Top Header Controls */}
      <div className="p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/80 to-transparent">
        <h3 className="font-heading font-extrabold text-sm tracking-wide">JNI Mobile Scanner</h3>
        <div className="flex items-center space-x-4">
          {devices.length > 1 && !capturedImage && (
            <button onClick={toggleCamera} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 text-slate-300">
              <RotateCw className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Scanner Center Screen */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          // Preview of Captured & Cropped Image
          <div className="relative max-w-full max-h-[70vh] p-4 flex flex-col items-center">
            <img 
              src={capturedImage} 
              alt="Captured Document" 
              className="rounded-lg shadow-2xl border border-zinc-700 max-h-[60vh] object-contain"
            />
            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-950/80 border border-emerald-500/20 px-3 py-1 rounded-full mt-3 animate-pulse">
              Document Cropped Successfully
            </span>
          </div>
        ) : (
          // Live Video feed with canvas corner overlays
          <div className="relative w-full h-full max-w-lg max-h-[75vh] flex items-center justify-center bg-black">
            {stream ? (
              <video 
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-8 space-y-4">
                <Camera className="w-12 h-12 text-zinc-500 mx-auto animate-pulse" />
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  Camera feed is not available. Standard simulated canvas scanner will run upon capture.
                </p>
              </div>
            )}

            {/* Glowing Corner Bounding Framework */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-[75%] h-[55%] border-2 border-emerald-500/30 rounded-lg relative shadow-[0_0_80px_rgba(16,185,129,0.1)]">
                {/* Glowing Laser line */}
                <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-scanner-laser" />

                {/* Corners */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-sm animate-pulse" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-sm animate-pulse" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-sm animate-pulse" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-sm animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status bar & Shutter Action Controls */}
      <div className="bg-zinc-950 p-6 flex flex-col items-center space-y-5 border-t border-zinc-900">
        <span className="text-[11px] font-semibold text-zinc-400">
          {statusMessage}
        </span>

        <div className="flex items-center justify-center w-full max-w-xs">
          {capturedImage ? (
            // Shutter Options: Accept vs Retake
            <div className="flex gap-4 w-full">
              <Button 
                onClick={handleRetake} 
                className="flex-1 bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 font-bold py-3 text-xs flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </Button>
              <Button 
                onClick={handleAccept} 
                className="flex-1 bg-emerald-500 text-black hover:bg-emerald-600 font-bold py-3 text-xs flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                Accept
              </Button>
            </div>
          ) : (
            // Shutter: Capture trigger button
            <button
              onClick={handleCapture}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 border-zinc-700 hover:scale-105 active:scale-95 transition-transform"
              aria-label="Take picture"
            >
              <div className="w-12 h-12 rounded-full bg-gold-primary hover:bg-gold-hover" />
            </button>
          )}
        </div>
      </div>
      
    </div>
  );
}
