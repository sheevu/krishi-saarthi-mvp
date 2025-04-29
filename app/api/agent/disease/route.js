import OpenAI from 'openai';

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('image');
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert image blob to Base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a plant doctor: diagnose this leaf image and suggest treatment.' },
        { role: 'user', content: `Please analyze this image:\n${dataUri}` }
      ]
    });

    return new Response(
      JSON.stringify({ diagnosis: resp.choices[0].message.content }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

