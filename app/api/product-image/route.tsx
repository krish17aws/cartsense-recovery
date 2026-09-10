import { ImageResponse } from "next/og";
import { productAccent, productEmoji } from "../../../lib/product-visual";

export function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name")?.slice(0, 80) || "Product";
  const category = url.searchParams.get("category")?.slice(0, 40) || "CartSense";
  const accent = productAccent(name);

  return new ImageResponse(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",background:"#eef5f1",color:"#153b2f",fontFamily:"sans-serif",padding:"40px"}}>
      <div style={{width:210,height:210,borderRadius:48,display:"flex",alignItems:"center",justifyContent:"center",background:accent,fontSize:118}}>
        {productEmoji(name, category)}
      </div>
      <div style={{fontSize:42,fontWeight:700,textAlign:"center",marginTop:30}}>{name}</div>
      <div style={{fontSize:24,textTransform:"uppercase",letterSpacing:3,color:"#547267",marginTop:14}}>{category}</div>
    </div>,
    {width:700,height:540,headers:{"Cache-Control":"public, max-age=86400"}},
  );
}
