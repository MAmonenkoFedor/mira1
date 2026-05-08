import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, getErrorMessage } from "@/integrations/api/client";
import { toast } from "sonner";

type ClientMessages = {
  authNotice: string;
  checkoutNotice: string;
};

const ClientMessagesAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState<ClientMessages>({
    authNotice: "",
    checkoutNotice: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ClientMessages>("/api/admin/client-messages");
      setValue({
        authNotice: data?.authNotice ?? "",
        checkoutNotice: data?.checkoutNotice ?? "",
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Не удалось загрузить сообщения"));
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
      await apiRequest("/api/admin/client-messages", {
        method: "PUT",
        body: JSON.stringify(value),
      });
      toast.success("Сохранено");
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Не удалось сохранить"));
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    setSaving(true);
    try {
      await apiRequest("/api/admin/client-messages", {
        method: "PUT",
        body: JSON.stringify({ authNotice: "", checkoutNotice: "" }),
      });
      toast.success("Сброшено на значения по умолчанию");
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Не удалось сбросить"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl">Сообщения для клиентов</h1>
            <p className="text-sm text-muted-foreground">
              Тексты на страницах входа и оформления заказа (например, про email сейчас и SMS позже).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetToDefaults} disabled={saving || loading}>
              Сбросить
            </Button>
            <Button onClick={save} disabled={saving || loading}>
              {saving ? "Сохраняю..." : "Сохранить"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Страница входа</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={value.authNotice}
              onChange={(e) => setValue((prev) => ({ ...prev, authNotice: e.target.value }))}
              placeholder="Текст подсказки на странице входа"
              disabled={loading}
              className="w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Оформление заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={value.checkoutNotice}
              onChange={(e) => setValue((prev) => ({ ...prev, checkoutNotice: e.target.value }))}
              placeholder="Текст подсказки на странице оформления заказа"
              disabled={loading}
              className="w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ClientMessagesAdmin;
