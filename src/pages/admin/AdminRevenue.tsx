import { motion } from "framer-motion";
import AdminLayout from "./AdminLayout";
import { TrendingUp, BarChart3 } from "lucide-react";

export default function AdminRevenue() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Platform revenue, commissions, and financial metrics</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Revenue", value: "KES 142.8M" },
          { label: "This Month", value: "KES 18.5M" },
          { label: "Commission Earned", value: "KES 7.14M" },
          { label: "Growth Rate", value: "+23%" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
        <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-nx-violet" /><h3 className="text-sm font-semibold text-white">Revenue Trend</h3></div>
        <div className="flex items-end gap-1 h-48">
          {[35,42,28,55,48,62,71,58,83,76,90,85,92,78,95,88,97,82,91,100,87,93,89,96].map((h,i)=>(
            <motion.div key={i} initial={{height:0}} animate={{height:`${h}%`}} transition={{duration:0.4,delay:0.1+i*0.02}} className="flex-1 rounded-t-sm" style={{background:h>85?"linear-gradient(to top,rgba(139,92,246,0.3),rgba(139,92,246,0.6))":h>60?"linear-gradient(to top,rgba(6,182,212,0.2),rgba(6,182,212,0.4))":"linear-gradient(to top,rgba(255,255,255,0.03),rgba(255,255,255,0.08))"}} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-white/20"><span>30 days ago</span><span>Today</span></div>
      </div>
    </AdminLayout>
  );
}
