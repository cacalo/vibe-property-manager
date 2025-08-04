import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import * as L from 'leaflet';

import { PropertyService } from '../../services/property.service';
import { Property } from '../../models/property.model';

interface PropertyMarkerData {
  property: Property;
  monthlyProfit: number;
  profitMargin: number;
  profitCategory: 'high' | 'medium' | 'low' | 'loss';
  color: string;
}

@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSliderModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="map-container">
      <!-- Map Controls -->
      <mat-card class="map-controls">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>map</mat-icon>
            Property Profitability Map
          </mat-card-title>
          <mat-card-subtitle>
            {{ properties().length }} properties • Color-coded by profitability
            • {{ propertiesWithRealCoords() }} with real coordinates
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="controls-row">
            <mat-form-field appearance="outline">
              <mat-label>View Filter</mat-label>
              <mat-select [(value)]="selectedFilter" (selectionChange)="updateMapView()">
                <mat-option value="all">All Properties</mat-option>
                <mat-option value="high">High Profit (Green)</mat-option>
                <mat-option value="medium">Medium Profit (Yellow)</mat-option>
                <mat-option value="low">Low Profit (Orange)</mat-option>
                <mat-option value="loss">Losses (Red)</mat-option>
              </mat-select>
            </mat-form-field>
            
            <button mat-raised-button color="primary" (click)="centerMap()">
              <mat-icon>my_location</mat-icon>
              Center Map
            </button>
          </div>
          
          <!-- Profitability Legend -->
          <div class="legend">
            <h4>Profitability Legend</h4>
            <div class="legend-items">
              <div class="legend-item">
                <div class="legend-color high"></div>
                <span>High Profit (>20% margin)</span>
                <mat-chip class="profit-chip high">{{ highProfitCount() }}</mat-chip>
              </div>
              <div class="legend-item">
                <div class="legend-color medium"></div>
                <span>Medium Profit (10-20% margin)</span>
                <mat-chip class="profit-chip medium">{{ mediumProfitCount() }}</mat-chip>
              </div>
              <div class="legend-item">
                <div class="legend-color low"></div>
                <span>Low Profit (0-10% margin)</span>
                <mat-chip class="profit-chip low">{{ lowProfitCount() }}</mat-chip>
              </div>
              <div class="legend-item">
                <div class="legend-color loss"></div>
                <span>Loss (negative margin)</span>
                <mat-chip class="profit-chip loss">{{ lossCount() }}</mat-chip>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Map Container -->
      <div class="map-wrapper">
        <div id="property-map" class="map"></div>
        
        <!-- Selected Property Info -->
        @if (selectedProperty()) {
          <mat-card class="property-info-card">
            <mat-card-header>
              <mat-card-title>{{ selectedProperty()!.name }}</mat-card-title>
              <mat-card-subtitle>{{ selectedProperty()!.address }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="property-stats">
                <div class="stat">
                  <span class="label">Monthly Rent:</span>
                  <span class="value">{{ selectedPropertyData()?.monthlyProfit | currency }}</span>
                </div>
                <div class="stat">
                  <span class="label">Profit Margin:</span>
                  <span class="value" [class]="selectedPropertyData()?.profitCategory">
                    {{ selectedPropertyData()?.profitMargin?.toFixed(1) || '0.0' }}%
                  </span>
                </div>
                <div class="stat">
                  <span class="label">Active:</span>
                  <span class="value">{{ selectedProperty()!.isActive ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary" (click)="viewPropertyDetails()">
                <mat-icon>visibility</mat-icon>
                View Details
              </button>
              <button mat-button (click)="clearSelection()">
                <mat-icon>close</mat-icon>
                Close
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .map-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 64px);
      gap: 16px;
      padding: 16px;
    }

    .map-controls {
      flex-shrink: 0;
    }

    .controls-row {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
    }

    .legend {
      h4 {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }
    }

    .legend-items {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-sm);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-sm);
      background-color: var(--background-tertiary);
    }

    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 3px var(--shadow-dark);

      &.high { background-color: var(--success-color); }
      &.medium { background-color: var(--warning-color); }
      &.low { background-color: var(--error-color); }
      &.loss { background-color: var(--purple-color); }
    }

    .profit-chip {
      margin-left: auto;
      
      &.high { background-color: var(--success-background); color: var(--success-dark); }
      &.medium { background-color: var(--warning-background); color: var(--warning-dark); }
      &.low { background-color: var(--error-background); color: var(--error-dark); }
      &.loss { background-color: var(--purple-background); color: var(--purple-dark); }
    }

    .map-wrapper {
      flex: 1;
      position: relative;
      border-radius: var(--border-radius-md);
      overflow: hidden;
      box-shadow: 0 2px 8px var(--shadow-medium);
    }

    .map {
      width: 100%;
      height: 100%;
      min-height: 400px;
    }

    .property-info-card {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 300px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .property-stats {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      font-weight: 600;
      
      &.high { color: #4caf50; }
      &.medium { color: #ff9800; }
      &.low { color: #f44336; }
      &.loss { color: #9c27b0; }
    }

    @media (max-width: 768px) {
      .map-container {
        padding: 8px;
        gap: 8px;
      }
      
      .controls-row {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }
      
      .legend-items {
        grid-template-columns: 1fr;
      }
      
      .property-info-card {
        position: relative;
        width: 100%;
        top: 0;
        right: 0;
        margin-top: 8px;
      }
    }

    // Custom marker styles
    :global(.profit-marker) {
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: transform 0.2s ease;
      
      &:hover {
        transform: scale(1.2);
      }
    }

    :global(.profit-marker.high) { background-color: #4caf50; }
    :global(.profit-marker.medium) { background-color: #ff9800; }
    :global(.profit-marker.low) { background-color: #f44336; }
    :global(.profit-marker.loss) { background-color: #9c27b0; }

    :global(.profit-marker.real-coords) {
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }

    :global(.profit-marker.demo-coords) {
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      opacity: 0.8;
      border-style: dashed !important;
    }

    :global(.profit-marker.selected) {
      transform: scale(1.3);
      border-width: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
  `]
})
export class PropertyMapComponent implements OnInit, OnDestroy {
  private propertyService = inject(PropertyService);
  private router = inject(Router);
  
  private map?: L.Map;
  private markers: (L.Marker | L.CircleMarker)[] = [];
  
  properties = this.propertyService.properties;
  selectedProperty = signal<Property | null>(null);
  selectedFilter = 'all';
  
  // Computed property data with profitability calculations
  propertyData = computed(() => {
    return this.properties().map(property => {
      const revenues = this.propertyService.getPropertyRevenues(property.id);
      const expenses = this.propertyService.getPropertyExpenses(property.id);
      
      const monthlyRevenue = revenues.reduce((sum: number, rev: any) => sum + rev.amount, 0);
      const monthlyExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
      const monthlyProfit = monthlyRevenue - monthlyExpenses;
      const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;
      
      let profitCategory: 'high' | 'medium' | 'low' | 'loss';
      let color: string;
      
      if (profitMargin > 20) {
        profitCategory = 'high';
        color = '#4caf50';
      } else if (profitMargin > 10) {
        profitCategory = 'medium';
        color = '#ff9800';
      } else if (profitMargin > 0) {
        profitCategory = 'low';
        color = '#f44336';
      } else {
        profitCategory = 'loss';
        color = '#9c27b0';
      }
      
      return {
        property,
        monthlyProfit,
        profitMargin,
        profitCategory,
        color
      } as PropertyMarkerData;
    });
  });
  
  selectedPropertyData = computed(() => {
    const selected = this.selectedProperty();
    if (!selected) return null;
    return this.propertyData().find(data => data.property.id === selected.id) || null;
  });
  
  // Legend counts
  highProfitCount = computed(() => 
    this.propertyData().filter(data => data.profitCategory === 'high').length
  );
  
  mediumProfitCount = computed(() => 
    this.propertyData().filter(data => data.profitCategory === 'medium').length
  );
  
  lowProfitCount = computed(() => 
    this.propertyData().filter(data => data.profitCategory === 'low').length
  );
  
  lossCount = computed(() => 
    this.propertyData().filter(data => data.profitCategory === 'loss').length
  );

  // Count properties with real coordinates
  propertiesWithRealCoords = computed(() =>
    this.properties().filter(p => p.latitude && p.longitude).length
  );

  ngOnInit() {
    this.initializeMap();
    this.loadPropertyMarkers();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap() {
    // Initialize map centered on a default location (can be customized)
    this.map = L.map('property-map').setView([40.7128, -74.0060], 10); // New York as default

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.map);
  }

  private loadPropertyMarkers() {
    this.clearMarkers();
    
    const data = this.propertyData();
    if (data.length === 0) {
      return;
    }

    const bounds = L.latLngBounds([]);
    let hasValidCoordinates = false;
    
    data.forEach((propertyData, index) => {
      const { property, profitCategory, color } = propertyData;
      
      let lat: number;
      let lng: number;
      
      // Use real coordinates if available, otherwise generate demo coordinates
      if (property.latitude && property.longitude) {
        lat = property.latitude;
        lng = property.longitude;
        hasValidCoordinates = true;
      } else {
        // Generate demo coordinates around NYC for properties without coordinates
        const baseLatOffsets = [0.05, -0.03, 0.08, -0.06, 0.02, -0.04, 0.07, -0.02];
        const baseLngOffsets = [0.06, -0.08, 0.04, -0.05, 0.09, -0.03, 0.02, -0.07];
        
        const latOffset = baseLatOffsets[index % baseLatOffsets.length] || (Math.random() - 0.5) * 0.15;
        const lngOffset = baseLngOffsets[index % baseLngOffsets.length] || (Math.random() - 0.5) * 0.2;
        
        lat = 40.7128 + latOffset;
        lng = -74.0060 + lngOffset;
      }
      
      // Create custom marker with different styles for real vs demo coordinates
      const hasRealCoordinates = property.latitude && property.longitude;
      const marker = L.circleMarker([lat, lng], {
        radius: hasRealCoordinates ? 12 : 10,
        fillColor: color,
        color: hasRealCoordinates ? 'white' : '#999',
        weight: hasRealCoordinates ? 3 : 2,
        opacity: 1,
        fillOpacity: hasRealCoordinates ? 0.8 : 0.6,
        className: `profit-marker ${profitCategory} ${hasRealCoordinates ? 'real-coords' : 'demo-coords'}`
      });

      // Add popup with property info
      const coordinateInfo = property.latitude && property.longitude 
        ? `<p style="margin: 0 0 4px 0; color: #4caf50; font-size: 12px;">📍 Real coordinates</p>`
        : `<p style="margin: 0 0 4px 0; color: #ff9800; font-size: 12px;">📍 Demo location - <a href="/properties/${property.id}/edit" style="color: #1976d2;">add real coordinates</a></p>`;
      
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0;">${property.name}</h4>
          <p style="margin: 0 0 4px 0; color: #666;">${property.address}</p>
          ${coordinateInfo}
          <p style="margin: 0 0 4px 0;"><strong>Monthly Profit:</strong> $${propertyData.monthlyProfit.toFixed(2)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Profit Margin:</strong> ${propertyData.profitMargin.toFixed(1)}%</p>
          <button onclick="window.selectProperty('${property.id}')" style="
            background: #1976d2; 
            color: white; 
            border: none; 
            padding: 6px 12px; 
            border-radius: 4px; 
            cursor: pointer;
          ">Select Property</button>
        </div>
      `);

      // Add click handler
      marker.on('click', () => {
        this.selectProperty(property);
        this.updateMarkerStyles();
      });

      marker.addTo(this.map!);
      this.markers.push(marker);
      bounds.extend([lat, lng]);
    });

    // Fit map to show all markers, or use default center if no valid coordinates
    if (bounds.isValid()) {
      this.map!.fitBounds(bounds, { padding: [20, 20] });
    } else if (!hasValidCoordinates) {
      // If no properties have real coordinates, center on NYC
      this.map!.setView([40.7128, -74.0060], 10);
    }
    
    // Make selectProperty available globally for popup buttons
    (window as any).selectProperty = (propertyId: string) => {
      const property = this.properties().find(p => p.id === propertyId);
      if (property) {
        this.selectProperty(property);
        this.updateMarkerStyles();
      }
    };
  }

  private clearMarkers() {
    this.markers.forEach(marker => {
      this.map!.removeLayer(marker);
    });
    this.markers = [];
  }

  private updateMarkerStyles() {
    // Update marker styles based on selection
    this.markers.forEach((marker, index) => {
      const propertyData = this.propertyData()[index];
      const isSelected = this.selectedProperty()?.id === propertyData.property.id;
      
      if (isSelected) {
        (marker as any).setStyle({
          radius: 16,
          weight: 4
        });
      } else {
        (marker as any).setStyle({
          radius: 12,
          weight: 3
        });
      }
    });
  }

  selectProperty(property: Property) {
    this.selectedProperty.set(property);
  }

  clearSelection() {
    this.selectedProperty.set(null);
    this.updateMarkerStyles();
  }

  updateMapView() {
    this.clearMarkers();
    this.loadPropertyMarkers();
  }

  centerMap() {
    if (this.markers.length > 0) {
      const bounds = L.latLngBounds(this.markers.map(marker => marker.getLatLng()));
      this.map!.fitBounds(bounds, { padding: [20, 20] });
    }
  }

  viewPropertyDetails() {
    const property = this.selectedProperty();
    if (property) {
      this.router.navigate(['/properties', property.id]);
    }
  }
}
