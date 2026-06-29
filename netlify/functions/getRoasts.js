exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { top1, top2 } = body;

        if (!top1 || !top2) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing top1 or top2 data" }) };
        }

        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "GROQ_API_KEY environment variable is not set" }) };
        }

        const systemPrompt = `You are a savage, hilarious AI comedian who roasts team dynamics. 
You will be given the top 2 moods of a team during a "Team Days" celebration.
Your job is to write a witty, lighthearted, and sarcastic roast for each of the top 2 moods.
CRITICAL: The roasts must be highly relatable to both tech roles (developers who write code, fix bugs, and hate meetings) and non-tech roles (Scrum Masters who love agile metrics, tickets, and meetings).
You must output a JSON object containing the roasts and detailed image generation prompts for each mood. Do NOT include any markdown formatting, backticks, or extra text. Return ONLY the raw JSON.

JSON Structure:
{
  "top1": {
    "roast": "Your roast text here",
    "imagePrompt": "A highly detailed, funny cartoon illustration prompt describing this mood state, e.g., 'A stressed developer drinking coffee from a bucket while a scrum master points at a burning Kanban board, digital art, vibrant colors, funny'"
  },
  "top2": {
    "roast": "Your roast text here",
    "imagePrompt": "A highly detailed, funny cartoon illustration prompt describing this mood state"
  }
}`;

        const userPrompt = `Here are the top 2 moods of our team today:
1st Place Mood: "${top1.title}" (${top1.emoji}) - Description: "${top1.desc}". It got ${top1.count} votes.
2nd Place Mood: "${top2.title}" (${top2.emoji}) - Description: "${top2.desc}". It got ${top2.count} votes.

Please roast them! Include developers and Scrum Masters in your roasts.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.85,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Groq API Error:", errBody);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Groq API responded with status ${response.status}` })
            };
        }

        const responseData = await response.json();
        const contentText = responseData.choices[0].message.content.trim();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: contentText
        };
    } catch (error) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
