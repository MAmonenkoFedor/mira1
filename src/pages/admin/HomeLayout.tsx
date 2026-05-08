import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Save } from "lucide-react";
import { apiRequest, getErrorMessage } from "@/integrations/api/client";
import { toast } from "sonner";

type HomeSection = {
  key: string;
  enabled: boolean;
  title?: string;
  viewAllLink?: string;
  badge?: string;
  productIds?: string[];
  limit?: number;
};

type HomeSeo = {
  title?: string;
  description?: string;
  keywords?: string;
};

type HomeHero = {
  topBadge?: string;
  headline?: string;
  highlight?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  feature1?: string;
  feature2?: string;
};

type HomeTrustItem = {
  icon?: "truck" | "shield" | "rotate" | "headphones";
  title: string;
  description: string;
};

type HomeLayout = {
  sections: HomeSection[];
  featuredCategoryIds?: string[];
  seo?: HomeSeo;
  hero?: HomeHero;
  trust?: HomeTrustItem[];
};

type ProductOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

type LayoutPreset = {
  key: string;
  label: string;
  description: string;
};

type PresetApplyOptions = {
  sections: boolean;
  featuredCategoryIds: boolean;
  seo: boolean;
  hero: boolean;
  trust: boolean;
};

type PresetPreview = {
  current: HomeLayout;
  next: HomeLayout;
  changed: PresetApplyOptions;
  changedCount: number;
  details: {
    sections: {
      orderChanged: boolean;
      changedKeys: string[];
    };
    featuredCategoryIds: {
      added: string[];
      removed: string[];
    };
    seo: {
      changedKeys: string[];
    };
    hero: {
      changedKeys: string[];
    };
    trust: {
      changedIndices: number[];
      beforeCount: number;
      afterCount: number;
    };
  };
};

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero баннер",
  trust: "Блок доверия",
  categories: "Сетка категорий",
  gift_sets: "Карусель: Подарочные наборы",
  promo_banners: "Промо-баннеры",
  premium: "Карусель: Премиум",
  truffles: "Карусель: Трюфели",
  discounts: "Товары со скидкой",
  popular: "Карусель: Популярные",
  articles: "Статьи",
};

const TITLE_KEYS = new Set(["gift_sets", "premium", "truffles", "discounts", "popular"]);
const LINK_KEYS = new Set(["gift_sets", "premium", "truffles", "popular"]);
const BADGE_KEYS = new Set(["premium"]);
const PRODUCT_KEYS = new Set(["gift_sets", "premium", "truffles", "discounts", "popular"]);
const LIMIT_KEYS = new Set(["gift_sets", "premium", "truffles", "discounts", "popular"]);

const humanizeSectionKey = (key: string) => SECTION_LABELS[key] || key;

const HomeLayoutAdmin = () => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [featuredCategoryIds, setFeaturedCategoryIds] = useState<string[]>([]);
  const [seo, setSeo] = useState<HomeSeo>({});
  const [hero, setHero] = useState<HomeHero>({});
  const [trust, setTrust] = useState<HomeTrustItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [presets, setPresets] = useState<LayoutPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("default");
  const [presetApplyOptions, setPresetApplyOptions] = useState<PresetApplyOptions>({
    sections: true,
    featuredCategoryIds: true,
    seo: true,
    hero: true,
    trust: true,
  });
  const [presetPreview, setPresetPreview] = useState<PresetPreview | null>(null);
  const [previewingPreset, setPreviewingPreset] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchLayout = async () => {
    setLoading(true);
    try {
      const [layout, productOptions, categoryOptions, presetOptions] = await Promise.all([
        apiRequest<HomeLayout>("/api/admin/home-layout"),
        apiRequest<ProductOption[]>("/api/admin/products/options"),
        apiRequest<CategoryOption[]>("/api/admin/categories"),
        apiRequest<LayoutPreset[]>("/api/admin/home-layout/presets"),
      ]);
      setSections(layout?.sections || []);
      setFeaturedCategoryIds(layout?.featuredCategoryIds || []);
      setSeo(layout?.seo || {});
      setHero(layout?.hero || {});
      setTrust(layout?.trust || []);
      setProducts(productOptions || []);
      setCategories((categoryOptions || []).map((category) => ({ id: category.id, name: category.name })));
      setPresets(presetOptions || []);
      setSelectedPreset((presetOptions || [])[0]?.key || "default");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Ошибка загрузки витрины"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayout();
  }, []);

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      const item = next[index];
      next[index] = next[target];
      next[target] = item;
      return next;
    });
  };

  const updateSection = (index: number, patch: Partial<HomeSection>) => {
    setSections((prev) => prev.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  };

  const toggleSectionProduct = (index: number, productId: string, checked: boolean) => {
    const current = sections[index]?.productIds || [];
    const next = checked ? [...current, productId] : current.filter((id) => id !== productId);
    updateSection(index, { productIds: [...new Set(next)] });
  };

  const toggleFeaturedCategory = (categoryId: string, checked: boolean) => {
    setFeaturedCategoryIds((prev) => {
      const next = checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId);
      return [...new Set(next)];
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiRequest("/api/admin/home-layout", {
        method: "PUT",
        body: JSON.stringify({
          sections,
          featuredCategoryIds,
          seo,
          hero,
          trust,
        }),
      });
      toast.success("Настройки витрины сохранены");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Ошибка сохранения"));
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = async () => {
    setApplyingPreset(true);
    try {
      await apiRequest("/api/admin/home-layout/apply-preset", {
        method: "POST",
        body: JSON.stringify({
          preset: selectedPreset,
          apply: presetApplyOptions,
        }),
      });
      await fetchLayout();
      setPresetPreview(null);
      toast.success("Пресет витрины применён");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Ошибка применения пресета"));
    } finally {
      setApplyingPreset(false);
    }
  };

  const previewPreset = async () => {
    setPreviewingPreset(true);
    try {
      const preview = await apiRequest<PresetPreview>("/api/admin/home-layout/preview-preset", {
        method: "POST",
        body: JSON.stringify({
          preset: selectedPreset,
          apply: presetApplyOptions,
        }),
      });
      setPresetPreview(preview);
      if ((preview?.changedCount || 0) === 0) {
        toast.info("Изменений не будет");
      } else {
        toast.success(`Найдено изменений: ${preview.changedCount}`);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Ошибка предпросмотра пресета"));
    } finally {
      setPreviewingPreset(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl">Витрина главной</h1>
            <p className="text-sm text-muted-foreground">
              Управление блоками главной страницы: порядок, видимость, товары, категории и SEO.
            </p>
          </div>
          <Button onClick={save} disabled={saving || loading}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Сохраняю..." : "Сохранить"}
          </Button>
        </div>

        <Card className="p-4">
          <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <p className="font-medium">Быстрые пресеты витрины</p>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пресет" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.key} value={preset.key}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {presets.find((preset) => preset.key === selectedPreset)?.description && (
                <p className="text-xs text-muted-foreground">
                  {presets.find((preset) => preset.key === selectedPreset)?.description}
                </p>
              )}
              <div className="grid sm:grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={presetApplyOptions.sections}
                    onCheckedChange={(checked) =>
                      setPresetApplyOptions((prev) => ({ ...prev, sections: Boolean(checked) }))
                    }
                  />
                  <span>Порядок и блоки</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={presetApplyOptions.hero}
                    onCheckedChange={(checked) =>
                      setPresetApplyOptions((prev) => ({ ...prev, hero: Boolean(checked) }))
                    }
                  />
                  <span>Hero контент</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={presetApplyOptions.trust}
                    onCheckedChange={(checked) =>
                      setPresetApplyOptions((prev) => ({ ...prev, trust: Boolean(checked) }))
                    }
                  />
                  <span>Блок доверия</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={presetApplyOptions.featuredCategoryIds}
                    onCheckedChange={(checked) =>
                      setPresetApplyOptions((prev) => ({ ...prev, featuredCategoryIds: Boolean(checked) }))
                    }
                  />
                  <span>Категории</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer sm:col-span-2">
                  <Checkbox
                    checked={presetApplyOptions.seo}
                    onCheckedChange={(checked) =>
                      setPresetApplyOptions((prev) => ({ ...prev, seo: Boolean(checked) }))
                    }
                  />
                  <span>SEO главной</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={previewPreset} disabled={loading || previewingPreset}>
                {previewingPreset ? "Считаю..." : "Предпросмотр"}
              </Button>
              <Button onClick={applyPreset} disabled={loading || applyingPreset}>
                {applyingPreset ? "Применяю..." : "Применить пресет"}
              </Button>
            </div>
          </div>
          {presetPreview && (
            <div className="pt-3 border-t border-border mt-3 text-sm space-y-1">
              <p className="font-medium">Предпросмотр изменений: {presetPreview.changedCount}</p>
              <p className="text-muted-foreground">
                Блоки и порядок: {presetPreview.changed.sections ? "да" : "нет"} | Hero:{" "}
                {presetPreview.changed.hero ? "да" : "нет"} | Trust: {presetPreview.changed.trust ? "да" : "нет"}
              </p>
              <p className="text-muted-foreground">
                Категории: {presetPreview.changed.featuredCategoryIds ? "да" : "нет"} | SEO:{" "}
                {presetPreview.changed.seo ? "да" : "нет"}
              </p>
              {presetPreview.changed.sections && (
                <p className="text-muted-foreground">
                  Секции:{" "}
                  {presetPreview.details.sections.changedKeys.length > 0
                    ? presetPreview.details.sections.changedKeys.map(humanizeSectionKey).join(", ")
                    : "без точечных изменений"}
                  {presetPreview.details.sections.orderChanged ? " (изменится порядок)" : ""}
                </p>
              )}
              {presetPreview.changed.hero && presetPreview.details.hero.changedKeys.length > 0 && (
                <p className="text-muted-foreground">
                  Hero поля: {presetPreview.details.hero.changedKeys.join(", ")}
                </p>
              )}
              {presetPreview.changed.seo && presetPreview.details.seo.changedKeys.length > 0 && (
                <p className="text-muted-foreground">
                  SEO поля: {presetPreview.details.seo.changedKeys.join(", ")}
                </p>
              )}
              {presetPreview.changed.featuredCategoryIds && (
                <p className="text-muted-foreground">
                  Категории +{presetPreview.details.featuredCategoryIds.added.length} / -
                  {presetPreview.details.featuredCategoryIds.removed.length}
                </p>
              )}
              {presetPreview.changed.trust && (
                <p className="text-muted-foreground">
                  Trust: карточки {presetPreview.details.trust.beforeCount} → {presetPreview.details.trust.afterCount},
                  изменено позиций: {presetPreview.details.trust.changedIndices.length}
                </p>
              )}
              <details className="mt-2 rounded-md border border-border bg-muted/30 p-2">
                <summary className="cursor-pointer font-medium">Показать diff JSON (до/после)</summary>
                <div className="grid gap-2 mt-2 lg:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Текущее</p>
                    <pre className="text-xs whitespace-pre-wrap break-words max-h-64 overflow-auto rounded bg-background p-2">
                      {JSON.stringify(presetPreview.current, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">После применения</p>
                    <pre className="text-xs whitespace-pre-wrap break-words max-h-64 overflow-auto rounded bg-background p-2">
                      {JSON.stringify(presetPreview.next, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          )}
        </Card>

        {loading ? (
          <p className="text-muted-foreground">Загрузка...</p>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => (
              <Card key={section.key} className="p-4">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{SECTION_LABELS[section.key] || section.key}</p>
                      <p className="text-xs text-muted-foreground">{section.key}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveSection(index, -1)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveSection(index, 1)}
                        disabled={index === sections.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={section.enabled}
                          onCheckedChange={(enabled) => updateSection(index, { enabled })}
                        />
                        <span className="text-sm">Включен</span>
                      </label>
                    </div>
                  </div>

                  {TITLE_KEYS.has(section.key) && (
                    <Input
                      value={section.title || ""}
                      onChange={(e) => updateSection(index, { title: e.target.value })}
                      placeholder="Заголовок блока"
                    />
                  )}

                  {LINK_KEYS.has(section.key) && (
                    <Input
                      value={section.viewAllLink || ""}
                      onChange={(e) => updateSection(index, { viewAllLink: e.target.value })}
                      placeholder="/catalog?category=..."
                    />
                  )}

                  {BADGE_KEYS.has(section.key) && (
                    <Input
                      value={section.badge || ""}
                      onChange={(e) => updateSection(index, { badge: e.target.value })}
                      placeholder="Бейдж (например, Эксклюзив)"
                    />
                  )}

                  {PRODUCT_KEYS.has(section.key) && (
                    <div className="border border-border rounded-lg p-3 space-y-2 max-h-44 overflow-y-auto">
                      <p className="text-xs text-muted-foreground">
                        Ручной состав товаров (если пусто, используется авто-подбор)
                      </p>
                      {products.map((product) => (
                        <label key={product.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={(section.productIds || []).includes(product.id)}
                            onCheckedChange={(checked) => toggleSectionProduct(index, product.id, Boolean(checked))}
                          />
                          <span className="truncate">{product.name}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {LIMIT_KEYS.has(section.key) && (
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={section.limit || ""}
                      onChange={(e) =>
                        updateSection(index, {
                          limit: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="Лимит карточек (например, 8)"
                    />
                  )}
                </div>
              </Card>
            ))}

            <Card className="p-4">
              <div className="space-y-3">
                <h3 className="font-medium">Hero блок</h3>
                <Input
                  value={hero.topBadge || ""}
                  onChange={(e) => setHero((prev) => ({ ...prev, topBadge: e.target.value }))}
                  placeholder="Бейдж сверху (например, 🎁 Новая коллекция)"
                />
                <Input
                  value={hero.headline || ""}
                  onChange={(e) => setHero((prev) => ({ ...prev, headline: e.target.value }))}
                  placeholder="Заголовок Hero"
                />
                <Input
                  value={hero.highlight || ""}
                  onChange={(e) => setHero((prev) => ({ ...prev, highlight: e.target.value }))}
                  placeholder="Выделенная часть заголовка"
                />
                <Input
                  value={hero.description || ""}
                  onChange={(e) => setHero((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Описание Hero"
                />
                <div className="grid md:grid-cols-2 gap-2">
                  <Input
                    value={hero.primaryCtaText || ""}
                    onChange={(e) => setHero((prev) => ({ ...prev, primaryCtaText: e.target.value }))}
                    placeholder="Текст основной кнопки"
                  />
                  <Input
                    value={hero.primaryCtaLink || ""}
                    onChange={(e) => setHero((prev) => ({ ...prev, primaryCtaLink: e.target.value }))}
                    placeholder="Ссылка основной кнопки"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <Input
                    value={hero.secondaryCtaText || ""}
                    onChange={(e) => setHero((prev) => ({ ...prev, secondaryCtaText: e.target.value }))}
                    placeholder="Текст второй кнопки"
                  />
                  <Input
                    value={hero.secondaryCtaLink || ""}
                    onChange={(e) => setHero((prev) => ({ ...prev, secondaryCtaLink: e.target.value }))}
                    placeholder="Ссылка второй кнопки"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <Input
                    value={hero.feature1 || ""}
                    onChange={(e) => setHero((prev) => ({ ...prev, feature1: e.target.value }))}
                    placeholder="Преимущество 1"
                  />
                  <Input
                    value={hero.feature2 || ""}
                    onChange={(e) => setHero((prev) => ({ ...prev, feature2: e.target.value }))}
                    placeholder="Преимущество 2"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-3">
                <h3 className="font-medium">Блок доверия</h3>
                <p className="text-xs text-muted-foreground">Иконка: truck / shield / rotate / headphones</p>
                {trust.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="grid md:grid-cols-3 gap-2">
                    <Input
                      value={item.icon || ""}
                      onChange={(e) =>
                        setTrust((prev) =>
                          prev.map((row, i) => (i === index ? { ...row, icon: e.target.value as HomeTrustItem["icon"] } : row)),
                        )
                      }
                      placeholder="icon key"
                    />
                    <Input
                      value={item.title}
                      onChange={(e) =>
                        setTrust((prev) => prev.map((row, i) => (i === index ? { ...row, title: e.target.value } : row)))
                      }
                      placeholder="Заголовок"
                    />
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        setTrust((prev) =>
                          prev.map((row, i) => (i === index ? { ...row, description: e.target.value } : row)),
                        )
                      }
                      placeholder="Описание"
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-3">
                <h3 className="font-medium">Категории на главной</h3>
                <p className="text-xs text-muted-foreground">
                  Если ничего не выбрано, показываются все категории.
                </p>
                <div className="border border-border rounded-lg p-3 space-y-2 max-h-44 overflow-y-auto">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={featuredCategoryIds.includes(category.id)}
                        onCheckedChange={(checked) => toggleFeaturedCategory(category.id, Boolean(checked))}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-3">
                <h3 className="font-medium">SEO главной</h3>
                <Input
                  value={seo.title || ""}
                  onChange={(e) => setSeo((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="SEO заголовок (title)"
                />
                <Input
                  value={seo.description || ""}
                  onChange={(e) => setSeo((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="SEO описание (description)"
                />
                <Input
                  value={seo.keywords || ""}
                  onChange={(e) => setSeo((prev) => ({ ...prev, keywords: e.target.value }))}
                  placeholder="SEO ключевые слова (keywords)"
                />
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default HomeLayoutAdmin;
