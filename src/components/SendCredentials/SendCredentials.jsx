import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './SendCredentials.module.css';

/* ---------- Icons — paths exported from Figma (icon/back, icon/camera), on a 24-unit grid ---------- */

const Icon = ({ size = 20, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const BackIcon = () => (
  <Icon size={22}>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
);

const CameraIcon = () => (
  <Icon>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </Icon>
);

/* ---------- Content ---------- */

const DOCUMENT_TYPES = ['Valid ID', 'Business Permit', 'Brgy. Clearance'];

const STEPS = [
  'Choose the document type',
  'Align it inside the frame',
  'Capture and send for review',
];

/* ---------- Camera helpers ---------- */

// Prefer the rear camera on phones (better for documents); laptops ignore this and use the webcam.
const CAMERA_CONSTRAINTS = {
  video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
  audio: false,
};

function cameraErrorMessage(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access was blocked. Allow camera access in your browser’s site settings, then try again.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device.';
    case 'NotReadableError':
    case 'AbortError':
      return 'Your camera is being used by another app. Close it, then try again.';
    default:
      return 'The camera could not be started. Please try again.';
  }
}

const stopStream = (stream) => stream?.getTracks().forEach((track) => track.stop());

/* ---------- Submission ----------
   With `submitUrl`, the photo is POSTed as multipart/form-data (fields: documentType, file).
   Without it, a mock handler simulates the upload so the flow works with no backend. */

async function sendCredentials({ submitUrl, documentType, file }) {
  if (!submitUrl) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return { ok: true, mock: true };
  }

  const body = new FormData();
  body.append('documentType', documentType);
  body.append('file', file);

  const response = await fetch(submitUrl, { method: 'POST', body });
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
  return response.json().catch(() => ({ ok: true }));
}

/* ---------- Screen: "D3 · Send Credentials (Camera)" (node 6:116) ---------- */

export default function SendCredentials({
  onBack,
  onSend,
  onCapture,
  submitUrl,
  defaultDocumentType = DOCUMENT_TYPES[0],
}) {
  const [documentType, setDocumentType] = useState(defaultDocumentType);
  const [camera, setCamera] = useState({ status: 'requesting', message: '' });
  const [capturedImage, setCapturedImage] = useState(null);
  const [submission, setSubmission] = useState({ status: 'idle', message: '' });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const requestIdRef = useRef(0); // ignores stale getUserMedia results (StrictMode, retries, unmount)

  /* ----- Live camera stream ----- */

  const stopCamera = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera({
        status: 'error',
        message: 'This browser can’t access the camera. Open the page over HTTPS (or localhost) in a modern browser.',
      });
      return;
    }

    setCamera({ status: 'requesting', message: '' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      if (requestId !== requestIdRef.current) {
        stopStream(stream); // a newer request or unmount happened while the prompt was open
        return;
      }

      streamRef.current = stream;
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (streamRef.current !== stream) return;
        setCamera({ status: 'error', message: 'The camera was disconnected. Reconnect it, then try again.' });
      });

      videoRef.current.srcObject = stream;
      setCamera({ status: 'live', message: '' });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setCamera({ status: 'error', message: cameraErrorMessage(error) });
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      requestIdRef.current += 1;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  /* ----- Snapshot capture ----- */

  const captureSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (camera.status !== 'live' || !video?.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(image);
    setSubmission({ status: 'idle', message: '' });
    onCapture?.({ documentType, image });
  };

  const retake = () => {
    setCapturedImage(null);
    setSubmission({ status: 'idle', message: '' });
  };

  /* ----- Submission ----- */

  const onSubmitCredentials = async () => {
    if (submission.status === 'sending') return;
    if (!capturedImage) {
      setSubmission({ status: 'error', message: 'Take a photo of your document with the shutter button first.' });
      return;
    }

    setSubmission({ status: 'sending', message: '' });

    try {
      const blob = await (await fetch(capturedImage)).blob(); // data URL → Blob
      const fileName = `${documentType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      const result = await sendCredentials({ submitUrl, documentType, file });

      setSubmission({ status: 'sent', message: 'Credentials sent for review.' });
      stopCamera();
      onSend?.({ documentType, file, result });
    } catch (error) {
      setSubmission({
        status: 'error',
        message: `We couldn’t send your credentials. ${error.message || 'Please try again.'}`,
      });
    }
  };

  /* ----- Render ----- */

  const isLive = camera.status === 'live';
  const isSending = submission.status === 'sending';

  const badge = capturedImage
    ? { label: 'Photo captured', tone: styles.statusDotCaptured }
    : isLive
      ? { label: 'Camera on', tone: '' }
      : camera.status === 'requesting'
        ? { label: 'Starting camera…', tone: styles.statusDotPending }
        : { label: 'Camera off', tone: styles.statusDotOff };

  return (
    <main className={styles.screen}>
      <section className={styles.instructions}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Go back">
          <BackIcon />
        </button>

        <h1 className={styles.title}>Send your credentials</h1>

        <p className={styles.description}>
          Use your camera to capture your valid ID or business permit as a boarding house
          owner. Make sure all text is clear and readable.
        </p>

        <div className={styles.chips} role="radiogroup" aria-label="Document type">
          {DOCUMENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={documentType === type}
              className={`${styles.chip} ${documentType === type ? styles.chipActive : ''}`}
              onClick={() => setDocumentType(type)}
              disabled={isSending}
            >
              {type}
            </button>
          ))}
        </div>

        <ol className={styles.steps}>
          {STEPS.map((step, i) => (
            <li key={step} className={styles.step}>
              <span className={styles.stepNumber}>{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>

        <button
          type="button"
          className={styles.sendButton}
          onClick={onSubmitCredentials}
          disabled={isSending || submission.status === 'sent'}
          aria-busy={isSending}
        >
          {isSending ? <span className={styles.spinner} aria-hidden="true" /> : <CameraIcon />}
          {isSending ? 'Sending…' : 'Send credentials'}
        </button>

        <p
          className={`${styles.formMessage} ${submission.status === 'error' ? styles.formMessageError : ''}`}
          role={submission.status === 'error' ? 'alert' : 'status'}
        >
          {submission.message}
        </p>
      </section>

      <section className={styles.cameraPanel} aria-label="Camera">
        <div className={styles.viewfinder}>
          <video
            ref={videoRef}
            className={`${styles.video} ${isLive ? '' : styles.hidden}`}
            autoPlay
            playsInline
            muted
            aria-label="Live camera preview"
          />

          {capturedImage && (
            <img className={styles.snapshot} src={capturedImage} alt={`Captured ${documentType}`} />
          )}

          {isLive && !capturedImage && (
            <div className={styles.guide} aria-hidden="true">
              {/* Dashed 3px border with Figma's exact 12/9 dash pattern */}
              <svg className={styles.guideBorder} viewBox="0 0 420 250" preserveAspectRatio="none">
                <rect x="1.5" y="1.5" width="417" height="247" rx="14.5" />
              </svg>
            </div>
          )}

          {!isLive && !capturedImage && (
            <div className={styles.placeholder}>
              {camera.status === 'requesting' ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  <p>Waiting for camera permission…</p>
                </>
              ) : (
                <>
                  <p role="alert">{camera.message}</p>
                  <button type="button" className={styles.retryButton} onClick={startCamera}>
                    Try again
                  </button>
                </>
              )}
            </div>
          )}

          <span className={styles.status}>
            <span className={`${styles.statusDot} ${badge.tone}`} />
            {badge.label}
          </span>

          {(isLive || capturedImage) && (
            <p className={styles.caption}>
              {capturedImage
                ? 'Check that all text is readable, then send it'
                : 'Align your document inside the frame'}
            </p>
          )}

          <canvas ref={canvasRef} className={styles.hidden} aria-hidden="true" />
        </div>

        <div className={styles.shutterRow}>
          <button
            type="button"
            className={styles.shutter}
            onClick={captureSnapshot}
            disabled={!isLive || Boolean(capturedImage) || isSending}
            aria-label={`Capture ${documentType}`}
          >
            <span className={styles.shutterInner} />
          </button>

          {capturedImage && (
            <button
              type="button"
              className={styles.retakeButton}
              onClick={retake}
              disabled={isSending || submission.status === 'sent'}
            >
              Retake
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
