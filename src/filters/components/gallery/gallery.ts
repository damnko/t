import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input, OnChanges, AfterViewInit, Output, EventEmitter, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { FiltersState, GalleryModel, OverlayStyle, FilterStyle, presets } from 'src/filters';
import { Subject } from 'rxjs/Subject';
import { FiltersService } from '../../services/filters-service';
import { fromJS } from 'immutable';
import * as Swiper from 'swiper';
import './gallery.scss';
import '../../../../node_modules/swiper/dist/css/swiper.css';
import 'rxjs/add/operator/debounceTime';

@Component({
  selector: 'gallery',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:`
  <section>
    <div class="swiper-container" #swiper
      [ngClass]="{'is-active': active}">
      <div class="swiper-wrapper">
        <div class="swiper-slide" *ngFor="let record of gallery; let idx = index;">
          <spinner-loader [loading]="loading"></spinner-loader>
          <div class="thumb"
            [ngClass]="{'selected': idx === selected && !customFilters }"
            (click)="select(record.figureStyle, record.overlayStyle, idx, record.key)">
            <figure class="thumb__figure" [ngStyle]="record.figureStyle">
              <div [ngStyle]="record.overlayStyle"></div>
              <img class="thumb__img" [src]="record.image" (load)="imageLoaded()">
            </figure>
            <p class="thumb__label">{{ record.labelName }}</p>
          </div>
        </div>
      </div>
      <div class="swiper-scrollbar" #scrollbar></div>
    </div>
  </section>
  `
})
export class GalleryComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() image: string;
  @Input() active: boolean = true;
  @Input() customFilters: boolean;
  @Input() loading: boolean;
  @Output() onSelect: EventEmitter<any> = new EventEmitter<any>(false);

  @ViewChild('swiper') swiperGallery: ElementRef;
  @ViewChild('scrollbar') scrollbar: ElementRef;
  gallery: GalleryModel[] = [];
  private selected: number;
  private imageLoaded$ = new Subject<boolean>();

  constructor(private filters: FiltersService) {}

  ngOnChanges(changes: any): void {
    if (changes.image) {
      this.gallery = this.getGalleryImages(changes.image.currentValue);
    }
  }

  ngAfterViewInit(): void {
    const mySwiper = new Swiper(this.swiperGallery.nativeElement, {
      slidesPerView: 'auto',
      scrollbar: this.scrollbar.nativeElement,
    });
    this.imageLoaded$.debounceTime(50)
      .subscribe(() => {
        this.filters.change({
          value: false,
          type: 'loading'
        });
      });
  }

  ngOnDestroy(): void {
    this.imageLoaded$.next(false);
  }

  imageLoaded(): void {
    this.imageLoaded$.next(true);
  }

  select(figure: FilterStyle, overlay: OverlayStyle, id: number, key: string): void {
    if (this.selected !== id || this.customFilters) {
      this.selected = id;
      const figureStyle = fromJS(figure);
      const overlayStyle = fromJS(overlay);
      this.onSelect.emit({ figureStyle, overlayStyle, key });
    }
  }

  getGalleryImages(src: string): GalleryModel[] {
    const data: GalleryModel[] = [];
    Object.keys(presets).forEach((key: string) => {
      const name = key.replace(/^./, key[0].toUpperCase());
      const object = presets[key];
      data.push({
        key: key,
        labelName: name,
        image: src,
        figureStyle: this.getGalleryFigureStyle(object.filter),
        overlayStyle: this.getGalleryOverlayStyle(object.overlay)
      });
    });
    return data;
  }

  getGalleryFigureStyle(filter: FiltersState): { position: string, WebkitFilter: string, filter: string } {
    return {
      WebkitFilter: this.getFigureStyle(filter),
      filter: this.getFigureStyle(filter),
      position: 'relative'
    };
  }

  getFigureStyle(state: FiltersState): string {
    let filters = '';
    filters += state.get('contrast') ? `contrast(${state.get('contrast')}%) ` : '';
    filters += state.get('brightness') ? `brightness(${state.get('brightness')}%) `: '';
    filters += state.get('saturate') ? `saturate(${state.get('saturate')}%) `: '';
    filters += state.get('sepia') ? `sepia(${state.get('sepia')}%) `: '';
    filters += state.get('grayscale') ? `grayscale(${state.get('grayscale')}%) `: '';
    filters += state.get('invert') ? `invert(${state.get('invert')}%) `: '';
    filters += state.get('hueRotate') ? `hue-rotate(${state.get('hueRotate')}deg) `: '';
    filters += state.get('blur') ? `blur(${state.get('blur')}px) `: '';
    return filters;
  }

  getGalleryOverlayStyle(overlay: FiltersState): OverlayStyle {
    return {
      content: ' ',
      display: 'block',
      height: '100%',
      width: '100%',
      top: '0',
      left: '0',
      pointerEvents: 'none',
      position: 'absolute',
      opacity: 1,
      background: this.getOverlayBackground(overlay.get('type'), overlay)
    };
  }

  getOverlayBackground(overlayType: string, overlay: FiltersState): string {
    let color1: string = overlay.get('color1') ? `rgba(${overlay.get('color1').get('color').get('r')}, ${overlay.get('color1').get('color').get('g')}, ${overlay.get('color1').get('color').get('b')}, ${overlay.get('color1').get('color').get('a')})` : '';
    let stop1: string = overlay.get('color1') && overlay.get('color1').get('stop') ? overlay.get('color1').get('stop') : '';
    let color2: string = overlay.get('color2') ? `rgba(${overlay.get('color2').get('color').get('r')}, ${overlay.get('color2').get('color').get('g')}, ${overlay.get('color2').get('color').get('b')}, ${overlay.get('color2').get('color').get('a')})` : '';
    let stop2: string = overlay.get('color2') && overlay.get('color2').get('stop') ? overlay.get('color2').get('stop') : '';
    let direction: string = overlay.get('direction') ? overlay.get('direction') : '';
    let position: string = overlay.get('position') ? overlay.get('position') : null;
    let size: string = overlay.get('size') ? overlay.get('size') : null;

    switch (overlayType) {
      case 'solid':
        return `rgba(${overlay.get('color').get('r')}, ${overlay.get('color').get('g')}, ${overlay.get('color').get('b')}, ${overlay.get('color').get('a')})`;
      case 'linear':
        return `linear-gradient(${direction}, ${color1} ${stop1}%, ${color2} ${stop2}%)`;
      case 'radial':
        return `-webkit-radial-gradient(${position}, circle ${size}, ${color1} ${stop1}%, ${color2} ${stop2}%)`;
    }
  }
}
