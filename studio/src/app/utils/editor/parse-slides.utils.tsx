import {h, JSX} from '@stencil/core';

import {v4 as uuid} from 'uuid';

import {convertStyle} from '@deckdeckgo/deck-utils';

import {ParseElementsUtils} from './parse-elements.utils';

import {QRCodeUtils} from './qrcode.utils';

import {Slide, SlideTemplate} from '../../models/data/slide';
import {Deck} from '../../models/data/deck';
import {EnvironmentDeckDeckGoConfig} from '../../services/core/environment/environment-config';
import {EnvironmentConfigService} from '../../services/core/environment/environment-config.service';

export class ParseSlidesUtils {
  static parseSlide(deck: Deck, slide: Slide, contentEditable: boolean, ignoreSlideId: boolean = false): Promise<JSX.IntrinsicElements> {
    return new Promise<JSX.IntrinsicElements>(async (resolve) => {
      if (!document || !slide || !slide.data || !slide.data.template) {
        resolve(null);
        return;
      }

      if (SlideTemplate[slide.data.template.toUpperCase()]) {
        // prettier-ignore
        resolve(await this.parseSlideElement(deck, slide, `deckgo-slide-${SlideTemplate[slide.data.template.toUpperCase()].toLowerCase()}`, contentEditable, ignoreSlideId));
      } else {
        resolve(null);
      }
    });
  }

  private static parseSlideElement(
    deck: Deck,
    slide: Slide,
    slideTag: string,
    contentEditable: boolean,
    ignoreSlideId: boolean
  ): Promise<JSX.IntrinsicElements> {
    return new Promise<JSX.IntrinsicElements>(async (resolve) => {
      if (!document) {
        resolve();
        return;
      }

      let content = undefined;

      // Create a div to parse back to JSX its children
      const div = document.createElement('div');

      if (slide.data.content && slide.data.content !== undefined) {
        div.innerHTML = slide.data.content;
        content = await ParseElementsUtils.parseElements(div, true, contentEditable);
      }

      const attributes = {
        style: slide.data.attributes ? await convertStyle(slide.data.attributes.style) : undefined,
        src: slide.data.attributes && slide.data.attributes.src ? slide.data.attributes.src : undefined,
        'custom-background': slide.data.attributes && slide.data.attributes.customBackground ? slide.data.attributes.customBackground : undefined,
        'img-src': slide.data.attributes && slide.data.attributes.imgSrc ? slide.data.attributes.imgSrc : undefined,
        'img-alt': slide.data.attributes && slide.data.attributes.imgAlt ? slide.data.attributes.imgAlt : undefined,
      };

      if (slide.data.template === SlideTemplate.QRCODE) {
        attributes['content'] = slide.data.attributes && slide.data.attributes.content ? slide.data.attributes.content : QRCodeUtils.getPresentationUrl(deck);
        attributes['custom-qrcode'] = slide.data.attributes && slide.data.attributes.content ? 'true' : undefined;
      }

      if (slide.data.template === SlideTemplate.CHART) {
        attributes['type'] = slide.data.attributes && slide.data.attributes.type ? slide.data.attributes.type : undefined;
        attributes['inner-radius'] = slide.data.attributes && slide.data.attributes.innerRadius ? slide.data.attributes.innerRadius : undefined;
        attributes['animation'] = slide.data.attributes && slide.data.attributes.animation ? slide.data.attributes.animation : undefined;
        attributes['date-pattern'] = slide.data.attributes && slide.data.attributes.datePattern ? slide.data.attributes.datePattern : undefined;
        attributes['y-axis-domain'] = slide.data.attributes && slide.data.attributes.yAxisDomain ? slide.data.attributes.yAxisDomain : undefined;
        attributes['smooth'] = slide.data.attributes && slide.data.attributes.smooth === false ? 'false' : undefined;
        attributes['area'] = slide.data.attributes && slide.data.attributes.area === false ? 'false' : undefined;
        attributes['ticks'] = slide.data.attributes && slide.data.attributes.ticks ? slide.data.attributes.ticks : undefined;
        attributes['grid'] = slide.data.attributes && slide.data.attributes.grid ? 'true' : undefined;
        attributes['separator'] = slide.data.attributes && slide.data.attributes.separator ? slide.data.attributes.separator : undefined;
        attributes['custom-loader'] = 'true';
      }

      if (slide.data.template === SlideTemplate.SPLIT) {
        attributes['vertical'] = slide.data.attributes && slide.data.attributes.vertical ? 'true' : undefined;
        attributes['type'] = slide.data.attributes && slide.data.attributes.type ? slide.data.attributes.type : undefined;
      }

      if (slide.data.template === SlideTemplate.POLL) {
        const deckDeckGoConfig: EnvironmentDeckDeckGoConfig = EnvironmentConfigService.getInstance().get('deckdeckgo');
        attributes['pollLink'] = deckDeckGoConfig.pollUrl;
        attributes['socketUrl'] = deckDeckGoConfig.socketUrl;
      }

      if (slide.data.template === SlideTemplate.AUTHOR) {
        attributes['img-mode'] = slide.data.attributes && slide.data.attributes.imgMode ? slide.data.attributes.imgMode : undefined;
      }

      if (slide.data.template === SlideTemplate['ASPECT-RATIO']) {
        attributes['grid'] = true;
        attributes['editable'] = true;
      }

      const SlideElement: string = slideTag;

      const result: JSX.IntrinsicElements = (
        <SlideElement key={uuid()} slide_id={ignoreSlideId ? undefined : slide.id} {...attributes}>
          {content}
        </SlideElement>
      );

      resolve(result);
    });
  }
}
