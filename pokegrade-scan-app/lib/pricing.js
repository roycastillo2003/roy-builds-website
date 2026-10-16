const BASE = "https://api.pkmnprices.com/v1";
const headers = () => ({ "X-API-Key": process.env.PKMNPRICES_API_KEY, Accept: "application/json" });

async function api(path) {
  const response = await fetch(`${BASE}${path}`, { headers: headers(), cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const e = new Error(data?.message || `Pricing API ${response.status}`); e.status = response.status; throw e; }
  return data;
}

function same(a,b){ return String(a||"").trim().toLowerCase() === String(b||"").trim().toLowerCase(); }
function score(card, wanted){
  let n=0;
  if(same(card.name,wanted.name)) n+=5;
  if(same(card.number,wanted.number) || same(`${card.number}/${card.total_set_number}`,wanted.number)) n+=5;
  if(same(card.set?.name,wanted.setName)) n+=4;
  if(same(card.language,wanted.language)) n+=1;
  return n;
}
function findPrice(prices, predicate){ const x=(prices||[]).find(predicate); return Number.isFinite(Number(x?.market_price)) ? Number(x.market_price) : null; }

export async function findCardAndPrices(wanted){
  const q = new URLSearchParams({ name:wanted.name, number:String(wanted.number).split("/")[0], per_page:"20" });
  const list = await api(`/cards?${q}`);
  const candidates = list.data || [];
  if(!candidates.length) throw new Error("No matching card was found in the price catalogue.");
  const match = [...candidates].sort((a,b)=>score(b,wanted)-score(a,wanted))[0];
  const detail = await api(`/cards/${encodeURIComponent(match.id)}`);
  const card = detail.data || detail;
  const prices = card.prices || [];
  const raw = prices.filter(p => !p.grade && String(p.currency).toUpperCase()==="USD");
  return {
    card: {
      id: card.id, name: card.name, setName: card.set?.name || wanted.setName,
      number: card.total_set_number ? `${card.number}/${card.total_set_number}` : String(card.number),
      rarity: card.rarity || wanted.rarity || null, imageUrl: card.image_url || match.image_url || null,
      confidence: wanted.confidence
    },
    prices: {
      currency: "USD",
      rawMarket: findPrice(raw,p=>String(p.condition).toLowerCase().includes("near mint")) ?? findPrice(raw,()=>true),
      rawLow: null,
      psa8: findPrice(prices,p=>String(p.grader).toUpperCase()==="PSA" && String(p.grade)==="8"),
      psa9: findPrice(prices,p=>String(p.grader).toUpperCase()==="PSA" && String(p.grade)==="9"),
      psa10: findPrice(prices,p=>String(p.grader).toUpperCase()==="PSA" && String(p.grade)==="10"),
      source: "PkmnPrices", updatedAt: card.updated_at || new Date().toISOString()
    }
  };
}
