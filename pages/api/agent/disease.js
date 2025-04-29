import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const form = await req.formData();
    const file = form.get('image');
    if (!file) return res.status(400).json({ error: 'No image provided' });

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a plant doctor: diagnose this leaf image and suggest treatment.' },
        { role: 'user', content: `Please analyze this image:\n${dataUri}` }
      ]
    });

    res.status(200).json({ diagnosis: resp.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
