import React, { useEffect } from 'react';
import { toast } from 'sonner';
import type { PlaceItem } from '../types';
import { usePlaceDetails } from '../hooks/usePlaceDetails';
import { PublicIcon } from './PublicIcon';

interface PlaceDetailSheetProps {
  place: PlaceItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onBack: () => void;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
}

const PRICE_LEVEL_LABEL: Record<string, string> = {
  PRICE_LEVEL_FREE: 'Free',
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};

/** Renders 5 material-symbol stars filled to the nearest half for `rating`. */
function StarRating({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((index) => {
        const symbol = rating >= index - 0.5 && rating < index ? 'star_half' : 'star';
        const filled = rating >= index - 0.5;
        return (
          <span
            key={index}
            className={`material-symbols-outlined ${filled ? 'text-[#F5A623]' : 'text-[#D8D6CF]'}`}
            style={{
              fontSize: `${size}px`,
              fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
            }}
          >
            {symbol}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Detail view for a single place, rendered *inside* the MapScreen bottom
 * sheet (the map stays visible above). Returns the sheet's header + scrollable
 * body; the drag handle and sheet chrome are owned by MapScreen.
 */
export const PlaceDetailSheet: React.FC<PlaceDetailSheetProps> = ({
  place,
  isSelected,
  onToggleSelect,
  onBack,
  onScroll,
}) => {
  const { details, isLoading, error } = usePlaceDetails(place.id);

  useEffect(() => {
    if (error) {
      toast.error('Could not load place details', {
        description: 'Showing the basics we already have.',
      });
    }
  }, [error]);

  const photos =
    details?.photoUrls && details.photoUrls.length > 0
      ? details.photoUrls
      : place.imageUrl
        ? [place.imageUrl]
        : [];

  const rating = details?.rating ?? place.rating;
  const ratingCount = details?.userRatingCount ?? 0;
  const address = details?.address ?? place.subtitle;
  const priceLabel = details?.priceLevel ? PRICE_LEVEL_LABEL[details.priceLevel] : null;

  return (
    <>
      {/* Header: back to list · title · minimal select control */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <button
          type="button"
          aria-label="Back to list"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F4EE] text-[#163300] active:scale-90 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>

        <h2 className="flex-1 truncate font-headline text-[17px] font-bold tracking-tight text-[#163300]">
          {place.title}
        </h2>

        <button
          type="button"
          aria-label={isSelected ? 'Remove from must-haves' : 'Add to must-haves'}
          aria-pressed={isSelected}
          onClick={onToggleSelect}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm active:scale-90 transition-all cursor-pointer ${
            isSelected ? 'bg-[#9FE870] text-[#163300]' : 'bg-[#E9E8E3] text-[#41493A]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isSelected ? 'playlist_add_check' : 'playlist_add'}
          </span>
        </button>
      </div>

      {/* Scrollable detail body — clears the floating CTA */}
      <div onScroll={onScroll} className="bottom-sheet-scroll-content no-scrollbar flex-1 min-h-0 overflow-y-auto">
        {/* Photo gallery */}
        {photos.length > 0 ? (
          <div className="relative">
            <div className="flex h-[190px] w-full snap-x snap-mandatory overflow-x-auto no-scrollbar rounded-2xl">
              {photos.map((url, index) => (
                <img
                  key={url}
                  src={url}
                  alt={`${place.title} photo ${index + 1}`}
                  className="h-full w-full shrink-0 snap-center object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              ))}
            </div>
            {photos.length > 1 && (
              <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/45 px-2.5 py-1 font-label text-[11px] font-semibold text-white backdrop-blur-sm">
                {photos.length} photos
              </span>
            )}
          </div>
        ) : (
          <div className="flex h-[190px] w-full items-center justify-center rounded-2xl bg-[#EFEEE8]">
            <PublicIcon name={place.iconName} className="h-12 w-12 text-[#41493A]/40" />
          </div>
        )}

        {/* Meta: category · price */}
        {(details?.category || priceLabel) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-label text-[13px] text-[#41493A]">
            {details?.category && (
              <span className="font-semibold capitalize text-[#163300]">
                {details.category}
              </span>
            )}
            {details?.category && priceLabel && <span className="text-[#C1CAB5]">•</span>}
            {priceLabel && <span className="font-semibold">{priceLabel}</span>}
          </div>
        )}

        {/* Rating */}
        <div className="mt-2.5 flex items-center gap-2">
          <span className="font-headline text-[16px] font-bold text-[#163300]">
            {rating > 0 ? rating.toFixed(1) : 'New'}
          </span>
          <StarRating rating={rating} />
          {ratingCount > 0 && (
            <span className="font-label text-[13px] text-[#41493A]">
              ({ratingCount.toLocaleString()})
            </span>
          )}
        </div>

        {/* Address */}
        {address && (
          <div className="mt-3 flex items-start gap-2">
            <PublicIcon name="location_on" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#41493A]" />
            <span className="font-body text-[14px] leading-relaxed text-[#41493A]">
              {address}
            </span>
          </div>
        )}

        {/* Links */}
        {(details?.websiteUri || details?.googleMapsUri) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {details.websiteUri && (
              <a
                href={details.websiteUri}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E9E8E3] bg-white px-3.5 py-2 font-label text-[13px] font-semibold text-[#163300] active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[16px]">language</span>
                Website
              </a>
            )}
            {details.googleMapsUri && (
              <a
                href={details.googleMapsUri}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E9E8E3] bg-white px-3.5 py-2 font-label text-[13px] font-semibold text-[#163300] active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[16px]">map</span>
                Directions
              </a>
            )}
          </div>
        )}

        {/* Summary */}
        {details?.summary && (
          <p className="mt-5 font-body text-[15px] leading-relaxed text-[#163300]">
            {details.summary}
          </p>
        )}

        {/* Reviews / comments */}
        <div className="mt-6">
          <h3 className="font-headline text-[16px] font-bold text-[#163300]">Reviews</h3>

          {isLoading ? (
            <div className="mt-4 flex flex-col gap-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-[#EFEEE8]" />
              ))}
            </div>
          ) : details && details.reviews.length > 0 ? (
            <div className="mt-3 flex flex-col gap-3">
              {details.reviews.map((review, index) => (
                <div
                  key={`${review.author}-${index}`}
                  className="rounded-2xl border border-[#E9E8E3] bg-white p-4"
                >
                  <div className="flex items-center gap-2.5">
                    {review.authorPhotoUrl ? (
                      <img
                        src={review.authorPhotoUrl}
                        alt={review.author}
                        className="h-8 w-8 rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFEEE8] font-label text-[13px] font-bold text-[#41493A]">
                        {review.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-headline text-[14px] font-bold text-[#163300]">
                        {review.author}
                      </span>
                      {review.relativeTime && (
                        <span className="font-label text-[11px] text-[#41493A]">
                          {review.relativeTime}
                        </span>
                      )}
                    </div>
                    <div className="ml-auto">
                      <StarRating rating={review.rating} size={14} />
                    </div>
                  </div>
                  <p className="mt-2.5 font-body text-[14px] leading-relaxed text-[#41493A]">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 font-label text-[13px] text-[#41493A]">
              No reviews available for this place yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
};
