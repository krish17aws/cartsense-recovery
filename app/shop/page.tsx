"use client";
/* eslint-disable @next/next/no-img-element -- catalogue images are dynamic remote demo assets */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  LogOut,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  X,
} from "lucide-react";

type User = {
  id: string;
  name: string;
  initials: string;
  type: string;
  orders: number;
};
const users: User[] = [
  {
    id: "meera",
    name: "Meera Nair",
    initials: "MN",
    type: "Loyal customer",
    orders: 18,
  },
  {
    id: "arjun",
    name: "Arjun Menon",
    initials: "AM",
    type: "Returning customer",
    orders: 5,
  },
  {
    id: "priya",
    name: "Priya Sharma",
    initials: "PS",
    type: "New customer",
    orders: 0,
  },
  {
    id: "rahul",
    name: "Rahul Verma",
    initials: "RV",
    type: "Returning customer",
    orders: 3,
  },
  {
    id: "ananya",
    name: "Ananya Iyer",
    initials: "AI",
    type: "New customer",
    orders: 0,
  },
  {
    id: "vikram",
    name: "Vikram Rao",
    initials: "VR",
    type: "Loyal customer",
    orders: 12,
  },
  {
    id: "sneha",
    name: "Sneha Kapoor",
    initials: "SK",
    type: "Returning customer",
    orders: 7,
  },
  {
    id: "karthik",
    name: "Karthik Kumar",
    initials: "KK",
    type: "New customer",
    orders: 0,
  },
];
const catalog = [
  [
    "Wearables",
    [
      "NoiseFit Halo",
      "Amazfit Active",
      "Fire-Boltt Phoenix",
      "boAt Lunar",
      "Fastrack Revoltt",
      "Titan Smart Pro",
      "Redmi Watch",
      "OnePlus Watch",
      "Samsung Fit",
      "Fitbit Inspire",
    ],
    "smartwatch",
  ],
  [
    "Electronics",
    [
      "JBL Tune Headphones",
      "boAt Stone Speaker",
      "Sony Earbuds",
      "Portronics Power Bank",
      "Logitech Wireless Mouse",
      "Zebronics Keyboard",
      "Anker Charger",
      "Realme Buds",
      "Philips Trimmer",
      "Mi Security Camera",
    ],
    "electronics",
  ],
  [
    "Accessories",
    [
      "Urban Forest Handbag",
      "DailyObjects Sleeve",
      "WildHorn Wallet",
      "Skybags Backpack",
      "Lavie Tote Bag",
      "Fastrack Sunglasses",
      "Titan Leather Belt",
      "Caprese Sling Bag",
      "American Tourister Duffel",
      "Safari Laptop Bag",
    ],
    "fashionaccessories",
  ],
  [
    "Footwear",
    [
      "Campus Running Shoes",
      "Puma Sneakers",
      "Adidas Trainers",
      "Sparx Walking Shoes",
      "Red Tape Loafers",
      "Crocs Clogs",
      "Bata Formal Shoes",
      "Nike Revolution",
      "Woodland Sandals",
      "Skechers Go Walk",
    ],
    "shoes",
  ],
  [
    "Beauty",
    [
      "Minimalist SPF 50",
      "Lakmé Skin Tint",
      "Mamaearth Face Wash",
      "Maybelline Mascara",
      "Plum Vitamin C Serum",
      "Nivea Body Lotion",
      "L'Oréal Shampoo",
      "The Man Company Perfume",
      "Cetaphil Cleanser",
      "Neutrogena Moisturiser",
    ],
    "beautyproduct",
  ],
  [
    "Home",
    [
      "Prestige Kettle",
      "Milton Water Bottle",
      "Pigeon Cookware Set",
      "Wakefit Cushion",
      "Borosil Lunch Box",
      "Philips LED Lamp",
      "Home Centre Bedsheet",
      "Solimo Storage Box",
      "Cello Dinner Set",
      "Butterfly Mixer",
    ],
    "homeproduct",
  ],
  [
    "Fashion",
    [
      "Allen Solly Shirt",
      "Levi's Jeans",
      "Biba Kurta",
      "Van Heusen T-Shirt",
      "Jockey Hoodie",
      "Aurelia Palazzo",
      "Max Denim Jacket",
      "U.S. Polo Trousers",
      "W for Woman Top",
      "Peter England Blazer",
    ],
    "fashion",
  ],
  [
    "Sports",
    [
      "Yonex Badminton Racquet",
      "Cosco Football",
      "Nivia Cricket Bat",
      "Strauss Yoga Mat",
      "Boldfit Dumbbells",
      "Adidas Gym Bag",
      "Vector X Skipping Rope",
      "Kookaburra Cricket Ball",
      "Speedo Goggles",
      "Decathlon Water Bottle",
    ],
    "sportsequipment",
  ],
  [
    "Grocery",
    [
      "Tata Sampann Cashews",
      "Yoga Bar Muesli",
      "Nescafé Coffee",
      "Hershey's Cocoa",
      "Open Secret Cookies",
      "Paper Boat Juice",
      "Saffola Oats",
      "Daawat Basmati Rice",
      "Catch Spice Box",
      "Happilo Trail Mix",
    ],
    "grocery",
  ],
  [
    "Kids",
    [
      "Lego Classic Set",
      "Funskool Puzzle",
      "Hot Wheels Car",
      "Make It Real Craft Kit",
      "Nerf Elite Blaster",
      "Barbie Dreamtopia",
      "Skillmatics Activity Kit",
      "R for Rabbit Scooter",
      "Hamleys Soft Toy",
      "Einstein Box",
    ],
    "toy",
  ],
] as const;
const products = catalog.flatMap(([category, names], ci) =>
  names.map((name, ni) => ({
    id: ci * 10 + ni + 1,
    name,
    category,
    price: 399 + (((ci * 10 + ni) * 337) % 7600),
    rating: (4.1 + ((ci + ni) % 8) / 10).toFixed(1),
    image: `https://loremflickr.com/700/540/${encodeURIComponent(name.replaceAll(" ", ","))}?lock=${ci * 10 + ni + 301}`,
  })),
);
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function Shop() {
  const [user, setUser] = useState<User | null>(null),
    [cart, setCart] = useState<Record<number, number>>({}),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All"),
    [open, setOpen] = useState(false),
    [ordered, setOrdered] = useState(false),
    [page, setPage] = useState(1),
    [couponInput, setCouponInput] = useState(""),
    [eligibleCoupon, setEligibleCoupon] = useState<{code:string;percent:number;amount:number}|null>(null),
    [appliedCoupon, setAppliedCoupon] = useState<{code:string;percent:number;amount:number}|null>(null),
    [couponMessage, setCouponMessage] = useState("");
  const perPage = 20;
  const filtered = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const shown = filtered.slice(0, page * perPage);
  const count = Object.values(cart).reduce((a, b) => a + b, 0),
    total = useMemo(
      () => products.reduce((s, p) => s + (cart[p.id] || 0) * p.price, 0),
      [cart],
    );
  const discount = appliedCoupon
    ? appliedCoupon.percent
      ? Math.round(total * appliedCoupon.percent / 100)
      : Math.min(total, appliedCoupon.amount)
    : 0;
  const payable = Math.max(0, total - discount);
  const change = (id: number, by: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + by) }));
  useEffect(() => {
    const recovery = new URLSearchParams(window.location.search).get("recovery");
    if (!recovery) return;
    const [userId, couponCode = ""] = decodeURIComponent(recovery).split(":");
    const recoveredUser = users.find((candidate) => candidate.id === userId);
    if (!recoveredUser) return;
    void fetch("/api/cart-snapshots", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as {carts?:Array<{userId:string;itemsJson:string;analysisJson?:string;status:string}>;error?:string};
        if (!response.ok) throw new Error(data.error ?? "Unable to restore cart");
        const saved = data.carts?.find((row) => row.userId === userId);
        if (!saved) throw new Error("Saved recovery cart not found");
        setUser(recoveredUser);
        const savedItems = JSON.parse(saved.itemsJson) as Array<{id:number;quantity:number}>;
        setCart(Object.fromEntries(savedItems.map((item) => [item.id, item.quantity])));
        const analysis = saved.analysisJson ? JSON.parse(saved.analysisJson) as {couponCode?:string;couponPercent?:number;discountAmount?:number} : null;
        const storedCode = analysis?.couponCode || (analysis?.couponPercent ? `${userId.toUpperCase()}20` : analysis?.discountAmount ? "WELCOME100" : "");
        if (couponCode && storedCode === couponCode && saved.status === "sent") {
          const offer = {code:couponCode,percent:Number(analysis?.couponPercent ?? 0),amount:Number(analysis?.discountAmount ?? 0)};
          setEligibleCoupon(offer);
          setCouponInput(couponCode);
        }
        setOpen(true);
      })
      .catch((error) => setCouponMessage(error instanceof Error ? error.message : "Unable to restore cart"));
  }, []);
  useEffect(() => {
    if (!user) return;
    const items = products
      .filter((p) => cart[p.id])
      .map((p) => ({
        id: p.id,
        name: p.name,
        quantity: cart[p.id],
        price: p.price,
        image: p.image,
      }));
    const lastActivityAt = new Date(
      Date.now() - (user.id === "rahul" && count > 0 ? 4 * 60 * 60 * 1000 : 0),
    ).toISOString();
    void fetch("/api/cart-snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        customerName: user.name,
        customerType: user.type,
        previousOrders: user.orders,
        items,
        itemCount: count,
        cartTotal: total,
        lastActivityAt,
        status: user.id === "rahul" && count > 0 ? "abandoned" : "active",
      }),
      keepalive: true,
    });
  }, [user, cart, count, total]);
  if (!user)
    return (
      <div className="login-page">
        <div className="login-brand">
          <span>
            <Sparkles />
          </span>
          <strong>CartSense</strong>
          <b>Store</b>
        </div>
        <div className="login-card">
          <span className="eyebrow">DEMO SHOPPING EXPERIENCE</span>
          <h1>Who is shopping today?</h1>
          <p>
            Select a customer profile to enter the store. Each profile creates
            its own cart and recovery journey.
          </p>
          <div className="user-grid">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setUser(u);
                  setCart({});
                  setOrdered(false);
                }}
              >
                <span className="user-avatar">{u.initials}</span>
                <div>
                  <strong>{u.name}</strong>
                  <small>
                    {u.type} · {u.orders} orders
                  </small>
                </div>
                <ArrowRight />
              </button>
            ))}
          </div>
          <Link href="/" className="back-admin">
            Open analytics &amp; recovery overview
          </Link>
        </div>
      </div>
    );
  return (
    <div className="store-page">
      <header className="store-header">
        <Link href="/shop" className="store-brand">
          <span>
            <Sparkles size={18} />
          </span>
          CartSense <b>Store</b>
        </Link>
        <div className="store-search">
          <Search />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={`Search across ${products.length} products`}
          />
        </div>
        <div className="store-user">
          <div>
            <strong>Hi, {user.name.split(" ")[0]}</strong>
            <span>{user.type}</span>
          </div>
          <button>
            <span>{user.initials}</span>
            <ChevronDown />
          </button>
          <button
            className="logout"
            onClick={() => setUser(null)}
            title="Switch customer"
          >
            <LogOut />
          </button>
          <Link href="/" className="admin-link" title="Open analytics dashboard">
            Analytics
          </Link>
          <button className="cart-trigger" onClick={() => setOpen(true)}>
            <ShoppingCart />
            <b>{count}</b>
          </button>
        </div>
      </header>
      <main className="store-main">
        <div className="store-intro">
          <div>
            <span className="eyebrow">
              {products.length} PRODUCTS · CURATED FOR YOU
            </span>
            <h1>Find something you’ll love.</h1>
            <p>
              Browse the full demo catalogue and build a realistic recovery
              cart.
            </p>
          </div>
          <Link href="/" className="admin-link">
            Open recovery admin
          </Link>
        </div>
        <div className="category-row">
          {["All", ...catalog.map((c) => c[0])].map((c) => (
            <button
              key={c}
              className={category === c ? "active" : ""}
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="catalog-meta">
          <strong>{filtered.length} products</strong>
          <span>Showing {Math.min(shown.length, filtered.length)}</span>
        </div>
        <section className="product-grid four-col">
          {shown.map((p) => (
            <article className="product-card" key={p.id}>
              <div className="product-photo">
                <img src={p.image} alt={p.name} />
                <span>★ {p.rating}</span>
              </div>
              <div className="product-copy">
                <small>{p.category}</small>
                <h2>{p.name}</h2>
                <div>
                  <strong>{money(p.price)}</strong>
                  {cart[p.id] ? (
                    <div className="qty">
                      <button onClick={() => change(p.id, -1)}>
                        <Minus />
                      </button>
                      <span>{cart[p.id]}</span>
                      <button onClick={() => change(p.id, 1)}>
                        <Plus />
                      </button>
                    </div>
                  ) : (
                    <button className="add" onClick={() => change(p.id, 1)}>
                      Add to cart
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
        {shown.length < filtered.length && (
          <button className="load-more" onClick={() => setPage((p) => p + 1)}>
            Load 20 more products
          </button>
        )}
      </main>
      {open && (
        <div className="cart-backdrop" onClick={() => setOpen(false)}>
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-head">
              <div>
                <span>{user.name.toUpperCase()}’S CART</span>
                <h2>{count} items selected</h2>
              </div>
              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            {ordered ? (
              <div className="order-success">
                <span>
                  <Check />
                </span>
                <h2>Order confirmed!</h2>
                <p>
                  Thanks, {user.name.split(" ")[0]}. Your order is being
                  prepared.
                </p>
                <button
                  onClick={() => {
                    setOrdered(false);
                    setCart({});
                    setOpen(false);
                  }}
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {products
                    .filter((p) => cart[p.id])
                    .map((p) => (
                      <div className="cart-item" key={p.id}>
                        <img src={p.image} alt="" />
                        <div>
                          <strong>{p.name}</strong>
                          <span>{money(p.price)}</span>
                          <div className="qty">
                            <button onClick={() => change(p.id, -1)}>
                              <Minus />
                            </button>
                            <span>{cart[p.id]}</span>
                            <button onClick={() => change(p.id, 1)}>
                              <Plus />
                            </button>
                          </div>
                        </div>
                        <strong>{money(p.price * cart[p.id])}</strong>
                      </div>
                    ))}
                  {!count && (
                    <div className="empty-cart">
                      <ShoppingCart />
                      <strong>Your cart is empty</strong>
                      <span>Add products to begin the recovery journey.</span>
                    </div>
                  )}
                </div>
                <div className="cart-benefits">
                  <span>
                    <Truck />
                    Free delivery
                  </span>
                  <span>
                    <ShieldCheck />
                    Secure checkout
                  </span>
                </div>
                <div className="cart-total">
                  <span>Subtotal</span>
                  <strong>{money(total)}</strong>
                  {appliedCoupon && (
                    <>
                      <span>Coupon {appliedCoupon.code}</span>
                      <strong>−{money(discount)}</strong>
                      <span>Amount to pay</span>
                      <strong>{money(payable)}</strong>
                    </>
                  )}
                  <small>
                    Taxes included. Shipping calculated at checkout.
                  </small>
                </div>
                <div className="coupon-entry">
                  <input value={couponInput} onChange={(event) => setCouponInput(event.target.value.toUpperCase())} placeholder="Enter coupon code" />
                  <button onClick={() => {
                    if (eligibleCoupon && couponInput.trim() === eligibleCoupon.code) {
                      setAppliedCoupon(eligibleCoupon);
                      setCouponMessage("Coupon applied successfully");
                    } else {
                      setAppliedCoupon(null);
                      setCouponMessage("Coupon is invalid, expired or not approved for this customer");
                    }
                  }}>Apply</button>
                  {couponMessage && <span>{couponMessage}</span>}
                </div>
                <button
                  className="checkout"
                  disabled={!count}
                  onClick={() => setOrdered(true)}
                >
                  Proceed to checkout
                </button>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
