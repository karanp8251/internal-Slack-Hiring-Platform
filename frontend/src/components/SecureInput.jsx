import React, { useEffect, useRef, useState } from 'react';

const SecureInput = ({
  type = 'text',
  required = false,
  min,
  max,
  placeholder,
  value,
  onChange,
  className,
  name,
  id,
  ...rest
}) => {
  const inputRef = useRef(null);
  const [tampered, setTampered] = useState(false);

  useEffect(() => {
    const inputEl = inputRef.current;
    if (!inputEl) return;

    // Define our expected configuration
    const expected = {
      type,
      required: required ? 'true' : null,
      min: min !== undefined ? String(min) : null,
      max: max !== undefined ? String(max) : null,
    };

    const restoreAttributes = () => {
      let detected = false;
      Object.entries(expected).forEach(([attr, val]) => {
        if (val !== null) {
          if (inputEl.getAttribute(attr) !== val) {
            detected = true;
            inputEl.setAttribute(attr, val);
          }
        } else {
          if (inputEl.hasAttribute(attr)) {
            detected = true;
            inputEl.removeAttribute(attr);
          }
        }
      });
      if (detected) {
        setTampered(true);
        console.warn(`Security Warning: Attribute tampering detected on input "${name || id}". Restoring secure defaults.`);
      }
    };

    // Initial check
    restoreAttributes();

    // Set up MutationObserver to monitor attribute changes
    const observer = new MutationObserver(() => {
      restoreAttributes();
    });

    observer.observe(inputEl, {
      attributes: true,
      attributeFilter: ['type', 'required', 'min', 'max'],
    });

    return () => {
      observer.disconnect();
    };
  }, [type, required, min, max, name, id]);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type={type}
        required={required}
        min={min}
        max={max}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${className || ''} ${
          tampered ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/20' : ''
        }`}
        name={name}
        id={id}
        {...rest}
      />
      {tampered && (
        <p className="text-[10px] text-red-650 font-bold mt-1">
          ⚠️ Input tampering detected! Secure configuration restored.
        </p>
      )}
    </div>
  );
};

export default SecureInput;
