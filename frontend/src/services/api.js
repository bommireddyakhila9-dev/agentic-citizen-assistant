import axios from 'axios';

// Create an Axios instance pointing to the FastAPI backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api/v1` : '/api/v1',
  timeout: 120000, // 120-second timeout to comfortably accommodate multi-step agent tool loops
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Resolves static asset and evidence photo URLs for cross-domain deployments (Vercel + Render)
 */
export const getAssetUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * Checks the FastAPI server health
 */
export const checkHealth = async () => {
  const startTime = performance.now();
  try {
    const response = await api.get('/health');
    const endTime = performance.now();
    return {
      success: true,
      data: response.data,
      latency: Math.round(endTime - startTime),
      status: response.status,
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      error: error.message || 'Unable to connect to FastAPI backend',
      latency: Math.round(endTime - startTime),
      status: error.response ? error.response.status : null,
    };
  }
};

/**
 * Sends a message to the LangGraph Citizen Assistant agent with language preference
 */
export const sendChatMessage = async (message, conversationHistory = [], phone = null, language = 'English') => {
  try {
    const res = await api.post('/chat', {
      message,
      conversation_history: conversationHistory,
      phone,
      language,
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Fetches all civic grievances from the database
 */
export const fetchGrievances = async () => {
  try {
    const res = await api.get('/grievances');
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Looks up a single grievance by its ticket number (e.g. GRV-1001)
 */
export const fetchGrievanceByTicket = async (ticket) => {
  try {
    const res = await api.get(`/grievances/${ticket}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Municipal Officer / Admin: Updates status and department notes
 */
export const updateGrievanceStatus = async (ticketNumber, status, departmentNotes, officerName = 'Municipal Officer') => {
  try {
    const res = await api.patch(`/grievances/${ticketNumber}/status`, {
      status,
      department_notes: departmentNotes,
      officer_name: officerName,
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Fetches geocoded map pins for the interactive civic map
 */
export const fetchMapPins = async () => {
  try {
    const res = await api.get('/grievances/map/pins');
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Fetches municipal welfare schemes
 */
export const fetchServices = async () => {
  try {
    const res = await api.get('/services');
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Fetches real-time SMS & Email civic alerts
 */
export const fetchNotifications = async (limit = 30) => {
  try {
    const res = await api.get('/notifications/', { params: { limit } });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Uploads a base64 encoded photo or document
 */
export const uploadFileBase64 = async (filename, fileData, contentType = 'image/jpeg') => {
  try {
    const res = await api.post('/upload/base64', {
      filename,
      file_data: fileData,
      content_type: contentType,
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Uses Gemini Vision to analyze photo evidence severity and category
 */
export const analyzeCivicEvidence = async (filename, fileData, contentType = 'image/jpeg') => {
  try {
    const res = await api.post('/upload/analyze-evidence', {
      filename,
      file_data: fileData,
      content_type: contentType,
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Transcribes recorded microphone audio using Gemini Multimodal Audio
 * (Works even when Chrome WebSpeech cloud servers are blocked by network/VPN)
 */
export const transcribeVoiceAudio = async (audioBase64, contentType = 'audio/webm', language = 'English') => {
  try {
    const res = await api.post('/upload/transcribe-voice', {
      audio_data: audioBase64,
      content_type: contentType,
      language: language,
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Checks Gemini AI integration status
 */
export const getAiStatus = async () => {
  try {
    const res = await api.get('/ai/status');
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Sends a test prompt to Gemini
 */
export const testGeminiPrompt = async (prompt) => {
  try {
    const res = await api.post('/ai/test', { prompt });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Sends a real 4-digit SMS OTP via backend dispatch
 */
export const sendCitizenOtp = async (phone, name = null) => {
  try {
    const res = await api.post('/auth/send-otp', { phone, name });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Verifies the 4-digit SMS OTP against the backend
 */
export const verifyCitizenOtp = async (phone, otp) => {
  try {
    const res = await api.post('/auth/verify-otp', { phone, otp });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

/**
 * Authenticates municipal officer credentials
 */
export const loginOfficer = async (email, pin = '1234') => {
  try {
    const res = await api.post('/auth/officer-login', { email, pin });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || err.message };
  }
};

export default api;
