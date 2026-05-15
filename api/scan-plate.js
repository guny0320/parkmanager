export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { b64, mimeType } = req.body || {};
  if (!b64 || !mimeType) return res.status(400).json({ error: 'b64, mimeType 필수' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ plate: '판독불가', error: 'API 키 미설정' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: b64 } },
            { type: 'text', text: "이 이미지에서 한국 자동차 번호판을 읽어줘. 번호판 숫자와 글자만 출력해. 예: 12가3456. 번호판이 없거나 읽을 수 없으면 '판독불가'라고만 써." }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', response.status, err);
      return res.status(500).json({ plate: '판독불가' });
    }

    const data = await response.json();
    const plate = data.content?.[0]?.text?.trim() || '판독불가';
    return res.json({ plate });
  } catch (e) {
    console.error('scan-plate error:', e);
    return res.status(500).json({ plate: '판독불가' });
  }
}
