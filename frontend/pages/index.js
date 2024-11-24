import React, { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <Head>
        <title>MetaChat AI - Immersive Chatbot Experience</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div id="app-root">
        <header>
          <nav>
            <div className="logo">MetaChat AI</div>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <section id="hero">
            <div id="meta-human-container">
              {isClient && <MetaHuman />}
            </div>
            <h1>Welcome to the Future of AI Chatbots</h1>
            <p>Experience lifelike conversations with our meta human chatbots</p>
            <button id="cta-button">Get Started</button>
          </section>
          <section id="features">
            <h2>Why Choose MetaChat AI?</h2>
            <div className="feature-grid">
              {isClient && <FeatureGrid />}
            </div>
          </section>
          <section id="how-it-works">
            <h2>How It Works</h2>
            <div className="steps-container">
              {isClient && <StepsContainer />}
            </div>
          </section>
        </main>
        <Footer />
      </div>
      <style jsx global>{`
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        header {
          background-color: #f4f4f4;
          padding: 1rem;
          position: fixed;
          width: 100%;
          top: 0;
          z-index: 1000;
        }
        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        nav ul {
          display: flex;
          list-style: none;
        }
        nav ul li {
          margin-left: 1rem;
        }
        a {
          text-decoration: none;
          color: #333;
        }
        #hero {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 2rem;
          background-color: #f0f0f0;
        }
        #meta-human-container {
          width: 300px;
          height: 300px;
          margin-bottom: 2rem;
        }
        .feature-grid, .steps-container {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          margin-top: 2rem;
        }
        .feature-item, .step-item {
          flex-basis: 30%;
          margin-bottom: 2rem;
          padding: 1rem;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }
        .feature-item:hover, .step-item:hover {
          transform: translateY(-10px);
        }
        footer {
          background-color: #333;
          color: #fff;
          padding: 2rem;
          text-align: center;
        }
        .footer-content {
          display: flex;
          justify-content: space-around;
          margin-bottom: 2rem;
        }
        .social-icons a {
          color: #fff;
          margin: 0 0.5rem;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>
    </>
  );
}

function MetaHuman() {
  useEffect(() => {
    const metaHuman = document.createElement('img');
    metaHuman.src = '/meta-human.png';
    metaHuman.alt = 'Meta Human Avatar';
    metaHuman.style.width = '100%';
    metaHuman.style.height = '100%';
    
    const container = document.getElementById('meta-human-container');
    if (container) {
      container.appendChild(metaHuman);
    }

    function animateMetaHuman() {
      metaHuman.style.transform = 'translateY(0)';
      metaHuman.style.opacity = '1';
      metaHuman.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
      
      setTimeout(() => {
        metaHuman.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          metaHuman.style.transform = 'translateY(0)';
        }, 500);
      }, 1000);
    }

    animateMetaHuman();
    const interval = setInterval(animateMetaHuman, 5000);

    return () => clearInterval(interval);
  }, []);

  return null;
}

function FeatureGrid() {
  const features = [
    { icon: '🤖', title: 'Lifelike Interactions', description: 'Our meta human chatbots provide incredibly realistic conversations, enhancing user engagement.' },
    { icon: '🎨', title: 'Customizable Avatars', description: 'Create unique meta human avatars that align with your brand identity and target audience.' },
    { icon: '🧠', title: 'Advanced AI', description: 'Powered by cutting-edge AI technology for intelligent and context-aware responses.' }
  ];

  return (
    <>
      {features.map((feature, index) => (
        <div key={index} className="feature-item fade-in">
          <div className="feature-icon">{feature.icon}</div>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </div>
      ))}
    </>
  );
}

function StepsContainer() {
  const steps = [
    { number: 1, title: 'Design Your Avatar', description: 'Create a unique meta human avatar that represents your brand.' },
    { number: 2, title: 'Train Your AI', description: 'Input your data and let our AI learn your business specifics.' },
    { number: 3, title: 'Deploy & Engage', description: 'Integrate your meta human chatbot and start engaging with your audience.' }
  ];

  return (
    <>
      {steps.map((step, index) => (
        <div key={index} className="step-item fade-in">
          <div className="step-number">{step.number}</div>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </div>
      ))}
    </>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-section">
          <h3>Company</h3>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Resources</h3>
          <ul>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Documentation</a></li>
            <li><a href="#">Support</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Legal</h3>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="social-icons">
        <a href="#" aria-label="Facebook">Facebook</a>
        <a href="#" aria-label="Twitter">Twitter</a>
        <a href="#" aria-label="LinkedIn">LinkedIn</a>
        <a href="#" aria-label="Instagram">Instagram</a>
      </div>
    </footer>
  );
}