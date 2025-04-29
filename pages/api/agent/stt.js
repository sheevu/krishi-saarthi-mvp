import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const form = await req.formData();
    const audioFile = form.get('audio');
    if (!audioFile) return res.status(400).json({ error: 'No audio provided' });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile
    });

    res.status(200).json({ text: transcription.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
