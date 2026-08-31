import { useState } from "react";
import SellerLayout from "./SellerLayout";
import { HelpCircle, ShoppingCart, Wallet, Shield, Truck, Package, User, BadgeCheck, AlertTriangle, Settings, ChevronDown, MessageSquare, Phone, Mail } from "lucide-react";

const categories = [
  { icon: ShoppingCart, label: "Orders", articles: ["How to process an order", "Order status explained", "Cancel an order"] },
  { icon: Wallet, label: "Payments", articles: ["Payment methods", "Understanding fees", "Invoice generation"] },
  { icon: Shield, label: "Escrow", articles: ["How escrow works", "When funds are released", "Escrow disputes"] },
  { icon: Truck, label: "Delivery", articles: ["Nexora Market delivery", "Ready for collection", "Tracking shipments"] },
  { icon: Package, label: "Products", articles: ["List a product", "Product guidelines", "Pricing tips"] },
  { icon: BadgeCheck, label: "Verification", articles: ["Get verified", "Verification requirements", "Verification benefits"] },
  { icon: AlertTriangle, label: "Disputes", articles: ["Respond to disputes", "Submit evidence", "Dispute resolution"] },
  { icon: Settings, label: "Account", articles: ["Account settings", "Security", "Withdrawal setup"] },
];

export default function SellerHelp() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [ticketModal, setTicketModal] = useState(false);
  const faqs = [
    { q: "How does Nexora Market escrow work?", a: "When a buyer places an order, their payment is held in escrow. Once you prepare the product and Nexora Market collects and delivers it, the buyer confirms receipt, and funds are released to your wallet." },
    { q: "When can I withdraw my earnings?", a: "You can withdraw funds that are marked as 'Available' in your wallet. Funds in escrow cannot be withdrawn until the transaction is completed and the buyer confirms receipt." },
    { q: "How does Nexora Market handle delivery?", a: "Nexora Market manages all delivery. You only need to prepare the product and mark it as 'Ready for Collection'. Nexora Market will collect and deliver it to the buyer." },
    { q: "What are the fees?", a: "Nexora Market charges a platform fee of 5% per transaction for the free tier. Professional sellers pay 2.5%, and Enterprise sellers pay 0.5%. Delivery fees are calculated by Nexora Market and shown to the buyer at checkout." },
  ];

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Help & Support</h1>
          <p className="text-sm text-white/40 mt-1">Find answers and get help</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => setTicketModal(true)} className="p-4 rounded-xl bg-nx-violet/5 border border-nx-violet/10 text-left hover:bg-nx-violet/10 transition-colors">
            <MessageSquare className="w-5 h-5 text-nx-violet mb-2" />
            <p className="text-sm font-medium text-white">Contact Support</p>
            <p className="text-[11px] text-white/30">Submit a ticket</p>
          </button>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <Phone className="w-5 h-5 text-nx-cyan mb-2" />
            <p className="text-sm font-medium text-white">Call Us</p>
            <p className="text-[11px] text-white/30">+254 800 NEXORA</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <Mail className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-sm font-medium text-white">Email Support</p>
            <p className="text-[11px] text-white/30">support@nexora.co.ke</p>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map(c => (
            <div key={c.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
              <c.icon className="w-5 h-5 text-nx-violet mb-2" />
              <p className="text-sm font-medium text-white">{c.label}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{c.articles.length} articles</p>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left">
                  <span className="text-sm text-white">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-white/20 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`} />
                </button>
                {expandedFaq === i && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3">
                    <p className="text-xs text-white/50 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ticket modal */}
        {ticketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTicketModal(false)} />
            <div className="relative w-full max-w-md rounded-2xl bg-[#0E0E18] border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Submit Support Ticket</h3>
              <div className="space-y-3">
                <div><label className="text-xs text-white/40 mb-1 block">Category</label>
                  <select className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none"><option>Orders</option><option>Payments</option><option>Escrow</option><option>Delivery</option><option>Products</option><option>Account</option></select>
                </div>
                <div><label className="text-xs text-white/40 mb-1 block">Subject</label>
                  <input className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none" placeholder="Brief description" />
                </div>
                <div><label className="text-xs text-white/40 mb-1 block">Message</label>
                  <textarea rows={4} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none resize-none" placeholder="Describe your issue..." />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setTicketModal(false)} className="flex-1 py-2.5 rounded-lg text-sm text-white/40 hover:bg-white/[0.03]">Cancel</button>
                <button onClick={() => setTicketModal(false)} className="flex-1 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium">Submit Ticket</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
