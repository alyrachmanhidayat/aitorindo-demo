import { redirect } from "next/navigation";

/** No landing page in the client demo: open straight on the dashboard. */
export default function Home() {
  redirect("/dashboard");
}
