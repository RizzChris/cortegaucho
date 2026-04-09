/**
 * CG Product Thumbs
 * Galeria dinamica de miniaturas para Corte Gaucho.
 *
 * Escucha cambios de variante en Dawn y actualiza la miniatura dinamica
 * segun el metafield product.metafields.cortegaucho.thumb_dynamic.
 *
 * Valores posibles de thumb_dynamic:
 *   'funda'   -> Option1 es la funda (cuchillos)
 *   'vaina'   -> Option1 es vaina con/sin (sets trinchar)
 *   'tamano'  -> Option1 es tamano (vainas sueltas)
 *   'none'    -> Sin miniatura dinamica (cajas)
 */

class CGProductThumbs {
  constructor(container) {
    this.container = container;
    this.dynamicType = container.dataset.dynamic || 'none';
    this.thumbDynamic = container.querySelector('.cg-thumb--dynamic');
    this.thumbs = Array.from(container.querySelectorAll('.cg-thumb'));
    this.fixedThumb1 = container.querySelector('.cg-thumb[data-index="1"] img')?.src || '';
    this.sectionId = container.closest('product-info')?.dataset.section || '';
    this.mediaGallery = container.closest('product-info')?.querySelector('media-gallery') || document.querySelector('media-gallery');
    this.boundVariantChange = this.handleVariantChange.bind(this);
    this.boundThumbClick = this.handleThumbClick.bind(this);

    this.init();
  }

  init() {
    if (this.container.dataset.initialized === 'true') return;
    this.container.dataset.initialized = 'true';

    this.thumbs.forEach((thumb) => {
      thumb.addEventListener('click', this.boundThumbClick);
    });

    if (this.dynamicType === 'none' || !this.thumbDynamic) return;

    // Dawn reciente: evento interno por pub/sub.
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      this.unsubscribeVariant = subscribe(PUB_SUB_EVENTS.variantChange, ({ data }) => {
        if (!data?.variant) return;
        if (this.sectionId && data.sectionId && this.sectionId !== data.sectionId) return;
        this.handleVariantData(data.variant);
      });
    }

    // Fallback para implementaciones que emiten evento DOM.
    document.addEventListener('variant:change', this.boundVariantChange);

    const initialVariant = this.getSelectedVariant();
    if (initialVariant?.featured_image) {
      this.handleVariantData(initialVariant);
    }
  }

  handleVariantChange(event) {
    const variant = event?.detail?.variant;
    if (!variant) return;
    this.handleVariantData(variant);
  }

  handleVariantData(variant) {
    const label = this.getOptionLabel(variant);

    if (variant.featured_image?.src) {
      this.updateDynamicThumb(
        variant.featured_image.src,
        variant.featured_image.alt || label,
        label
      );
      return;
    }

    // "Sin funda" y "Sin vaina" reutilizan la miniatura 1 en lugar de ocultar.
    if (this.fixedThumb1 && this.matchesNoAccessoryLabel(label)) {
      this.updateDynamicThumb(this.fixedThumb1, label || 'Sin accesorio', label);
      return;
    }

    this.hideDynamicThumb();
  }

  matchesNoAccessoryLabel(label) {
    if (!label) return false;
    const normalized = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    return normalized.includes('sin funda') || normalized.includes('sin vaina');
  }

  getSelectedVariant() {
    try {
      const selectedVariantScript = this.container
        .closest('product-info')
        ?.querySelector('variant-selects [data-selected-variant]');

      if (!selectedVariantScript) return null;
      return JSON.parse(selectedVariantScript.textContent || 'null');
    } catch (error) {
      return null;
    }
  }

  getOptionLabel(variant) {
    switch (this.dynamicType) {
      case 'funda':
      case 'vaina':
      case 'tamano':
        return variant.option1 || '';
      default:
        return '';
    }
  }

  updateDynamicThumb(src, alt, label) {
    if (!this.thumbDynamic) return;

    const img = this.thumbDynamic.querySelector('img');
    const labelEl = this.thumbDynamic.querySelector('.cg-thumb__label');
    if (!img) return;

    this.thumbDynamic.classList.add('cg-thumb--updating');

    window.setTimeout(() => {
      img.src = src;
      img.alt = alt || label || 'Accesorio seleccionado';
      if (labelEl) labelEl.textContent = label || '';
      this.thumbDynamic.style.display = '';
      this.thumbDynamic.classList.remove('cg-thumb--updating');
    }, 150);
  }

  hideDynamicThumb() {
    if (!this.thumbDynamic) return;
    this.thumbDynamic.style.display = 'none';
  }

  handleThumbClick(event) {
    const thumb = event.currentTarget;
    if (!thumb) return;

    this.thumbs.forEach((item) => item.classList.remove('cg-thumb--active'));
    thumb.classList.add('cg-thumb--active');

    const targetImgSrc = thumb.querySelector('img')?.src;
    if (!targetImgSrc) return;

    if (!this.trySetActiveMediaByImage(targetImgSrc)) {
      this.updateVisibleImageFallback(thumb);
    }
  }

  trySetActiveMediaByImage(targetImgSrc) {
    if (!this.mediaGallery || typeof this.mediaGallery.setActiveMedia !== 'function') return false;

    const normalizedTarget = this.normalizeImageUrl(targetImgSrc);
    const items = this.mediaGallery.querySelectorAll('[data-media-id]');

    for (const item of items) {
      const itemImg = item.querySelector('img');
      if (!itemImg) continue;

      const currentSrc = this.normalizeImageUrl(itemImg.currentSrc || itemImg.src);
      if (currentSrc === normalizedTarget) {
        this.mediaGallery.setActiveMedia(item.dataset.mediaId, false);
        return true;
      }
    }

    return false;
  }

  updateVisibleImageFallback(thumb) {
    const img = thumb.querySelector('img');
    const activeImage = this.mediaGallery?.querySelector('.product__media-item.is-active img')
      || document.querySelector('.product__media-item.is-active img')
      || document.querySelector('.product__media-list .product__media-item img');

    if (!img || !activeImage) return;

    activeImage.src = img.src;
    activeImage.srcset = '';
    activeImage.alt = img.alt || activeImage.alt;
  }

  normalizeImageUrl(url) {
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.origin + parsed.pathname;
    } catch (error) {
      return url;
    }
  }
}

function initCGProductThumbs() {
  document.querySelectorAll('.cg-thumbs').forEach((container) => {
    new CGProductThumbs(container);
  });
}

document.addEventListener('DOMContentLoaded', initCGProductThumbs);
document.addEventListener('shopify:section:load', initCGProductThumbs);
