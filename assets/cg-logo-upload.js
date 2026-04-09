(() => {
  const LOGO_TRIGGER_PATTERN = /logo\s*[-_]?\s*(1|2)/;

  const normalizeText = (value) =>
    (value || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const selectedOptionValues = (productInfo) => {
    const variantSelects = productInfo.querySelector('variant-selects');
    if (!variantSelects) return [];

    const values = [];

    variantSelects.querySelectorAll('fieldset').forEach((fieldset) => {
      const selected = fieldset.querySelector('input[type="radio"]:checked');
      if (selected) values.push(selected.value || '');
    });

    variantSelects.querySelectorAll('select').forEach((select) => {
      values.push(select.value || '');
    });

    return values;
  };

  const requiresLogoUpload = (productInfo) => {
    return selectedOptionValues(productInfo).some((value) => {
      return LOGO_TRIGGER_PATTERN.test(normalizeText(value));
    });
  };

  const updateUploadState = (productInfo) => {
    if (!productInfo) return;

    const uploadBlock = productInfo.querySelector('[data-cg-logo-upload]');
    if (!uploadBlock) return;

    const fileInput = uploadBlock.querySelector('.cg-logo-upload__file-input');
    const instructionsInput = uploadBlock.querySelector('input[name="properties[Logo instrucciones]"]');
    const errorNode = uploadBlock.querySelector('[data-cg-file-error]');
    const fileNameNode = uploadBlock.querySelector('[data-cg-file-name]');

    const active = requiresLogoUpload(productInfo);

    uploadBlock.classList.toggle('hidden', !active);

    [fileInput, instructionsInput].forEach((field) => {
      if (!field) return;
      field.disabled = !active;
    });

    if (fileInput) {
      fileInput.required = active;
    }

    if (!active) {
      if (fileInput) fileInput.value = '';
      if (instructionsInput) instructionsInput.value = '';
      if (fileNameNode) fileNameNode.textContent = '';
      if (errorNode) errorNode.classList.add('hidden');
    }
  };

  const validateBeforeSubmit = (form) => {
    const productInfo = form.closest('product-info');
    if (!productInfo) return true;

    const uploadBlock = productInfo.querySelector('[data-cg-logo-upload]');
    if (!uploadBlock || uploadBlock.classList.contains('hidden')) return true;

    const fileInput = uploadBlock.querySelector('.cg-logo-upload__file-input');
    const errorNode = uploadBlock.querySelector('[data-cg-file-error]');

    if (!fileInput || fileInput.disabled) return true;

    if (fileInput.files && fileInput.files.length > 0) {
      if (errorNode) errorNode.classList.add('hidden');
      return true;
    }

    if (errorNode) errorNode.classList.remove('hidden');
    return false;
  };

  const onClick = (event) => {
    const fileButton = event.target.closest('[data-cg-file-btn]');
    if (!fileButton) return;

    const uploadBlock = fileButton.closest('[data-cg-logo-upload]');
    const fileInput = uploadBlock?.querySelector('.cg-logo-upload__file-input');
    if (fileInput && !fileInput.disabled) fileInput.click();
  };

  const onChange = (event) => {
    const target = event.target;

    if (target.matches('.cg-logo-upload__file-input')) {
      const uploadBlock = target.closest('[data-cg-logo-upload]');
      if (!uploadBlock) return;

      const fileNameNode = uploadBlock.querySelector('[data-cg-file-name]');
      const errorNode = uploadBlock.querySelector('[data-cg-file-error]');

      if (fileNameNode) {
        if (target.files && target.files.length) {
          fileNameNode.textContent = target.files[0].name;
        } else {
          fileNameNode.textContent = '';
        }
      }

      if (errorNode) errorNode.classList.add('hidden');
      return;
    }

    if (target.closest('variant-selects')) {
      updateUploadState(target.closest('product-info'));
    }
  };

  const onSubmit = (event) => {
    const form = event.target.closest('form[data-type="add-to-cart-form"]');
    if (!form) return;

    if (!validateBeforeSubmit(form)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  const initializeAll = () => {
    document.querySelectorAll('product-info').forEach(updateUploadState);
  };

  document.addEventListener('DOMContentLoaded', initializeAll);
  document.addEventListener('product-info:loaded', initializeAll);
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('submit', onSubmit, true);
})();
