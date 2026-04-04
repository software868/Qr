import { StaffRegisterForm } from "@/components/auth/staff-register-form";
import { registerQcUser } from "@/actions/auth";

export default function RegisterQcPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <StaffRegisterForm
        title="Register — Check form"
        description="Create an account to run the dynamic checklist, upload photos, and receive entry UIDs with QR labels."
        registerAction={registerQcUser}
        successPath="/qc"
      />
    </div>
  );
}
