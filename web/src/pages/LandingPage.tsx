import Hero from "../components/landing/Hero";
import ProblemSection from "../components/landing/ProblemSection";
import SolutionSection from "../components/landing/SolutionSection";
import HowItWorks from "../components/landing/HowItWorks";
import FeaturesSection from "../components/landing/FeaturesSection";
import CustomerSegments from "../components/landing/CustomerSegments";
import TrustSection from "../components/landing/TrustSection";

export default function LandingPage() {
  return (
    <main>
      <Hero />

      <ProblemSection />
      <SolutionSection />
      <HowItWorks />
      <FeaturesSection />
      <CustomerSegments />
      <TrustSection />
    </main>
  );
}
