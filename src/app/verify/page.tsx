import { redirect } from "next/navigation";

export const metadata = {
  title: "Verify Certificate | NLIT",
  description: "Verify your NLIT training or internship certificate on Certiva.",
};

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const id = searchParams?.id || searchParams?.number;
  
  if (id && typeof id === "string") {
    redirect(`https://certiva.careercue.in/verify/${id}`);
  } else {
    redirect(`https://certiva.careercue.in/verify`);
  }
}
