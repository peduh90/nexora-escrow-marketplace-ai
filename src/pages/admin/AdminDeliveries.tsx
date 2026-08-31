import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Truck, Search, Eye, MapPin, Clock, CheckCircle2, Package, ArrowRight } from "lucide-react";

const deliveries = [
  { id: "DLV-0342", order: "ORD-2901", product: "HP EliteBook 840 G3", buyer: "Edwin Kamau", buyerLocation: "Westlands, Nairobi", seller: "TechZone Kenya", sellerLocation: "CBD, Nairobi", status: "In Transit", agent: "John Driver", fee: "FREE", insurance: "KES 440", created: "Apr 5, 2025" },
  { id: "DLV-0341", order: "ORD-2900", product: "Samsung Galaxy S23", buyer: "Peter Mwangi", buyerLocation: "Kisumu CBD", seller: "PhoneWorld", sellerLocation: "CBD, Nairobi", status: "Picked Up", agent: "Mary Courier", fee: "KES 500", insurance: "KES 900", created: "Apr 5, 2025" },
  { id: "DLV-0340", order: "ORD-2899", product: "Nike Air Max 90", buyer: "Lucy Wambui", buyerLocation: "Karen, Nairobi", seller: "FashionHub KE", sellerLocation: "Westlands, Nairobi", status: "Delivered", agent: "Sam Express", fee: "FREE", insurance: "KES 170", created: "Apr 4, 2025" },
  { id: "DLV-0339", order: "ORD-2896", product: "2BR Apartment", buyer: "Grace Njeri", buyerLocation: "Nakuru CBD", seller: "PropertyLink KE", sellerLocation: "Westlands, Nairobi", status: "Pending", agent: "Unassigned", fee: "KES 500", insurance: "KES 0", created: "Apr 3, 2025" },
];

const deliveryZones = [
  { zone: "Nairobi CBD", fee: "FREE", estimatedTime: "1-2 hours", active: true },
  { zone: "Westlands, Nairobi", fee: "FREE", estimatedTime: "1-2 hours", active: true },
  { zone: "Karen, Nairobi", fee: "FREE", estimatedTime: "2-3 hours", active: true },
  { zone: "Kiambu", fee: "KES 200", estimatedTime: "Same day", active: true },
  { zone: "Kisumu", fee: "KES 500", estimatedTime: "1-2 days", active: true },
  { zone: "Nakuru", fee: "KES 400", estimatedTime: "1-2 days", active: true },
  { zone: "Mombasa", fee: "KES 800", estimatedTime: "2-3 days", active: true },
  { zone: "Eldoret", fee: "KES 600", estimatedTime: "1-2 days", active: true },
];

export default function AdminDeliveries() {
  const [tab, setTab] = useState("Active");

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Delivery Management</h1>
        <p className="text-sm text-white/40 mt-1">Platform-managed delivery operations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Pending", value: "47", color: "#F59E0B" },
          { label: "In Transit", value: "156", color: "#06B6D4" },
          { label: "Delivered Today", value: "342", color: "#10B981" },
          { label: "Active Agents", value: "28", color: "#8B5CF6" },
          { label: "Failed", value: "3", color: "#EF4444" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Active Deliveries */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-nx-cyan" />
              <h3 className="text-sm font-semibold text-white">Active Deliveries</h3>
            </div>
            <div className="flex gap-1">
              {["Active", "All"].map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-2 py-1 rounded text-[10px] font-medium ${tab === t ? "bg-nx-violet/10 text-nx-violet" : "text-white/20"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {deliveries.map(d => (
              <div key={d.id} className="px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-white/50">{d.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${d.status === "Delivered" ? "bg-nx-emerald/10 text-nx-emerald" : d.status === "In Transit" ? "bg-nx-cyan/10 text-nx-cyan" : d.status === "Picked Up" ? "bg-nx-violet/10 text-nx-violet" : "bg-nx-gold/10 text-nx-gold"}`}>{d.status}</span>
                  </div>
                  <span className="text-[10px] text-white/20">{d.created}</span>
                </div>
                <p className="text-xs text-white/60 font-medium mb-1">{d.product}</p>
                <div className="flex items-center gap-2 text-[10px] text-white/25">
                  <span>{d.sellerLocation}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{d.buyerLocation}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px]">
                  <span className="text-white/25">Agent: {d.agent}</span>
                  <span className={d.fee === "FREE" ? "text-nx-emerald" : "text-white/40"}>Fee: {d.fee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Zones */}
        <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-nx-emerald" />
              <h3 className="text-sm font-semibold text-white">Delivery Zones</h3>
            </div>
            <button className="text-[10px] text-nx-violet hover:text-nx-violet/80">+ Add Zone</button>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {deliveryZones.map(z => (
              <div key={z.zone} className="px-5 py-3 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60 font-medium">{z.zone}</p>
                    <p className="text-[10px] text-white/20">{z.estimatedTime}</p>
                  </div>
                  <span className={`text-xs font-medium ${z.fee === "FREE" ? "text-nx-emerald" : "text-white/50"}`}>{z.fee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
