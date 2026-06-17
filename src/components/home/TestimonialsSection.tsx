import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getReviews } from "@/lib/course-api";

const TestimonialsSection = () => {
  const { t } = useTranslation();
  const { data: reviews = [] } = useQuery({
    queryKey: ["home-reviews"],
    queryFn: getReviews,
  });

  const featuredReviews = reviews
    .filter((review) => review.visible && review.rating >= 4)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 6);

  return (
    <section className="py-16 lg:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t("home.testimonialsSection.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("home.testimonialsSection.subtitle")}
          </p>
        </div>

        {/* Testimonials Dynamic Centered Layout Container */}
        <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
          {featuredReviews.map((review) => (
            <div
              key={review.id}
              /* w-full: Takes full width on mobile
                md:w-... Calculates matching width for 2 columns per row on medium viewports 
                lg:w-... Calculates matching width for 3 columns per row on large viewports
                flex flex-col justify-between: Ensures even if text length varies, the card footers align perfectly at the bottom edge
              */
              className="bg-card p-6 rounded-xl shadow-card w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 flex flex-col justify-between"
            >
              <div>
                {/* Quote Icon */}
                <Quote className="h-8 w-8 text-accent/30 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "fill-warning text-warning" : "text-muted"}`}
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-card-foreground mb-6 line-clamp-4 italic">
                  "{review.content}"
                </p>
              </div>

              {/* Author Footer Wrapper */}
              <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center font-semibold text-accent shrink-0">
                  {(review.studentName || "L")[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-card-foreground line-clamp-1">
                    {review.studentName || t("courseDetail.discussion.learner")}
                  </p>
                  {review.title && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {review.title}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {featuredReviews.length === 0 && (
            <div className="w-full text-center text-muted-foreground py-8">
              {/* Fallback translation or static text */}
              No reviews yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;