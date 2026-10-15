import type { AvailabilityOption } from "../types";

type AvailabilityCard = {
  value: AvailabilityOption;
  title: string;
  hint: string;
};

type StepAvailabilitySelectionProps = {
  stepLabel: string;
  options: AvailabilityCard[];
  selectedAvailability: AvailabilityOption | null;
  onSelect: (availability: AvailabilityOption) => void;
  onBack: () => void;
  onNext: () => void;
};

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl border border-[#c7c4d9]/40 bg-white/70 px-5 py-2.5 text-sm font-semibold text-[#464556] transition hover:bg-white hover:border-[#5755a4]/50 active:scale-95"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

export function StepAvailabilitySelection({
  stepLabel,
  options,
  selectedAvailability,
  onSelect,
  onBack,
  onNext
}: StepAvailabilitySelectionProps) {
  return (
    <section className="w-full flex-none p-5 sm:p-8">
      <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-[#3b2ae1]">{stepLabel}</p>
      <h2 className="mt-3 font-headline text-2xl font-black leading-tight text-[#1b1b24] sm:text-3xl">When do you prefer to prep?</h2>
      <p className="mt-2 text-sm text-[#464556] sm:text-base">
        We use this to match you with accountability partners in the same prep window.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const selected = selectedAvailability === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSelect(option.value);
                requestAnimationFrame(() => {
                  setTimeout(() => onNext(), 120);
                });
              }}
              className={`rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                selected
                  ? "border-[#554bf9] bg-[#f0ecfa] shadow-[0_0_0_1px_rgba(85,75,249,0.25)]"
                  : "border-[#c7c4d9]/40 bg-white hover:border-[#5755a4]/50"
              }`}
            >
              <p className="font-headline text-xl font-black capitalize text-[#1b1b24]">{option.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#464556]">{option.hint}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <BackButton onClick={onBack} />
      </div>
    </section>
  );
}
