import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ChatInput - Message input bar with text field, file attach, and send button.
 *
 * Props:
 *  - onSendMessage: (content: string) => Promise<void>
 *  - onSendFile: (file: File, content?: string) => Promise<void>
 *  - disabled: boolean
 */
export default function ChatInput({ onSendMessage, onSendFile, disabled = false }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordedChunksRef = useRef([]);
  const recordingStartRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const pointerStartRef = useRef(null);
  const willCancelRef = useRef(false);

  useEffect(() => {
    return () => {
      // cleanup object URL on unmount
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSend = async () => {
    if (sending) return;

    const trimmedText = text.trim();
    if (!trimmedText && !selectedFile) return;

    setSending(true);
    try {
      if (selectedFile) {
        await onSendFile(selectedFile, trimmedText);
        setSelectedFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      } else {
        await onSendMessage(trimmedText);
      }
      setText('');
    } catch (err) {
      // Error handled by parent
    } finally {
      setSending(false);
    }
  };

  // Start recording for press-and-hold behavior
  const startHoldRecording = async (clientX, clientY) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
      };

      mr.start();
      setIsRecording(true);
      recordingStartRef.current = Date.now();
      setRecordingSeconds(0);

      // timer
      recordingTimerRef.current = window.setInterval(() => {
        const start = recordingStartRef.current || Date.now();
        setRecordingSeconds(Math.floor((Date.now() - start) / 1000));
      }, 250);

      // store pointer start for cancel detection
      pointerStartRef.current = { x: clientX, y: clientY };
      willCancelRef.current = false;

      // stop handler will be invoked by finishHoldRecording
      mr.onstop = async () => {
        try { stream.getTracks().forEach(t => t.stop()); } catch (_) {}
        setIsRecording(false);
        if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
        recordingStartRef.current = null;
        const willCancel = willCancelRef.current;
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        if (!willCancel && blob.size > 0) {
          const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type });
          setSending(true);
          try {
            await onSendFile(file, text.trim());
            setText('');
          } catch (_) {}
          setSending(false);
        }
        recordedChunksRef.current = [];
        willCancelRef.current = false;
      };
    } catch (err) {
      console.warn('microphone access denied', err);
    }
  };

  const finishHoldRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    } catch (_) {}
  };

  const cancelHoldRecording = () => {
    // mark willCancel and stop recorder; onstop handler will discard
    willCancelRef.current = true;
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    } catch (_) {}
  };

  const handlePointerMoveGlobal = (ev) => {
    if (!pointerStartRef.current) return;
    const currentX = ev.clientX !== undefined ? ev.clientX : (ev.touches && ev.touches[0]?.clientX) || 0;
    const dx = pointerStartRef.current.x - currentX; // positive when moved left
    // if user slides left more than 60px we treat as cancel
    if (dx > 60) {
      willCancelRef.current = true;
    } else {
      willCancelRef.current = false;
    }
  };

  const attachGlobalPointerHandlers = () => {
    window.addEventListener('pointermove', handlePointerMoveGlobal);
    window.addEventListener('pointerup', handleGlobalPointerUp);
  };

  const detachGlobalPointerHandlers = () => {
    window.removeEventListener('pointermove', handlePointerMoveGlobal);
    window.removeEventListener('pointerup', handleGlobalPointerUp);
  };

  const handleGlobalPointerUp = () => {
    // called when pointer is released anywhere
    detachGlobalPointerHandlers();
    finishHoldRecording();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } catch (_) {
        setPreviewUrl(null);
      }
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch (_) {}
      setPreviewUrl(null);
    }
    setSelectedFile(null);
  };

  return (
    <div className="chat-input">
      {selectedFile && (
        <div className="file-preview">
          {/* Preview image/audio/video when possible */}
          {selectedFile.type.startsWith('image/') && previewUrl && (
            <img src={previewUrl} alt="preview" className="file-preview-image" />
          )}

          {selectedFile.type.startsWith('audio/') && previewUrl && (
            <audio controls className="file-preview-audio" src={previewUrl} />
          )}

          {selectedFile.type.startsWith('video/') && previewUrl && (
            <video controls className="file-preview-video" src={previewUrl} />
          )}

          <div className="file-meta">
            <div className="file-name">{selectedFile.name}</div>
            <div className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
          </div>
          <button className="file-remove" onClick={removeFile}>✕</button>
        </div>
      )}

      <div className="chat-input-row">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*,audio/*" style={{ display: 'none' }} />

        <div className="text-input-wrap">
          <textarea
            className="text-input"
            placeholder={t('chat.type_message')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || sending}
            rows={1}
          />

          <div className="input-actions">
            <button className="icon-btn attach-inside" onClick={() => fileInputRef.current?.click()} disabled={disabled || sending} aria-label="attach">
              <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M21.44 11.05l-8.49 8.49a5 5 0 01-7.07-7.07l8.49-8.49a3.5 3.5 0 014.95 4.95l-8.49 8.49a2 2 0 11-2.83-2.83l7.78-7.78" stroke="none"/>
              </svg>
            </button>
            <button
              className={`icon-btn record-inside ${isRecording ? 'recording' : ''}`}
              onPointerDown={(e) => {
                // start press-and-hold
                e.preventDefault();
                const p = e;
                startHoldRecording(p.clientX || 0, p.clientY || 0).then(() => {});
                attachGlobalPointerHandlers();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                // release handled globally
              }}
              onPointerCancel={(e) => {
                e.preventDefault();
                cancelHoldRecording();
                detachGlobalPointerHandlers();
              }}
              disabled={disabled || sending}
              aria-label="record"
            >
              {isRecording ? (
                <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <rect x="5" y="5" width="14" height="14" rx="2" ry="2" fill="currentColor" />
                </svg>
              ) : (
                <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path fill="currentColor" d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" />
                  <path fill="currentColor" d="M19 11v1a7 7 0 01-14 0v-1" opacity="0.6" />
                </svg>
              )}
            </button>
            <button className="icon-btn send-inside" onClick={handleSend} disabled={disabled || sending || (!text.trim() && !selectedFile)} aria-label="send">
              {sending ? <span className="spinner" /> : (
                <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                </svg>
              )}
            </button>
          </div>
          {/* Recording overlay shown while press-and-hold recording is active */}
          {isRecording && (
            <div className={`record-overlay ${willCancelRef.current ? 'will-cancel' : ''}`}>
              <div className="record-indicator">
                <span className="record-dot" />
                <span className="record-time">{new Date(recordingSeconds * 1000).toISOString().substr(14, 5)}</span>
              </div>
              <div className="record-hint">{willCancelRef.current ? 'Suelta para cancelar' : 'Desliza a la izquierda para cancelar'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}