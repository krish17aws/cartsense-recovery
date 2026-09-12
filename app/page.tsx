"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Brain,
  Check,
  CircleDollarSign,
  Gift,
  LayoutDashboard,
  MessageCircleMore,
  MoreHorizontal,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
type Recovery = {
  id: string;
  userId: string;
  name: string;
  initials: string;
  value: number;
  customer: string;
  offer: string;
  discount: number;
  state: "auto" | "approval" | "sent" | "active";
  time: string;
  items?: number;
};
type CartRow = {
  userId: string;
  customerName: string;
  customerType: string;
  previousOrders: number;
  cartTotal: number;
  itemCount: number;
  itemsJson: string;
  status: string;
  lastActivityAt: string;
  analysisJson?: string;
  analysisSource?: string;
};
type Analysis = {
  recommendation: string;
  couponPercent: number;
  discountAmount?: number;
  couponCode?: string;
  confidence: number;
  reasoning: string;
  risk: string;
  requiresApproval: boolean;
  activityStatus?: string;
  historySummary?: string;
  evidence?: Array<{
    label: string;
    detail: string;
    score: number;
    maxScore: number;
    sentiment: "positive" | "neutral" | "risk";
  }>;
};
const initial: Recovery[] = [
  {
    id: "CR-1048",
    userId: "meera",
    name: "Meera Nair",
    initials: "MN",
    value: 11597,
    customer: "Loyal customer",
    offer: "No coupon · personalised reminder",
    discount: 0,
    state: "sent",
    time: "2 min ago",
  },
  {
    id: "CR-1047",
    userId: "arjun",
    name: "Arjun Menon",
    initials: "AM",
    value: 4289,
    customer: "Returning customer",
    offer: "10% recovery coupon",
    discount: 10,
    state: "auto",
    time: "Sends after 3h",
  },
  {
    id: "CR-1046",
    userId: "priya",
    name: "Priya Sharma",
    initials: "PS",
    value: 2179,
    customer: "New customer",
    offer: "₹100 welcome offer · cart above ₹500",
    discount: 0,
    state: "sent",
    time: "8 min ago",
  },
  {
    id: "CR-1045",
    userId: "rahul",
    name: "Rahul Verma",
    initials: "RV",
    value: 0,
    customer: "Returning customer",
    offer: "Awaiting AI analysis",
    discount: 0,
    state: "active",
    time: "No saved cart",
  },
  {
    id: "CR-1044",
    userId: "ananya",
    name: "Ananya Iyer",
    initials: "AI",
    value: 0,
    customer: "New customer",
    offer: "₹100 when cart > ₹500",
    discount: 0,
    state: "active",
    time: "No saved cart",
  },
  {
    id: "CR-1043",
    userId: "vikram",
    name: "Vikram Rao",
    initials: "VR",
    value: 0,
    customer: "Loyal customer",
    offer: "Awaiting activity",
    discount: 0,
    state: "active",
    time: "No saved cart",
  },
  {
    id: "CR-1042",
    userId: "sneha",
    name: "Sneha Kapoor",
    initials: "SK",
    value: 0,
    customer: "Returning customer",
    offer: "Awaiting activity",
    discount: 0,
    state: "active",
    time: "No saved cart",
  },
  {
    id: "CR-1041",
    userId: "karthik",
    name: "Karthik Kumar",
    initials: "KK",
    value: 0,
    customer: "New customer",
    offer: "₹100 when cart > ₹500",
    discount: 0,
    state: "active",
    time: "No saved cart",
  },
];
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
export default function Overview() {
  const [items, setItems] = useState(initial),
    [selected, setSelected] = useState("rahul"),
    [cartRows, setCartRows] = useState<CartRow[]>([]),
    [notice, setNotice] = useState(""),
    [analysis, setAnalysis] = useState<Analysis | null>(null),
    [source, setSource] = useState(""),
    [loading, setLoading] = useState(false),
    [sending, setSending] = useState(false);
  const selectedRef = useRef(selected);
  const current = items.find((i) => i.userId === selected) ?? items[3],
    pending = cartRows.filter((cart) => cart.status === "approval_required").length,
    newlyRecoveredRevenue = cartRows
      .filter((cart) => cart.status === "recovered")
      .reduce((sum, cart) => sum + cart.cartTotal, 0),
    recoveredRevenue = 184320 + newlyRecoveredRevenue;
  const flash = (s: string) => {
    setNotice(s);
    setTimeout(() => setNotice(""), 3000);
  };
  const refresh = async (runAI: boolean, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const cartResponse = await fetch("/api/cart-snapshots", {
        cache: "no-store",
      });
      const payload = (await cartResponse.json()) as { carts?: CartRow[]; error?: string };
      if (!cartResponse.ok) throw new Error(payload.error ?? "Cart API failed");
      const carts = payload.carts ?? [];
      setCartRows(carts);
      setItems((xs) =>
        xs.map((x) => {
          const cart = carts.find((c) => c.userId === x.userId);
          if (!cart) return x;
          const hours =
            (Date.now() - new Date(cart.lastActivityAt).getTime()) / 3600000;
          return {
            ...x,
            value: cart.cartTotal,
            items: cart.itemCount,
            state:
              cart.status === "approval_required"
                ? "approval"
                : cart.status === "ready_to_send"
                  ? "auto"
                  : cart.status === "sent" || cart.status === "recovered"
                    ? "sent"
                    : "active",
            time:
              cart.status === "recovered"
                ? "Purchase recovered"
                : cart.itemCount === 0
                ? "Cart empty"
                : hours >= 3
                  ? "3-hour limit exceeded"
                  : `Scheduled · ${Math.max(0, Math.ceil(3 - hours))}h remaining`,
          };
        }),
      );
      const selectedUserId = selectedRef.current;
      const chosen = carts.find((c) => c.userId === selectedUserId);
      if (!runAI) {
        if (chosen?.analysisJson) {
          try {
            setAnalysis(JSON.parse(chosen.analysisJson));
            setSource(chosen.analysisSource ?? "");
          } catch {
            setAnalysis(null);
            setSource("");
          }
        } else {
          setAnalysis(null);
          setSource("");
        }
      }
      if (runAI) {
        if (chosen && chosen.itemCount > 0) {
          const analysisResponse = await fetch("/api/recovery-analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: selectedUserId }),
          });
          const result = (await analysisResponse.json()) as { analysis?: Analysis; source?: string; error?: string };
          if (!analysisResponse.ok || !result.analysis) throw new Error(result.error ?? "Analysis failed");
          const analysisResult = result.analysis;
          setAnalysis(analysisResult);
          setSource(result.source ?? "policy_engine");
          setCartRows((rows) =>
            rows.map((row) =>
              row.userId === selectedUserId
                ? {
                    ...row,
                    status: analysisResult.requiresApproval
                      ? "approval_required"
                      : "ready_to_send",
                    analysisJson: JSON.stringify(analysisResult),
                    analysisSource: result.source ?? "policy_engine",
                  }
                : row,
            ),
          );
          setItems((xs) =>
            xs.map((x) =>
              x.userId === selectedUserId
                ? {
                    ...x,
                    offer: analysisResult.discountAmount
                      ? `₹${analysisResult.discountAmount} welcome offer`
                      : analysisResult.couponPercent
                        ? `${analysisResult.couponPercent}% AI-recommended coupon`
                        : "Personalised reminder",
                    discount: analysisResult.couponPercent,
                    state: analysisResult.requiresApproval
                      ? "approval"
                      : "auto",
                    time: analysisResult.requiresApproval
                      ? "Awaiting human decision"
                      : "Ready for automatic send",
                  }
                : x,
            ),
          );
          flash(
            result.source === "gemini"
              ? `AI analysed ${current.name}’s live cart`
              : `Recovery analysis completed for ${current.name}`,
          );
        } else flash(`Add items to ${current.name}’s cart first`);
      }
    } catch (error) {
      if (!quiet) flash(error instanceof Error ? error.message : "Could not load the latest cart");
    }
    if (!quiet) setLoading(false);
  };
  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refresh(false, true), 0);
    const timer = window.setInterval(() => void refresh(false, true), 3000);
    const onFocus = () => void refresh(false, true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- polling subscription is intentionally established once
  const decide = (approved: boolean) => {
    setItems((xs) =>
      xs.map((x) =>
        x.userId === selected
          ? {
              ...x,
              state: approved ? "sent" : "auto",
              offer: approved ? x.offer : "Standard reminder · coupon removed",
            }
          : x,
      ),
    );
    flash(
      approved
        ? "Coupon approved and send authorised"
        : "Coupon removed · standard recovery authorised",
    );
  };
  const sendWhatsApp = async (removeCoupon = false) => {
    setSending(true);
    try {
      const response = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected, removeCoupon }),
      });
      const result = (await response.json()) as {
        sent?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Unable to send");
      decide(!removeCoupon);
      setCartRows((rows) =>
        rows.map((row) =>
          row.userId === selected ? { ...row, status: "sent" } : row,
        ),
      );
      flash(`WhatsApp message sent to the configured test recipient`);
    } catch (error) {
      flash(error instanceof Error ? error.message : "WhatsApp send failed");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="app-shell simple-shell">
      <aside className="sidebar simple-sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <strong>CartSense</strong>
            <span>Recovery AI</span>
          </div>
        </div>
        <nav>
          <p className="nav-label">WORKSPACE</p>
          <button className="nav-item active">
            <LayoutDashboard />
            Overview
          </button>
        </nav>
        <div className="automation-mini">
          <span>
            <i />
            AUTOMATION LIVE
          </span>
          <p>Watching carts continuously</p>
          <strong>3-hour inactivity rule</strong>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item">
            <Settings />
            Automation policy
          </button>
          <div className="profile">
            <div className="avatar dark">KP</div>
            <div>
              <strong>Krishna Prasanth</strong>
              <span>Administrator</span>
            </div>
            <MoreHorizontal />
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <h1>Recovery overview</h1>
            <p>
              Live carts, AI recommendations, and human review for large
              discounts.
            </p>
          </div>
          <div className="header-actions">
            <Link href="/shop" className="store-link">
              <ShoppingBag />
              Customer store
            </Link>
            <div className="live">
              <i />
              Automation running
            </div>
            <button
              className="store-link"
              disabled={loading}
              onClick={() => void refresh(false)}
            >
              <RefreshCw /> Refresh carts
            </button>
            <button
              className="primary"
              disabled={loading}
              onClick={() => void refresh(true)}
            >
              <Sparkles />
              {loading ? "Analysing…" : "Run AI now"}
            </button>
          </div>
        </header>
        {notice && (
          <div className="toast">
            <Check />
            {notice}
          </div>
        )}
        <section className="metrics">
          <Metric
            label="Revenue recovered"
            value={money(recoveredRevenue)}
            note="This month"
            icon={<CircleDollarSign />}
          />
          <Metric
            label="Messages auto-sent"
            value="126"
            note="No manual work required"
            icon={<Send />}
          />
          <Metric
            label="Awaiting approval"
            value={String(pending).padStart(2, "0")}
            note="Large discounts only"
            icon={<ShieldCheck />}
            amber
          />
          <Metric
            label="Recovery rate"
            value="14.8%"
            note="+2.1% vs last month"
            icon={<TrendingUp />}
          />
        </section>
        <section className="policy-strip">
          <div className="policy-title">
            <span>
              <Zap />
            </span>
            <div>
              <strong>Automation policy</strong>
              <p>Messages send automatically after the inactivity limit.</p>
            </div>
          </div>
          <Policy
            icon={<Timer />}
            title="Scheduled means"
            value="Waiting for 3-hour limit"
          />
          <Policy
            icon={<Gift />}
            title="New customer"
            value="₹100 off when cart > ₹500"
          />
          <Policy
            icon={<ShieldCheck />}
            title="Human approval"
            value="Discount above 15%"
          />
        </section>
        <section className="overview-grid">
          <div className="activity-card">
            <div className="card-heading">
              <div>
                <h2>Live recovery activity</h2>
                <p>Select any customer with a saved cart, then run AI</p>
              </div>
              <span className="updated">Live carts</span>
            </div>
            <div className="activity-list">
              {items.map((i) => (
                <button
                  key={i.id}
                  className={`activity-row ${selected === i.userId ? "selected" : ""}`}
                  onClick={() => {
                    selectedRef.current = i.userId;
                    setSelected(i.userId);
                    const cart = cartRows.find((c) => c.userId === i.userId);
                    if (cart?.analysisJson) {
                      setAnalysis(JSON.parse(cart.analysisJson));
                      setSource(cart.analysisSource ?? "");
                    } else {
                      setAnalysis(null);
                      setSource("");
                    }
                  }}
                >
                  <div className="avatar">{i.initials}</div>
                  <div className="activity-person">
                    <strong>{i.name}</strong>
                    <span>
                      {i.customer} · {i.items ?? "—"} items
                    </span>
                  </div>
                  <div className="activity-value">
                    <strong>{money(i.value)}</strong>
                    <span>{i.time}</span>
                  </div>
                  <Status state={i.state} />
                  <ArrowUpRight />
                </button>
              ))}
            </div>
          </div>
          <aside className="exception-card">
            <div className="exception-top">
              <span className="exception-icon">
                <Brain />
              </span>
              <div>
                <small>
                  {source === "gemini"
                    ? "GEMINI AI INSIGHT"
                    : source
                      ? "POLICY ENGINE FALLBACK"
                      : "AWAITING ANALYSIS"}
                </small>
                <h2>{current.name} recovery decision</h2>
              </div>
            </div>
            <div className="customer-summary">
              <div className="avatar large">{current.initials}</div>
              <div>
                <strong>{current.name}</strong>
                <span>
                  {current.customer} · {current.items ?? 0} cart items
                </span>
              </div>
              <strong>{money(current.value)}</strong>
            </div>
            {analysis ? (
              <>
                <div className="customer-history">
                  <div>
                    <span>ENGAGEMENT STATUS</span>
                    <strong>
                      <i />
                      {analysis.activityStatus ?? "Returning customer"}
                    </strong>
                  </div>
                  <p>{analysis.historySummary ?? "3 completed orders"}</p>
                  <small>
                    Demo customer history used for this portfolio scenario
                  </small>
                </div>
                <div className="ai-insight">
                  <div>
                    <span>AI RECOMMENDATION</span>
                    <b>{analysis.recommendation.replaceAll("_", " ")}</b>
                  </div>
                  <strong>
                    {analysis.confidence}% confidence in this action
                  </strong>
                  <p>{analysis.reasoning}</p>
                  <small>Margin risk: {analysis.risk}</small>
                </div>
                {analysis.evidence && (
                  <div className="confidence-evidence">
                    <div className="evidence-heading">
                      <div>
                        <span>WHY {analysis.confidence}%?</span>
                        <strong>Confidence evidence</strong>
                      </div>
                      <small>Points earned / available</small>
                    </div>
                    {analysis.evidence.map((signal) => (
                      <div className="evidence-row" key={signal.label}>
                        <div>
                          <strong>{signal.label}</strong>
                          <span>{signal.detail}</span>
                        </div>
                        <div className="evidence-score">
                          <b>
                            {signal.score}/{signal.maxScore}
                          </b>
                          <div>
                            <i
                              className={signal.sentiment}
                              style={{
                                width: `${(signal.score / signal.maxScore) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="confidence-note">
                      Confidence measures how strongly the available behavior
                      supports this action. It does not guarantee conversion.
                    </p>
                  </div>
                )}
                <div className="coupon-box">
                  <span>RECOMMENDED ACTION</span>
                  <div>
                    <strong>
                      {analysis.discountAmount
                        ? `₹${analysis.discountAmount} welcome discount`
                        : analysis.couponPercent
                          ? `${analysis.couponPercent}% recovery coupon`
                          : "Send without a coupon"}
                    </strong>
                    {(analysis.discountAmount ?? 0) > 0 ? (
                      <b>₹{analysis.discountAmount} OFF</b>
                    ) : analysis.couponPercent > 0 ? (
                      <b>{analysis.couponPercent}% OFF</b>
                    ) : null}
                  </div>
                  <p>
                    {analysis.requiresApproval
                      ? "The recommendation exceeds the 15% limit, so sending is paused for your approval."
                      : "The recommendation is within policy and can send automatically."}
                  </p>
                  {analysis.couponCode && (
                    <p>Coupon code: <strong>{analysis.couponCode}</strong></p>
                  )}
                </div>
                <div className="message-sample">
                  <MessageCircleMore />
                  <p>
                    Hi {current.name.split(" ")[0]} 👋 Your cart is still
                    waiting. Complete your purchase and use your personalised
                    recovery offer before it expires.
                  </p>
                </div>
                {analysis.requiresApproval ? (
                  <div className="approval-actions">
                    <button
                      disabled={sending}
                      onClick={() => void sendWhatsApp(true)}
                    >
                      {sending ? "Sending…" : "Remove coupon & send"}
                    </button>
                    <button
                      disabled={sending}
                      onClick={() => void sendWhatsApp(false)}
                    >
                      <Check />
                      {sending ? "Sending…" : "Approve & send"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="auto-confirm">
                      <Check />
                      <span>
                        <strong>Automatic send authorised</strong>No human
                        approval is required
                      </span>
                    </div>
                    <button
                      className="send-now"
                      disabled={sending}
                      onClick={() => void sendWhatsApp(false)}
                    >
                      <Send />
                      {sending ? "Sending…" : "Send WhatsApp now"}
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="analysis-empty">
                <Brain />
                <strong>No AI insight generated yet</strong>
                <p>
                  Add items as {current.name.split(" ")[0]}, return here, and
                  click <b>Run AI now</b>. Demo carts are eligible immediately
                  so the analysis can be tested.
                </p>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
function Status({ state }: { state: Recovery["state"] }) {
  return (
    <span className={`activity-status ${state}`}>
      {state === "approval"
        ? "Needs approval"
        : state === "sent"
          ? "Auto-sent"
          : state === "active"
            ? "Scheduled"
            : "Ready"}
    </span>
  );
}
function Policy({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="policy-item">
      <span>{icon}</span>
      <div>
        <small>{title}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
function Metric({
  label,
  value,
  note,
  icon,
  amber = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  amber?: boolean;
}) {
  return (
    <article className="metric">
      <div className={`metric-icon ${amber ? "amber" : ""}`}>{icon}</div>
      <div>
        <p>{label}</p>
        <div className="metric-value">
          <strong>{value}</strong>
        </div>
        <small>{note}</small>
      </div>
    </article>
  );
}
