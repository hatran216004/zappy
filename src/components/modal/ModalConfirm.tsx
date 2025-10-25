/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type MaybeNode = React.ReactNode;

export type ConfirmOptions = {
  title?: MaybeNode;
  description?: MaybeNode;
  confirmText?: string; // default: "Confirm"
  cancelText?: string; // default: "Cancel"
  destructive?: boolean; // default: false
  icon?: MaybeNode;
  autoFocusConfirm?: boolean; // default: true
  dismissible?: boolean; // default: false (chuẩn confirm)
};

type Resolver = (ok: boolean) => void;

const defaultOptions: Required<
  Omit<ConfirmOptions, 'title' | 'description' | 'icon'>
> = {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  destructive: false,
  autoFocusConfirm: true,
  dismissible: false
};

type ConfirmContextType = {
  confirm: (opts?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = React.createContext<ConfirmContextType | null>(null);
export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx)
    throw new Error('useConfirm must be used within ConfirmPopupProvider');
  return ctx.confirm;
}

export default function ConfirmPopupProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const resolveRef = React.useRef<Resolver | null>(null);
  const confirmBtnRef = React.useRef<HTMLButtonElement | null>(null);

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [opts, setOpts] = React.useState<ConfirmOptions>(defaultOptions);

  const confirm = React.useCallback((options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOpts({ ...defaultOptions, ...(options ?? {}) });
      setLoading(false);
      setOpen(true);
      resolveRef.current = resolve;
    });
  }, []);

  const finish = React.useCallback((ok: boolean) => {
    if (!resolveRef.current) return;
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setOpen(false);
    setLoading(false);
    resolve(ok);
  }, []);

  // Auto focus Confirm
  React.useEffect(() => {
    if (open && opts.autoFocusConfirm) {
      const id = requestAnimationFrame(() => confirmBtnRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open, opts.autoFocusConfirm]);

  // Enter để confirm
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmBtnRef.current?.click();
      }
      if (e.key === 'Escape' && !opts.dismissible) {
        // chặn Esc khi không dismissible
        e.stopPropagation();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, opts.dismissible]);

  const handleOpenChange = (next: boolean) => {
    // Khi Dialog đóng vì outside/Esc → coi như Cancel nếu được phép
    if (!next) {
      if (opts.dismissible) finish(false);
      else setOpen(true); // giữ mở nếu không dismissible
    } else {
      setOpen(true);
    }
  };

  const onConfirm = () => {
    if (loading) return;
    setLoading(true);
    finish(true);
  };
  const onCancel = () => {
    if (loading) return;
    finish(false);
  };

  const { title, description, confirmText, cancelText, destructive, icon } =
    opts;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader className="space-y-2">
            <div className="flex items-start gap-3">
              {icon ? <div className="mt-0.5">{icon}</div> : null}
              <div>
                <DialogTitle className="text-lg">
                  {title ?? 'Are you sure?'}
                </DialogTitle>
                {description ? (
                  <DialogDescription className="text-muted-foreground">
                    {description}
                  </DialogDescription>
                ) : null}
              </div>
            </div>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              {cancelText ?? defaultOptions.cancelText}
            </Button>
            <Button
              ref={confirmBtnRef}
              onClick={onConfirm}
              disabled={loading}
              variant={destructive ? 'destructive' : 'default'}
            >
              {loading
                ? 'Processing...'
                : confirmText ?? defaultOptions.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
