import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { messages, lang } = req.body;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an expert agronomist who speaks ${lang}.` },
        ...messages
      ]
    });
    res.status(200).json({ reply: resp.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
