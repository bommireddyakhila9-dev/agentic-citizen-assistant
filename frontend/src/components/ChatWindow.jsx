import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Zap, Trash2, RefreshCw, Copy, Check, ThumbsUp, ThumbsDown, Mic, MicOff, Paperclip, X, Image, Globe, Printer } from './Icons';
import { sendChatMessage, uploadFileBase64, analyzeCivicEvidence, transcribeVoiceAudio } from '../services/api';

const QUICK_PROMPTS = [
  { label: '🔍 Track GRV-1001', prompt: 'Can you check the current status of complaint GRV-1001?' },
  { label: '☀️ Solar Subsidy', prompt: 'What are the eligibility criteria and documents for the Rooftop Solar Subsidy scheme?' },
  { label: '🚰 Report Water Leak', prompt: 'I want to report a broken water pipe on Main Road. My contact phone is 9876543210.' },
  { label: '🩺 Senior Healthcare', prompt: 'What benefits are available under the Senior Citizen Healthcare scheme?' },
];

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'हिंदी (Hindi)' },
  { code: 'Spanish', label: 'Español' },
  { code: 'French', label: 'Français' },
  { code: 'Bengali', label: 'বাংলা (Bengali)' },
  { code: 'Marathi', label: 'मराठी (Marathi)' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)' },
];

const SPEECH_LANG_MAP = {
  English: 'en-US',
  Hindi: 'hi-IN',
  Spanish: 'es-ES',
  French: 'fr-FR',
  Bengali: 'bn-IN',
  Marathi: 'mr-IN',
  Telugu: 'te-IN',
};

/**
 * Replaces **bold**, *italic*, `code`, and clickable GRV-xxxx tickets
 */
function parseInlineMarkdown(text, onTicketClick) {
  if (!text) return null;
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\bGRV-\d{4}\b|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      const inner = matchedStr.slice(2, -2);
      if (/^GRV-\d{4}$/.test(inner)) {
        parts.push(
          <button
            key={match.index}
            onClick={() => onTicketClick && onTicketClick(inner)}
            title={`Click to track ticket ${inner}`}
            style={{
              background: 'rgba(56, 189, 248, 0.18)',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: '6px',
              padding: '1px 8px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-block',
              margin: '0 2px',
              transition: 'all 0.15s ease',
            }}
          >
            {inner} ↗
          </button>
        );
      } else {
        parts.push(
          <strong key={match.index} style={{ fontWeight: 700, color: 'var(--text-main)' }}>
            {inner}
          </strong>
        );
      }
    } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      const inner = matchedStr.slice(1, -1);
      if (/^GRV-\d{4}$/.test(inner)) {
        parts.push(
          <button
            key={match.index}
            onClick={() => onTicketClick && onTicketClick(inner)}
            title={`Click to track ticket ${inner}`}
            style={{
              background: 'rgba(56, 189, 248, 0.18)',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: '6px',
              padding: '1px 8px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-block',
              margin: '0 2px',
            }}
          >
            {inner} ↗
          </button>
        );
      } else {
        parts.push(
          <code
            key={match.index}
            style={{
              background: 'var(--bg-card-subtle)',
              color: 'var(--accent)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.825rem',
              border: '1px solid var(--border)',
            }}
          >
            {inner}
          </code>
        );
      }
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      const inner = matchedStr.slice(1, -1);
      parts.push(
        <em key={match.index} style={{ fontStyle: 'italic', color: 'var(--text-main)' }}>
          {inner}
        </em>
      );
    } else if (/^GRV-\d{4}$/.test(matchedStr)) {
      parts.push(
        <button
          key={match.index}
          onClick={() => onTicketClick && onTicketClick(matchedStr)}
          title={`Click to track ticket ${matchedStr}`}
          style={{
            background: 'rgba(56, 189, 248, 0.18)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
            borderRadius: '6px',
            padding: '1px 8px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.825rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-block',
            margin: '0 2px',
            transition: 'all 0.15s ease',
          }}
        >
          {matchedStr} ↗
        </button>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Formats multi-line headers, bullet points, numbers, and horizontal dividers
 */
function FormattedMessage({ text, onTicketClick }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} style={{ height: '4px' }} />;
        }

        if (trimmed === '---' || trimmed === '***') {
          return (
            <hr
              key={idx}
              style={{
                border: 'none',
                borderTop: '1px solid var(--border)',
                margin: '8px 0',
                opacity: 0.6,
              }}
            />
          );
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const headerText = headingMatch[2];
          const fontSize = level === 1 ? '1.15rem' : level === 2 ? '1.05rem' : '0.95rem';

          return (
            <h4
              key={idx}
              style={{
                fontSize,
                fontWeight: 700,
                color: 'var(--accent)',
                marginTop: idx === 0 ? '0px' : '10px',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                lineHeight: 1.3,
              }}
            >
              {parseInlineMarkdown(headerText, onTicketClick)}
            </h4>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          const number = numMatch[1];
          const itemText = numMatch[2];
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                paddingLeft: '2px',
                fontSize: '0.885rem',
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  background: 'var(--bg-card-subtle)',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  fontSize: '0.725rem',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  lineHeight: '1.4',
                  marginTop: '2px',
                  flexShrink: 0,
                }}
              >
                {number}
              </span>
              <span style={{ flex: 1, overflowWrap: 'anywhere' }}>
                {parseInlineMarkdown(itemText, onTicketClick)}
              </span>
            </div>
          );
        }

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const itemText = trimmed.replace(/^(\*|-|•)\s+/, '');
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                paddingLeft: '4px',
                fontSize: '0.885rem',
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1, marginTop: '2px' }}>
                •
              </span>
              <span style={{ flex: 1, overflowWrap: 'anywhere' }}>
                {parseInlineMarkdown(itemText, onTicketClick)}
              </span>
            </div>
          );
        }

        return (
          <p
            key={idx}
            style={{
              margin: 0,
              fontSize: '0.885rem',
              lineHeight: 1.55,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {parseInlineMarkdown(line, onTicketClick)}
          </p>
        );
      })}
    </div>
  );
}

export default function ChatWindow({ initialPrompt, onOpenReceipt }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I am CitizenConnect AI, your autonomous municipal assistant. How can I help you today? You can ask me questions in your preferred language, dictate voice complaints, attach damage photos, or track grievances.',
      tools_used: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [language, setLanguage] = useState('English');

  // Photo Attachment & Gemini Vision Analysis
  const [attachment, setAttachment] = useState(null); // { name, url, dataUrl, size }
  const [uploading, setUploading] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [visionAnalysis, setVisionAnalysis] = useState(null);

  // Web Speech API Voice Recognition & Gemini Audio Transcriber
  const [isListening, setIsListening] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [transcribingAudio, setTranscribingAudio] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [speechErrorMsg, setSpeechErrorMsg] = useState('');
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const silenceTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Manage live recording duration timer
  useEffect(() => {
    if (isListening || isRecordingAudio) {
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [isListening, isRecordingAudio]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Clean up speech recognition & audio recording on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore cleanup error
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  /**
   * Gemini Audio Transcriber: records microphone audio using HTML5 MediaRecorder
   * and transcribes via backend Gemini Multimodal API. Works 100% on restricted
   * networks, VPNs, Brave, Firefox, and Safari without Google cloud speech blocks.
   */
  const startMediaRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSpeechErrorMsg('Microphone recording is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        setTranscribingAudio(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          const res = await transcribeVoiceAudio(base64Audio, audioBlob.type, language);
          if (res.success && res.data.transcription && res.data.transcription !== '[Inaudible]') {
            const cleanText = res.data.transcription;
            setInput((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
            setSpeechErrorMsg('');
          } else {
            setSpeechErrorMsg('Audio recorded, but no clear speech was recognized. Try speaking closer to your mic.');
          }
          setTranscribingAudio(false);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecordingAudio(true);
      setSpeechErrorMsg('');
    } catch (err) {
      console.error('MediaRecorder error:', err);
      setIsRecordingAudio(false);
      setSpeechErrorMsg('Microphone access blocked: ' + (err.message || 'Please grant permission'));
    }
  };

  const stopMediaRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsRecordingAudio(false);
    }
  };

  const handleSimulateVoice = () => {
    const samples = [
      "There is a deep hazardous pothole near Sector 5 bus stop damaging car tires.",
      "The streetlight in Ward 2 has been flickering and is now completely dark.",
      "Main water supply pipeline is leaking on High Street causing water logging.",
      "Garbage collection truck has not visited Ward 4 for the last 3 days.",
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    setInput(picked);
    setSpeechErrorMsg('');
  };

  const toggleVoiceDictation = () => {
    // If currently recording via MediaRecorder, stop and transcribe
    if (isRecordingAudio) {
      stopMediaRecording();
      return;
    }

    // If currently listening via SpeechRecognition, stop it
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Browser doesn't support WebSpeech (e.g. Firefox) -> seamlessly use Gemini MediaRecorder!
      startMediaRecording();
      return;
    }

    try {
      // Re-instantiate a fresh recognizer for reliable start/stop lifecycle
      const recognizer = new SpeechRecognition();
      // Set continuous = true so the browser NEVER cuts off on short pauses
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = SPEECH_LANG_MAP[language] || 'en-US';

      const initialBaseText = input.trim();

      const resetSilenceTimer = () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        // Generous 12-second silence grace period before gentle auto-finish, giving the citizen plenty of time!
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              // ignore
            }
          }
          setIsListening(false);
        }, 12000);
      };

      recognizer.onstart = () => {
        setIsListening(true);
        setSpeechErrorMsg('');
        resetSilenceTimer();
      };

      recognizer.onresult = (event) => {
        resetSilenceTimer();
        let finalStr = '';
        let interimStr = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript + ' ';
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }
        const accumulated = (finalStr + interimStr).trim();
        const prefix = initialBaseText ? `${initialBaseText} ` : '';
        setInput(prefix + accumulated);
      };

      recognizer.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        setIsListening(false);
        if (event.error === 'network') {
          // Google Cloud Speech API is blocked by network/VPN/Brave -> seamlessly auto-failover to Gemini Audio AI!
          setSpeechErrorMsg('Google speech servers are blocked on your network. Switched to Gemini Audio AI mode.');
          startMediaRecording();
        } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setSpeechErrorMsg('Microphone blocked: Click the lock / tune icon in your browser URL bar to allow microphone access.');
        } else if (event.error === 'no-speech') {
          setSpeechErrorMsg('No speech detected. Please speak closer to your microphone and try again.');
        } else if (event.error === 'audio-capture') {
          setSpeechErrorMsg('No microphone found on your device. Please plug in or enable your microphone.');
        } else if (event.error !== 'aborted') {
          setSpeechErrorMsg(`Speech note: ${event.error}`);
        }
      };

      recognizer.onend = () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        setIsListening(false);
      };

      recognitionRef.current = recognizer;
      recognizer.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
      // Failover to Gemini Audio AI
      startMediaRecording();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setVisionAnalysis(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      const res = await uploadFileBase64(file.name, base64Data, file.type);
      if (res.success) {
        const attObj = {
          name: file.name,
          url: res.data.url,
          dataUrl: base64Data,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type,
        };
        setAttachment(attObj);

        // Automatically trigger Gemini Multimodal Vision analysis on the photo
        setAnalyzingPhoto(true);
        const analysisRes = await analyzeCivicEvidence(file.name, base64Data, file.type);
        if (analysisRes.success && analysisRes.data.analysis) {
          setVisionAnalysis(analysisRes.data.analysis);
        }
        setAnalyzingPhoto(false);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendMessage = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if ((!textToSend.trim() && !attachment) || loading) return;

    let promptWithAttachment = textToSend.trim();
    if (attachment) {
      promptWithAttachment += `\n[Attached Evidence Photo: ${attachment.url}]`;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: textToSend.trim() || 'Attached civic photo evidence.',
      attachment: attachment ? { ...attachment } : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const apiHistory = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachment(null);
    setVisionAnalysis(null);
    setLoading(true);

    const result = await sendChatMessage(promptWithAttachment, apiHistory, null, language);

    if (result.success) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.data.response,
          tools_used: result.data.tools_used || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `⚠️ Error: ${result.error || 'Failed to connect to the assistant.'}`,
          tools_used: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
    setLoading(false);
  };

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id, type) => {
    setFeedback((prev) => ({ ...prev, [id]: type }));
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content: 'Conversation reset. How may I assist you with municipal services today?',
        tools_used: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="health-card" style={{ maxWidth: '820px', padding: 0, overflow: 'hidden' }}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
      />

      {/* Chat Header */}
      <div style={{
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #1e3a8a, #0284c7)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <Bot size={24} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'white', letterSpacing: '-0.01em' }}>
              CitizenConnect Autonomous Agent
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }}></span>
              <span style={{ fontSize: '0.75rem', color: '#e0f2fe', fontWeight: 500 }}>
                LangGraph Loop • Voice Dictation • Multilingual • Gemini Vision
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Multilingual Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '8px',
            padding: '4px 8px',
          }}>
            <Globe size={14} color="white" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} style={{ background: '#0f172a', color: 'white' }}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearChat}
            title="Reset conversation"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'white',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              transition: 'background 0.2s ease',
            }}
          >
            <Trash2 size={14} color="white" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="no-scrollbar" style={{
        padding: '12px 20px',
        background: 'var(--bg-card-subtle)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        overflowY: 'hidden',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', alignSelf: 'center', flexShrink: 0, marginRight: '4px' }}>
          Suggested:
        </span>
        {QUICK_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.prompt)}
            disabled={loading}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div style={{
        height: '460px',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        background: 'var(--bg-card-subtle)',
      }}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCopied = copiedId === msg.id;
          const userFeedback = feedback[msg.id];

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '85%' : '92%',
                flexDirection: isUser ? 'row-reverse' : 'row',
                width: '100%',
                justifyContent: isUser ? 'flex-start' : 'flex-start',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isUser ? 'linear-gradient(135deg, #2563eb, #38bdf8)' : '#0f172a',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
                border: '1px solid var(--border)',
                boxShadow: isUser ? '0 2px 8px rgba(37,99,235,0.4)' : 'none',
              }}>
                {isUser ? <User size={18} color="white" /> : <Bot size={18} color="#38bdf8" />}
              </div>

              {/* Message Bubble Container */}
              <div style={{ maxWidth: 'calc(100% - 48px)', overflowX: 'hidden', width: '100%' }}>
                {/* Tool Invocation Badges */}
                {msg.tools_used && msg.tools_used.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {msg.tools_used.map((toolName, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: 'var(--accent)',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontFamily: 'JetBrains Mono, monospace',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <Zap size={12} color="var(--accent)" />
                        Tool Invoked: {toolName}
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Bubble */}
                <div style={{
                  background: isUser ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'var(--bg-card)',
                  color: isUser ? '#ffffff' : 'var(--text-main)',
                  padding: '14px 18px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  boxShadow: 'var(--shadow-sm)',
                  border: isUser ? 'none' : '1px solid var(--border)',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                  position: 'relative',
                  width: 'fit-content',
                  maxWidth: '100%',
                }}>
                  {/* Inline Attached Photo */}
                  {msg.attachment && (
                    <div style={{ marginBottom: '10px' }}>
                      <img
                        src={msg.attachment.dataUrl || msg.attachment.url}
                        alt="Uploaded evidence"
                        style={{
                          maxWidth: '220px',
                          maxHeight: '160px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '2px solid rgba(255,255,255,0.4)',
                          display: 'block',
                        }}
                      />
                      <span style={{ fontSize: '0.7rem', opacity: 0.9, marginTop: '2px', display: 'block' }}>
                        📷 {msg.attachment.name}
                      </span>
                    </div>
                  )}

                  {isUser ? (
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                      {msg.content}
                    </p>
                  ) : (
                    <FormattedMessage
                      text={msg.content}
                      onTicketClick={(tId) => handleSendMessage(`What is the current status and update on ticket ${tId}?`)}
                    />
                  )}
                </div>

                {/* Footer Bar for Bubble: Timestamp + Action Buttons */}
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginTop: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isUser ? 'flex-end' : 'space-between',
                  gap: '8px',
                }}>
                  <span>{msg.timestamp}</span>

                  {!isUser && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        title="Copy response"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isCopied ? '#10b981' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          fontSize: '0.675rem',
                          fontWeight: 600,
                        }}
                      >
                        {isCopied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => handleFeedback(msg.id, 'up')}
                        title="Helpful"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: userFeedback === 'up' ? 'var(--accent)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                      >
                        <ThumbsUp size={13} />
                      </button>

                      <button
                        onClick={() => handleFeedback(msg.id, 'down')}
                        title="Not helpful"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: userFeedback === 'down' ? '#ef4444' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                      >
                        <ThumbsDown size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#0f172a',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border)',
            }}>
              <Bot size={18} color="#38bdf8" />
            </div>
            <div style={{
              background: 'var(--bg-card)',
              padding: '14px 18px',
              borderRadius: '16px 16px 16px 4px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <RefreshCw size={15} className="spin" color="var(--accent)" />
              <span>AI Agent is reasoning in {language} & querying municipal tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Gemini Vision Analysis Banner (if image analyzed) */}
      {attachment && (
        <div style={{
          padding: '10px 20px',
          background: 'var(--bg-card-subtle)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--accent)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.8rem',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Image size={14} />
                <span style={{ fontWeight: 600 }}>{attachment.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({attachment.size})</span>
                <button
                  onClick={() => {
                    setAttachment(null);
                    setVisionAnalysis(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {analyzingPhoto && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={12} className="spin" />
                  Gemini Vision inspecting damage severity...
                </span>
              )}
            </div>

            {visionAnalysis && (
              <button
                onClick={() => {
                  setInput((prev) => prev ? `${prev} - ${visionAnalysis}` : `I want to report this incident: ${visionAnalysis}`);
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Auto-fill Diagnosis into Complaint
              </button>
            )}
          </div>

          {visionAnalysis && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.785rem',
              color: 'var(--text-main)',
              lineHeight: 1.45,
            }}>
              <strong style={{ color: 'var(--accent)' }}>🤖 Gemini Vision Inspection: </strong>
              {visionAnalysis}
            </div>
          )}
        </div>
      )}

      {/* Voice Listening Active Strip (Native WebSpeech) */}
      {isListening && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(239, 68, 68, 0.12)',
          borderTop: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: '#ef4444',
          fontWeight: 700,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} className="pulse"></span>
            <span>🎙️ Listening ({formatTimer(recordSeconds)} • {language}) — Speak freely, take your time...</span>
          </div>
          <button
            onClick={toggleVoiceDictation}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 14px',
              fontSize: '0.785rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
            }}
          >
            ✓ Done Speaking
          </button>
        </div>
      )}

      {/* Voice Recording Active Strip (Gemini Audio AI - Network Independent) */}
      {isRecordingAudio && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(16, 185, 129, 0.15)',
          borderTop: '1px solid rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: '#10b981',
          fontWeight: 700,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} className="pulse"></span>
            <span>🔴 Recording for Gemini AI ({formatTimer(recordSeconds)} • {language}) — Speak your full complaint at your own pace</span>
          </div>
          <button
            onClick={stopMediaRecording}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 14px',
              fontSize: '0.785rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
            }}
          >
            ✓ Done Speaking & Transcribe
          </button>
        </div>
      )}

      {/* Transcribing Audio Loader */}
      {transcribingAudio && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(56, 189, 248, 0.15)',
          borderTop: '1px solid rgba(56, 189, 248, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.8rem',
          color: 'var(--accent)',
          fontWeight: 700,
        }}>
          <RefreshCw size={14} className="spin" />
          <span>🤖 Gemini Multimodal AI is transcribing your voice recording...</span>
        </div>
      )}

      {/* Voice Dictation Error / Permission Notice */}
      {speechErrorMsg && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(245, 158, 11, 0.15)',
          borderTop: '1px solid rgba(245, 158, 11, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--warning)',
          fontWeight: 600,
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
            <span>⚠️</span>
            <span>{speechErrorMsg}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={startMediaRecording}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                color: '#10b981',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🎙️ Record via Gemini Audio
            </button>
            <button
              onClick={handleSimulateVoice}
              style={{
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⚡ Insert Voice Sample
            </button>
            <button
              onClick={() => setSpeechErrorMsg('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '0 4px',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input Box */}
      <div style={{
        padding: '16px 20px',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
      }}>
        {/* Photo Upload Paperclip Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || loading}
          title="Upload Civic Photo / Document"
          style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: attachment ? 'var(--accent)' : 'var(--text-muted)',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <Paperclip size={18} className={uploading ? 'spin' : ''} />
        </button>

        <input
          type="text"
          placeholder={`Ask a question or speak your complaint in ${language}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'var(--bg-input)',
            color: 'var(--text-main)',
            fontSize: '0.925rem',
            fontFamily: 'inherit',
            outline: 'none',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
          }}
        />

        {/* Real Microphone Voice Dictation Button (Dual Engine) */}
        <button
          onClick={toggleVoiceDictation}
          disabled={transcribingAudio}
          title={
            isListening || isRecordingAudio
              ? 'Stop Recording'
              : 'Speak Complaint Aloud (Dual Engine: WebSpeech + Gemini AI Audio)'
          }
          style={{
            background: isListening || isRecordingAudio ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-card-subtle)',
            border: isListening || isRecordingAudio ? '1px solid #ef4444' : '1px solid var(--border)',
            borderRadius: '10px',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isListening || isRecordingAudio ? '#ef4444' : 'var(--text-muted)',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          {transcribingAudio ? (
            <RefreshCw size={18} className="spin" color="var(--accent)" />
          ) : isListening || isRecordingAudio ? (
            <MicOff size={18} color="#ef4444" />
          ) : (
            <Mic size={18} />
          )}
        </button>

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || (!input.trim() && !attachment)}
          className="btn-test"
          style={{ padding: '0 22px', height: '42px', borderRadius: '10px', flexShrink: 0 }}
        >
          <Send size={16} color="white" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
