import OpenAI from 'openai';

export async function POST(request) {
  try {
    const form = await request.formData();
    const audioFile = form.get('audio');
    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No audio provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile
    });

    return new Response(
      JSON.stringify({ text: transcription.text }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
