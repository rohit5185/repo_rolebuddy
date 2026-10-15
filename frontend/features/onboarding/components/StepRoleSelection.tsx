import { Button } from "@/components/ui/button";

type RoleOption = {
  value: string;
  caption: string;
};

type StepRoleSelectionProps = {
  options: readonly RoleOption[];
  selectedRole: string | null;
  onSelect: (role: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function StepRoleSelection({ options, selectedRole, onSelect, onBack, onNext }: StepRoleSelectionProps) {
  return (
    <section className="w-full flex-none p-5 sm:p-8 lg:p-10">
      <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-[#3b2ae1]">Step 01 - Role Selection</p>
      <h2 className="mt-3 font-headline text-3xl font-black leading-tight text-[#1b1b24] sm:text-4xl">
        Define your Professional Identity
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-[#464556] sm:text-base">
        Select the role that best matches your current focus. This improves matching precision for Phase 3.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const selected = selectedRole === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`rounded-2xl border p-4 text-left transition-all sm:p-5 ${
                selected
                  ? "border-[#554bf9] bg-[#f0ecfa] shadow-[0_0_0_1px_rgba(85,75,249,0.25)]"
                  : "border-[#c7c4d9]/40 bg-white hover:border-[#5755a4]/50"
              }`}
            >
              <p className="font-headline text-lg font-bold text-[#1b1b24]">{option.value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.15em] text-[#777588]">{option.caption}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-xl border border-[#c7c4d9]/40 bg-white/70 text-[#464556] hover:bg-white"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          className="h-11 rounded-xl bg-[linear-gradient(135deg,#3b2ae1,#554bf9)] font-label text-xs font-bold uppercase tracking-[0.15em] text-white"
        >
          Continue
        </Button>
      </div>
    </section>
  );
}
