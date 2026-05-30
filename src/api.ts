const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface GroqMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export const sendMessageToGroq = async (
  apiKey: string,
  messages: GroqMessage[],
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error de API: ${response.status} - ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No se pudo leer la respuesta')
  }

  const decoder = new TextDecoder()
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content || ''
          if (content) {
            fullContent += content
            onChunk?.(content)
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  return fullContent
}
