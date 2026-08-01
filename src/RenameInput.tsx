import { useCallback, useEffect, useRef, useState } from 'react';

export type RenameInputProps = {
  initialValue: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

/**
 * Inline rename field. Ported from the CAD app's `LayerNameInput` with the
 * preset-suggestion dropdown and its portal removed — the package has no
 * opinion about what a row should be called.
 *
 * Enter commits, Escape reverts, blur commits. Keystrokes are swallowed so
 * the tree's own keyboard navigation does not fire while you are typing.
 */
export function RenameInput({ initialValue, onSubmit, onCancel }: RenameInputProps) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const commit = useCallback(() => {
    if (done.current) return;
    done.current = true;
    const next = value.trim();
    if (next && next !== initialValue) onSubmit(next);
    else onCancel();
  }, [value, initialValue, onSubmit, onCancel]);

  const cancel = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onCancel();
  }, [onCancel]);

  return (
    <input
      ref={ref}
      className="ft-rename"
      value={value}
      autoComplete="off"
      spellCheck={false}
      aria-label="Rename"
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onBlur={commit}
      onKeyDown={(e) => {
        // Never let a keystroke reach the tree's navigation handler.
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        }
      }}
    />
  );
}
