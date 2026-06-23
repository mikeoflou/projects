export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" }});
    }

    const { prompt } = await request.json();

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_ACTUAL_GEMINI_API_KEY", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const answer = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ answer }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};
export async function onRequestPost(context) {
    const { request, env } = context;
    const { prompt } = await request.json();

    // Use env.GEMINI_API_KEY to pull from your GitHub Secret
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const answer = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ answer }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
}
