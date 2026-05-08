import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { useClientMessages } from "@/hooks/useClientMessages";

const Auth = () => {
  const { user, signInWithPassword, requestEmailOtp, verifyEmailOtp } = useAuth();
  const { data: clientMessages } = useClientMessages();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"password" | "emailOtp">("password");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [passwordEmail, setPasswordEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState("");
  const authNotice =
    clientMessages?.authNotice ||
    "Сейчас доступны вход и подтверждение по email. Вход по SMS будет добавлен следующим этапом.";

  if (user) {
    return <Navigate to="/account" replace />;
  }

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) return;

    setLoading(true);
    try {
      const data = await requestEmailOtp(otpEmail.trim().toLowerCase());
      setRequestId(data.requestId);
      setOtpStep("verify");
      toast.success(`Код отправлен на ${otpEmail.trim().toLowerCase()}`);
    } catch {
      toast.error("Ошибка отправки кода");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      await verifyEmailOtp(otpEmail.trim().toLowerCase(), otp, requestId);
      toast.success("Вход выполнен!");
      navigate("/account");
    } catch {
      toast.error("Неверный код");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordEmail.trim() || !password.trim()) return;

    setLoading(true);
    try {
      await signInWithPassword(passwordEmail.trim().toLowerCase(), password);
      toast.success("Вход выполнен!");
      navigate("/account");
    } catch {
      toast.error("Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-secondary/30 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-xl p-6 sm:p-8 shadow-card">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode("password")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "password" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                <Mail className="w-4 h-4 inline mr-1" /> Email + пароль
              </button>
              <button
                onClick={() => {
                  setMode("emailOtp");
                  setOtpStep("request");
                  setOtp("");
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "emailOtp" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                <Mail className="w-4 h-4 inline mr-1" /> Email + код
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center mb-6">
              {authNotice}
            </p>

            {mode === "password" ? (
              <>
                <h1 className="font-heading font-bold text-xl text-center mb-2">Вход по Email</h1>
                <p className="text-sm text-muted-foreground text-center mb-6">Введите email и пароль</p>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={passwordEmail}
                    onChange={(e) => setPasswordEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full btn-gold" disabled={loading}>
                    {loading ? "Вход..." : "Войти"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </>
            ) : (
              <>
                <h1 className="font-heading font-bold text-xl text-center mb-2">
                  {otpStep === "request" ? "Вход по коду из Email" : "Введите код"}
                </h1>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {otpStep === "request"
                    ? "Введите email для получения одноразового кода"
                    : `Мы отправили код на ${otpEmail.trim().toLowerCase()}`}
                </p>

                {otpStep === "request" ? (
                  <form onSubmit={handleSendEmailOtp} className="space-y-4">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      required
                    />
                    <Button type="submit" className="w-full btn-gold" disabled={loading}>
                      {loading ? "Отправка..." : "Получить код"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <Button
                      onClick={handleVerifyEmailOtp}
                      className="w-full btn-gold"
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? "Проверка..." : "Войти"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep("request");
                        setOtp("");
                      }}
                      className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Изменить email
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
