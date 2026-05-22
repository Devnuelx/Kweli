"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import MobileHome from "@/public/svgs/mobile-home.svg";
import ScanScreen from "@/public/svgs/scan.svg";

const steps = [
    {
        step: "Step 1",
        title: "Download & Open App",
        description: "Get the Kweli app from your app store and sign up in seconds.",
        image: MobileHome,
    },
    {
        step: "Step 2",
        title: "Scan QR Code",
        description: "Tap the scan button and point your camera at the certified product code.",
        image: ScanScreen,
    },
    {
        step: "Step 3",
        title: "Verify Product",
        description: "Instant verification powered by Hedera Hashgraph. Know the truth instantly.",
        image: MobileHome,
    },
    {
        step: "Step 4",
        title: "Get Rewarded",
        description: "Earn tokens for every safe product you verify. Stay safe and get paid.",
        image: MobileHome,
    },
];

export default function StickySteps() {
    const [activeStep, setActiveStep] = useState(0);
    const sectionRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!sectionRef.current) return;

            const { top, height } = sectionRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate progress: 0 when top touches top of screen, 1 when bottom touches bottom
            // Actually we want the content to be sticky for most of the duration.
            // Let's say we scroll through 4 steps.

            // Determine how far we've scrolled into the section
            const scrolled = -top;

            // We want each step to take up some scroll distance (e.g. 100vh)
            // Total scrollable distance is height - windowHeight.
            // If height is 400vh, scrollable is 300vh.

            if (scrolled < 0) {
                setActiveStep(0);
                return;
            }

            const stepHeight = windowHeight * 0.75; // Sensitivity
            const currentStep = Math.floor(scrolled / stepHeight);

            // Clamp index
            const index = Math.min(steps.length - 1, Math.max(0, currentStep));
            setActiveStep(index);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Initial check
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        // Height determines how long the section remains pinned. 
        // 400vh gives us enough room to scroll through 4 steps comfortably.
        <section ref={sectionRef} className="relative h-[400vh] bg-white">

            {/* Sticky container: Holds the view in place while we scroll through the parent height */}
            <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">

                <div className="max-w-6xl w-full px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12 lg:gap-24 h-full">

                    {/* Left: Text Content (Switches in place) */}
                    <div className="md:w-1/2 order-2 md:order-1 flex flex-col justify-center h-full max-w-lg">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`transition-all duration-700 absolute md:static inset-0 md:inset-auto flex flex-col justify-center ${activeStep === index
                                    ? "opacity-100 transform translate-y-0 relative"
                                    : "opacity-0 transform translate-y-8 absolute pointer-events-none"
                                    }`}
                                // Positioning absolute/static trick to stack them but keep layout size if relative
                                // Actually for smooth fading in place, absolute positioning on top of each other is better, 
                                // or we effectively hide the others.
                                // To avoid layout shift, we can make the container relative and children absolute, 
                                // OR just render all and hide.
                                style={{
                                    display: activeStep === index ? 'flex' : 'none'  // forceful switch for simple swap, or use block/hidden
                                    // But user wanted simple fade? The code below handles standard list but we want in-place.
                                }}
                            >
                                {/* Actually let's do a better animation approach: 
                       All items rendered, absolute positioned in a relative container, fading in/out. 
                   */}
                            </div>
                        ))}

                        {/* Refined Text Implementation */}
                        <div className="relative h-[300px] w-full flex items-center">
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out ${activeStep === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                        }`}
                                >
                                    <p className="text-blue-600 font-bold text-lg mb-4 tracking-wide uppercase">{step.step}</p>
                                    <h2 className="text-4xl md:text-5xl font-bold mb-6 font-gen text-gray-900 leading-tight">
                                        {step.title}
                                    </h2>
                                    <p className="text-xl text-gray-500 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {/* Dots/Indicators */}
                        <div className="flex gap-2 mt-8">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 rounded-full transition-all duration-500 ${activeStep === i ? "w-8 bg-blue-600" : "w-2 bg-gray-200"}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right: Phone Mockup (Stays fixed, image changes) */}
                    <div className="md:w-1/2 order-1 md:order-2 flex justify-center items-center h-full relative">
                        {/* <div className="relative bg-black rounded-[3.5rem] border-[10px] border-gray-900 shadow-2xl overflow-hidden z-20 transition-transform duration-700"> */}
                        {/* Notch */}
                        {/* <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20"></div> */}

                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 w-[320px] h-[640px] transition-opacity duration-700 ease-in-out bg-white ${activeStep === index ? 'opacity-100' : 'opacity-0'}`}
                            >
                                <Image
                                    src={step.image}
                                    alt={step.title}
                                    fill
                                    className="object-contain bg-white"
                                    priority={index === 0}
                                />
                            </div>
                        ))}
                        {/* </div> */}

                        {/* Optional: Add background blob/glow that stays fixed or pulses */}
                        {/* <div className="absolute inset-0 bg-blue-500/5 blur-[100px] -z-10 rounded-full w-[80%] h-[80%] top-[10%] left-[10%]"></div> */}
                    </div>

                </div>
            </div>
        </section>
    );
}
