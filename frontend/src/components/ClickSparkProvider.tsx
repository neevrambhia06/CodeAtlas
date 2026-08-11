'use client';

import ClickSpark from '@/components/ClickSpark';

export default function ClickSparkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClickSpark
      sparkColor="#C8D9E6"
      sparkSize={12}
      sparkRadius={20}
      sparkCount={8}
      duration={400}
      easing="ease-out"
      extraScale={1.0}
    >
      {children}
    </ClickSpark>
  );
}
