import { useState, useRef } from 'react';

export default function Home() {
  const [lang, setLang] = useState('hi-IN');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const fileInputRef = useRef();
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // Send text chat
  const sendMessage = async (text) => {
    if (!text) return;
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInput('');
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: text }
          ],
          lang
        })
      });
      const { reply } = await res.json();
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.lang = lang;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { sender: 'bot', text: '⚠️ Error contacting API' }]);
    }
  };

  // Handle Send
  const handleSend = () => sendMessage(input);

  // Image upload → disease detection
  const handleImageUpload = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) return alert('Select an image first');
    setMessages((prev) => [...prev, { sender: 'user', text: `Uploaded image: ${file.name}` }]);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/agent/disease', { method: 'POST', body: fd });
      const { diagnosis } = await res.json();
      setMessages((prev) => [...prev, { sender: 'bot', text: diagnosis }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { sender: 'bot', text: '⚠️ Error analyzing image' }]);
    }
  };

  // Voice recording
  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => setAudioChunks((chunks) => [...chunks, e.data]);
    recorder.start();
  };

  // Stop recording, transcribe, then chat
  const stopRecording = () => {
    setRecording(false);
    const recorder = mediaRecorderRef.current;
    recorder.onstop = async () => {
      if (audioChunks.length === 0) {
        setMessages((prev) => [...prev, { sender: 'bot', text: '⚠️ No audio recorded. Please try again.' }]);
        return;
      }
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      setAudioChunks([]);
      setMessages((prev) => [...prev, { sender: 'user', text: '🎤 (voice message)' }]);
      const fd = new FormData();
      fd.append('audio', blob);
      try {
        const sttResponse = await fetch('/api/agent/stt', { method: 'POST', body: fd });
        const { text } = await sttResponse.json();
        setMessages((prev) => [...prev, { sender: 'bot', text: `Transcribed: ${text}` }]);
        await sendMessage(text);
      } catch (error) {
        console.error(error);
        setMessages((prev) => [...prev, { sender: 'bot', text: '⚠️ Error transcribing audio' }]);
      }
    };
    recorder.stop();
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Kisaan Sathi GPT</h1>
      <div>
        <label>
          Language:&nbsp;
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="hi-IN">Hindi</option>
            <option value="awa-IN">Awadhi</option>
            <option value="en-US">English</option>
          </select>
        </label>
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: 4, height: 400, overflowY: 'auto', padding: 10, marginTop: 10, background: '#fafafa' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.sender === 'user' ? 'right' : 'left', margin: '8px 0' }}>
            <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 4, background: m.sender === 'user' ? '#d1e7dd' : '#e2e3e5' }}>
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <input style={{ width: '70%' }} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask your farming question..." />
        <button onClick={handleSend}>Send</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <input type="file" accept="image/*" ref={fileInputRef} />
        <button onClick={handleImageUpload}>Analyze Disease</button>
      </div>

      <div style={{ marginTop: 10 }}>
        {!recording ? <button onClick={startRecording}>🎤 Start Recording</button> : <button onClick={stopRecording}>⏹️ Stop Recording</button>}
      </div>
    </div>
  );
}
