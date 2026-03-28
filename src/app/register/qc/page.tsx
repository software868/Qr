import { StaffRegisterForm } from "@/components/auth/staff-register-form";
import { registerQcUser } from "@/actions/auth";

export default function RegisterQcPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <StaffRegisterForm
        title="Register — Quality check"
        description="Create an account to run BOM-based QC, upload images, and issue final UIDs."
        registerAction={registerQcUser}
        successPath="/qc"
      />
    </div>
  );
}
