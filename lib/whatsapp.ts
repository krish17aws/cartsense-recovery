type CartMessage = { userId:string; customerName:string; cartTotal:number; analysisJson:string|null };
type MetaError = { message?:string; code?:number; error_subcode?:number; type?:string };

const required = (name:string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

export async function sendCartWhatsApp(cart:CartMessage, options:{message?:string; removeCoupon?:boolean} = {}) {
  const token = required("WHATSAPP_ACCESS_TOKEN");
  const phoneId = required("WHATSAPP_PHONE_NUMBER_ID");
  const recipient = required("WHATSAPP_TEST_RECIPIENT").replace(/\D/g, "");
  const baseUrl = required("APP_BASE_URL").replace(/\/$/, "");
  const version = process.env.WHATSAPP_API_VERSION?.trim() || "v25.0";
  const template = process.env.WHATSAPP_TEMPLATE_NAME?.trim() || "cart_recovery_v1";
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en_US";
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/)/i.test(baseUrl)) {
    throw new Error("APP_BASE_URL must be your public HTTPS Vercel URL. Meta cannot download a cart image from localhost.");
  }
  const firstName = cart.customerName.split(" ")[0];
  const analysis = cart.analysisJson ? JSON.parse(cart.analysisJson) as {reasoning?:string} : null;
  const message = options.message ?? (options.removeCoupon ? null : analysis?.reasoning) ?? "Your cart is still waiting. Complete your purchase before the items are gone.";
  const imageUrl = `${baseUrl}/api/cart-image?userId=${encodeURIComponent(cart.userId)}`;
  const payload = { messaging_product:"whatsapp", to:recipient, type:"template", template:{ name:template, language:{code:language}, components:[
    {type:"header",parameters:[{type:"image",image:{link:imageUrl}}]},
    {type:"body",parameters:[{type:"text",text:firstName},{type:"text",text:`₹${cart.cartTotal.toLocaleString("en-IN")}`},{type:"text",text:message}]},
    {type:"button",sub_type:"url",index:"0",parameters:[{type:"text",text:cart.userId}]}
  ]}};
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data = await response.json() as {messages?:Array<{id:string}>; error?:MetaError};
  if (!response.ok) {
    const error = data.error;
    const codes = [error?.code ? `code ${error.code}` : "", error?.error_subcode ? `subcode ${error.error_subcode}` : ""].filter(Boolean).join(", ");
    throw new Error(`Meta WhatsApp error${codes ? ` (${codes})` : ""}: ${error?.message ?? "request rejected"}`);
  }
  const messageId = data.messages?.[0]?.id;
  if (!messageId) throw new Error("Meta accepted the request but returned no message ID");
  return { messageId, imageUrl };
}
