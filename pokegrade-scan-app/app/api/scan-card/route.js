import { inspectCard } from "../../../lib/vision";
import { findCardAndPrices } from "../../../lib/pricing";
import { json, safeMessage } from "../../../lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX = 2 * 1024 * 1024;
const TYPES = new Set(["image/jpeg","image/png","image/webp"]);

export async function POST(request){
  try {
    if(!process.env.OPENAI_API_KEY || !process.env.PKMNPRICES_API_KEY) return json({error:"Server API keys are not configured."},500);
    const form = await request.formData();
    const front = form.get("front"); const back = form.get("back");
    for(const file of [front,back]){
      if(!(file instanceof File)) return json({error:"Front and back images are required."},400);
      if(!TYPES.has(file.type)) return json({error:"Use JPEG, PNG, or WebP images."},415);
      if(file.size > MAX) return json({error:"Each processed image must be 2 MB or smaller."},413);
    }
    const vision = await inspectCard(front,back);
    if(Number(vision.identification.confidence) < 0.55) return json({error:"The card could not be identified confidently. Retake clear, straight photos without glare."},422);
    const priced = await findCardAndPrices(vision.identification);
    return json({...priced, estimatedGrade:vision.estimatedGrade, warnings:vision.estimatedGrade?.notes || []});
  } catch(error){ return json({error:safeMessage(error)}, error?.status && error.status<500 ? error.status : 500); }
}
