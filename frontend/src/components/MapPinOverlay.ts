// Wraps google.maps.marker.AdvancedMarkerElement, rendering the existing
// pill-bubble marker markup (icon + label, selected/unselected styling) as
// its `content` node. AdvancedMarkerElement is the current recommended
// marker API and requires a Map ID (see MapScreen's Map constructor).
//
// This module must only be used after `loadGoogleMaps()` has resolved and
// the `marker` library has been imported, so `google.maps.marker` exists.
import { publicIconHref } from '../lib/icons';

export interface MapPinOverlayOptions {
  position: google.maps.LatLngLiteral;
  pinIcon: string;
  pinLabel: string;
  isSelected: boolean;
  zIndex: number;
  onClick: () => void;
}

function buildPinHtml(pinIcon: string, pinLabel: string, isSelected: boolean): string {
  const iconHref = publicIconHref(pinIcon);

  if (isSelected) {
    return `
      <div class="pin-bubble flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#163300] text-[#9FE870] shadow-lg ring-2 ring-white transition-all">
        <svg class="h-[15px] w-[15px]" aria-hidden="true"><use href="${iconHref}"></use></svg>
        <span class="font-label text-[12px] font-bold tracking-tight text-white whitespace-nowrap">${pinLabel}</span>
      </div>
      <div class="w-2 h-2 bg-[#163300] rotate-45 mx-auto -mt-1 shadow-sm"></div>
    `;
  }

  return `
    <div class="pin-bubble flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFFFFF]/95 text-[#163300] shadow-md ring-1 ring-black/[0.06] transition-all">
      <svg class="h-[13px] w-[13px]" aria-hidden="true"><use href="${iconHref}"></use></svg>
      <span class="font-label text-[11px] font-medium whitespace-nowrap text-[#163300]">${pinLabel}</span>
    </div>
    <div class="w-1.5 h-1.5 bg-[#FFFFFF]/95 rotate-45 mx-auto -mt-0.5"></div>
  `;
}

export class MapPinOverlay {
  private marker: google.maps.marker.AdvancedMarkerElement;
  private content: HTMLDivElement;
  private pinIcon: string;
  private pinLabel: string;
  private isSelected: boolean;
  private onClick: () => void;

  constructor(options: MapPinOverlayOptions) {
    this.pinIcon = options.pinIcon;
    this.pinLabel = options.pinLabel;
    this.isSelected = options.isSelected;
    this.onClick = options.onClick;

    const content = document.createElement('div');
    content.style.cursor = 'pointer';
    this.content = content;
    this.render();

    this.marker = new google.maps.marker.AdvancedMarkerElement({
      position: options.position,
      content,
      zIndex: options.zIndex,
      gmpClickable: true,
    });
    this.marker.addListener('click', () => this.onClick());
  }

  update(options: Omit<MapPinOverlayOptions, 'position'>) {
    this.pinIcon = options.pinIcon;
    this.pinLabel = options.pinLabel;
    this.isSelected = options.isSelected;
    this.onClick = options.onClick;
    this.marker.zIndex = options.zIndex;
    this.render();
  }

  setMap(map: google.maps.Map | null) {
    this.marker.map = map;
  }

  private render() {
    this.content.innerHTML = buildPinHtml(this.pinIcon, this.pinLabel, this.isSelected);
  }
}
