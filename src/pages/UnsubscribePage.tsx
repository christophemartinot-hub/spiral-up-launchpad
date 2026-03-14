import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "success" | "error" | "missing";

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<Status>(email ? "loading" : "missing");

  useEffect(() => {
    if (!email) return;

    const run = async () => {
      try {
        const { error } = await supabase.functions.invoke("unsubscribe-proxy", {
          body: { email },
        });
        setStatus(error ? "error" : "success");
      } catch {
        setStatus("error");
      }
    };
    run();
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f3f0", fontFamily: "'Titillium Web', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="w-full max-w-md mx-4">
        {/* Header */}
        <div className="rounded-t-2xl px-8 py-7" style={{ background: "#6BA8A0" }}>
          <h1 className="text-2xl font-bold text-white m-0">
            SPIRAL <span style={{ color: "#FFD93D" }}>UP</span>
          </h1>
        </div>

        {/* Body */}
        <div className="bg-white px-8 py-10 rounded-b-2xl shadow-sm" style={{ borderTop: "none" }}>
          {status === "loading" && (
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 rounded-full mx-auto mb-4" style={{ borderColor: "#6BA8A0", borderTopColor: "transparent" }} />
              <p className="text-lg font-semibold" style={{ color: "#2d2d2d" }}>Processing your request…</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-bold mb-3" style={{ color: "#2d2d2d" }}>You've been unsubscribed</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#666666" }}>
                <strong>{email}</strong> has been removed from our mailing list. You won't receive any more emails from us.
              </p>
              <p className="text-sm" style={{ color: "#999999" }}>
                Changed your mind?{" "}
                <a href="mailto:connect@spiralingup.works?subject=Re-subscribe" className="underline" style={{ color: "#6BA8A0" }}>
                  Email us
                </a>{" "}
                to re-subscribe.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold mb-3" style={{ color: "#2d2d2d" }}>Something went wrong</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#666666" }}>
                We couldn't process your unsubscribe request. Please try again or contact us directly.
              </p>
              <a
                href="mailto:connect@spiralingup.works?subject=Unsubscribe request"
                className="inline-block px-6 py-3 rounded-lg text-white font-semibold text-sm no-underline"
                style={{ background: "#D4836B" }}
              >
                Contact Us
              </a>
            </div>
          )}

          {status === "missing" && (
            <div className="text-center">
              <div className="text-4xl mb-4">📭</div>
              <h2 className="text-xl font-bold mb-3" style={{ color: "#2d2d2d" }}>Invalid unsubscribe link</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#666666" }}>
                This link appears to be incomplete. Please use the unsubscribe link from your email, or contact us at{" "}
                <a href="mailto:connect@spiralingup.works" className="underline" style={{ color: "#6BA8A0" }}>
                  connect@spiralingup.works
                </a>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs" style={{ color: "#999999" }}>
          © {new Date().getFullYear()} SPIRAL UP™. All rights reserved.
        </p>
      </div>
    </div>
  );
}
