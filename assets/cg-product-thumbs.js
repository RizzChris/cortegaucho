/**
 * Corte Gaucho — Dynamic Thumbnail Gallery
 * Archivo: assets/cg-product-thumbs.js
 *
 * Escucha variant:change de Dawn y actualiza:
 *   Cuadro 3 (funda)  → siempre con variant.featured_image
 *   Cuadro 4 (logo)   → visible solo si option3 contiene "logotipo"
 *   Cuadro 5 (caja)   → visible solo si option3 contiene "caja"
 *   Cuadros 1 y 2     → nunca se tocan (son metafields estáticos)
 */

(function () {
  'use strict';

  // ─── Constantes ─────────────────────────────────────────────────────────────
  const FADE_MS = 150;

  // IDs de los cuadros dinámicos
  const IDS = {
    funda:       'cg-img-funda',
    logo:        'cg-img-logo',
    caja:        'cg-img-caja',
    wrapLogo:    'cg-thumb-logo',
    wrapCaja:    'cg-thumb-caja',
    wrapDynamic: 'cg-thumb-dynamic',
    msgLogo:     'cg-multi-logo-msg',
  };

  const HIDDEN_CLASS = 'cg-hidden';

  // ─── Utilidades ─────────────────────────────────────────────────────────────

  /** Actualiza src de una imagen con efecto fade */
  function setImg(imgEl, src, alt) {
    if (!imgEl || !src) return;
    if (imgEl.src === src) return; // Sin cambio, evitar parpadeo

    imgEl.style.transition = `opacity ${FADE_MS}ms ease`;
    imgEl.style.opacity = '0';
    setTimeout(() => {
      imgEl.src = src;
      if (alt) imgEl.alt = alt;
      imgEl.style.opacity = '1';
      imgEl.style.display = 'block';
    }, FADE_MS);
  }

  /** Muestra u oculta un elemento por clase */
  function setVisible(el, visible) {
    if (!el) return;
    if (visible) {
      el.classList.remove(HIDDEN_CLASS);
    } else {
      el.classList.add(HIDDEN_CLASS);
    }
  }

  /** Limpia la URL de Shopify quitando parámetros de tamaño */
  function cleanSrc(src) {
    if (!src) return '';
    return src.split('?')[0];
  }

  // ─── Lógica principal ────────────────────────────────────────────────────────

  /**
   * Procesa el cambio de variante y actualiza los cuadros 3, 4 y 5.
   * @param {object} variant — objeto de variante de Shopify
   */
  function handleVariantChange(variant) {
    if (!variant) return;

    const src     = cleanSrc(variant.featured_image?.src);
    const option3 = (variant.option3 || '').toLowerCase();

    const hasLogo = option3.includes('logotipo');
    const hasCaja = option3.includes('caja');

    // ── Cuadro 3: Funda — siempre se actualiza ──
    const imgFunda   = document.getElementById(IDS.funda);
    const wrapFunda  = document.getElementById(IDS.wrapDynamic);

    if (src) {
      setImg(imgFunda, src, variant.title + ' — funda');
      setVisible(wrapFunda, true);
    } else {
      setVisible(wrapFunda, false);
    }

    // ── Cuadro 4: Logo — visible solo si option3 contiene "logotipo" ──
    const imgLogo  = document.getElementById(IDS.logo);
    const wrapLogo = document.getElementById(IDS.wrapLogo);
    const msgLogo  = document.getElementById(IDS.msgLogo);

    setVisible(wrapLogo, hasLogo);
    setVisible(msgLogo, hasLogo);

    if (hasLogo && src) {
      setImg(imgLogo, src, 'Con logotipo');
    }

    // ── Cuadro 5: Caja — visible solo si option3 contiene "caja" ──
    const imgCaja  = document.getElementById(IDS.caja);
    const wrapCaja = document.getElementById(IDS.wrapCaja);

    setVisible(wrapCaja, hasCaja);

    if (hasCaja && src) {
      setImg(imgCaja, src, 'Con caja');
    }
  }

  // ─── Buscar variante por ID en los datos embebidos ───────────────────────────

  function getVariantById(id) {
    // window.CG_THUMBS.allVariants viene del Liquid (product.variants | json)
    const variants = window.CG_THUMBS?.allVariants || [];
    return variants.find(v => v.id === id) || null;
  }

  // ─── Listeners ───────────────────────────────────────────────────────────────

  function bindEvents() {

    // Método 1: evento pub/sub de Dawn (versiones recientes)
    document.addEventListener('variant:change', function (e) {
      const variant = e.detail?.variant;
      handleVariantChange(variant);
    });

    // Método 2: fallback — escuchar cambio en el input hidden "id" del formulario
    // Dawn actualiza ese input cuando el cliente selecciona una variante
    document.addEventListener('change', function (e) {
      const target = e.target;

      // Solo nos interesan los inputs de variante de Dawn
      const isVariantInput =
        target.matches('[name="id"]') ||
        target.matches('.product-form__input input[type="radio"]') ||
        target.matches('[data-variant-id]');

      if (!isVariantInput) return;

      // Leer el id del input hidden más cercano dentro del formulario
      const form      = target.closest('form[action="/cart/add"]');
      const idInput   = form?.querySelector('input[name="id"]');
      const variantId = parseInt(idInput?.value, 10);

      if (!variantId) return;

      const variant = getVariantById(variantId);
      handleVariantChange(variant);
    });
  }

  // ─── Init ────────────────────────────────────────────────────────────────────

  function init() {
    // Solo correr si el wrapper existe en la página
    if (!document.querySelector('[data-cg-thumbs]')) return;

    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();