import "./Home.css";
import Navbar from "../../components/landing-page/navbar/Navbar";
import Hero from "../../components/landing-page/hero/Hero";
import HowItWorks from "../../components/landing-page/how-it-works/HowItWorks";
import Skills from "../../components/landing-page/skills/Skills";
import CTA from "../../components/landing-page/cta/CTA";
import Footer from "../../components/landing-page/footer/Footer";

function Home() {
  return (
    <main className="home-page">

      <Navbar />

      <Hero />

      <HowItWorks />

      <Skills />

      <CTA />

      <Footer />

    </main>
  );
}

export default Home;