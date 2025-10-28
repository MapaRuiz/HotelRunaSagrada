import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
  NgZone,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type * as Leaflet from 'leaflet';

export interface MapCoordinates {
  lat: number;
  lng: number;
}

const DEFAULT_LAT = 4.711; // Bogotá
const DEFAULT_LNG = -74.0721;
const DEFAULT_ZOOM = 13;

const DEFAULT_COORDINATES: MapCoordinates = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };

@Component({
  selector: 'app-map-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-preview.html',
  styleUrls: ['./map-preview.css'],
})
export class MapPreview implements AfterViewInit, OnDestroy {
  @Input()
  set coordinates(value: MapCoordinates | null | undefined) {
    let lat = DEFAULT_COORDINATES.lat;
    let lng = DEFAULT_COORDINATES.lng;

    if (value != null) {
      const latCandidate = Number(value.lat);
      const lngCandidate = Number(value.lng);
      if (Number.isFinite(latCandidate) && Number.isFinite(lngCandidate)) {
        lat = latCandidate;
        lng = lngCandidate;
      }
    }

    const normalizedLat = +Number(lat).toFixed(6);
    const normalizedLng = +Number(lng).toFixed(6);

    if (
      this.lastExternalCoordinates &&
      this.lastExternalCoordinates.lat === normalizedLat &&
      this.lastExternalCoordinates.lng === normalizedLng
    ) {
      return;
    }

    this.lastExternalCoordinates = { lat: normalizedLat, lng: normalizedLng };
    this.applyExternalCoordinates(normalizedLat, normalizedLng);
  }

  @Input()
  set editable(value: boolean) {
    const next = !!value;
    if (next === this._editable) return;
    this._editable = next;
    this.syncMarkerDraggable();
  }

  get editable(): boolean {
    return this._editable;
  }

  @Output() coordinatesChange = new EventEmitter<MapCoordinates>();

  @ViewChild('mapContainer', { static: false })
  private mapContainer?: ElementRef<HTMLDivElement>;

  private leaflet?: typeof Leaflet;
  private map?: Leaflet.Map;
  private marker?: Leaflet.Marker;
  private readonly markerColor = '#0a6847';
  private _editable = false;
  private lastExternalCoordinates?: MapCoordinates;
  private homeCoordinates: MapCoordinates = { ...DEFAULT_COORDINATES };

  lat = DEFAULT_LAT;
  lng = DEFAULT_LNG;
  inputLat = DEFAULT_LAT;
  inputLng = DEFAULT_LNG;
  mapReady = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private zone: NgZone) {}

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const host = this.mapContainer?.nativeElement;
    if (!host) return;

    const leafletModule = await import('leaflet');
    const L = (leafletModule as any).default ?? leafletModule;
    this.leaflet = L;

    const { Icon } = L;
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });

    this.zone.runOutsideAngular(() => {
      const mapInstance = L.map(host, {
        center: [this.lat, this.lng],
        zoom: DEFAULT_ZOOM,
        preferCanvas: true,
      });
      this.map = mapInstance;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance);

      const markerInstance = L.marker([this.lat, this.lng], {
        draggable: this._editable,
        icon: this.createBaseIcon(),
      }).addTo(mapInstance);
      this.marker = markerInstance;
      this.homeCoordinates = { lat: this.lat, lng: this.lng };

      this.syncMarkerDraggable();

      markerInstance.on('moveend', (event: Leaflet.LeafletEvent) => {
        if (!this._editable) return;
        const target = event.target as Leaflet.Marker;
        const pos = target.getLatLng();
        const currentZoom = this.map?.getZoom() ?? DEFAULT_ZOOM;
        this.zone.run(() =>
          this.setMarkerAndView(pos.lat, pos.lng, currentZoom, { animate: false })
        );
      });

      this.zone.run(() =>
        this.setMarkerAndView(this.lat, this.lng, mapInstance.getZoom(), {
          emit: false,
          animate: false,
        })
      );

      setTimeout(() => mapInstance.invalidateSize(), 0);
    });

    this.zone.run(() => {
      this.mapReady = true;
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
    this.mapReady = false;
  }

  goToLatLng(): void {
    if (!this._editable) return;

    const latRaw = this.inputLat ?? '';
    const lngRaw = this.inputLng ?? '';

    const lat =
      typeof latRaw === 'number' ? latRaw : Number.parseFloat(String(latRaw).replace(',', '.'));
    const lng =
      typeof lngRaw === 'number' ? lngRaw : Number.parseFloat(String(lngRaw).replace(',', '.'));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      alert('Coordenadas inválidas');
      return;
    }

    this.setMarkerAndView(lat, lng, 16);
  }

  recenter(): void {
    if (!this.map) return;
    const zoom = this.map.getZoom() ?? DEFAULT_ZOOM;
    this.map.setView([this.homeCoordinates.lat, this.homeCoordinates.lng], zoom, {
      animate: true,
    });
    this.setMarkerAndView(this.homeCoordinates.lat, this.homeCoordinates.lng, zoom, {
      emit: false,
      animate: false,
    });
  }

  private applyExternalCoordinates(lat: number, lng: number): void {
    const normalizedLat = +Number(lat).toFixed(6);
    const normalizedLng = +Number(lng).toFixed(6);

    const changed = this.lat !== normalizedLat || this.lng !== normalizedLng;

    this.lat = normalizedLat;
    this.lng = normalizedLng;
    this.inputLat = normalizedLat;
    this.inputLng = normalizedLng;
    this.homeCoordinates = { lat: normalizedLat, lng: normalizedLng };

    if (changed && (this.map || this.marker)) {
      this.setMarkerAndView(normalizedLat, normalizedLng, this.map?.getZoom(), {
        emit: false,
        animate: false,
      });
    }
  }

  private setMarkerAndView(
    lat: number,
    lng: number,
    zoom?: number | null,
    options?: { emit?: boolean; animate?: boolean }
  ): void {
    const normalizedLat = +Number(lat).toFixed(6);
    const normalizedLng = +Number(lng).toFixed(6);

    this.lat = normalizedLat;
    this.lng = normalizedLng;
    this.inputLat = normalizedLat;
    this.inputLng = normalizedLng;

    if (this.marker) {
      this.marker.setLatLng([normalizedLat, normalizedLng]);
    } else if (this.leaflet && this.map) {
      const markerInstance = this.leaflet
        .marker([normalizedLat, normalizedLng], {
          draggable: this._editable,
          icon: this.createBaseIcon(),
        })
        .addTo(this.map);
      this.marker = markerInstance;
      this.syncMarkerDraggable();

      markerInstance.on('moveend', (event: Leaflet.LeafletEvent) => {
        if (!this._editable) return;
        const target = event.target as Leaflet.Marker;
        const pos = target.getLatLng();
        const currentZoom = this.map?.getZoom() ?? DEFAULT_ZOOM;
        this.setMarkerAndView(pos.lat, pos.lng, currentZoom, { animate: false });
      });
    }

    if (this.map) {
      const targetZoom = zoom ?? this.map.getZoom();
      const animate = options?.animate ?? true;
      this.map.setView([normalizedLat, normalizedLng], targetZoom, { animate });
    }

    if (options?.emit !== false) {
      this.homeCoordinates = { lat: this.lat, lng: this.lng };
      if (this._editable) {
        this.coordinatesChange.emit({ lat: this.lat, lng: this.lng });
      }
    }
  }

  private syncMarkerDraggable(): void {
    if (!this.marker) return;
    if (this._editable) {
      this.marker.dragging?.enable?.();
    } else {
      this.marker.dragging?.disable?.();
    }
  }

  private createBaseIcon(fill = this.markerColor): Leaflet.DivIcon {
    if (!this.leaflet) {
      throw new Error('Leaflet no está cargado');
    }

    return this.leaflet.divIcon({
      className: 'map-pin',
      html: `<span class="pin" style="--pin:${fill}"></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });
  }
}
