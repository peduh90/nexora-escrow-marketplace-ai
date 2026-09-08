import { useNavigate } from "react-router";
import { Scale, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-nx-bg">
      <div className="sticky top-0 z-30 h-14 bg-nx-card/80 backdrop-blur-xl border-b border-nx-border flex items-center px-4 md:px-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors mr-3">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-white">Terms of Service</h2>
      </div>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <Scale className="w-8 h-8 text-nx-violet" />
          <div>
            <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
            <p className="text-xs text-white/30">Last updated: September 2, 2026</p>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            By accessing or using Nexora Market ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. Nexora Market is operated by Nexora Market Ltd, a company registered in Kenya.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">2. Platform Description</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Nexora Market is an AI-powered escrow marketplace that connects buyers and sellers in Kenya and East Africa. The platform provides escrow protection, AI-powered fraud detection, platform-managed delivery, and dispute resolution services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">3. User Accounts</h2>
          <ul className="space-y-2 text-sm text-white/50 leading-relaxed ml-4">
            <li>• You must be at least 18 years old to create an account</li>
            <li>• Sellers must complete KYC (Know Your Customer) verification before listing products</li>
            <li>• You are responsible for maintaining the security of your account</li>
            <li>• One person may maintain only one account per role (buyer/seller)</li>
            <li>• You must provide accurate and current information during registration</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">4. Escrow Protection</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            All marketplace transactions are protected by Nexora's escrow system. When a buyer places an order, payment is held securely in escrow until the buyer confirms receipt and satisfaction with the product. Escrow funds are released to the seller automatically upon buyer confirmation. In case of disputes, Nexora's AI-assisted resolution system and admin team will investigate and determine fair outcomes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">5. Fees & Commissions</h2>
          <ul className="space-y-2 text-sm text-white/50 leading-relaxed ml-4">
            <li>• Free forever: registration, account creation, product listings, job posting, applications, portfolio creation, messaging, and browsing</li>
            <li>• Normal Marketplace — seller commission: 3% on KSh 1–4,999 · 2.5% on KSh 5,000–49,999 · 2% on KSh 50,000–199,999 · 1.5% on KSh 200,000 and above</li>
            <li>• Normal Marketplace — buyer protection fee: 1% on KSh 1–10,000 · 0.75% on KSh 10,001–50,000 · 0.5% on KSh 50,001–200,000 · 0.25% above KSh 200,000</li>
            <li>• Freelance Marketplace — freelancer commission: 3% on KSh 1–5,000 · 2% on KSh 5,001–50,000 · 1.5% on KSh 50,001–250,000 · 1% above KSh 250,000</li>
            <li>• Freelance Marketplace — employer protection fee: 1% on KSh 1–10,000 · 0.75% on KSh 10,001–50,000 · 0.5% on KSh 50,001–200,000 · 0.25% above KSh 200,000</li>
            <li>• Freelancers pay no deposit, registration fee, application fee, or mandatory subscription</li>
            <li>• Withdrawals have no default Nexora percentage fee — only an actual configured external provider cost or fixed service fee may apply, shown before confirmation</li>
            <li>• Escrow is included within the applicable transaction fees — no separate escrow charge</li>
            <li>• All fees are displayed transparently before any payment</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">6. Delivery</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Nexora Market manages all delivery logistics. Sellers are responsible for preparing products and making them available for Nexora's collection. Sellers do not control delivery fees, routes, or providers. Buyers select their delivery location during checkout, and the platform automatically calculates delivery fees.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">7. Prohibited Activities</h2>
          <ul className="space-y-2 text-sm text-white/50 leading-relaxed ml-4">
            <li>• Listing counterfeit, illegal, or prohibited items</li>
            <li>• Engaging in fraud, scams, or deceptive practices</li>
            <li>• Circumventing the escrow system or conducting off-platform transactions</li>
            <li>• Harassing, threatening, or abusing other users</li>
            <li>• Manipulating reviews, ratings, or search rankings</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">8. Dispute Resolution</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Nexora Market provides AI-assisted dispute resolution. Either party may open a dispute within 7 days of a transaction event. Our system reviews evidence, communication history, and transaction data to recommend fair outcomes. Admin reviewers make final decisions on disputed transactions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">9. Limitation of Liability</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Nexora Market Ltd acts as an intermediary platform. We are not a party to transactions between buyers and sellers. Our liability is limited to the platform fees paid for the specific transaction in question. We do not guarantee the quality, safety, or legality of items listed.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">10. Contact</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            For questions about these Terms, contact legal@nexoramarket.co.ke or visit our Help Center at nexoramarket.co.ke/help.
          </p>
        </section>
      </div>
    </div>
  );
}
