import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import burgsData from 'src/app/data/PresiaBurgs202007002034_2';
import states_helper from 'src/app/data/states_helper';
import riversData from 'src/app/data/PresiaRivers202007002034_1';
import { HttpClient } from '@angular/common/http';
import { MapService } from '../../services/map.service';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {

  private map;
  private cellsLayer;
  private burgsLayer;
  private riversLayer;
  private chosen;
  private info;
  private div;

  constructor(private http: HttpClient, private mapService: MapService) { }

  ngAfterViewInit(): void {
    this.mapService.getStates();
    this.initMap();
    this.initCellsLayer();
    this.initInfoLabel();
    this.initBurgsLayer();
    //this.initRiversLayer();
  }

  private initMap(): void {
    this.map = L.map('map', {
      maxBoundsViscosity: 1,
      attributionControl: false,
      crs: L.CRS.Simple,
      zoomControl: true, maxZoom: 8, minZoom: 3
    }).fitBounds([[22.516675118240162, 33.93735795454543], [55.03940239096744, 94.80454545454543]]);
    this.map.setMaxBounds([[0, 0], [70, 150]]);
    this.map.doubleClickZoom.disable();

    this.map.createPane('pane');
    this.map.getPane('pane').style.zIndex = 1;
    L.tileLayer('/assets/waves-stain.png', {
      pane: 'pane',
      opacity: 1
    }).addTo(this.map);

    const imageUrl = '/assets/land.png';
    const imageBounds = [[66.31578947368422, 114.375], [12.963988919667585, 34.21875]];

    this.map.createPane('pane0');
    this.map.getPane('pane0').style.zIndex = 1;
    this.map.getPane('pane0').style['mix-blend-mode'] = 'normal';
    L.imageOverlay(imageUrl, imageBounds,
      {
        opacity: 1,
        pane: 'pane0'
      }).addTo(this.map);
  }

  readonly styleCells = (feature: any): any => {
    return {
      opacity: 1,
      color: 'black',
      dashArray: '',
      weight: feature.properties['state'] !== '0' ? 3 : 0,
      lineCap: 'round',
      lineJoin: 'round',
      fill: true,
      fillOpacity: feature.properties['state'] != '0' ? 0.5 : 0,
      fillColor: states_helper.states[feature.properties['state']]['Color'],
      interactive: true,
    };
  }

  private initCellsLayer(): void {
    this.mapService.getCells()
      .subscribe((res: any) => {
        this.map.createPane('pane_PresiaCells202007002032_1');
        this.map.getPane('pane_PresiaCells202007002032_1').style.zIndex = 4;
        this.map.getPane('pane_PresiaCells202007002032_1').style['mix-blend-mode'] = 'normal';
        this.cellsLayer = new L.geoJson(res, {
          pane: 'pane_PresiaCells202007002032_1',
          attribution: '',
          interactive: true,
          style: this.styleCells,
          onEachFeature: this.onEachFeature
        });
        this.map.addLayer(this.cellsLayer);
      });
  }

  private initInfoLabel(): void {
    this.info = L.control();
    this.info.onAdd = (): any => {
      this.div = L.DomUtil.create('div', 'info');
      this.info.update();
      return this.div;
    };
    this.info.update = (props): any => {
      this.div.innerHTML = (props && +props.state !== 0 ? '<h3>Province details</h3>' +
        '<h4>State: ' + this.findState(props.state).State + '</h4>' +
        '<b>Population</b>: ' + props.population + ' people'
        : '<h3>Presia</h3>');
    };
    this.info.addTo(this.map);
  }

  private initBurgsLayer(): any {
    this.map.createPane('pane_PresiaBurgs202007002034_2');
    this.map.getPane('pane_PresiaBurgs202007002034_2').style.zIndex = 5000;
    this.map.getPane('pane_PresiaBurgs202007002034_2').style['mix-blend-mode'] = 'normal';
    this.burgsLayer = new L.geoJson(burgsData, {
      pane: 'pane_PresiaBurgs202007002034_2',
      attribution: '',
      interactive: true,
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, this.styleBurgs(feature));
      },
    });
    this.map.addLayer(this.burgsLayer);
    this.burgsLayer.eachLayer((layer) => {
      layer.bindTooltip((layer.feature.properties['Burg'] !== null ? String('<div style="color: #000000; font-size: 10pt; font-family: \'Tahoma\', sans-serif;">' + layer.feature.properties['Burg']) + '</div>' : ''), { permanent: false, offset: [-0, -0] });
    });
    this.map.on('zoomend', () => {
      this.burgsLayer.eachLayer((marker) => {
        marker.setRadius(this.map.getZoom() * this.map.getZoom() / 2);
      });
    });
  }

  readonly styleBurgs = (feature) => {
    return {
      pane: 'pane_PresiaBurgs202007002034_2',
      // radius: feature.properties['Capital'] == 'capital' ? 8 : 5,
      radius: this.map.getZoom() * this.map.getZoom() / 2,
      opacity: 1,
      color: 'rgba(83,83,83,1.0)',
      dashArray: '',
      lineCap: 'butt',
      lineJoin: 'miter',
      weight: 3.0,
      fill: true,
      fillOpacity: 1,
      fillColor: feature.properties['Capital'] == 'capital' ? 'gold' : 'rgba(247,247,247,1.0)',
      interactive: true,
    };
  }

  private initRiversLayer(): void {
    this.map.createPane('pane_PresiaRivers202007002034_1');
    this.map.getPane('pane_PresiaRivers202007002034_1').style.zIndex = 10;
    this.map.getPane('pane_PresiaRivers202007002034_1').style['mix-blend-mode'] = 'normal';
    this.riversLayer = new L.geoJson(riversData, {
      attribution: '',
      interactive: true,
      dataVar: 'json_PresiaRivers202007002034_1',
      pane: 'pane_PresiaRivers202007002034_1',
      style: this.styleRivers,
    });
    this.map.addLayer(this.riversLayer);
    this.map.on('zoomend', () => {
      this.riversLayer.eachLayer((marker) => {
        marker.setStyle({ weight: (marker.feature.properties['width'] * this.map.getZoom() * this.map.getZoom()) / 4 });
      });
    });
  }

  readonly styleRivers = (feature) => {
    return {
      pane: 'pane_PresiaRivers202007002034_1',
      opacity: 1,
      color: 'rgba(100,152,210,1.0)',
      dashArray: '',
      lineCap: 'round',
      lineJoin: 'round',
      weight: (feature.properties['width'] * this.map.getZoom() * this.map.getZoom()) / 4,
      fillOpacity: 0,
      interactive: true,
    };
  }

  readonly findState = (id: number) => {
    for (const state of states_helper.states) {
      if (state.Id === +id) {
        return state;
      }
    }
  }

  readonly setClicked = (feature) => {
    feature.setStyle({
      weight: 2,
      fillColor: 'gold',
      opacity: 0.5,
      fillOpacity: 1
    });
  }

  readonly highlightFeature = (e) => {
    const layer = e.target;
    layer.setStyle({
      weight: 2,
      color: '#666',
      dashArray: '',
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
    this.info.update(layer.feature.properties);
  }

  readonly resetHighlight = (e) => {
    this.cellsLayer.resetStyle(e.target);
    if (this.chosen === e.target) {
      this.setClicked(this.chosen);
    }
    this.info.update();
  }

  readonly onCellClick = (e) => {
    if (this.chosen !== e.target) {
      if (this.chosen != null) {
        this.cellsLayer.resetStyle(this.chosen);
      }
      this.chosen = e.target;
      this.setClicked(this.chosen);
      /*let temp = chosen.feature.properties['neighbors'];
      let neighbors = temp.substring(temp.indexOf(':')+1, temp.length-1).split(',');
      layer_PresiaCells202007002032_1.eachLayer(function (layer) {
          if (neighbors.includes(layer.feature.properties['id'])) setClicked(layer);
      });*/
    }
    else {
      this.cellsLayer.resetStyle(this.chosen);
      this.chosen = null;
    }
  }

  readonly onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: this.highlightFeature,
      mouseout: this.resetHighlight,
      click: this.onCellClick,
    });
  }

  readonly styleBiomes = (feature) => {
    return {
      opacity: 1,
      color: 'rgba(31,120,180,1.0)',
      dashArray: '',
      lineCap: 'butt',
      lineJoin: 'miter',
      weight: 1.0,
      fill: true,
      fillOpacity: 0.9,
      fillColor: 'brown',
      interactive: true,
    };
  }

}
