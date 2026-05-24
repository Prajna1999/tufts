import SmallMultiples from "@/components/charts/SmallMultiples";
import Sparklines from "@/components/charts/Sparklines";
import RangeFrameScatter from "@/components/charts/RangeFrameScatter";
import Slopegraph from "@/components/charts/Slopegraph";
import ConnectedScatter from "@/components/charts/ConnectedScatter";
import SparklineProse from "@/components/charts/SparklineProse";
import ReactiveDocument from "@/components/charts/ReactiveDocument";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbfbf8] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl font-medium text-[#33332e] mb-2">
          Tufte-grade data visualization
        </h1>
        <p className="font-serif text-[14px] text-[#86857c] mb-12 leading-relaxed">
          Information-dense, honest charts. Each panel answers &ldquo;compared to what?&rdquo;
        </p>

        <section className="mb-16">
          <SmallMultiples />
        </section>

        <div className="border-t border-[#e5e5e0] my-8" />

        <section className="mb-16">
          <Sparklines />
        </section>

        <div className="border-t border-[#e5e5e0] my-8" />

        <section className="mb-16 flex flex-wrap gap-8">
          <RangeFrameScatter />
          <Slopegraph />
        </section>

        <div className="border-t border-[#e5e5e0] my-8" />

        <section className="mb-16">
          <ConnectedScatter />
        </section>

        <div className="border-t border-[#e5e5e0] my-8" />

        <section className="mb-16">
          <SparklineProse />
        </section>

        <div className="border-t border-[#e5e5e0] my-8" />

        <section className="mb-16">
          <ReactiveDocument />
        </section>
      </div>
    </main>
  );
}
