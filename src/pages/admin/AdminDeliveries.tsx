import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Truck, Eye, MapPin, ArrowRight } from "lucide-react";

// Delivery zones are platform config — these are the admin-configured defaults
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
  const allDeliveries = useQuery(api.admin.getAllDeliveries);
  const allUsers = useQuery(api.admin.getAllUsers);
  const [tab, setTab] = useState("Active");

  const deliveries = allDeliveries ?? [];
  const users = allUsers ?? [];
  const getUser = (id: string) => users.find((u: any) => u._id === id);

  const pending = deliveries.filter((d: any) => d.status === "assigned").length;
  const inTransit = deliveries.filter((d: any) => d.status === "in_transit").length;
  const delivered = deliveries.filter((d: any) => d.status === "delivered" || d.status === "confirmed").length;
  const issues = deliveries.filter((d: any) => d.status === "issue").length;

  const filtered = tab === "Active"
    ? deliveries.filter((d: any) => d.status !== "delivered" && d.status !== "confirmed")
    : deliveries;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Delivery Management</h1>
        <p className="text-sm text-white/40 mt-1">Platform-managed delivery operations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Pending", value: pending.toString(), color: "#F59E0B" },
          { label: "In Transit", value: inTransit.toString(), color: "#06B6D4" },
          { label: "Delivered", value: delivered.toString(), color: "#10B981" },
          { label: "Total", value: deliveries.length.toString(), color: "#8B5CF6" },
          { label: "Issues", value: issues.toString(), color: "#EF4444" },
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
          {deliveries.length === 0 ? (
            <div className="py-16 flex flex-col items-center">
              <Truck className="w-8 h-8 text-white/10 mb-3" />
              <p className="text-sm text-white/30">No deliveries yet</p>
              <p className="text-[11px] text-white/15 mt-1">Deliveries will appear here once orders are placed</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {filtered.map((d: any) => {
                const escrow = d.escrowId;
                return (
                  <div key={d._id} className="px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${d.status === "delivered" || d.status === "confirmed" ? "bg-nx-emerald/10 text-nx-emerald" : d.status === "in_transit" ? "bg-nx-cyan/10 text-nx-cyan" : "bg-nx-gold/10 text-nx-gold"}`}>{d.status}</span>
                      <span className="text-[10px] text-white/20">{d.trackingCode}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/25">
                      <span>{d.pickupCounty}, {d.pickupTown}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{d.dropoffCounty}, {d.dropoffTown}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px]">
                      <span className="text-white/25">{d.driverName || "Unassigned"}</span>
                      <span className="text-white/40">KES {d.transportFee?.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
