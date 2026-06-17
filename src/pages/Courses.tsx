import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CourseCard from "@/components/courses/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  SlidersHorizontal,
  X,
  Star,
  Grid3X3,
  List,
  Heart,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApprovedCourses,
  getCategories,
  addToWishlist,
  removeFromWishlist,
  checkInWishlist,
} from "@/lib/course-api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import type { Course } from "@/types";
import { useToast } from "@/hooks/use-toast";

const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"] as const;
const RECENT_SEARCHES_KEY = "courses.recentSearches";

const getLocalizedCategoryName = (
  cat: { name: string; nameAm?: string; nameOm?: string; nameGz?: string },
  currentLang: string,
) => {
  switch (currentLang) {
    case "am":
      return cat.nameAm || cat.name;
    case "om":
      return cat.nameOm || cat.name;
    case "gez":
    case "gz":
      return cat.nameGz || cat.name;
    default:
      return cat.name;
  }
};

const getLevelLabel = (
  level: (typeof levels)[number],
  t: (key: string) => string,
) => {
  const key = `courses.levels.${level}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return level.toLowerCase().replace("_", " ");
};

const CourseCardWithWishlist = ({ course }: { course: Course }) => {
  const { user, isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const wishlistCheckQuery = useQuery({
    queryKey: ["wishlist-check", course.id],
    queryFn: () => checkInWishlist(course.id),
    enabled: Boolean(isLoggedIn && course.id),
  });

  const isWishlisted = Boolean(wishlistCheckQuery.data);

  const {
    isInCart,
    addToCart: addToCartContext,
    removeFromCart: removeFromCartContext,
  } = useCart();
  const inCart = isInCart(course.slug ?? "");

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (!course.id) return;
      if (isWishlisted) {
        await removeFromWishlist(course.id);
      } else {
        await addToWishlist(course.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wishlist-check", course.id],
      });
      queryClient.invalidateQueries({ queryKey: ["wishlist-me"] });
    },
  });

  const handleToggleWishlist: React.MouseEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoggedIn || wishlistMutation.isPending) return;
    wishlistMutation.mutate();
  };

  const handleAddToCart: React.MouseEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!course.slug) return;

    // Guests are redirected to auth; logged-in users can keep a cart regardless of role.
    if (!isLoggedIn) {
      navigate(
        `/auth?redirect=${encodeURIComponent(`/courses/${course.slug}/checkout`)}`,
      );
      return;
    }

    if (inCart) {
      removeFromCartContext(course.slug);
      toast({
        title: t("courses.cart.removedTitle", "Removed from cart"),
        description: t(
          "courses.cart.removedDescription",
          "This course was removed from your cart.",
        ),
      });
    } else {
      addToCartContext(course.slug);
      toast({
        title: t("courses.cart.addedTitle", "Added to cart"),
        description: t(
          "courses.cart.addedDescription",
          "We saved this course to your cart.",
        ),
      });
    }
  };

  return (
    <div className="relative">
      <CourseCard course={course} />
      <button
        type="button"
        onClick={handleAddToCart}
        aria-label={t("courses.actions.addToCart", "Add to cart")}
        className={cn(
          "absolute left-3 top-3 z-10 inline-flex h-8 items-center justify-center rounded-full px-2.5 text-xs font-medium shadow-md",
          inCart
            ? "bg-accent text-accent-foreground hover:bg-accent/90"
            : "bg-background/80 text-foreground hover:bg-background",
        )}
      >
        <ShoppingCart className="mr-1 h-3.5 w-3.5" />
        {inCart
          ? t("courses.actions.inCart", "In cart")
          : t("courses.actions.addToCart", "Add to cart")}
      </button>
      {isLoggedIn && (
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={
            isWishlisted
              ? t("courses.actions.removeFromWishlist", "Remove from wishlist")
              : t("courses.actions.addToWishlist", "Add to wishlist")
          }
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md hover:bg-background"
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isWishlisted
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground",
            )}
          />
        </button>
      )}
    </div>
  );
};

const Courses = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const currentLang = (i18n.language || "en").split("-")[0];

  const coursesQuery = useQuery({
    queryKey: ["courses", "approved"],
    queryFn: getApprovedCourses,
  });

  const categoriesQuery = useQuery({
    queryKey: ["course-categories"],
    queryFn: getCategories,
  });

  const courses = coursesQuery.data || [];
  const categories = categoriesQuery.data || [];

  // Filter states
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("popular");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed.filter((item) => typeof item === "string").slice(0, 6)
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(recentSearches.slice(0, 6)),
      );
    } catch {
      // ignore storage errors
    }
  }, [recentSearches]);

  const addRecentSearch = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    setRecentSearches((previous) =>
      [
        normalized,
        ...previous.filter(
          (item) => item.toLowerCase() !== normalized.toLowerCase(),
        ),
      ].slice(0, 6),
    );
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    if (
      searchQuery &&
      !course.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    if (selectedCategory && course.category?.slug !== selectedCategory)
      return false;
    if (selectedLevels.length && !selectedLevels.includes(course.level))
      return false;
    if (selectedRating && course.averageRating < selectedRating) return false;
    return true;
  });

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.enrollmentCount - a.enrollmentCount;
      case "rating":
        return b.averageRating - a.averageRating;
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "price-low":
        return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      case "price-high":
        return (b.discountPrice || b.price) - (a.discountPrice || a.price);
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedLevels([]);
    setSelectedRating(null);
    setSearchParams({});
  };

  const activeFiltersCount = [
    searchQuery,
    selectedCategory,
    selectedLevels.length > 0,
    selectedRating,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-primary text-primary-foreground py-12">
          <div className="container">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {t("courses.exploreTitle", "Explore Courses")}
            </h1>
            <p className="text-primary-foreground/80 max-w-2xl">
              {t(
                "courses.exploreSubtitle",
                "Discover thousands of courses taught by expert instructors. Learn at your own pace and earn certificates.",
              )}
            </p>
          </div>
        </div>

        <div className="container py-8">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t(
                  "courses.searchPlaceholder",
                  "Search courses...",
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addRecentSearch(searchQuery);
                  }
                }}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-card">
                <SelectValue
                  placeholder={t("courses.sort.placeholder", "Sort by")}
                />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="popular">
                  {t("courses.sort.popular", "Most Popular")}
                </SelectItem>
                <SelectItem value="rating">
                  {t("courses.sort.rating", "Highest Rated")}
                </SelectItem>
                <SelectItem value="newest">
                  {t("courses.sort.newest", "Newest")}
                </SelectItem>
                <SelectItem value="price-low">
                  {t("courses.sort.priceLow", "Price: Low to High")}
                </SelectItem>
                <SelectItem value="price-high">
                  {t("courses.sort.priceHigh", "Price: High to Low")}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {t("courses.filters.title", "Filters")}
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-accent text-accent-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* View Toggle */}
            <div className="hidden md:flex border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-none",
                  viewMode === "grid" && "bg-muted",
                )}
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-none",
                  viewMode === "list" && "bg-muted",
                )}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {recentSearches.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Recent searches:
              </span>
              {recentSearches.map((term) => (
                <Button
                  key={term}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSearchQuery(term)}
                >
                  {term}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={clearRecentSearches}
              >
                Clear
              </Button>
            </div>
          )}

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside
              className={cn(
                "w-64 shrink-0 space-y-6",
                showFilters ? "block" : "hidden lg:block",
              )}
            >
              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("courses.filters.active", "Active Filters")}
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    {t("courses.filters.clearAll", "Clear All")}
                  </Button>
                </div>
              )}

              {/* Categories */}
              <div className="space-y-3">
                <h3 className="font-semibold">
                  {t("courses.filters.category", "Category")}
                </h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                        selectedCategory === cat.slug
                          ? "bg-accent/10 text-accent"
                          : "hover:bg-muted",
                      )}
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.slug}
                        onChange={() =>
                          setSelectedCategory(
                            selectedCategory === cat.slug ? "" : cat.slug,
                          )
                        }
                        className="sr-only"
                      />
                      <span>{cat.icon}</span>
                      <span className="text-sm">
                        {getLocalizedCategoryName(cat, currentLang)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div className="space-y-3">
                <h3 className="font-semibold">
                  {t("courses.filters.level", "Level")}
                </h3>
                <div className="space-y-2">
                  {levels.map((level) => (
                    <label
                      key={level}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLevels([...selectedLevels, level]);
                          } else {
                            setSelectedLevels(
                              selectedLevels.filter((l) => l !== level),
                            );
                          }
                        }}
                      />
                      <span className="text-sm capitalize">
                        {getLevelLabel(level, t)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-3">
                <h3 className="font-semibold">
                  {t("courses.filters.rating", "Rating")}
                </h3>
                <div className="space-y-2">
                  {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                    <label
                      key={rating}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                        selectedRating === rating
                          ? "bg-accent/10 text-accent"
                          : "hover:bg-muted",
                      )}
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={selectedRating === rating}
                        onChange={() =>
                          setSelectedRating(
                            selectedRating === rating ? null : rating,
                          )
                        }
                        className="sr-only"
                      />
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="text-sm">
                        {t("courses.filters.ratingUp", "{{rating}}+ & up", {
                          rating,
                        })}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* Course Grid */}
            <div className="flex-1">
              <div className="mb-4 text-sm text-muted-foreground">
                {t("courses.resultsCount", "Showing {{count}} results", {
                  count: sortedCourses.length,
                })}
              </div>

              {(coursesQuery.isLoading || categoriesQuery.isLoading) && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span>{t("courses.loading", "Loading courses...")}</span>
                </div>
              )}

              {(coursesQuery.isError || categoriesQuery.isError) && (
                <div className="text-destructive">
                  {t("courses.errorLoading", "Failed to load courses.")}
                </div>
              )}

              {!coursesQuery.isLoading &&
                !coursesQuery.isError &&
                sortedCourses.length > 0 && (
                  <div
                    className={cn(
                      "grid gap-3",
                      viewMode === "grid"
                        ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                        : "grid-cols-1",
                    )}
                  >
                    {sortedCourses.map((course) => (
                      <CourseCardWithWishlist key={course.id} course={course} />
                    ))}
                  </div>
                )}

              {!coursesQuery.isLoading &&
                !coursesQuery.isError &&
                sortedCourses.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground mb-4">
                      {t(
                        "courses.noResults",
                        "No courses found matching your criteria.",
                      )}
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      {t("courses.filters.clear", "Clear Filters")}
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Courses;
