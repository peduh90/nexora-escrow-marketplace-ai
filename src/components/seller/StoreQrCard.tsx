import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { generateQr, downloadQr, qrTargetUrl } from "@/lib/qr";
import {
  QrCode, Copy, Download, Eye, Check, Loader2, Store, Shield, ExternalLink, X,
} from "lucide-react";

/**
 * ─── SELLER STORE QR CARD ─────────────────────────────────────────────────
 *
 * Every verified seller gets a personal QR code that opens their PERMANENT
 * public store profile (/seller/:userId). The destination is the account id —
 * never a product or listing — so adding, removing or changing products never
 * invalidates a printed code.
 *
 * The QR encodes only the public URL: no phone, email, wallet or KYC data is
 * embedded. The public profile page it opens shows only legitimate public
 * information (store name, verified badge, location, products, ratings).
 *
 * Actions: view (large preview + open store), copy the store link, and
 * download the PNG for printing (duka posters, WhatsApp status, flyers).
 */
export default function StoreQrCard() {
  const { user } = useAuth();
  const sellerId = (user as any)?._id as string | undefined;

  const [qrData, setQrData] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const storeUrl = sellerId
    ? qrTargetUrl({ kind: "storefront", sellerId })
    : "";

  // Generate lazily — first open (or first dashboard render post-mount) so
  // sellers who never look at the card cost nothing.
  useEffect(() => {
    if (!sellerId || qrData || generating) return;
    let cancelled = false;
    setGenerating(true);
    generateQr({ kind: "storefront", sellerId }, { size: 512 })
      .then((url) => { if (!cancelled) setQrData(url); })
      .catch(() => { /* retry on next open */ })
      .finally(() => { if (!cancelled) setGenerating(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  if (!sellerId) return null;

  const copyLink = async () => {
    try {
      if (navigator.share && /android|iphone|ipad/i.test(navigator.userAgent)) {
        // On phones the native share sheet is friendlier than a clipboard toast.
        await navigator.share({ title: "My Nexora store", url: storeUrl });
        return;
      }
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share cancelled / clipboard unavailable — copy as fallback.
      try {
        await navigator.clipboard.writeText(storeUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* private mode */ }
    }
  };

  return (
    <div className="p-4 md:p-5 rounded-xl border border-nx-violet/15 bg-gradient-to-br from-nx-violet/[0.06] via-transparent to-nx-cyan/[0.04]">
      <div className="flex items-start gap-4">
        {/* QR thumbnail / preview trigger */}
        <button
          onClick={() => setShowQr(true)}
          className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white p-1.5 shrink-0 hover:scale-[1.03] active:scale-[0.98] transition-transform shadow-lg"
          aria-label="View store QR code"
        >
          {qrData ? (
            <img src={qrData} alt="Your Nexora store QR code" className="w-full h-full" />
          ) : (
            <div className="w-full h-full rounded-lg bg-white/[0.04] flex items-center justify-center">
              {generating ? (
                <Loader2 className="w-5 h-5 text-nx-violet animate-spin" />
              ) : (
                <QrCode className="w-5 h-5 text-white/20" />
              )}
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Store className="w-4 h-4 text-nx-violet" /> Your Store QR code
            </h2>
            {(user as any)?.kycStatus === "verified" && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                <Shield className="w-2.5 h-2.5" /> Verified
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-white/40 mt-1 leading-snug">
            Customers scan this with any phone camera to open your store directly — no app needed.
            It always shows your latest products, so you never need a new QR code.
          </p>

          {/* Store link */}
          <div className="mt-2.5 flex items-center gap-2 min-w-0">
            <code className="text-[11px] text-white/50 truncate bg-white/[0.04] border border-white/5 rounded-lg px-2.5 py-1.5 flex-1 min-w-0">
              {storeUrl.replace(/^https?:\/\//, "")}
            </code>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={() => setShowQr(true)}
              className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/70 text-[12px] font-medium hover:bg-white/[0.08] transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> View
            </button>
            <button
              onClick={copyLink}
              className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/70 text-[12px] font-medium hover:bg-white/[0.08] transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy link</>
              )}
            </button>
            <button
              onClick={() =>
                downloadQr(
                  { kind: "storefront", sellerId },
                  `nexora-store-${String(sellerId).slice(-6)}.png`,
                  { size: 1024 },
                )
              }
              className="px-3 py-2 rounded-lg bg-nx-violet text-white text-[12px] font-semibold hover:bg-nx-violet/85 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download QR
            </button>
          </div>
        </div>
      </div>

      {/* Full preview modal */}
      {showQr && (
        <div
          className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowQr(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Your store QR code"
        >
          <div
            className="bg-nx-card border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Your store QR code</h3>
              <button onClick={() => setShowQr(false)} className="p-1 text-white/40 hover:text-white" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            {qrData ? (
              <>
                <img src={qrData} alt="Your Nexora store QR code" className="w-56 h-56 mx-auto rounded-xl bg-white p-2" />
                <p className="text-[11px] text-white/40 mt-3">
                  Opens <b className="text-white/70">{(user as any)?.businessName || (user as any)?.name || "your store"}</b> on Nexora —
                  works with any phone camera, app not required.
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={copyLink}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/70 text-[12.5px] font-semibold hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <button
                    onClick={() =>
                      downloadQr(
                        { kind: "storefront", sellerId },
                        `nexora-store-${String(sellerId).slice(-6)}.png`,
                        { size: 1024 },
                      )
                    }
                    className="flex-1 py-2.5 rounded-xl bg-nx-violet/10 border border-nx-violet/25 text-nx-violet text-[12.5px] font-semibold hover:bg-nx-violet/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
                <a
                  href={`/seller/${sellerId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-nx-cyan transition-colors"
                >
                  Preview your public store <ExternalLink className="w-3 h-3" />
                </a>
              </>
            ) : (
              <div className="w-56 h-56 mx-auto rounded-xl bg-white/[0.03] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-nx-violet animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
