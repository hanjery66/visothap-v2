
"use client";

import { useEffect, useRef, useState } from "react";

interface AutoScaleLayoutProps {
    designWidth?: number;
}

export default function AutoScaleLayout({
    designWidth = 1440,
}: AutoScaleLayoutProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const [scale, setScale] = useState(1);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        const container = containerRef.current;
        const content = contentRef.current;

        if (!container || !content) return;

        const update = () => {
            const availableWidth = container.clientWidth;

            const nextScale = Math.min(
                1,
                availableWidth / designWidth
            );

            setScale(nextScale);
            setHeight(content.offsetHeight);
        };

        const observer = new ResizeObserver(update);

        observer.observe(container);
        observer.observe(content);

        window.addEventListener("resize", update);

        update();

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", update);
        };
    }, [designWidth]);

    return (
        <div className="min-h-screen flex flex-col">

            {/* Main website */}
            <div className="flex-1 w-full">
                <div
                    ref={containerRef}
                    className="w-full overflow-hidden relative"
                    style={{ height: height * scale }}
                >
                    <div
                        ref={contentRef}
                        style={{
                            width: designWidth,
                            position: "absolute",
                            left: "50%",
                            transform: `translateX(-50%) scale(${scale})`,
                            transformOrigin: "top center",
                        }}
                    >
                        <main className="min-h-screen bg-slate-100 p-10">

                            {/* Header */}
                            <header className="flex items-center justify-between bg-white p-6 rounded-xl">
                                <h1 className="text-3xl font-bold">
                                    My Dashboard
                                </h1>
                                <nav className="flex gap-8 text-lg">
                                    <a href="#">Home</a>
                                    <a href="#">Products</a>
                                    <a href="#">About</a>
                                    <a href="#">Contact</a>
                                </nav>
                            </header>

                            {/* Hero */}
                            <section className="mt-8 bg-blue-600 text-white rounded-2xl p-12">
                                <h2 className="text-5xl font-bold">
                                    Welcome to My Website
                                </h2>
                                <p className="text-xl mt-4">
                                    This is a fixed-width layout that scales automatically.
                                </p>
                                <button className="mt-8 bg-white text-blue-600 px-8 py-4 rounded-lg">
                                    Get Started
                                </button>
                            </section>

                            {/* Cards */}
                            <section className="grid grid-cols-3 gap-6 mt-8">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="bg-white rounded-xl p-8 shadow-sm"
                                    >
                                        <div className="h-40 bg-slate-200 rounded-lg mb-6" />
                                        <h3 className="text-2xl font-bold">
                                            Card {item}
                                        </h3>
                                        <p className="text-slate-500 mt-3 text-lg">
                                            Example content to test scaling.
                                        </p>
                                    </div>
                                ))}
                            </section>

                            {/* Table */}
                            <section className="mt-8 bg-white rounded-xl p-8">
                                <h2 className="text-3xl font-bold mb-6">
                                    Recent Transactions
                                </h2>
                                <table className="w-full text-left text-lg">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5].map((item) => (
                                            <tr key={item} className="border-b">
                                                <td className="p-4">Customer {item}</td>
                                                <td className="p-4">Nov {item}, 2026</td>
                                                <td className="p-4 text-green-600">Completed</td>
                                                <td className="p-4">${item * 120}.00</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>

                        </main>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-auto bg-red-500 text-white p-6">
                <h1>Hello Footer</h1>
            </footer>

        </div>
    );
}
