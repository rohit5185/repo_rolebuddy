import { AuthForm } from "./AuthForm";
import { AuthShell } from "./AuthShell";

export function SignupPageView() {
  return (
    <AuthShell>
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
