import { useState, useRef } from 'react';

export default function Home() {
  const [lang, setLang] = useState('hi-IN');
  const [messages, setMessages] = useState([]); // { sender: 'user'|'bot', text }
  const [input, setInput] = useState('');
  const fileInputRef = useRef();
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // Send text chat
  const sendMessage = async (text) => {
    if (!text) return;
    const userMsg = { sender: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages.map(m=>({role: m.sender==='user'?'user':'assistant', content: m.text})), {role:'user', content: text}], lang })
      });
      const { reply } = await res.json();
      setMessages((m) => [...m, { sender: 'bot', text: reply }]);
      // Speak it
      const utter = new SpeechSynthesisUtterance(reply);
      utter.lang = lang;
      speechSynthesis.speak(utter);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { sender: 'bot', text: '⚠️ Error contacting API' }]);
    }
  };

  // Handle press of Send button or Enter
  const handleSend = () => sendMessage(input);

  // Image upload → disease detection
  const handleImageUpload = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) return alert('Select an image first');
    setMessages((m) => [...m, { sender: 'user', text: `Uploaded image: ${file.name}` }]);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/agent/disease', { method: 'POST', body: fd });
      const { diagnosis } = await res.json();
      setMessages((m) => [...m, { sender: 'bot', text: diagnosis }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { sender: 'bot', text: '⚠️ Error analyzing image' }]);
    }
  };

  // Start recording voice
  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => setAudioChunks((c) => [...c, e.data]);
    mr.start();
  };

  // Stop recording, transcribe, then chat
  const stopRecording = () => {
    setRecording(false);
    const mr = mediaRecorderRef.current;
    mr.onstop = async () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      setAudioChunks([]);
      setMessages((m) => [...m, { sender: 'user', text: '🎤 (voice message)' }]);
      const fd = new FormData();
      fd.append('audio', blob);
      try {
        const sttRes = await fetch('/api/agent/stt', { method: 'POST', body: fd });
        const { text } = await sttRes.json();
        // Display transcript
        setMessages((m) => [...m, { sender: 'bot', text: `Transcribed: ${text}` }]);
        // Then send that as chat input
        await sendMessage(text);
      } catch (err) {
        console.error(err);
        setMessages((m) => [...m, { sender: 'bot', text: '⚠️ Error transcribing audio' }]);
      }
    };
    mr.stop();
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Kisaan Sathi GPT</h1>
      <div>
        <label>Language:&nbsp;
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="hi-IN">Hindi (hi-IN)</option>
            <option value="awa-IN">Awadhi (awa-IN)</option>
            <option value="en-US">English (en-US)</option>
          </select>
        </label>
      </div>

      <div style={{
        border: '1px solid #ccc', borderRadius: 4, height: 400, overflowY: 'scroll',
        padding: 10, marginTop: 10, background: '#fafafa'
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.sender === 'user' ? 'right' : 'left', margin: '8px 0' }}>
            <span style={{
              display: 'inline-block', padding: '6px 10px', borderRadius: 4,
              background: m.sender === 'user' ? '#d1e7dd' : '#e2e3e5'
            }}>
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          style={{ width: '70%' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask your farming question..."
        />
        <button onClick={handleSend}>Send</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <input type="file" accept="image/*" ref={fileInputRef} />
        <button onClick={handleImageUpload}>Analyze Disease</button>
      </div>

      <div style={{ marginTop: 10 }}>
        {!recording
          ? <button onClick={startRecording}>🎤 Start Recording</button>
          : <button onClick={stopRecording}>⏹️ Stop Recording</button>
        }
      </div>
    </div>
  );
}
