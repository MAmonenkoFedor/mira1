import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiRequest, getErrorMessage } from "@/integrations/api/client";
import { toast } from "sonner";

type IntegrationSettings = {
  sms: {
    provider: "none" | "smsc";
    smscLogin: string;
    smscPassword: string;
    sender: string;
  };
  delivery: {
    provider: "none" | "cdek" | "yandex" | "ozon";
    cdekClientId: string;
    cdekClientSecret: string;
    yandexApiKey: string;
    ozonClientId: string;
    ozonApiKey: string;
  };
  payment: {
    provider: "none" | "manual" | "ozon";
    ozonPaymentKey: string;
  };
  mail: {
    provider: "none" | "smtp";
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    fromEmail: string;
    smtpPassword: string;
    notifyToEmail: string;
    postalCode: string;
  };
};

const emptyState: IntegrationSettings = {
  sms: { provider: "none", smscLogin: "", smscPassword: "", sender: "" },
  delivery: {
    provider: "none",
    cdekClientId: "",
    cdekClientSecret: "",
    yandexApiKey: "",
    ozonClientId: "",
    ozonApiKey: "",
  },
  payment: { provider: "manual", ozonPaymentKey: "" },
  mail: {
    provider: "none",
    smtpHost: "",
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: "",
    fromEmail: "",
    smtpPassword: "",
    notifyToEmail: "",
    postalCode: "",
  },
};

const IntegrationsAdmin = () => {
  const [value, setValue] = useState<IntegrationSettings>(emptyState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<IntegrationSettings>("/api/admin/integrations");
      setValue(data ?? emptyState);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Не удалось загрузить интеграции"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiRequest("/api/admin/integrations", {
        method: "PUT",
        body: JSON.stringify(value),
      });
      toast.success("Ключи сохранены");
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Не удалось сохранить ключи"));
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    setSaving(true);
    try {
      await apiRequest("/api/admin/integrations/test-email", {
        method: "POST",
        body: JSON.stringify({ to: testEmailTo.trim() || undefined }),
      });
      toast.success("Тестовое письмо отправлено");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Не удалось отправить тестовое письмо"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl">Интеграции</h1>
            <p className="text-sm text-muted-foreground">
              Тестовые и боевые ключи для SMS, доставки, оплаты и почты.
            </p>
          </div>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? "Сохраняю..." : "Сохранить"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SMS (SMSC)</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Провайдер SMS</Label>
              <select
                value={value.sms.provider}
                onChange={(e) =>
                  setValue((prev) => ({ ...prev, sms: { ...prev.sms, provider: e.target.value as "none" | "smsc" } }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                disabled={loading}
              >
                <option value="none">Отключено</option>
                <option value="smsc">SMSC</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Sender</Label>
              <Input
                value={value.sms.sender}
                onChange={(e) => setValue((prev) => ({ ...prev, sms: { ...prev.sms, sender: e.target.value } }))}
                placeholder="MiraVkus"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Логин SMSC</Label>
              <Input
                value={value.sms.smscLogin}
                onChange={(e) => setValue((prev) => ({ ...prev, sms: { ...prev.sms, smscLogin: e.target.value } }))}
                placeholder="login"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Пароль SMSC</Label>
              <Input
                type="password"
                value={value.sms.smscPassword}
                onChange={(e) => setValue((prev) => ({ ...prev, sms: { ...prev.sms, smscPassword: e.target.value } }))}
                placeholder="password"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Доставка</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Провайдер доставки</Label>
              <select
                value={value.delivery.provider}
                onChange={(e) =>
                  setValue((prev) => ({
                    ...prev,
                    delivery: { ...prev.delivery, provider: e.target.value as "none" | "cdek" | "yandex" | "ozon" },
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                disabled={loading}
              >
                <option value="none">Отключено</option>
                <option value="cdek">CDEK</option>
                <option value="yandex">Yandex Delivery</option>
                <option value="ozon">Ozon</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>CDEK Client ID</Label>
              <Input
                value={value.delivery.cdekClientId}
                onChange={(e) => setValue((prev) => ({ ...prev, delivery: { ...prev.delivery, cdekClientId: e.target.value } }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>CDEK Secret</Label>
              <Input
                type="password"
                value={value.delivery.cdekClientSecret}
                onChange={(e) =>
                  setValue((prev) => ({ ...prev, delivery: { ...prev.delivery, cdekClientSecret: e.target.value } }))
                }
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Yandex API Key</Label>
              <Input
                type="password"
                value={value.delivery.yandexApiKey}
                onChange={(e) => setValue((prev) => ({ ...prev, delivery: { ...prev.delivery, yandexApiKey: e.target.value } }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Ozon Client ID</Label>
              <Input
                value={value.delivery.ozonClientId}
                onChange={(e) => setValue((prev) => ({ ...prev, delivery: { ...prev.delivery, ozonClientId: e.target.value } }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Ozon API Key</Label>
              <Input
                type="password"
                value={value.delivery.ozonApiKey}
                onChange={(e) => setValue((prev) => ({ ...prev, delivery: { ...prev.delivery, ozonApiKey: e.target.value } }))}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Оплата</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Провайдер оплаты</Label>
              <select
                value={value.payment.provider}
                onChange={(e) =>
                  setValue((prev) => ({
                    ...prev,
                    payment: { ...prev.payment, provider: e.target.value as "none" | "manual" | "ozon" },
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                disabled={loading}
              >
                <option value="manual">Ручная/заглушка</option>
                <option value="none">Отключено</option>
                <option value="ozon">Ozon</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Ozon Payment Key</Label>
              <Input
                type="password"
                value={value.payment.ozonPaymentKey}
                onChange={(e) =>
                  setValue((prev) => ({ ...prev, payment: { ...prev.payment, ozonPaymentKey: e.target.value } }))
                }
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Почта</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Провайдер почты</Label>
              <select
                value={value.mail.provider}
                onChange={(e) =>
                  setValue((prev) => ({ ...prev, mail: { ...prev.mail, provider: e.target.value as "none" | "smtp" } }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                disabled={loading}
              >
                <option value="none">Отключено</option>
                <option value="smtp">SMTP</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Куда слать уведомления о заказах</Label>
              <Input
                value={value.mail.notifyToEmail}
                onChange={(e) =>
                  setValue((prev) => ({ ...prev, mail: { ...prev.mail, notifyToEmail: e.target.value } }))
                }
                placeholder="orders@domain.ru"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                value={value.mail.smtpHost}
                onChange={(e) => setValue((prev) => ({ ...prev, mail: { ...prev.mail, smtpHost: e.target.value } }))}
                placeholder="smtp.yandex.ru"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input
                inputMode="numeric"
                value={String(value.mail.smtpPort || "")}
                onChange={(e) => {
                  const nextPort = Number.parseInt(e.target.value, 10);
                  setValue((prev) => ({
                    ...prev,
                    mail: { ...prev.mail, smtpPort: Number.isFinite(nextPort) ? nextPort : 465 },
                  }));
                }}
                placeholder="465"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Secure</Label>
              <select
                value={value.mail.smtpSecure ? "true" : "false"}
                onChange={(e) =>
                  setValue((prev) => ({
                    ...prev,
                    mail: { ...prev.mail, smtpSecure: e.target.value === "true" },
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                disabled={loading}
              >
                <option value="true">Да (SSL/TLS)</option>
                <option value="false">Нет</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>SMTP User</Label>
              <Input
                value={value.mail.smtpUser}
                onChange={(e) => setValue((prev) => ({ ...prev, mail: { ...prev.mail, smtpUser: e.target.value } }))}
                placeholder="miravcus@ya.ru"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Почта отправителя</Label>
              <Input
                value={value.mail.fromEmail}
                onChange={(e) => setValue((prev) => ({ ...prev, mail: { ...prev.mail, fromEmail: e.target.value } }))}
                placeholder="miravcus@ya.ru"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Пароль SMTP</Label>
              <Input
                type="password"
                value={value.mail.smtpPassword}
                onChange={(e) => setValue((prev) => ({ ...prev, mail: { ...prev.mail, smtpPassword: e.target.value } }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Тестовое письмо (кому)</Label>
              <div className="flex gap-2">
                <Input
                  value={testEmailTo}
                  onChange={(e) => setTestEmailTo(e.target.value)}
                  placeholder="email@example.com"
                  disabled={loading}
                />
                <Button type="button" variant="outline" onClick={sendTestEmail} disabled={saving || loading}>
                  Отправить
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Почтовый индекс</Label>
              <Input
                value={value.mail.postalCode}
                onChange={(e) => setValue((prev) => ({ ...prev, mail: { ...prev.mail, postalCode: e.target.value } }))}
                placeholder="141281"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default IntegrationsAdmin;
