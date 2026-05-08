import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  LogOut,
  ChevronRight,
  Clock,
  User,
  MapPin,
  Trash2,
  Search,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/types/product";
import { apiRequest, getErrorMessage } from "@/integrations/api/client";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  created_at: string;
}

interface ProfileData {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
}

interface UserAddress {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  city: string;
  street: string;
  building: string;
  apartment?: string | null;
  entrance?: string | null;
  floor?: string | null;
  comment?: string | null;
  is_default: boolean;
}

interface OrderItem {
  id: string;
  product_id?: string | null;
  quantity: number;
}

type RecommendationProduct = Product & {
  recommendation_source?: "co_purchase" | "category_affinity" | "popular";
  recommendation_strength?: number;
  recommendation_score?: number;
};

const emptyAddressForm = {
  label: "",
  recipient_name: "",
  phone: "",
  city: "",
  street: "",
  building: "",
  apartment: "",
  entrance: "",
  floor: "",
  comment: "",
  is_default: false,
};

const statusColors: Record<string, string> = {
  "Новый": "bg-blue-100 text-blue-700",
  "В обработке": "bg-yellow-100 text-yellow-700",
  "Отправлен": "bg-purple-100 text-purple-700",
  "Доставлен": "bg-green-100 text-green-700",
};

const statusStep: Record<string, number> = {
  "Новый": 0,
  "В обработке": 1,
  "Отправлен": 2,
  "Доставлен": 3,
};

const Account = () => {
  const { user, signOut } = useAuth();
  const { addToCartWithQuantity } = useCart();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [repeatingOrderId, setRepeatingOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [recommendations, setRecommendations] = useState<RecommendationProduct[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  const fetchAccountData = async () => {
    setLoading(true);
    setOrdersError(null);
    setProfileError(null);
    setAddressesError(null);
    const [ordersRes, profileRes, addressesRes] = await Promise.allSettled([
      apiRequest<Order[]>("/api/my/orders"),
      apiRequest<ProfileData>("/api/my/profile"),
      apiRequest<UserAddress[]>("/api/my/addresses"),
    ]);
    if (ordersRes.status === "fulfilled") {
      setOrders(ordersRes.value || []);
    } else {
      setOrdersError(getErrorMessage(ordersRes.reason, "Не удалось загрузить заказы"));
    }
    if (profileRes.status === "fulfilled") {
      setProfile(profileRes.value || null);
      setProfileName(profileRes.value?.name || "");
    } else {
      setProfileError(getErrorMessage(profileRes.reason, "Не удалось загрузить профиль"));
    }
    if (addressesRes.status === "fulfilled") {
      setAddresses(addressesRes.value || []);
    } else {
      setAddressesError(getErrorMessage(addressesRes.reason, "Не удалось загрузить адреса"));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchRecommendations = async () => {
    setRecommendationsLoading(true);
    setRecommendationsError(null);
    try {
      const products = await apiRequest<RecommendationProduct[]>("/api/my/recommendations?limit=8");
      setRecommendations(products || []);
    } catch (err: unknown) {
      setRecommendationsError(getErrorMessage(err, "Не удалось загрузить рекомендации"));
    } finally {
      setRecommendationsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU").format(price) + " ₽";

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const next = await apiRequest<ProfileData>("/api/my/profile", {
        method: "PUT",
        body: JSON.stringify({ name: profileName }),
      });
      setProfile(next);
      setProfileName(next?.name || "");
      setProfileError(null);
    } catch (err: unknown) {
      setProfileError(getErrorMessage(err, "Не удалось сохранить профиль"));
    } finally {
      setSavingProfile(false);
    }
  };

  const saveAddress = async () => {
    setSavingAddress(true);
    try {
      await apiRequest<UserAddress>("/api/my/addresses", {
        method: "POST",
        body: JSON.stringify({
          ...addressForm,
          apartment: addressForm.apartment || null,
          entrance: addressForm.entrance || null,
          floor: addressForm.floor || null,
          comment: addressForm.comment || null,
        }),
      });
      setAddressForm(emptyAddressForm);
      const next = await apiRequest<UserAddress[]>("/api/my/addresses");
      setAddresses(next || []);
      setAddressesError(null);
    } catch (err: unknown) {
      setAddressesError(getErrorMessage(err, "Не удалось сохранить адрес"));
    } finally {
      setSavingAddress(false);
    }
  };

  const makeDefaultAddress = async (address: UserAddress) => {
    setSettingDefaultId(address.id);
    try {
      await apiRequest<UserAddress>(`/api/my/addresses/${address.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...address, is_default: true }),
      });
      const next = await apiRequest<UserAddress[]>("/api/my/addresses");
      setAddresses(next || []);
      setAddressesError(null);
    } catch (err: unknown) {
      setAddressesError(getErrorMessage(err, "Не удалось обновить адрес"));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const deleteAddress = async (addressId: string) => {
    setDeletingAddressId(addressId);
    try {
      await apiRequest(`/api/my/addresses/${addressId}`, { method: "DELETE" });
      const next = await apiRequest<UserAddress[]>("/api/my/addresses");
      setAddresses(next || []);
      setAddressesError(null);
    } catch (err: unknown) {
      setAddressesError(getErrorMessage(err, "Не удалось удалить адрес"));
    } finally {
      setDeletingAddressId(null);
    }
  };

  const repeatOrderFromList = async (orderId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setRepeatingOrderId(orderId);
    try {
      const [items, products] = await Promise.all([
        apiRequest<OrderItem[]>(`/api/my/orders/${orderId}/items`),
        apiRequest<Product[]>("/api/products"),
      ]);
      const productsById = new Map((products || []).map((product) => [product.id, product]));
      let addedItemsCount = 0;
      let missedItemsCount = 0;
      for (const item of items || []) {
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
          action: { label: "В корзину", onClick: () => navigate("/cart") },
        });
      } else {
        toast.success(`Товары добавлены в корзину: ${addedItemsCount}`, {
          action: { label: "В корзину", onClick: () => navigate("/cart") },
        });
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Не удалось повторить заказ"));
    } finally {
      setRepeatingOrderId(null);
    }
  };

  const availableStatuses = useMemo(
    () => [...new Set(orders.map((order) => order.status).filter(Boolean))],
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return order.order_number.toLowerCase().includes(query);
    });
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + order.total_price, 0);
    const delivered = orders.filter((order) => order.status === "Доставлен").length;
    const inTransit = orders.filter((order) => order.status === "Отправлен").length;
    return {
      totalOrders: orders.length,
      totalSpent,
      delivered,
      inTransit,
    };
  }, [orders]);

  const formatOrderProgress = (status: string) => {
    const step = statusStep[status] ?? 0;
    return `${((step + 1) / 4) * 100}%`;
  };

  const recommendationMeta = (source?: RecommendationProduct["recommendation_source"]) => {
    if (source === "co_purchase") {
      return { label: "Часто покупают вместе", className: "bg-primary/10 text-primary border-primary/30" };
    }
    if (source === "category_affinity") {
      return { label: "Похоже на ваши покупки", className: "bg-purple-100 text-purple-700 border-purple-200" };
    }
    return { label: "Популярный выбор", className: "bg-muted text-muted-foreground border-border" };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30">
        <div className="container-custom py-6 sm:py-8">
          <div className="rounded-2xl bg-card p-5 sm:p-6 shadow-card mb-5 border border-border/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-heading font-bold text-2xl sm:text-3xl">Кабинет покупателя</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile?.name || "Покупатель"}, добро пожаловать. Здесь заказы, адреса и профиль.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link to="/catalog">В каталог</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
                  <LogOut className="w-4 h-4 mr-2" />
                  Выйти
                </Button>
              </div>
            </div>
            {(profile?.phone || user?.phone) && (
              <p className="text-sm text-muted-foreground mt-3">Телефон: {profile?.phone || user?.phone}</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/70">
              <p className="text-xs text-muted-foreground">Всего заказов</p>
              <p className="font-heading font-bold text-2xl mt-1">{stats.totalOrders}</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/70">
              <p className="text-xs text-muted-foreground">Сумма покупок</p>
              <p className="font-heading font-bold text-2xl mt-1">{formatPrice(stats.totalSpent)}</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/70">
              <p className="text-xs text-muted-foreground">Доставлено</p>
              <p className="font-heading font-bold text-2xl mt-1">{stats.delivered}</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/70">
              <p className="text-xs text-muted-foreground">В пути</p>
              <p className="font-heading font-bold text-2xl mt-1">{stats.inTransit}</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-auto h-auto">
              <TabsTrigger value="orders" className="gap-2">
                <Package className="w-4 h-4" />
                Заказы
              </TabsTrigger>
              <TabsTrigger value="addresses" className="gap-2">
                <MapPin className="w-4 h-4" />
                Адреса
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Профиль
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="w-4 h-4" />
                Избранное
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : ordersError ? (
                <div className="bg-card rounded-xl p-8 text-center shadow-card space-y-3">
                  <p className="text-muted-foreground">{ordersError}</p>
                  <Button onClick={fetchAccountData} variant="outline">
                    Повторить
                  </Button>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center shadow-card">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">У вас пока нет заказов</p>
                  <Link to="/catalog">
                    <Button className="btn-gold">Перейти в каталог</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Поиск по номеру заказа"
                        />
                      </div>
                      <div className="flex gap-2 overflow-auto pb-1">
                        <Button
                          size="sm"
                          variant={statusFilter === "all" ? "default" : "outline"}
                          onClick={() => setStatusFilter("all")}
                        >
                          Все
                        </Button>
                        {availableStatuses.map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={statusFilter === status ? "default" : "outline"}
                            onClick={() => setStatusFilter(status)}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Показано заказов: {filteredOrders.length} из {orders.length}
                    </p>
                  </div>

                  {filteredOrders.length === 0 && (
                    <div className="bg-card rounded-xl p-6 text-center shadow-card">
                      <p className="text-muted-foreground">По выбранным фильтрам заказы не найдены</p>
                    </div>
                  )}

                  {filteredOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/account/order/${order.id}`}
                      className="block bg-card rounded-xl p-4 sm:p-5 shadow-card hover:shadow-hover transition-shadow border border-border/70"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{order.order_number}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                          <div className="w-52 max-w-full">
                            <div className="h-1.5 rounded bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary rounded"
                                style={{ width: formatOrderProgress(order.status) }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => repeatOrderFromList(order.id, e)}
                            disabled={repeatingOrderId === order.id}
                          >
                            {repeatingOrderId === order.id ? "..." : "Купить снова"}
                          </Button>
                          <span className="font-heading font-bold text-primary">{formatPrice(order.total_price)}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="addresses" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card space-y-3 border border-border/70">
                  <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Новый адрес доставки
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={addressForm.label}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder="Название (например, Дом)"
                    />
                    <Input
                      value={addressForm.recipient_name}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, recipient_name: e.target.value }))}
                      placeholder="Получатель"
                    />
                    <Input
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Телефон"
                    />
                    <Input
                      value={addressForm.city}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="Город"
                    />
                    <Input
                      value={addressForm.street}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
                      placeholder="Улица"
                    />
                    <Input
                      value={addressForm.building}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, building: e.target.value }))}
                      placeholder="Дом"
                    />
                    <Input
                      value={addressForm.apartment}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, apartment: e.target.value }))}
                      placeholder="Квартира"
                    />
                    <Input
                      value={addressForm.floor}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, floor: e.target.value }))}
                      placeholder="Этаж"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={addressForm.is_default}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))}
                    />
                    Сделать основным адресом
                  </label>
                  {addressesError && <p className="text-xs text-destructive">{addressesError}</p>}
                  <Button
                    onClick={saveAddress}
                    disabled={
                      savingAddress ||
                      !addressForm.label.trim() ||
                      !addressForm.recipient_name.trim() ||
                      !addressForm.phone.trim() ||
                      !addressForm.city.trim() ||
                      !addressForm.street.trim() ||
                      !addressForm.building.trim()
                    }
                  >
                    {savingAddress ? "Сохраняю..." : "Добавить адрес"}
                  </Button>
                </div>

                <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card space-y-3 border border-border/70">
                  <h2 className="font-heading font-semibold text-lg">Сохранённые адреса</h2>
                  {addresses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Пока нет сохранённых адресов</p>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map((address) => (
                        <div key={address.id} className="border border-border rounded-lg p-3 bg-background">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {address.label}
                                {address.is_default && (
                                  <Badge variant="secondary" className="text-[10px] px-2 py-0">
                                    Основной
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {address.recipient_name}, {address.phone}
                              </p>
                              <p className="text-sm">
                                {address.city}, {address.street}, {address.building}
                                {address.apartment ? `, кв. ${address.apartment}` : ""}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {!address.is_default && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => makeDefaultAddress(address)}
                                  disabled={settingDefaultId === address.id}
                                >
                                  {settingDefaultId === address.id ? "..." : "Сделать основным"}
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => deleteAddress(address.id)}
                                disabled={deletingAddressId === address.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card space-y-3 border border-border/70">
                  <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Данные профиля
                  </h2>
                  <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Ваше имя" />
                  <Input value={profile?.email || ""} readOnly placeholder="Email" />
                  <Input value={profile?.phone || user?.phone || ""} readOnly placeholder="Телефон" />
                  {profileError && <p className="text-xs text-destructive">{profileError}</p>}
                  <Button onClick={saveProfile} disabled={savingProfile || !profileName.trim()}>
                    {savingProfile ? "Сохраняю..." : "Сохранить профиль"}
                  </Button>
                </div>

                <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card border border-border/70">
                  <h2 className="font-heading font-semibold text-lg mb-3">Быстрые действия</h2>
                  <div className="space-y-2">
                    <Link to="/catalog" className="block">
                      <div className="rounded-lg border border-border p-3 hover:border-primary/40 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-primary" />
                          <span className="text-sm">Перейти в каталог</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                    <div className="rounded-lg border border-border p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        <span className="text-sm">Отслеживайте статусы в разделе заказов</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-sm">Профиль и адреса можно обновлять в пару кликов</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4">
              <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card border border-border/70">
                <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Избранные товары
                </h2>
                {favorites.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">Пока нет избранных товаров</p>
                    <Button asChild variant="outline">
                      <Link to="/catalog">Перейти в каталог</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {favorites.map((product) => (
                      <ProductCard key={product.id} product={product} analyticsContext="catalog" />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card border border-border/70">
                <h2 className="font-heading font-semibold text-lg mb-1">Рекомендуем к покупке</h2>
                <p className="text-xs text-muted-foreground mb-3">
                  Подборка на основе ваших прошлых заказов и товаров, которые обычно покупают вместе
                </p>
                {recommendationsLoading ? (
                  <p className="text-sm text-muted-foreground">Загрузка рекомендаций...</p>
                ) : recommendationsError ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{recommendationsError}</p>
                    <Button variant="outline" onClick={fetchRecommendations}>
                      Повторить
                    </Button>
                  </div>
                ) : recommendations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Пока нет персональных рекомендаций</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {recommendations.map((product) => (
                      <div key={product.id} className="space-y-1">
                        <Badge variant="outline" className={`text-[10px] px-2 py-0 ${recommendationMeta(product.recommendation_source).className}`}>
                          {recommendationMeta(product.recommendation_source).label}
                        </Badge>
                        <ProductCard product={product} analyticsContext="catalog" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
