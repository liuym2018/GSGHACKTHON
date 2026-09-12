/**
 * Real Webcam & Synthetic Virtual Camera Feed Generator
 * Ensures that an active video stream is ALWAYS rendering on the screen,
 * whether using physical webcam hardware or virtual studio camera simulation.
 */

export interface CameraFeedController {
  stream: MediaStream;
  stop: () => void;
  type: 'real' | 'virtual';
  captureCurrentFrame: () => string;
  setOutfitStyle?: (style: string) => void;
}

export type VirtualOutfitStyle = 'tuxedo' | 'emerald_silk' | 'camel_trench' | 'streetwear';

/**
 * Creates an animated, live virtual mobile camera feed at 30 FPS.
 * Renders an animated high-fashion model with real garments, drape,
 * tracking reticle, and studio telemetry so that Outfit Design AI has a
 * realistic, working live camera feed.
 */
export function createVirtualCameraStream(
  label: string,
  platform: 'ios' | 'android',
  initialStyle: VirtualOutfitStyle = 'tuxedo'
): CameraFeedController {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  let animationFrameId: number;
  let frameCount = 0;
  let currentStyle: VirtualOutfitStyle = initialStyle;

  const isIOS = platform === 'ios';
  const primaryColor = isIOS ? '#3B82F6' : '#10B981';

  function render() {
    frameCount++;
    const t = frameCount * 0.035;

    // 1. Studio Runway Backdrop
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0d14');
    gradient.addColorStop(0.45, '#161c27');
    gradient.addColorStop(1, '#080a0f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle runway backdrop vertical perspective lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(40, canvas.height);
    ctx.moveTo(540, 0);
    ctx.lineTo(600, canvas.height);
    ctx.stroke();

    // 2. Ambient Studio Soft Spotlight
    const lightX = canvas.width / 2 + Math.sin(t * 0.4) * 35;
    const lightY = 280 + Math.cos(t * 0.3) * 15;
    const aura = ctx.createRadialGradient(lightX, lightY, 30, lightX, lightY, 300);
    aura.addColorStop(0, currentStyle === 'emerald_silk'
      ? 'rgba(16, 185, 129, 0.22)'
      : currentStyle === 'camel_trench'
      ? 'rgba(245, 158, 11, 0.18)'
      : currentStyle === 'streetwear'
      ? 'rgba(168, 85, 247, 0.20)'
      : isIOS ? 'rgba(59, 130, 246, 0.22)' : 'rgba(236, 72, 153, 0.22)'
    );
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Human Subject Motion
    const headX = canvas.width / 2 + Math.sin(t * 0.6) * 7;
    const headY = 270 + Math.sin(t * 1.1) * 4; // breathing
    const headRadius = 70;

    // Body / Torso
    const torsoY = headY + 120;

    // A. Hair (back layer)
    ctx.beginPath();
    ctx.fillStyle = '#1c1917';
    ctx.arc(headX, headY - 10, headRadius + 14, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // B. Neck & Collarbones (Skin)
    ctx.beginPath();
    ctx.fillStyle = '#e7bc91';
    ctx.roundRect(headX - 26, headY + 45, 52, 90, 10);
    ctx.fill();

    // Neck shadow under chin
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(headX, headY + 58, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // C. OUTFIT / GARMENT RENDERING
    if (currentStyle === 'tuxedo') {
      // Midnight Tuxedo with Satin Lapels & White Poplin Shirt
      // Shoulders base
      ctx.beginPath();
      ctx.fillStyle = '#111827'; // Dark charcoal / midnight
      ctx.ellipse(headX, torsoY + 160, 210, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // White Shirt V-Placket
      ctx.beginPath();
      ctx.fillStyle = '#f8fafc';
      ctx.moveTo(headX - 35, headY + 80);
      ctx.lineTo(headX + 35, headY + 80);
      ctx.lineTo(headX, headY + 220);
      ctx.closePath();
      ctx.fill();

      // Black Silk Bow Tie
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(headX - 24, headY + 95);
      ctx.lineTo(headX + 24, headY + 95);
      ctx.lineTo(headX, headY + 106);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX, headY + 100, 6, 0, Math.PI * 2);
      ctx.fill();

      // Peak Lapels (Satin Sheen)
      ctx.fillStyle = '#1e293b';
      // Left Lapel
      ctx.beginPath();
      ctx.moveTo(headX - 110, torsoY + 140);
      ctx.lineTo(headX - 18, headY + 85);
      ctx.lineTo(headX - 4, headY + 240);
      ctx.lineTo(headX - 80, torsoY + 150);
      ctx.closePath();
      ctx.fill();

      // Right Lapel
      ctx.beginPath();
      ctx.moveTo(headX + 110, torsoY + 140);
      ctx.lineTo(headX + 18, headY + 85);
      ctx.lineTo(headX + 4, headY + 240);
      ctx.lineTo(headX + 80, torsoY + 150);
      ctx.closePath();
      ctx.fill();

      // Lapel highlight edge
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(headX - 18, headY + 85);
      ctx.lineTo(headX - 4, headY + 240);
      ctx.moveTo(headX + 18, headY + 85);
      ctx.lineTo(headX + 4, headY + 240);
      ctx.stroke();

      // Gold Pocket Square
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(headX + 75, torsoY + 100);
      ctx.lineTo(headX + 95, torsoY + 92);
      ctx.lineTo(headX + 105, torsoY + 105);
      ctx.closePath();
      ctx.fill();

    } else if (currentStyle === 'emerald_silk') {
      // Emerald Green Satin Slip Dress with Asymmetric Neckline
      ctx.beginPath();
      ctx.fillStyle = '#065f46'; // Emerald green
      ctx.ellipse(headX, torsoY + 150, 200, 130, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cowl drape
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.moveTo(headX - 70, headY + 90);
      ctx.quadraticCurveTo(headX, headY + 150, headX + 70, headY + 90);
      ctx.lineTo(headX + 70, headY + 240);
      ctx.lineTo(headX - 70, headY + 240);
      ctx.closePath();
      ctx.fill();

      // Satin sheen curve
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(headX - 60, headY + 98);
      ctx.quadraticCurveTo(headX, headY + 155, headX + 60, headY + 98);
      ctx.stroke();

      // Gold chain necklace
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(headX, headY + 70, 36, 0.2, Math.PI - 0.2);
      ctx.stroke();

    } else if (currentStyle === 'camel_trench') {
      // Camel Cashmere Trench with Crimson Ribbed Turtleneck
      // Crimson turtleneck
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.roundRect(headX - 30, headY + 65, 60, 60, 8);
      ctx.fill();
      // Ribbed texture
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.5;
      for (let rx = -24; rx <= 24; rx += 8) {
        ctx.beginPath();
        ctx.moveTo(headX + rx, headY + 65);
        ctx.lineTo(headX + rx, headY + 125);
        ctx.stroke();
      }

      // Camel Trench Outer
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(headX, torsoY + 160, 215, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // Broad lapels
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(headX - 120, torsoY + 130);
      ctx.lineTo(headX - 25, headY + 100);
      ctx.lineTo(headX - 10, headY + 250);
      ctx.lineTo(headX - 70, torsoY + 160);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(headX + 120, torsoY + 130);
      ctx.lineTo(headX + 25, headY + 100);
      ctx.lineTo(headX + 10, headY + 250);
      ctx.lineTo(headX + 70, torsoY + 160);
      ctx.closePath();
      ctx.fill();

      // Tortoise horn buttons
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(headX + 35, headY + 180, 8, 0, Math.PI * 2);
      ctx.arc(headX + 35, headY + 230, 8, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Urban Streetwear Matte Tech Blazer with Lavender Accents
      ctx.fillStyle = '#1e1b4b'; // Deep indigo / tech black
      ctx.beginPath();
      ctx.ellipse(headX, torsoY + 160, 215, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lavender hoodie inner
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(headX - 45, headY + 80);
      ctx.lineTo(headX + 45, headY + 80);
      ctx.lineTo(headX, headY + 220);
      ctx.closePath();
      ctx.fill();

      // Black tech blazer lapels
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(headX - 110, torsoY + 130);
      ctx.lineTo(headX - 30, headY + 95);
      ctx.lineTo(headX - 10, headY + 250);
      ctx.lineTo(headX - 70, torsoY + 160);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(headX + 110, torsoY + 130);
      ctx.lineTo(headX + 30, headY + 95);
      ctx.lineTo(headX + 10, headY + 250);
      ctx.lineTo(headX + 70, torsoY + 160);
      ctx.closePath();
      ctx.fill();

      // Silver hardware chain
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(headX, headY + 95, 30, 0, Math.PI);
      ctx.stroke();
    }

    // D. Head & Facial Features
    // Head shape
    ctx.beginPath();
    ctx.fillStyle = '#f3cba5'; // Natural skin
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Hair front & bangs
    ctx.beginPath();
    ctx.fillStyle = '#1c1917';
    ctx.arc(headX, headY - 14, headRadius + 6, Math.PI, Math.PI * 2);
    ctx.lineTo(headX + headRadius + 4, headY + 25);
    ctx.quadraticCurveTo(headX, headY - 10, headX - headRadius - 4, headY + 25);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.arc(headX - 24, headY - 4, 6, 0, Math.PI * 2);
    ctx.arc(headX + 24, headY - 4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(headX - 34, headY - 16);
    ctx.lineTo(headX - 14, headY - 15);
    ctx.moveTo(headX + 14, headY - 15);
    ctx.lineTo(headX + 34, headY - 16);
    ctx.stroke();

    // Nose line
    ctx.strokeStyle = '#d49b70';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX, headY - 2);
    ctx.lineTo(headX + 3, headY + 15);
    ctx.lineTo(headX - 2, headY + 18);
    ctx.stroke();

    // Lips (Warm Berry / Couture Red)
    ctx.fillStyle = currentStyle === 'emerald_silk' ? '#be123c' : '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(headX, headY + 34, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Live Computer Vision / Fashion Reticle Overlay
    const boxPadding = 36;
    const boxX = headX - headRadius - boxPadding / 2;
    const boxY = headY - headRadius - boxPadding / 2;
    const boxW = (headRadius + boxPadding / 2) * 2;
    const boxH = (headRadius + boxPadding / 2) * 2 + 15;
    const cornerSize = 18;

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;

    // Corner brackets for head
    ctx.beginPath();
    // Top-Left
    ctx.moveTo(boxX, boxY + cornerSize);
    ctx.lineTo(boxX, boxY);
    ctx.lineTo(boxX + cornerSize, boxY);
    // Top-Right
    ctx.moveTo(boxX + boxW - cornerSize, boxY);
    ctx.lineTo(boxX + boxW, boxY);
    ctx.lineTo(boxX + boxW, boxY + cornerSize);
    // Bottom-Left
    ctx.moveTo(boxX, boxY + boxH - cornerSize);
    ctx.lineTo(boxX, boxY + boxH);
    ctx.lineTo(boxX + cornerSize, boxY + boxH);
    // Bottom-Right
    ctx.moveTo(boxX + boxW - cornerSize, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH - cornerSize);
    ctx.stroke();

    // Reticle tag
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SUBJECT TRACKING • 60FPS', boxX, boxY - 8);

    // Garment silhouette bounding box
    const garmentX = headX - 160;
    const garmentY = headY + 70;
    const garmentW = 320;
    const garmentH = 340;
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(garmentX, garmentY, garmentW, garmentH);
    ctx.setLineDash([]);

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(
      `OUTFIT: ${currentStyle.toUpperCase().replace('_', ' ')} • SILHOUETTE FIT`,
      garmentX + 8,
      garmentY - 6
    );

    // 5. Camera Telemetry HUD Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, 36);

    ctx.fillStyle = '#E5E7EB';
    ctx.font = '11px monospace';
    ctx.fillText('LENS: ' + (isIOS ? '12MP TrueDepth HDR' : '10.5MP DualPixel HDR'), 16, 22);

    const timeStr = new Date().toLocaleTimeString();
    ctx.fillText('REC: ' + timeStr + ' • 30FPS', canvas.width - 210, 22);

    // Bottom telemetry bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - 36, canvas.width, 36);
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px monospace';
    ctx.fillText('VONAGE WEBRTC HD • ' + label.toUpperCase(), 16, canvas.height - 14);

    // Audio level meter bar
    const audioLevel = Math.abs(Math.sin(t * 3.5)) * 55 + 10;
    ctx.fillStyle = '#10B981';
    ctx.fillRect(canvas.width - 110, canvas.height - 22, audioLevel, 8);
    ctx.strokeStyle = '#374151';
    ctx.strokeRect(canvas.width - 110, canvas.height - 22, 65, 8);

    animationFrameId = requestAnimationFrame(render);
  }

  render();

  // Create real MediaStream from canvas
  const stream = (canvas as any).captureStream(30) as MediaStream;

  // Create silent/subtle audio track so WebRTC sinks have complete track
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const dest = audioCtx.createMediaStreamDestination();
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }
  } catch (e) {
    // video track alone is sufficient
  }

  return {
    stream,
    type: 'virtual',
    captureCurrentFrame: () => {
      return canvas.toDataURL('image/jpeg', 0.9);
    },
    setOutfitStyle: (style: string) => {
      currentStyle = style as VirtualOutfitStyle;
    },
    stop: () => {
      cancelAnimationFrame(animationFrameId);
      stream.getTracks().forEach((track) => track.stop());
    },
  };
}

/**
 * Attempts to capture real webcam hardware safely without audio bottlenecks.
 */
export async function tryGetPhysicalWebcam(): Promise<MediaStream | null> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return null;
  }
  try {
    // Request video ONLY to avoid failing if no microphone is plugged in or audio is blocked
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        facingMode: 'user',
      },
      audio: false,
    });
    return stream;
  } catch (err) {
    console.warn('Physical webcam request not granted or error, retrying without constraints:', err);
    try {
      // Fallback with basic video constraint
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      return fallbackStream;
    } catch (e2) {
      console.warn('Physical webcam fallback failed:', e2);
      return null;
    }
  }
}

/**
 * Captures a pristine JPEG data URL frame from any MediaStream or HTMLVideoElement.
 */
export async function captureFrameFromStream(
  stream: MediaStream | null,
  videoElement?: HTMLVideoElement | null
): Promise<string | null> {
  // If a playing video element is supplied and has valid dimensions, draw from it
  if (videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.9);
      }
    } catch (e) {
      console.warn('Error capturing from video element:', e);
    }
  }

  // If stream exists, use offscreen video
  if (stream && stream.getVideoTracks().length > 0) {
    try {
      return await new Promise<string | null>((resolve) => {
        const tempVideo = document.createElement('video');
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        tempVideo.srcObject = stream;

        const cleanup = () => {
          tempVideo.pause();
          tempVideo.srcObject = null;
          tempVideo.remove();
        };

        const timer = setTimeout(() => {
          cleanup();
          resolve(null);
        }, 1500);

        tempVideo.onloadedmetadata = () => {
          tempVideo.play().then(() => {
            setTimeout(() => {
              try {
                const w = tempVideo.videoWidth || 640;
                const h = tempVideo.videoHeight || 800;
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(tempVideo, 0, 0, w, h);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                  clearTimeout(timer);
                  cleanup();
                  resolve(dataUrl);
                  return;
                }
              } catch (e) {
                console.warn('Offscreen capture error', e);
              }
              clearTimeout(timer);
              cleanup();
              resolve(null);
            }, 100);
          }).catch(() => {
            clearTimeout(timer);
            cleanup();
            resolve(null);
          });
        };
      });
    } catch (err) {
      console.warn('Stream capture error', err);
    }
  }

  return null;
}

