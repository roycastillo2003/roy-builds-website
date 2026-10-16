import OpenAI from "openai";

function dataUrl(file, bytes) {
  const mime = ["image/jpeg","image/png","image/webp"].includes(file.type) ? file.type : "image/jpeg";
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

export async function inspectCard(front, back) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const [frontBytes, backBytes] = await Promise.all([front.arrayBuffer(), back.arrayBuffer()]);
  const prompt = `Inspect these front and back photos of one Pokemon trading card. Return only valid JSON with this exact shape:
{"identification":{"name":"","setName":"","number":"","language":"English","variant":"","rarity":"","confidence":0},"estimatedGrade":{"overall":0,"centering":0,"corners":0,"edges":0,"surface":0,"notes":[]}}
Rules: Copy visible card text exactly. Confidence is 0 to 1. Scores are 1 to 10 in 0.5 increments. If identification is uncertain, keep confidence below 0.70. Grade only visible evidence; glare, blur, sleeves, and hidden damage must reduce confidence and be listed in notes. Do not claim an official PSA, BGS, or CGC grade.`;
  const response = await client.responses.create({
    model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
    input: [{ role: "user", content: [
      { type: "input_text", text: prompt },
      { type: "input_image", image_url: dataUrl(front, frontBytes), detail: "high" },
      { type: "input_image", image_url: dataUrl(back, backBytes), detail: "high" }
    ] }]
  });
  const text = response.output_text?.trim().replace(/^```json\s*|\s*```$/g, "");
  const parsed = JSON.parse(text);
  if (!parsed?.identification?.name || !parsed?.identification?.number) throw new Error("Vision could not identify the card.");
  return parsed;
}
