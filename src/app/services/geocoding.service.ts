import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formatted_address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private readonly http = inject(HttpClient);

  // Using Nominatim (OpenStreetMap) - free geocoding service
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

  /**
   * Geocode an address to get latitude and longitude
   * Uses Nominatim (OpenStreetMap) free geocoding service
   */
  geocodeAddress(address: string): Observable<GeocodingResult | null> {
    if (!address || address.trim().length < 5) {
      return of(null);
    }

    const params = {
      q: address.trim(),
      format: 'json',
      limit: '1',
      addressdetails: '1'
    };

    const queryString = new URLSearchParams(params).toString();
    const url = `${this.NOMINATIM_URL}?${queryString}`;

    return this.http.get<any[]>(url).pipe(
      map(results => {
        if (results && results.length > 0) {
          const result = results[0];
          return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            formatted_address: result.display_name
          } as GeocodingResult;
        }
        return null;
      }),
      catchError(error => {
        console.warn('Geocoding failed:', error);
        return of(null);
      })
    );
  }

  /**
   * Reverse geocode coordinates to get an address
   */
  reverseGeocode(latitude: number, longitude: number): Observable<string | null> {
    const params = {
      lat: latitude.toString(),
      lon: longitude.toString(),
      format: 'json',
      zoom: '18',
      addressdetails: '1'
    };

    const queryString = new URLSearchParams(params).toString();
    const url = `https://nominatim.openstreetmap.org/reverse?${queryString}`;

    return this.http.get<any>(url).pipe(
      map(result => {
        if (result && result.display_name) {
          return result.display_name;
        }
        return null;
      }),
      catchError(error => {
        console.warn('Reverse geocoding failed:', error);
        return of(null);
      })
    );
  }
}
