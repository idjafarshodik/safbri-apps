export async function onRequestPost(context) {
  const requestData = await context.request.json()
  
  const n8nWebhookUrl = context.env.N8N_WEBHOOK_URL
  const apiKey = context.env.API_KEY

  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify(requestData)
    })

    const responseData = await response.json()
    
    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' },
      status: response.status
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
}
  }