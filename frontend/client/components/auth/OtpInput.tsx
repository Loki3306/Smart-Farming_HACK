import React, { useState, useRef, useEffect } from "react";
import { Loader, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

interface OtpInputProps {
  phoneNumber: string;
  onVerified: () => void;
  onCancel: () => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  phoneNumber,
  onVerified,
  onCancel,
}) => {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds countdown
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every((digit) => digit !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      // Call actual Twilio API
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          code: otpCode
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.verified) {
        setSuccess(true);
        setTimeout(() => {
          onVerified();
        }, 800);
      } else {
        setError(data.error || "Invalid OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Failed to verify OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setTimeLeft(60);
    setError(null);
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();

    try {
      // Call actual Twilio API to resend OTP
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to resend OTP. Please try again.");
        setCanResend(true);
      } else {
        console.log(`OTP resent to ${phoneNumber}`);
      }
    } catch (err) {
      console.error("OTP resend error:", err);
      setError("Failed to resend OTP. Please try again.");
      setCanResend(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          Verify Phone Number
        </h3>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to
          <br />
          <span className="font-medium text-foreground">{phoneNumber}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isVerifying || success}
            aria-label={`OTP digit ${index + 1}`}
            className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all
              ${
                success
                  ? "border-green-500 bg-green-50 text-green-700"
                  : error
                    ? "border-red-500 bg-red-50 text-red-700"
                    : digit
                      ? "border-primary bg-primary/5"
                      : "border-border bg-white"
              }
              focus:outline-none focus:ring-2 focus:ring-primary/50
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
        ))}
      </div>

      {/* Status Messages */}
      {isVerifying && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader className="w-4 h-4 animate-spin" />
          <span>Verifying...</span>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Phone verified successfully!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Timer and Resend */}
      <div className="text-center space-y-3">
        {!canResend ? (
          <p className="text-sm text-muted-foreground">
            Resend code in{" "}
            <span className="font-semibold text-foreground">{timeLeft}s</span>
          </p>
        ) : (
          <Button
            type="button"
            variant="link"
            onClick={handleResend}
            className="text-primary"
          >
            Resend OTP
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isVerifying}
          className="w-full"
        >
          Change Phone Number
        </Button>
      </div>
    </div>
  );
};
