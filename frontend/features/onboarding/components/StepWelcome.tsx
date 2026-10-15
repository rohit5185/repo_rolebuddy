import { Button } from "@/components/ui/button";

type StepWelcomeProps = {
  onNext: () => void;
};

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <section className="w-full flex-none p-5 sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-[#3b2ae1]">Welcome</p>
          <h2 className="mt-3 font-headline text-4xl font-black leading-tight text-[#1b1b24] sm:text-5xl">
            Stay consistent.
            <span className="block text-[#554bf9]">Do not prepare alone.</span>
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#464556] sm:text-base">
            We match you with the right peer and track your progress daily. Finish onboarding in under a minute to
            unlock better partner matching.
          </p>

          <Button
            type="button"
            onClick={onNext}
            className="mt-8 h-12 rounded-xl bg-[linear-gradient(135deg,#3b2ae1,#554bf9)] px-8 font-label text-sm font-bold uppercase tracking-[0.15em] text-white hover:opacity-90"
          >
            Get Started
          </Button>
        </div>

        <div className="rounded-2xl border border-[#c7c4d9]/30 bg-white p-6">
          <h3 className="font-headline text-2xl font-extrabold text-[#1b1b24]">Consistency Streak</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#777588]">Interview Prep - Level 4</p>
          <div className="mt-8 flex items-end justify-between">
            <p className="text-4xl font-black leading-none text-[#1b1b24]">
              14 <span className="text-base font-bold text-[#777588]">Days</span>
            </p>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#3c5900]">+100 XP</span>
          </div>
          <div className="mt-6 flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((pill) => (
              <div key={pill} className={`h-2 flex-1 rounded-full ${pill < 5 ? "bg-[#b7f644]" : "bg-[#e4e1ef]"}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
