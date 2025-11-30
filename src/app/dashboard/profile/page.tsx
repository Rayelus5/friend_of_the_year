import { redirect } from "next/navigation";

export default function LegacyProfileRedirect() {
    redirect("/dashboard?tab=profile");
}