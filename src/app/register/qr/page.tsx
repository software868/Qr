import { StaffRegisterForm } from "@/components/auth/staff-register-form";
import { registerQrGeneratorUser } from "@/actions/auth";

export default function RegisterQrPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <StaffRegisterForm
        title="Register — QR Generator"
        description="Create an account to create products, Product UIDs, and QR labels."
        registerAction={registerQrGeneratorUser}
        successPath="/qr"
      />
    </div>
  );
}
