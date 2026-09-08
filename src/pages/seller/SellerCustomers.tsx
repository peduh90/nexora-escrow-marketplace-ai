import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import SellerLayout from "./SellerLayout";
import { Users, ShoppingBag, Search } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  orders: number;
  totalSpent: number;
  location: string;
}

export default function SellerCustomers() {
  // Backend-verified scoped query: returns only buyers this seller has
  // actually transacted with, with seller-safe contact details.
  const customersResult = useQuery(api.wallet.getSellerCustomers);
  const escrows = useQuery(api.wallet.getEscrowBySeller);

  const [search, setSearch] = useState("");

  const customers = (customersResult ?? []) as unknown as Customer[];
  const totalOrders = (escrows ?? []).length;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-sm text-white/40 mt-1">
            {customers.length} customers • {totalOrders} total orders
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
          />
        </div>

        {customers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No customers yet</p>
            <p className="text-[11px] text-white/15 mt-1">Customers will appear here when buyers purchase your products</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-nx-violet/10 flex items-center justify-center text-nx-violet text-sm font-bold">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{c.name}</span>
                      {c.verified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400">✓ Verified</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-white/30 mt-0.5">
                      <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> {c.orders} orders</span>
                      {c.location && <span>{c.location}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">KES {c.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
