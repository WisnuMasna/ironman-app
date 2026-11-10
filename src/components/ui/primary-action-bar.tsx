export function PrimaryActionBar({
  label,
  onClick,
  formAction,
  type = "button",
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  formAction?: (formData: FormData) => void | Promise<void>;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  if (formAction) {
    return (
      <form action={formAction} className="sticky bottom-[5.5rem] z-30">
        <button
          type="submit"
          disabled={disabled}
          className="flex min-h-tap w-full items-center justify-center rounded-pill bg-primary px-4 text-body font-bold text-on-primary shadow-2 disabled:opacity-50"
        >
          {label}
        </button>
      </form>
    );
  }

  return (
    <div className="sticky bottom-[5.5rem] z-30">
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="flex min-h-tap w-full items-center justify-center rounded-pill bg-primary px-4 text-body font-bold text-on-primary shadow-2 disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}
