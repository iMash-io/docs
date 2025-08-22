// Configuration
const LIVEKIT_URL = 'wss://test-2yph5toq.livekit.cloud';
const LK_API_KEY = "APIHu68vyMSdaSv";
const LK_API_SECRET = "PkfcYSQMJRe7s57ufn0OaFEwBAZzeqpSTMdCpowUfdCD";

// Voice inventories (must match what agent.py understands)
const OPENAI_VOICES = ["ash","echo"];
const GEMINI_VOICES = [
  "Zephyr","Puck","Charon","Fenrir","Orus","Enceladus","Iapetus",
  "Umbriel","Algieba","Algenib","Rasalgethi","Achernar","Alnilam","Gacrux"
];

// UI Elements
const $ = (id) => document.getElementById(id);
const statusBadge = $('statusBadge');
const statusText = $('statusText');
const liveIndicator = $('liveIndicator');
const sessionTimer = $('sessionTimer');
const joinBtn = $('joinBtn');
const leaveBtn = $('leaveBtn');
const micBtn = $('micBtn');
const camBtn = $('camBtn');
const roomId = $('roomId');
const localVideo = $('localVideo');
const advisorVideo = $('advisorVideo');
const advisorPlaceholder = $('advisorPlaceholder');
const userPlaceholder = $('userPlaceholder');

const providerToggle = $('providerToggle');
const voiceToggle = $('voiceToggle');
const voiceAbbr = voiceToggle.querySelector('.abbr');
const voiceMenu = $('voiceMenu');
const voiceMenuBody = $('voiceMenuBody');

let room = null;
let sessionStartTime = null;
let timerInterval = null;
let currentRoomName = null;
let localStream = null; // Keep track of local stream

// --- provider & voice state (persisted) ---
let provider = (localStorage.getItem('provider') || 'gemini'); // 'gemini' | 'openai'
let voiceGemini = localStorage.getItem('voiceGemini') || 'Charon';
let voiceOpenAI = localStorage.getItem('voiceOpenAI') || 'shimmer';
let selectedSessionType = 'consultation';

// Session type selector
document.querySelectorAll('.session-type').forEach(type => {
  type.addEventListener('click', () => {
    document.querySelectorAll('.session-type').forEach(t => t.classList.remove('active'));
    type.classList.add('active');
    selectedSessionType = type.dataset.type;
  });
});

function generateRoomName() {
  const randomId = Math.floor(10000000 + Math.random() * 90000000);
  return `lawyers-demo-room-${randomId}`;
}

function providerVoices() {
  return provider === 'openai' ? OPENAI_VOICES : GEMINI_VOICES;
}
function currentVoice() {
  return provider === 'openai' ? voiceOpenAI : voiceGemini;
}
function setCurrentVoice(v) {
  if (provider === 'openai') {
    voiceOpenAI = v;
    localStorage.setItem('voiceOpenAI', voiceOpenAI);
  } else {
    voiceGemini = v;
    localStorage.setItem('voiceGemini', voiceGemini);
  }
  renderVoicePuck();
}
function abbr(s) {
  return (s || '').replace(/[^A-Za-z]/g,'').slice(0,2).toUpperCase() || 'VO';
}

// --- Voice menu ---
function buildVoiceMenu() {
  const list = providerVoices();
  const cur = currentVoice();
  voiceMenuBody.innerHTML = '';
  for (const v of list) {
    const btn = document.createElement('button');
    btn.className = 'voice-item' + (v.toLowerCase() === (cur||'').toLowerCase() ? ' active' : '');
    btn.setAttribute('data-v', v);
    btn.setAttribute('role','menuitem');
    btn.innerHTML = `<span>${v}</span><span class="check">${v.toLowerCase() === (cur||'').toLowerCase() ? '✓' : ''}</span>`;
    btn.addEventListener('click', () => {
      setCurrentVoice(v);
      hideVoiceMenu();
    });
    voiceMenuBody.appendChild(btn);
  }
  $('voiceMenuHeader').textContent = provider === 'openai' ? 'OpenAI Voices' : 'Gemini Voices';
}
function showVoiceMenu() {
  buildVoiceMenu();
  voiceMenu.classList.remove('hidden');
  voiceMenu.setAttribute('aria-hidden','false');
  // outside click to close
  setTimeout(() => {
    document.addEventListener('click', outsideClose, { once: true });
  }, 0);
  document.addEventListener('keydown', escClose);
}
function hideVoiceMenu() {
  voiceMenu.classList.add('hidden');
  voiceMenu.setAttribute('aria-hidden','true');
  document.removeEventListener('keydown', escClose);
}
function outsideClose(e) {
  if (!voiceMenu.contains(e.target) && e.target !== voiceToggle) hideVoiceMenu();
}
function escClose(e) {
  if (e.key === 'Escape') hideVoiceMenu();
}

// --- Render toggles ---
function renderProviderPuck() {
  providerToggle.classList.toggle('gemini', provider === 'gemini');
  providerToggle.classList.toggle('openai', provider === 'openai');
  providerToggle.title = provider; // tooltip only
}
function renderVoicePuck() {
  voiceAbbr.textContent = abbr(currentVoice());
  voiceToggle.title = currentVoice(); // tooltip
}
function renderToggles() {
  renderProviderPuck();
  renderVoicePuck();
}

// Toggle provider
providerToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  provider = (provider === 'gemini') ? 'openai' : 'gemini';
  localStorage.setItem('provider', provider);
  // ensure voice exists for provider
  const list = providerVoices();
  if (!list.some(v => v.toLowerCase() === (currentVoice()||'').toLowerCase())) {
    setCurrentVoice(list[0]);
  }
  renderToggles();
  hideVoiceMenu(); // close voice menu if open
});

// Open/close voice menu
voiceToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  if (voiceMenu.classList.contains('hidden')) showVoiceMenu();
  else hideVoiceMenu();
});

// --- Status management ---
function setStatus(status, text) {
  statusBadge.className = 'status-badge ' + status;
  statusText.textContent = text;
  if (status === 'live') { liveIndicator.style.display = 'flex'; startSessionTimer(); }
  else { liveIndicator.style.display = 'none'; stopSessionTimer(); }
}

// --- Session timer ---
function startSessionTimer() { sessionStartTime = Date.now(); timerInterval = setInterval(updateTimer, 1000); updateTimer(); }
function stopSessionTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } sessionTimer.textContent = ''; }
function updateTimer() {
  if (!sessionStartTime) return;
  const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
  const m = Math.floor(elapsed / 60), s = (elapsed % 60).toString().padStart(2,'0');
  sessionTimer.textContent = `Session Time: ${m}:${s}`;
}

// --- Token fetching (INSECURE - FOR DEMO PURPOSES ONLY) ---
async function fetchToken(roomName, participantName) {
  // WARNING: This method of generating a token is INSECURE and should ONLY be used for demos.
  // It exposes your LiveKit API Secret in the client-side code.
  // In a real application, this token should always be generated on a server.

  // Helper to encode a string/object to a Base64URL string.
  function encode(d) {
    const data = new TextEncoder().encode(JSON.stringify(d));
    return btoa(String.fromCharCode(...new Uint8Array(data)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    exp: Math.floor(Date.now() / 1000) + (10 * 60), // Token is valid for 10 minutes
    nbf: Math.floor(Date.now() / 1000) - 60, // Not before 60 seconds ago
    iss: LK_API_KEY,
    sub: participantName,
    name: participantName,
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  };

  const encodedHeader = encode(header);
  const encodedPayload = encode(payload);
  
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(LK_API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  // Helper to encode an ArrayBuffer to a Base64URL string.
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// --- Local preview with better cleanup ---
async function startLocalPreview() {
  try {
    // Clean up any existing stream first
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    
    // Get fresh stream
    localStream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } 
    });
    
    // Create new video element to ensure clean state
    const newVideo = document.createElement('video');
    newVideo.id = 'localVideo';
    newVideo.autoplay = true;
    newVideo.muted = true;
    newVideo.playsInline = true;
    newVideo.srcObject = localStream;
    newVideo.style.position = 'absolute';
    newVideo.style.inset = '0';
    newVideo.style.width = '100%';
    newVideo.style.height = '100%';
    newVideo.style.objectFit = 'cover';
    
    // Replace old video element
    const oldVideo = $('localVideo');
    oldVideo.parentNode.replaceChild(newVideo, oldVideo);
    
    userPlaceholder.style.display = 'none';
  } catch (e) {
    console.log('Camera permission denied or unavailable');
    $('localVideo').style.display = 'none';
    userPlaceholder.style.display = 'flex';
  }
}

// --- Controls state ---
function enableControls(connected) {
  joinBtn.disabled = connected;
  leaveBtn.disabled = !connected;
  micBtn.disabled = !connected;
  camBtn.disabled = !connected;
  if (!connected) {
    micBtn.textContent = '🎤';
    camBtn.textContent = '📹';
  }
}

// --- Connect to room ---
async function connectToRoom() {
  const base = generateRoomName();
  currentRoomName = base;
  const userName = 'Guest_' + Math.floor(Math.random() * 1000);

  // append hidden provider + voice (agent parses these)
  const v = currentVoice();
  const roomName = `${base}::${provider === 'openai' ? 'oai' : 'gem'}:${v}`;

  // Update room ID display
  roomId.textContent = base.replace('lawyers-demo-room-', '');

  setStatus('connecting', 'Connecting...');
  enableControls(false);

  try {
    const token = await fetchToken(roomName, userName);

    room = new LivekitClient.Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: { resolution: LivekitClient.VideoPresets.h720.resolution },
    });

    // Handle remote tracks
    room.on('trackSubscribed', (track, publication, participant) => {
      if (track.kind === 'video') {
        advisorPlaceholder.style.display = 'none';
        advisorVideo.innerHTML = '';
        const el = track.attach();
        el.style.width = '100%'; el.style.height = '100%'; el.style.objectFit = 'cover';
        advisorVideo.appendChild(el);
      } else if (track.kind === 'audio') {
        const audioEl = track.attach();
        audioEl.autoplay = true;
        room.startAudio().catch(() => {});
      }
    });

    room.on('trackUnsubscribed', (track) => {
      track.detach().forEach((el) => el.remove());
      if (track.kind === 'video') advisorPlaceholder.style.display = 'flex';
    });

    room.on('disconnected', () => { disconnectFromRoom(true); });

    await room.connect(LIVEKIT_URL, token);

    // Publish local media with the existing stream
    try {
      await room.localParticipant.enableCameraAndMicrophone();
      // Update the video element with the published track
      const pubs = room.localParticipant.getTrackPublications ? room.localParticipant.getTrackPublications() : [];
      const videoPub = pubs.find(p => p.kind === 'video' && p.track);
      if (videoPub && videoPub.track) {
        const v = videoPub.track.attach();
        v.muted = true;
        v.style.position = 'absolute';
        v.style.inset = '0';
        v.style.width = '100%';
        v.style.height = '100%';
        v.style.objectFit = 'cover';
        const oldVideo = $('localVideo');
        v.id = 'localVideo';
        oldVideo.parentNode.replaceChild(v, oldVideo);
      }
    } catch (err) {
      console.log('Could not publish local media:', err);
    }

    await room.startAudio().catch(() => {});

    // expose to outer scope
    window._lkRoom = room;

    enableControls(true);
    setStatus('live', 'Connected');
  } catch (e) {
    alert('Connection failed. Please check credentials.\\n\\n' + (e?.message || e));
    setStatus('', 'Offline');
    enableControls(false);
    roomId.textContent = 'Not connected';
  }
}

// --- Disconnect with better cleanup ---
async function disconnectFromRoom(internal = false) {
  if (window._lkRoom) {
    try { 
      await window._lkRoom.disconnect(); 
    } catch (_) {}
    window._lkRoom = null;
  }
  
  room = null;
  advisorVideo.innerHTML = '';
  advisorPlaceholder.style.display = 'flex';
  
  // Stop all tracks before restarting preview
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  // Wait a bit before restarting to ensure cleanup
  setTimeout(() => {
    startLocalPreview();
  }, 100);
  
  enableControls(false);
  setStatus('', 'Offline');
  roomId.textContent = 'Not connected';
}

// --- Mic/Cam toggles ---
async function toggleMic() {
  const room = window._lkRoom; if (!room) return;
  try {
    const pubs = room.localParticipant.getTrackPublications ? room.localParticipant.getTrackPublications() : [];
    const micPub = pubs.find(p => p.kind === 'audio');
    const wasOn = !!(micPub && micPub.isEnabled !== false);
    await room.localParticipant.setMicrophoneEnabled(!wasOn);
    micBtn.textContent = wasOn ? '🔇' : '🎤';
  } catch (_) {}
}
async function toggleCam() {
  const room = window._lkRoom; if (!room) return;
  try {
    const pubs = room.localParticipant.getTrackPublications ? room.localParticipant.getTrackPublications() : [];
    const videoPub = pubs.find(p => p.kind === 'video');
    const wasOn = !!(videoPub && videoPub.isEnabled !== false);
    await room.localParticipant.setCameraEnabled(!wasOn);
    const nowOn = !wasOn;
    camBtn.textContent = nowOn ? '📹' : '📵';
    const lv = $('localVideo');
    if (lv && lv.style) { lv.style.display = nowOn ? 'block' : 'none'; }
    userPlaceholder.style.display = nowOn ? 'none' : 'flex';
  } catch (_) {}
}

// --- Event listeners ---
joinBtn.addEventListener('click', connectToRoom);
leaveBtn.addEventListener('click', () => disconnectFromRoom(false));
micBtn.addEventListener('click', toggleMic);
camBtn.addEventListener('click', toggleCam);

// --- Init ---
renderToggles();
startLocalPreview();
