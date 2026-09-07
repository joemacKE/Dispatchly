import Hero from "../components/landing/Hero";
import ProblemSection from "../components/landing/ProblemSection";
import SolutionSection from "../components/landing/SolutionSection";
import HowItWorks from "../components/landing/HowItWorks";
import FeaturesSection from "../components/landing/FeaturesSection";
import CustomerSegments from "../components/landing/CustomerSegments";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <main>
      <Hero />

      <ProblemSection />
      <SolutionSection />
      <HowItWorks />
      <FeaturesSection />
      <CustomerSegments />
      <Footer />
    </main>
  );
}
