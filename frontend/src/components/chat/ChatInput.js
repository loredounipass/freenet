import React, { useState, useRef } from 'react';
import { Box, IconButton, TextField, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
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
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = async () => {
    if (sending) return;

    const trimmedText = text.trim();
    if (!trimmedText && !selectedFile) return;

    setSending(true);
    try {
      if (selectedFile) {
        await onSendFile(selectedFile, trimmedText);
        setSelectedFile(null);
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
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <Box
      sx={{
        borderTop: '1px solid #E0E0E0',
        bgcolor: '#fff',
        px: 2,
        py: 1,
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
      }}
    >
      {/* File preview */}
      {selectedFile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1,
            p: 1,
            bgcolor: '#F5F5F5',
            borderRadius: 2,
            gap: 1,
          }}
        >
          <ImageIcon sx={{ color: '#2186EB', fontSize: 20 }} />
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Box
              component="span"
              sx={{
                fontSize: '0.8rem',
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {selectedFile.name}
            </Box>
            <Box component="span" sx={{ fontSize: '0.7rem', color: '#9E9E9E' }}>
              {(selectedFile.size / 1024).toFixed(1)} KB
            </Box>
          </Box>
          <IconButton size="small" onClick={removeFile}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        {/* Attach file button */}
        <IconButton
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
          sx={{ color: '#9E9E9E', '&:hover': { color: '#2186EB' } }}
        >
          <AttachFileIcon />
        </IconButton>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*"
          style={{ display: 'none' }}
        />

        {/* Text input */}
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={t('chat.type_message')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: '#F5F5F5',
              '& fieldset': { border: 'none' },
              '&:hover fieldset': { border: 'none' },
              '&.Mui-focused fieldset': { border: '1px solid #2186EB' },
            },
          }}
        />

        {/* Send button */}
        <IconButton
          onClick={handleSend}
          disabled={disabled || sending || (!text.trim() && !selectedFile)}
          sx={{
            bgcolor: '#2186EB',
            color: '#fff',
            width: 40,
            height: 40,
            '&:hover': { bgcolor: '#1a6fc2' },
            '&.Mui-disabled': { bgcolor: '#E0E0E0', color: '#9E9E9E' },
          }}
        >
          {sending ? (
            <CircularProgress size={20} sx={{ color: '#fff' }} />
          ) : (
            <SendIcon sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}