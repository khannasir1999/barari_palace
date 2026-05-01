import { useState, useEffect } from 'react';

const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

const Preloader = () => {
    const [animate, setAnimate] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const t1 = setTimeout(() => setAnimate(true), 120);
        const t2 = setTimeout(() => setFadeOut(true), 2700);
        const t3 = setTimeout(() => setDone(true), 3380);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    if (done) return null;

    return (
        <div
            className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-[9999]"
            style={{
                opacity: fadeOut ? 0 : 1,
                pointerEvents: fadeOut ? 'none' : 'auto',
                transition: 'opacity 650ms ease',
            }}
        >
            <div className="flex flex-col items-center gap-3">

                <div className="flex items-center gap-5">

                    {/* ARY — slides in from left */}
                    <span
                        className="font-montserrat font-black leading-none shrink-0 bg-gradient-to-b from-[#f7df72] via-[#daa520] to-[#b8860b] bg-clip-text text-transparent"
                        style={{
                            fontSize: 'clamp(56px, 11vw, 120px)',
                            transform: animate ? 'translateX(0)' : 'translateX(-100vw)',
                            opacity: animate ? 1 : 0,
                            transition: `transform 950ms ${ease}, opacity 350ms ease`,
                        }}
                    >
                        ARY
                    </span>

                    {/* Hexagon & — rises from bottom */}
                    <div
                        className="flex items-center shrink-0"
                        style={{
                            transform: animate ? 'translateY(0)' : 'translateY(80px)',
                            opacity: animate ? 1 : 0,
                            transition: `transform 950ms ${ease} 120ms, opacity 550ms ease 120ms`,
                        }}
                    >
                        <svg
                            viewBox="0 0 60 70"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ width: 'clamp(32px, 5vw, 68px)', height: 'clamp(38px, 6vw, 80px)' }}
                        >
                            <defs>
                                <linearGradient id="hexGold" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f7df72" />
                                    <stop offset="50%" stopColor="#c9a227" />
                                    <stop offset="100%" stopColor="#b8860b" />
                                </linearGradient>
                            </defs>
                            <polygon
                                points="30,4 55,18 55,52 30,66 5,52 5,18"
                                fill="none"
                                stroke="url(#hexGold)"
                                strokeWidth="2.2"
                            />
                            <text
                                x="30"
                                y="37"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="url(#hexGold)"
                                fontSize="24"
                                fontWeight="bold"
                                fontFamily="Montserrat, Arial, sans-serif"
                            >
                                {"&"}
                            </text>
                        </svg>
                    </div>

                    {/* MAZ — slides in from right */}
                    <span
                        className="font-montserrat font-black leading-none shrink-0 bg-gradient-to-b from-[#e8e8e8] via-[#b0b0b0] to-[#888888] bg-clip-text text-transparent"
                        style={{
                            fontSize: 'clamp(56px, 11vw, 120px)',
                            transform: animate ? 'translateX(0)' : 'translateX(100vw)',
                            opacity: animate ? 1 : 0,
                            transition: `transform 950ms ${ease}, opacity 350ms ease`,
                        }}
                    >
                        MAZ
                    </span>
                </div>

                {/* DEVELOPMENTS — rises from bottom */}
                <div
                    className="font-montserrat font-light text-[#8a8a8a] uppercase tracking-[0.3em]"
                    style={{
                        fontSize: 'clamp(8px, 1.5vw, 14px)',
                        letterSpacing: 'clamp(4px, 1vw, 10px)',
                        transform: animate ? 'translateY(0)' : 'translateY(60px)',
                        opacity: animate ? 1 : 0,
                        transition: `transform 950ms ${ease} 280ms, opacity 550ms ease 280ms`,
                    }}
                >
                    DEVELOPMENTS
                </div>

            </div>
        </div>
    );
};

export default Preloader;