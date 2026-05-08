import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CreditCard, Truck, CheckCircle2, Circle, ShoppingCart, Receipt } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { apiRequest, getErrorMessage } from "@/integrations/api/client";
import { useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_id?: string | null;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
}

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  delivery_price: number;
  delivery_method: string | null;
  payment_method: string | null;
  address: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  "Новый": "bg-blue-100 text-blue-700",
  "В обработке": "bg-yellow-100 text-yellow-700",
  "Отправлен": "bg-purple-100 text-purple-700",
  "Доставлен": "bg-green-100 text-green-700",
};

const paymentLabels: Record<string, string> = {
  card: "Банковская карта",
  sbp: "СБП",
  cash: "При получении",
};

const deliveryLabels: Record<string, string> = {
  courier: "Курьерская доставка",
  pickup: "Самовывоз",
};

const orderSteps = ["Новый", "В обработке", "Отправлен", "Доставлен"];

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCartWithQuantity } = useCart();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repeatingOrder, setRepeatingOrder] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) {
      setError("Не найден идентификатор заказа");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [orderRes, itemsRes] = await Promise.all([
        apiRequest<OrderData>(`/api/my/orders/${id}`),
        apiRequest<OrderItem[]>(`/api/my/orders/${id}/items`),
      ]);
      setOrder(orderRes || null);
      setItems(itemsRes || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Не удалось загрузить заказ"));
      setOrder(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU").format(price) + " ₽";

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const productsSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currentStep = Math.max(0, orderSteps.indexOf(order?.status || "Новый"));

  const handleRepeatOrder = async () => {
    if (items.length === 0) {
      toast.info("В заказе нет товаров для повторного добавления");
      return;
    }
    setRepeatingOrder(true);
    try {
      const products = await apiRequest<Product[]>("/api/products");
      const productsById = new Map(products.map((product) => [product.id, product]));
      let addedItemsCount = 0;
      let missedItemsCount = 0;

      for (const item of items) {
        if (!item.product_id) {
          missedItemsCount += 1;
          continue;
        }
        const product = productsById.get(item.product_id);
        if (!product) {
          missedItemsCount += 1;
          continue;
        }
        addToCartWithQuantity(product, item.quantity);
        addedItemsCount += 1;
      }

      if (addedItemsCount === 0) {
        toast.error("Не удалось добавить товары в корзину");
        return;
      }

      if (missedItemsCount > 0) {
        toast.warning(`Добавлено позиций: ${addedItemsCount}. Недоступно: ${missedItemsCount}`, {
          action: {
            label: "В корзину",
            onClick: () => navigate("/cart"),
          },
        });
      } else {
        toast.success(`Товары добавлены в корзину: ${addedItemsCount}`, {
          action: {
            label: "В корзину",
            onClick: () => navigate("/cart"),
          },
        });
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Не удалось повторить заказ"));
    } finally {
      setRepeatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">{error || "Заказ не найден"}</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={fetchOrder}>Повторить</Button>
              <Button asChild>
                <Link to="/account">К моим заказам</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30">
        <div className="container-custom py-6 sm:py-8">
          <Link
            to="/account"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Мои заказы
          </Link>

          <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card border border-border/70 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h1 className="font-heading font-bold text-2xl">{order.order_number}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/cart")}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  В корзину
                </Button>
                <Button variant="outline" onClick={handleRepeatOrder} disabled={repeatingOrder}>
                  {repeatingOrder ? "Добавляю..." : "Повторить заказ"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{formatDate(order.created_at)}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              {orderSteps.map((step, index) => {
                const completed = index <= currentStep;
                return (
                  <div key={step} className={`rounded-lg border px-3 py-2 text-xs ${completed ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                    <div className="flex items-center gap-2">
                      {completed ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={completed ? "text-foreground" : "text-muted-foreground"}>{step}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items */}
          <div className="bg-card rounded-xl p-5 shadow-card mb-4 border border-border/70">
            <h2 className="font-heading font-semibold mb-4">Состав заказа</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    <img
                      src={item.product_image || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.product_id ? (
                      <Link to={`/product/${item.product_id}`} className="text-sm font-medium line-clamp-1 hover:text-primary transition-colors">
                        {item.product_name}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{item.quantity} шт. × {formatPrice(item.price)}</p>
                  </div>
                  <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="grid sm:grid-cols-2 gap-4">
            {order.delivery_method && (
              <div className="bg-card rounded-xl p-5 shadow-card border border-border/70">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Доставка</h3>
                </div>
                <Badge variant="secondary" className="mb-2 w-fit">
                  {deliveryLabels[order.delivery_method] || order.delivery_method}
                </Badge>
                <p className="text-sm">{deliveryLabels[order.delivery_method] || order.delivery_method}</p>
                {order.address && (
                  <div className="flex items-start gap-1 mt-2">
                    <MapPin className="w-3 h-3 text-muted-foreground mt-0.5" />
                    <p className="text-xs text-muted-foreground">{order.address}</p>
                  </div>
                )}
                <p className="text-sm mt-2">
                  {order.delivery_price === 0 ? (
                    <span className="text-trust">Бесплатно</span>
                  ) : (
                    formatPrice(order.delivery_price)
                  )}
                </p>
              </div>
            )}

            {order.payment_method && (
              <div className="bg-card rounded-xl p-5 shadow-card border border-border/70">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Оплата</h3>
                </div>
                <Badge variant="secondary" className="mb-2 w-fit">
                  {paymentLabels[order.payment_method] || order.payment_method}
                </Badge>
                <p className="text-sm text-muted-foreground">Способ оплаты сохранён для этого заказа</p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl p-5 shadow-card mt-4 border border-border/70">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-semibold">Сумма заказа</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Товары</span>
                <span>{formatPrice(productsSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Доставка</span>
                <span>{order.delivery_price === 0 ? "Бесплатно" : formatPrice(order.delivery_price)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-baseline">
                <span className="font-heading font-semibold">Итого</span>
                <span className="font-heading font-bold text-2xl text-primary">{formatPrice(order.total_price)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetail;
