import { redirect } from "next/navigation";

export default function RootPage() {
  // أول ما يفتح الصفحة الرئيسية، هينقله فوراً لصفحة الـ Login
  redirect("/login");
}