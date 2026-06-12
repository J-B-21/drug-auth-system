const GS1_SEPARATOR = '\u001d';

const FIXED_LENGTH_AI = Object.freeze({
  '01': { field: 'gtin', length: 14, pattern: /^\d{14}$/ },
  '17': { field: 'expiry_date', length: 6, pattern: /^\d{6}$/ },
});

const VARIABLE_LENGTH_AI = Object.freeze({
  '10': { field: 'batch_number', maxLength: 20, pattern: /^[A-Za-z0-9._~!@#$%&*+=:;,\-/]{1,20}$/ },
  '21': { field: 'serial_number', maxLength: 20, pattern: /^[A-Za-z0-9._~!@#$%&*+=:;,\-/]{1,20}$/ },
});

const normalizeGs1 = (rawString) => rawString
  .trim()
  .replace(/\((\d{2})\)/g, `${GS1_SEPARATOR}$1`)
  .replace(/[~\u001d]/g, GS1_SEPARATOR)
  .replace(/\s+/g, GS1_SEPARATOR)
  .replace(new RegExp(`${GS1_SEPARATOR}+`, 'g'), GS1_SEPARATOR)
  .replace(new RegExp(`^${GS1_SEPARATOR}`), '');

const looksLikeGs1 = (rawString) => {
  if (!rawString || typeof rawString !== 'string') {
    return false;
  }

  const normalized = normalizeGs1(rawString);

  return (
    /^\(01\)\d{14}/.test(rawString.trim()) ||
    /^01\d{14}(10|17|21|\u001d)/.test(normalized) ||
    normalized.includes(GS1_SEPARATOR)
  );
};

const malformed = (reason) => ({
  malformed: true,
  reason,
  components: null,
});

const parseGs1DataMatrix = (rawString) => {
  if (!looksLikeGs1(rawString)) {
    return null;
  }

  const source = normalizeGs1(rawString);
  const components = {};
  let currentIndex = 0;
  let iterations = 0;

  while (currentIndex < source.length) {
    iterations += 1;

    if (iterations > 20) {
      return malformed('too_many_segments');
    }

    if (source[currentIndex] === GS1_SEPARATOR) {
      currentIndex += 1;
      continue;
    }

    const ai = source.slice(currentIndex, currentIndex + 2);

    if (FIXED_LENGTH_AI[ai]) {
      const definition = FIXED_LENGTH_AI[ai];
      const start = currentIndex + 2;
      const end = start + definition.length;
      const value = source.slice(start, end);

      if (value.length !== definition.length || !definition.pattern.test(value)) {
        return malformed(`invalid_ai_${ai}`);
      }

      components[definition.field] = value;
      currentIndex = end;
      continue;
    }

    if (VARIABLE_LENGTH_AI[ai]) {
      const definition = VARIABLE_LENGTH_AI[ai];
      const start = currentIndex + 2;
      let end = start;

      while (end < source.length && source[end] !== GS1_SEPARATOR) {
        end += 1;
      }

      const value = source.slice(start, end);

      if (!value || value.length > definition.maxLength || !definition.pattern.test(value)) {
        return malformed(`invalid_ai_${ai}`);
      }

      components[definition.field] = value;
      currentIndex = end;
      continue;
    }

    return malformed(`unknown_ai_${ai || 'empty'}`);
  }

  if (components.gtin && (components.serial_number || components.batch_number)) {
    delete components.expiry_date;

    return {
      malformed: false,
      components,
    };
  }

  return null;
};

module.exports = {
  parseGs1DataMatrix,
};
