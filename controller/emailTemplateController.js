export const generateEmailTemplate = async (req, res) => {
  try {
    const { role = 'software engineer' } = req.body || {}
    const OPENAI_KEY = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    const fallbackTemplate = `Hi {edit name here},

I hope you are doing well. My name is {your name} and I am a ${role} with experience in [brief highlight]. I wanted to reach out regarding opportunities at {company} where I believe my skills in [skill1, skill2] could contribute to your team.

Would you be open to a short conversation to discuss how I can help? Thank you for your time.

Best regards,
{your name}`

    const prompt = `Generate a concise, professional email template for a ${role}. Include a clear greeting with an editable placeholder like {edit name here}, a short body, and a polite sign-off. Keep placeholders for role and company. Return only the email body text without explanations.`

    if (!OPENAI_KEY) {
      // Return fallback so frontend works without API key
      return res.json({ success: true, template: fallbackTemplate })
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that produces email templates.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.6,
      }),
    })

    if (!resp.ok) {
      // on OpenAI error, return fallback template
      try {
        const txt = await resp.text()
        console.warn('OpenAI error:', txt)
      } catch (e) {
        console.warn('OpenAI error, and failed to read body')
      }
      return res.json({ success: true, template: fallbackTemplate })
    }

    const data = await resp.json()
    const content = data?.choices?.[0]?.message?.content || fallbackTemplate
    return res.json({ success: true, template: content })
  } catch (err) {
    console.error('generateEmailTemplate', err)
    return res.status(500).json({ success: false, message: err.message || String(err) })
  }
}
