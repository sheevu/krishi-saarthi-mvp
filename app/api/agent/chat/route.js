import OpenAI from 'openai';

export async function POST(request) {
  try {
    const { messages, lang } = await request.json();
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an expert agronomist who speaks ${lang}.` },
        ...messages
      ]
    });

    return new Response(
      JSON.stringify({ reply: resp.choices[0].message.content }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

