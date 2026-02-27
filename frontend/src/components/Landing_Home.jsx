import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield, Layout, Lock, ChevronRight, Star, Camera, Volume2, FileText,
    AlertTriangle, Monitor, Users2, CheckCircle2, Eye, FileCheck,
    CheckCircle, TrendingUp, Database, Key, ShieldCheck, Mail, MapPin, Phone,
    ArrowRight, Globe, Zap, Cpu, BarChart2, Activity, HardDrive, Download, ClipboardList, Clock, ShieldAlert,
    Plus, Minus
} from 'lucide-react';

function Landing_Home() {
    const [scrolled, setScrolled] = useState(false);
    const [activeFaq, setActiveFaq] = useState(null);

    const [visibleSections, setVisibleSections] = useState(['solutions', 'features', 'security', 'enterprise']);

    const navItems = [
        { name: 'Solutions', id: 'solutions' },
        { name: 'Features', id: 'features' },
        { name: 'Security', id: 'security' },
        { name: 'Enterprise', id: 'enterprise' }
    ];

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Check which sections exist in the DOM
        const checkSections = () => {
            const existing = navItems
                .filter(item => document.getElementById(item.id))
                .map(item => item.id);
            setVisibleSections(existing);
        };

        // Initial check and occasional re-check if content changes (simulated for dev)
        checkSections();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 80; // Navbar height offset
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen bg-white text-charcoal selection:bg-indigo-100 relative font-sans overflow-hidden">
            <div className="fixed inset-0 z-0 text-left">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-radial from-slate-100/60 via-transparent to-transparent blur-[120px] opacity-80" />
                <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-radial from-slate-50/40 via-transparent to-transparent blur-[120px] opacity-60 animate-pulse-slow" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-radial from-slate-50/30 via-transparent to-transparent blur-[120px] opacity-50" />
            </div>

            {/* 1. Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4 glass border-b border-black/5' : 'py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-11 h-11 rounded-xl glass-card flex items-center justify-center group-hover:scale-110 transition-all duration-500 bg-white shadow-sm border-black/5">
                            <Shield className="w-6 h-6 text-brand-black" />
                        </div>
                        <span className="text-2xl font-bold text-gradient leading-none">FairExam</span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        {navItems.filter(item => visibleSections.includes(item.id)).map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                onClick={(e) => scrollToSection(e, item.id)}
                                className="text-[13px] font-bold text-slate-500 hover:text-charcoal transition-colors tracking-widest uppercase"
                            >
                                {item.name}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-5">
                        <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-500 hover:text-charcoal transition-colors tracking-widest uppercase">Sign In</Link>
                        <Link to="/register" className="px-6 py-3 rounded-full bg-charcoal text-white text-sm font-bold hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-100 cursor-pointer tracking-wider uppercase">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* 2. Elite Hero with Visual Impact */}
            <header className="relative pt-48 pb-24 px-6 z-10">
                <div className="max-w-7xl mx-auto space-y-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="text-left space-y-10">
                            <div className="space-y-6">
                                <h1 className="text-6xl md:text-7xl lg:text-[92px] font-bold leading-[0.85] text-charcoal">
                                    Fair & Secure <br />
                                    <span className="text-gradient">AI-Powered Exams</span>
                                </h1>
                                <p className="text-xl text-slate-500 font-bold leading-relaxed max-w-xl">
                                    AI Face Detection • Noise Monitoring • Full-Screen Enforcement. The gold standard for modern academic integrity.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                                <Link to="/login" className="w-full sm:w-auto px-12 py-6 rounded-3xl bg-charcoal text-white font-black text-xl flex items-center justify-center gap-3 group hover:bg-[#1E293B] hover:scale-[1.05] transition-all shadow-2xl shadow-slate-100 cursor-pointer">
                                    Secure Login
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                </Link>
                                <Link to="/candidate-login" className="w-full sm:w-auto px-10 py-6 rounded-3xl border border-black/10 bg-white font-black text-xl hover:bg-slate-50 transition-all text-charcoal flex items-center justify-center gap-3 cursor-pointer">
                                    View Assigned Exams
                                </Link>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-4 bg-slate-200/10 rounded-[64px] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative rounded-[48px] overflow-hidden border border-black/5 shadow-2xl shadow-slate-200/50 bg-white aspect-[4/3]">
                                <img
                                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2070"
                                    alt="Modern Online Examination"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 3. Feature Bento Grid with Visuals */}
            <section id="features" className="max-w-7xl mx-auto px-6 py-32 space-y-20 relative z-10 overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                    <div className="space-y-6 max-w-2xl text-left">
                        <h2 className="text-5xl md:text-[80px] font-bold leading-none text-charcoal">
                            Engineered for <br /><span className="text-gradient">Absolute Trust</span>
                        </h2>
                        <p className="text-xl text-slate-500 font-bold leading-relaxed">
                            Real-time monitoring and anti-cheat restrictions built for Students and Examiners.
                        </p>
                    </div>
                    <div className="hidden lg:block pb-5">
                        <div className="p-5 glass-card rounded-2xl flex items-center gap-4 bg-white/80 border-black/5">
                            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                                <ShieldAlert className="w-6 h-6 text-brand-teal" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Violation Shield</div>
                                <div className="text-xl font-bold text-charcoal">Real-Time Alerts</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[300px]">
                    {/* Main AI Card - Masterpiece Visual Integration */}
                    <div className="md:col-span-8 md:row-span-2 glass-card rounded-[48px] relative overflow-hidden group border-black/5 bg-white shadow-2xl shadow-slate-200/50">
                        {/* MASTERPIECE VISUAL: Biometric Monitoring - FULL BACKGROUND */}
                        <div className="absolute inset-0 z-0 bg-slate-50 overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070"
                                alt="AI Biometric Sensor"
                                className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 opacity-60 group-hover:opacity-80"
                            />
                            <div className="absolute inset-0 bg-slate-200/5 mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent" />
                        </div>

                        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 text-charcoal">
                            <div className="p-4 w-fit rounded-2xl bg-slate-50 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <Cpu className="w-10 h-10 text-brand-black" />
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-4xl font-bold leading-tight">AI Proctoring Engine</h3>
                                <p className="text-xl text-slate-500 font-bold max-w-md leading-relaxed">Continuous AI face detection and noise monitoring ensures a proxy-free environment with automated alerts.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                    {['Face Detection', 'Noise Monitoring', 'Proctor Alerts', 'Auto-Submit'].map(feature => (
                                        <div key={feature} className="flex items-center gap-3 text-sm font-bold text-slate-500">
                                            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            </div>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secure Mode - Masterpiece Visual */}
                    <div className="md:col-span-4 glass-card rounded-[40px] p-10 flex flex-col justify-between group bg-[#0f172a] text-white overflow-hidden border-none text-left shadow-2xl shadow-slate-900/60 relative">
                        {/* Technical Background Overlay */}
                        <div className="absolute inset-0 w-full h-full opacity-90 transition-opacity duration-1000">
                            <img
                                src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=2070"
                                alt="Security Interface"
                                className="w-full h-full object-cover contrast-125"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />
                            <div className="absolute inset-0 bg-slate-500/10 mix-blend-overlay" />
                        </div>

                        <div className="w-16 h-16 rounded-[22px] bg-slate-800 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(30,41,59,0.4)] transition-transform duration-500 border border-slate-700/30">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <h4 className="text-3xl font-bold uppercase text-white drop-shadow-sm">Safe Examination Browser</h4>
                            <p className="text-indigo-100 font-bold leading-relaxed text-lg">Hardened sanctuary for high-stakes assessments.</p>
                        </div>
                    </div>

                    {/* Dashboard Feature - Masterpiece Visual - Premium Dark Mode (Static) */}
                    <div className="md:col-span-4 glass-card rounded-[40px] p-10 flex flex-col justify-between bg-[#0f172a] border-none overflow-hidden text-left relative shadow-2xl shadow-indigo-900/40">
                        {/* Technical Background Overlay - Static Visibility */}
                        <div className="absolute inset-0 w-full h-full opacity-80 transition-opacity duration-1000 pointer-events-none">
                            <img
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070"
                                alt="Modern Monitoring Dashboard"
                                className="w-full h-full object-cover brightness-100 contrast-[1.1]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent" />
                            <div className="absolute inset-0 bg-slate-500/[0.1] mix-blend-multiply" />
                        </div>

                        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/40 relative z-10 text-white border border-orange-300/30">
                            <Monitor className="w-8 h-8" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <h4 className="text-3xl font-bold text-white uppercase drop-shadow-sm">Dashboard Suite</h4>
                            <p className="text-orange-50 font-bold leading-relaxed text-lg opacity-90">Centralized command for schedules and live monitoring.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3.1 How it Works Section */}
            <section className="py-32 bg-white relative z-10 overflow-hidden" id="how-it-works">
                <div className="max-w-7xl mx-auto px-6 space-y-20">
                    <div className="text-center space-y-6">
                        <h2 className="text-5xl md:text-[80px] font-black tracking-tight leading-none text-charcoal">
                            How it <span className="text-gradient">Works</span>
                        </h2>
                        <p className="text-xl text-slate-500 font-bold max-w-2xl mx-auto">
                            A seamless three-step process designed for institutions and students.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-[2px] bg-slate-100 -z-10" />

                        <HowItWorksStep
                            number="01"
                            title="Schedule Exam"
                            desc="Examiners upload questions and set proctoring rules in seconds."
                            icon={<ClipboardList className="w-10 h-10" />}
                        />
                        <HowItWorksStep
                            number="02"
                            title="Secure Login"
                            desc="Students verify identity via AI face detection and enter secure mode."
                            icon={<Users2 className="w-10 h-10" />}
                        />
                        <HowItWorksStep
                            number="03"
                            title="AI Proctoring"
                            desc="Real-time monitoring detects violations and auto-generates reports."
                            icon={<Activity className="w-10 h-10" />}
                        />
                    </div>
                </div>
            </section>

            {/* 4. Insight Intelligence Section */}
            < section id="solutions" className="bg-slate-50 py-32 border-y border-black/5 relative z-10 overflow-hidden text-left" >
                <div className="max-w-7xl mx-auto px-6 space-y-20">
                    <div className="text-center space-y-6">
                        <h2 className="text-5xl md:text-[80px] font-black tracking-tight leading-none text-charcoal">
                            Insight <span className="text-gradient">Intelligence</span>
                        </h2>
                        <p className="text-xl md:text-2xl text-slate-500 font-bold max-w-3xl mx-auto">
                            Auto-evaluate MCQ answers, view violation reports, and publish performance analytics instantly.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="glass-card rounded-[48px] p-12 space-y-10 col-span-2 bg-white border-black/10 shadow-2xl shadow-slate-200/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-brand-black animate-pulse" />
                                    <span className="text-sm font-black tracking-[0.2em] uppercase text-slate-900">Live Result Processing</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                    <Activity className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                                </div>
                            </div>

                            <div className="h-[400px] relative rounded-[40px] overflow-hidden group/img border border-indigo-50 shadow-2xl shadow-slate-100">
                                <img
                                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2015"
                                    alt="AI Analytics Dashboard"
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-1000 contrast-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />
                                <div className="absolute bottom-8 left-8 p-6 glass-card rounded-2xl border-white/20 shadow-2xl">
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Global Network</p>
                                    <p className="text-[10px] font-bold text-slate-500 pt-1">99.9% Latency Accuracy</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <MetricItem
                                icon={<CheckCircle className="w-6 h-6" />}
                                label="Auto-Assessment"
                                value="MCQ Ready"
                                image="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=2070"
                            />
                            <MetricItem
                                icon={<Download className="w-6 h-6" />}
                                label="Results"
                                value="PDF Export"
                                image="https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=2030"
                            />
                            <MetricItem
                                icon={<Database className="w-6 h-6" />}
                                label="Access"
                                value="Roll-Number Based"
                                image="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072"
                            />
                        </div>
                    </div>
                </div>
            </section >



            {/* 5.1 Testimonials Section */}
            <section className="py-32 px-6 bg-slate-50 relative z-10 overflow-hidden">
                <div className="max-w-7xl mx-auto space-y-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-6 max-w-2xl">
                            <h2 className="text-5xl md:text-[80px] font-black tracking-tight leading-none text-charcoal">
                                Trusted by <br /><span className="text-gradient">Big Organizations</span>
                            </h2>
                            <p className="text-xl text-slate-500 font-bold">Real stories from institutions scaling with integrity.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-6 py-3 rounded-2xl bg-white border border-black/5 shadow-sm">
                                <span className="text-3xl font-black text-charcoal">2k+</span>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutions</p>
                            </div>
                        </div>
                    </div>

                    {/* Organization Logos Strip */}
                    <div className="py-12">
                        <p className="text-center text-xs font-black tracking-[0.3em] uppercase text-slate-400 mb-10">Trusted by leading organizations worldwide</p>
                        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                            {[
                                { name: 'Wipro', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg', color: '#431D7E' },
                                { name: 'SAP', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg', color: '#0070F2' },
                                { name: 'Infosys', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg', color: '#007CC3' },
                                { name: 'Accenture', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg', color: '#A100FF' },
                                { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', color: '#4285F4' },
                                { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', color: '#00A4EF' },
                            ].map((org) => (
                                <div
                                    key={org.name}
                                    className="group flex items-center justify-center px-6 py-4 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/60 hover:scale-110 transition-all duration-500 cursor-pointer"
                                    title={org.name}
                                >
                                    <img
                                        src={org.logo}
                                        alt={org.name}
                                        className="h-8 md:h-10 w-auto object-contain transition-all duration-500 group-hover:scale-110"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <TestimonialCard
                            quote="The AI proctoring is remarkably accurate. It has completely transformed our remote examination process."
                            author="Dr. Sarah Chen"
                            role="Dean of Academics"
                            institution="Stanford University"
                            image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
                        />
                        <TestimonialCard
                            quote="FairExam's interface is intuitive for both students and staff. The support team is world-class."
                            author="James Wilson"
                            role="IT Director"
                            institution="Oxford Academy"
                            image="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
                        />
                        <TestimonialCard
                            quote="Finally, a proctoring solution that doesn't feel invasive but maintains absolute fairness."
                            author="Elena Rodriguez"
                            role="Student Council Head"
                            institution="MIT"
                            image="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150"
                        />
                    </div>
                </div>
            </section>



            {/* 6.1 FAQ Section */}
            <section className="py-32 px-6 bg-white relative z-10" id="faq">
                <div className="max-w-5xl mx-auto space-y-20">
                    <div className="text-center space-y-6">
                        <h2 className="text-5xl md:text-[80px] font-black tracking-tight leading-none text-charcoal">
                            Common <br /><span className="text-gradient">Questions</span>
                        </h2>
                        <p className="text-xl text-slate-500 font-bold">Everything you need to know about FairExam.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "How does the AI detect cheating?",
                                a: "Our proprietary AI engine uses face detection to ensure the registered student is present, noise monitoring to detect unauthorized communication, and browser enforcement to prevent external searching."
                            },
                            {
                                q: "What happens if the internet disconnects?",
                                a: "FairExam has a built-in 'Resilience Mode'. It continues monitoring offline and syncs data once the connection is restored, ensuring no student is unfairly penalized for technical issues."
                            },
                            {
                                q: "Is the student's privacy protected?",
                                a: "Absolutely. We are GDPR and SOC2 compliant. All data is encrypted at rest and in transit, and recordings are automatically deleted after a specified retention period set by the institution."
                            },
                            {
                                q: "Which devices are supported?",
                                a: "FairExam works on all modern desktops and laptops (Windows, macOS, ChromeOS). Chrome is our recommended browser for the best experience."
                            }
                        ].map((faq, index) => (
                            <FAQItem
                                key={index}
                                question={faq.q}
                                answer={faq.a}
                                isOpen={activeFaq === index}
                                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                            />
                        ))}
                    </div>
                </div>
            </section>





            {/* 7. Enhanced Global Footer - Compact & Premium */}
            < footer className="pt-20 pb-16 px-6 relative z-10 bg-white border-t border-black/5" >
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12">
                        <div className="lg:col-span-2 space-y-6 text-left border-r border-black/[0.03] pr-12">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-charcoal flex items-center justify-center shadow-lg shadow-slate-100">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-gradient leading-none">FairExam</span>
                            </div>
                            <p className="text-sm text-slate-500 font-bold max-w-xs leading-relaxed">
                                AI-powered exam proctoring for the future of education. Trusted by 2,000+ top institutions.
                            </p>
                            <div className="flex items-center gap-4">
                                <SocialLink icon={<Globe className="w-4 h-4" />} />
                                <SocialLink icon={<Mail className="w-4 h-4" />} />
                                <SocialLink icon={<Phone className="w-4 h-4" />} />
                            </div>
                        </div>

                        <FooterList title="Product" links={['Features', 'Pricing', 'Security', 'Integrations']} />
                        <FooterList title="Company" links={['About Us', 'Careers', 'Blog', 'Contact']} />
                        <FooterList title="Legal" links={['Privacy Policy', 'Terms of Service', 'GDPR', 'Compliance']} />
                    </div>
                </div>
            </footer >
        </div >
    );
}







const MetricItem = React.memo(function MetricItem({ icon, label, value, image }) {
    return (
        <div className="glass-card rounded-[32px] p-8 flex items-center justify-between group bg-white border-black/10 relative overflow-hidden shadow-xl shadow-slate-100/50">
            {/* Visual Background Snippet */}
            {image && (
                <div className="absolute top-0 right-0 w-32 h-full opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                    <img src={image} className="w-full h-full object-cover grayscale" alt="" />
                </div>
            )}

            <div className="flex items-center gap-6 relative z-10">
                <div className="w-14 h-14 rounded-[18px] bg-slate-50 flex items-center justify-center group-hover:bg-[#1E293B] group-hover:text-white transition-all duration-500 shadow-sm">
                    <div className="text-slate-600 group-hover:text-white transition-colors">{icon}</div>
                </div>
                <div className="text-left">
                    <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-900/40 leading-none pb-1 group-hover:text-[#0F172A] transition-colors">{label}</div>
                    <div className="text-2xl font-black text-slate-900">{value}</div>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#0F172A] group-hover:translate-x-1 transition-all relative z-10" />
        </div>
    );
});



const SocialLink = React.memo(function SocialLink({ icon }) {
    return (
        <div className="w-10 h-10 rounded-full border border-black/5 bg-white flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1E293B] transition-all cursor-pointer shadow-sm hover:scale-110">
            {icon}
        </div>
    );
});

const FooterList = React.memo(function FooterList({ title, links }) {
    return (
        <div className="space-y-6 text-left">
            <h5 className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-900">{title}</h5>
            <ul className="space-y-3">
                {links.map((link) => (
                    <li key={link}>
                        <a href="#" className="text-sm text-slate-500 hover:text-[#0F172A] font-bold transition-all inline-block hover:translate-x-1">{link}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
});

const HowItWorksStep = React.memo(function HowItWorksStep({ number, title, desc, icon }) {
    return (
        <div className="flex flex-col items-center text-center space-y-6 relative group">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center border border-black/5 group-hover:scale-110 group-hover:bg-[#1E293B] transition-all duration-500 relative z-10">
                <div className="text-slate-600 group-hover:text-white transition-colors">
                    {icon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-charcoal text-white text-xs font-black flex items-center justify-center border-4 border-white">
                    {number}
                </div>
            </div>
            <div className="space-y-2">
                <h4 className="text-xl font-black text-charcoal">{title}</h4>
                <p className="text-slate-500 font-bold leading-relaxed max-w-[240px]">{desc}</p>
            </div>
        </div>
    );
});

const TestimonialCard = React.memo(function TestimonialCard({ quote, author, role, institution, image }) {
    return (
        <div className="glass-card rounded-[40px] p-10 bg-white border-black/5 flex flex-col justify-between space-y-8 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500">
            <div className="space-y-6">
                <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="text-xl font-bold text-charcoal italic leading-relaxed">"{quote}"</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-50">
                    <img src={image} alt={author} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h5 className="font-black text-charcoal leading-none">{author}</h5>
                    <p className="text-xs font-bold text-slate-400 pt-1 uppercase tracking-wider">{role}</p>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{institution}</p>
                </div>
            </div>
        </div>
    );
});

const FAQItem = React.memo(function FAQItem({ question, answer, isOpen, onClick }) {
    return (
        <div className={`rounded-3xl border transition-all duration-500 overflow-hidden ${isOpen ? 'bg-slate-50 border-slate-200 shadow-lg shadow-slate-100' : 'bg-white border-black/5 hover:border-slate-200'}`}>
            <button
                onClick={onClick}
                className="w-full px-8 py-6 flex items-center justify-between text-left cursor-pointer"
            >
                <span className={`text-lg font-black transition-colors ${isOpen ? 'text-[#0F172A]' : 'text-charcoal'}`}>{question}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-[#0F172A] text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
            </button>
            <div className={`px-8 transition-all duration-500 ease-in-out ${isOpen ? 'pb-8 opacity-100 max-h-[500px]' : 'max-h-0 opacity-0'}`}>
                <p className="text-slate-500 font-bold leading-relaxed">{answer}</p>
            </div>
        </div>
    );
});

export default Landing_Home;
