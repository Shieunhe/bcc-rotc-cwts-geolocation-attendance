import PageIntroPanel from "@/components/common/PageIntroPanel";

interface ROTCheaderProps {
  msLevel: "1" | "2";
}

export default function ROTCheader({ msLevel }: ROTCheaderProps) {
  return (
    <PageIntroPanel
      title="ROTC Platoon List"
      subtitle={`View and assign the platoon for ROTC MS ${msLevel} cadets.`}
      variant="sky"
    />
  )
}
