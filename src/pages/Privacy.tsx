import { useNavigate } from "react-router";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-nx-bg">
      <div className="sticky top-0 z-30 h-14 bg-nx-card/80 backdrop-blur-xl border-b border-nx-border flex items-center px-4 md:px-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors mr-3">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-white">Privacy Policy</h2>
      </div>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-nx-violet" />
          <div>
            <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
            <p className="text-xs text-white/30">Last updated: September 2, 2026</p>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            When you use Nexora Market, we collect information you provide directly, information from your use of our services, and information from third parties. This includes:
          </p>
          <ul className="space-y-2 text-sm text-white/50 leading-relaxed ml-4">
            <li>• <strong className="text-white/70">Account Information:</strong> Name, email address, phone number, profile photo, and business details when you register as a seller.</li>
            <li>• <strong className="text-white/70">KYC Documents:</strong> Government-issued ID, business registration documents, and proof of address for seller verification.</li>
            <li>• <strong className="text-white/70">Transaction Data:</strong> Purchase history, payment information (processed securely via M-Pesa/Stripe), escrow records, and delivery addresses.</li>
            <li>• <strong className="text-white/70">Communication Data:</strong> Messages between buyers and sellers, customer support interactions, and dispute communications.</li>
            <li>• <strong className="text-white/70">Device Information:</strong> Browser type, IP address, device type, operating system, and usage patterns.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">2. How We Use Your Information</h2>
          <ul className="space-y-2 text-sm text-white/50 leading-relaxed ml-4">
            <li>• To provide, maintain, and improve our marketplace services</li>
            <li>• To process transactions and manage escrow protection</li>
            <li>• To verify seller identities through KYC procedures</li>
            <li>• To detect and prevent fraud, scams, and unauthorized access</li>
            <li>• To power our AI-powered risk detection and dispute resolution systems</li>
            <li>• To communicate with you about orders, security updates, and platform changes</li>
            <li>• To comply with legal obligations and resolve disputes</li>
            <li>• To personalize your marketplace experience and recommendations</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">3. Data Security</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            We implement industry-standard security measures to protect your data, including 256-bit SSL encryption, secure server infrastructure, regular security audits, and strict access controls. Payment information is never stored on our servers and is processed exclusively through certified payment processors (M-Pesa Daraja API, Stripe).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">4. Data Sharing</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            We do not sell your personal information. We share data only in the following circumstances:
          </p>
          <ul className="space-y-2 text-sm text-white/50 leading-relaxed ml-4">
            <li>• With other parties involved in a transaction (buyer/seller contact details for delivery)</li>
            <li>• With payment processors to complete transactions</li>
            <li>• With delivery partners to fulfill orders</li>
            <li>• When required by law or to protect our legal rights</li>
            <li>• With your explicit consent</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">5. Your Rights</h2>
          <ul className="space-y-2 text-sm text-white/50 leading-relaxed ml-4">
            <li>• Access and download your personal data</li>
            <li>• Correct inaccurate data</li>
            <li>• Request deletion of your account and data</li>
            <li>• Opt out of non-essential communications</li>
            <li>• File a complaint with a data protection authority</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">6. Contact Us</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            For privacy-related inquiries, contact our Data Protection Officer at privacy@nexoramarket.co.ke or write to: Nexora Market Ltd, P.O. Box 12345, Nairobi, Kenya.
          </p>
        </section>
      </div>
    </div>
  );
}
