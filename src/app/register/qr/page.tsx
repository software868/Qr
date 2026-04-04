import { redirect } from "next/navigation";

/** Legacy URL: QR Generator registration is retired; check form uses the same flow. */
export default function RegisterQrRedirectPage() {
  redirect("/register/qc");
}
