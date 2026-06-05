import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Heart,
  Brain,
  Clock,
  Shield,
  MessageCircle,
  FileText,
  Search,
  Calendar,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
  Check,
  Menu,
  X,
  Stethoscope,
  Activity,
  Zap,
  Lock,
  Smartphone,
  Globe,
  Sun,
  Moon
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import './LandingPage.css'

const LandingPage = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Diagnosis',
      description: 'Advanced AI analyzes your symptoms using medical literature and provides accurate, evidence-based insights.',
      color: 'var(--primary-600)',
    },
    {
      icon: MessageCircle,
      title: '24/7 Chat Support',
      description: 'Get instant answers to your medical questions anytime, anywhere. Our AI assistant never sleeps.',
      color: 'var(--secondary-600)',
    },
    {
      icon: FileText,
      title: 'Medical Document Analysis',
      description: 'Upload medical reports and get instant explanations. We support PDFs, lab reports, and prescriptions.',
      color: 'var(--accent-600)',
    },
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Find doctors, clinics, and hospitals near you with our intelligent location-based search.',
      color: 'var(--primary-600)',
    },
    {
      icon: Calendar,
      title: 'Appointment Booking',
      description: 'Schedule appointments with healthcare providers directly through our platform.',
      color: 'var(--secondary-600)',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your health data is encrypted and secure. We comply with healthcare privacy regulations.',
      color: 'var(--accent-600)',
    },
  ]

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'General Physician',
      avatar: 'SJ',
      content: 'This AI assistant has been incredibly helpful for preliminary assessments. It\'s like having a medical encyclopedia that understands context.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Patient',
      avatar: 'MC',
      content: 'I was able to understand my symptoms before visiting the doctor. The AI provided clear, non-alarming information that helped me prepare.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Nurse Practitioner',
      avatar: 'ER',
      content: 'I recommend this to my patients for between-visit questions. It reduces unnecessary calls and helps patients feel more informed.',
      rating: 5,
    },
    {
      name: 'James Wilson',
      role: 'Healthcare Administrator',
      avatar: 'JW',
      content: 'The document analysis feature saves us hours. Patients come prepared with better understanding of their lab results.',
      rating: 5,
    },
  ]

  const faqs = [
    {
      question: 'Is this a replacement for professional medical advice?',
      answer: 'No, our AI assistant is designed to provide general health information and guidance. It should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.',
    },
    {
      question: 'How accurate is the AI diagnosis?',
      answer: 'Our AI uses evidence-based medical literature and has been trained on verified medical data. However, accuracy can vary based on the information provided. Always verify important health decisions with a healthcare professional.',
    },
    {
      question: 'Is my health data secure?',
      answer: 'Absolutely. We use industry-standard encryption for all data transmission and storage. Your conversations are private and we comply with healthcare privacy regulations. We never sell your personal health information.',
    },
    {
      question: 'Can I upload medical documents?',
      answer: 'Yes! You can upload PDF documents including lab reports, prescriptions, and medical records. Our AI will analyze and explain the content in easy-to-understand language.',
    },
    {
      question: 'Is there a cost to use Medical Assistant?',
      answer: 'Basic features including AI chat are available for free. Premium features like unlimited document uploads and priority support may require a subscription. Check our pricing page for details.',
    },
    {
      question: 'How do I book an appointment with a doctor?',
      answer: 'Use our smart search to find healthcare providers in your area, then book appointments directly through our platform. You\'ll receive confirmation and reminders automatically.',
    },
  ]

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '1M+', label: 'Questions Answered' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'Availability' },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <Heart size={32} fill="var(--primary-600)" strokeWidth={2} />
            <span>Medical Assistant</span>
          </div>
          
          <div className="nav-links desktop-only">
            <a href="#features">Features</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#faq">FAQ</a>
            <a href="#about">About</a>
          </div>
          
          <div className="nav-actions desktop-only">
            <button
              className="theme-toggle-btn nav-theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </button>
          </div>
          
          <button 
            className="mobile-menu-btn mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
            
            {/* Mobile Theme Toggle */}
            <button
              className="mobile-theme-toggle"
              onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span>Switch to {theme === 'light' ? 'dark' : 'light'} mode</span>
            </button>
            
            <div className="mobile-menu-actions">
              <button
                className="btn btn-ghost btn-block"
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
              >
                Sign In
              </button>
              <button
                className="btn btn-primary btn-block"
                onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }}
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-badge">
              <Zap size={16} />
              <span>AI-Powered Healthcare</span>
            </div>
            
            <h1 className="hero-title">
              Your Personal
              <span className="gradient-text"> AI Medical</span>
              <br />Assistant
            </h1>
            
            <p className="hero-description">
              Get instant, accurate health insights powered by advanced AI. 
              Upload medical documents, find doctors, and book appointments — all in one place.
            </p>
            
            <div className="hero-actions">
              <button
                className="btn btn-primary btn-xl"
                onClick={() => navigate('/try')}
              >
                Start Free Consultation
                <ArrowRight size={20} />
              </button>
              <button
                className="btn btn-outline btn-xl"
                onClick={() => navigate('/signup')}
              >
                Create Account
              </button>
            </div>
            
            <div className="hero-features">
              <div className="hero-feature">
                <Check size={16} />
                <span>No credit card required</span>
              </div>
              <div className="hero-feature">
                <Check size={16} />
                <span>24/7 availability</span>
              </div>
              <div className="hero-feature">
                <Check size={16} />
                <span>HIPAA compliant</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="hero-image-container">
              <div className="hero-floating-card card-1">
                <Brain size={32} />
                <div>
                  <strong>AI Analysis</strong>
                  <p>Processing symptoms...</p>
                </div>
              </div>
              <div className="hero-floating-card card-2">
                <Shield size={32} />
                <div>
                  <strong>Secure & Private</strong>
                  <p>Your data is protected</p>
                </div>
              </div>
              <div className="hero-floating-card card-3">
                <Clock size={32} />
                <div>
                  <strong>24/7 Support</strong>
                  <p>Always available</p>
                </div>
              </div>
              <div className="hero-main-visual">
                <div className="visual-circle circle-1"></div>
                <div className="visual-circle circle-2"></div>
                <div className="visual-circle circle-3"></div>
                <div className="visual-icon">
                  <Stethoscope size={80} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Stats Bar */}
        <div className="stats-bar">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              className="stat-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + (index * 0.1) }}
            >
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-badge">Features</span>
            <h2>Everything You Need for Better Health</h2>
            <p>Comprehensive healthcare tools powered by cutting-edge AI technology</p>
          </motion.div>
          
          <motion.div 
            className="features-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="feature-card"
                variants={itemVariants}
                whileHover={{ y: -8, boxShadow: 'var(--shadow-xl)' }}
              >
                <div 
                  className="feature-icon"
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  <feature.icon size={32} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-badge">How It Works</span>
            <h2>Simple Steps to Better Health</h2>
            <p>Get started in minutes with our easy-to-use platform</p>
          </motion.div>
          
          <div className="steps-grid">
            {[
              {
                step: '01',
                icon: MessageCircle,
                title: 'Describe Your Symptoms',
                description: 'Tell our AI about what you\'re experiencing in natural language',
              },
              {
                step: '02',
                icon: Brain,
                title: 'AI Analysis',
                description: 'Our advanced AI analyzes your symptoms against medical literature',
              },
              {
                step: '03',
                icon: FileText,
                title: 'Get Insights',
                description: 'Receive clear, actionable health insights and recommendations',
              },
              {
                step: '04',
                icon: Calendar,
                title: 'Take Action',
                description: 'Book appointments or follow self-care guidance as needed',
              },
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="step-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="step-number">{item.step}</div>
                <div className="step-icon">
                  <item.icon size={32} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-badge">Testimonials</span>
            <h2>Trusted by Healthcare Professionals & Patients</h2>
            <p>See what our community has to say about Medical Assistant</p>
          </motion.div>
          
          <motion.div 
            className="testimonials-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                className="testimonial-card"
                variants={itemVariants}
              >
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="var(--warning-500)" color="var(--warning-500)" />
                  ))}
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <strong>{testimonial.name}</strong>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-badge">FAQ</span>
            <h2>Frequently Asked Questions</h2>
            <p>Find answers to common questions about Medical Assistant</p>
          </motion.div>
          
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <motion.div 
                key={index}
                className="faq-item"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <button 
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span>{faq.question}</span>
                  {openFaq === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <motion.div 
                  className="faq-answer"
                  initial={false}
                  animate={{
                    height: openFaq === index ? 'auto' : 0,
                    opacity: openFaq === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  {faq.answer}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2>Ready to Take Control of Your Health?</h2>
            <p>Join thousands of users who trust Medical Assistant for their healthcare needs</p>
            <div className="cta-actions">
              <button
                className="btn btn-primary btn-xl"
                onClick={() => navigate('/signup')}
              >
                Get Started Free
                <ArrowRight size={20} />
              </button>
              <button
                className="btn btn-ghost btn-xl"
                onClick={() => navigate('/try')}
              >
                Try Without Account
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <Heart size={28} fill="var(--primary-600)" strokeWidth={2} />
                <span>Medical Assistant</span>
              </div>
              <p>Your trusted AI-powered healthcare companion, providing accurate medical information and support 24/7.</p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook"><Globe size={20} /></a>
                <a href="#" aria-label="Twitter"><Globe size={20} /></a>
                <a href="#" aria-label="LinkedIn"><Globe size={20} /></a>
                <a href="#" aria-label="Instagram"><Globe size={20} /></a>
              </div>
            </div>
            
            <div className="footer-links">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#testimonials">Testimonials</a>
              <a href="#faq">FAQ</a>
              <a href="#">Pricing</a>
            </div>
            
            <div className="footer-links">
              <h4>Company</h4>
              <a href="#about">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Press</a>
            </div>
            
            <div className="footer-links">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
              <a href="#">HIPAA Compliance</a>
            </div>
            
            <div className="footer-contact">
              <h4>Contact</h4>
              <p><strong>Email:</strong> support@medicalassistant.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              <p><strong>Address:</strong> 123 Healthcare Ave, Medical City, MC 12345</p>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Medical Assistant. All rights reserved.</p>
            <p className="disclaimer">
              <Lock size={14} />
              This service provides general health information only. It is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
