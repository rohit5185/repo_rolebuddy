import { AuthForm } from "./AuthForm";
import { AuthShell } from "./AuthShell";

export function LoginPageView() {
  return (
    <AuthShell>
      <AuthForm mode="login" />
    </AuthShell>
  );
}
