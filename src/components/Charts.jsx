import React from 'react';

export const BarChart = () => (
    <svg width="100%" height="150" viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 dark:text-zinc-600">
        {/* Background Grid Lines */}
        <line x1="30" y1="25" x2="280" y2="25" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" className="opacity-30 dark:opacity-20" />
        <line x1="30" y1="65" x2="280" y2="65" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" className="opacity-30 dark:opacity-20" />
        <line x1="30" y1="105" x2="280" y2="105" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" className="opacity-30 dark:opacity-20" />
        <line x1="30" y1="145" x2="280" y2="145" stroke="currentColor" strokeWidth="1" className="opacity-50 dark:opacity-40" />

        {/* Y-Axis Labels */}
        <text x="10" y="30" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">600</text>
        <text x="10" y="70" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">400</text>
        <text x="10" y="110" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">200</text>
        <text x="20" y="150" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">0</text>

        {/* X-Axis Labels */}
        <text x="40" y="165" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">11</text>
        <text x="70" y="165" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">12</text>
        <text x="100" y="165" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">13</text>
        <text x="130" y="165" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">14</text>
        <text x="160" y="165" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">15</text>
        <text x="190" y="165" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">16</text>
        <text x="220" y="165" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">17</text>
        <text x="250" y="165" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">18</text>

        {/* Bars */}
        <g className="fill-gray-200 dark:fill-zinc-800">
            <rect x="42" y="80" width="8" height="65" rx="1" />
            <rect x="72" y="75" width="8" height="70" rx="1" />
            <rect x="102" y="90" width="8" height="55" rx="1" />
            <rect x="132" y="60" width="8" height="85" rx="1" />
            <rect x="162" y="70" width="8" height="75" rx="1" />
            <rect x="192" y="85" width="8" height="60" rx="1" />
            <rect x="222" y="50" width="8" height="95" rx="1" />
            <rect x="252" y="80" width="8" height="65" rx="1" />
        </g>

        <g className="fill-brand-500">
            <rect x="52" y="45" width="8" height="100" rx="1" />
            <rect x="82" y="55" width="8" height="90" rx="1" />
            <rect x="112" y="25" width="8" height="120" rx="1" />
            <rect x="142" y="100" width="8" height="45" rx="1" />
            <rect x="172" y="30" width="8" height="115" rx="1" />
            <rect x="202" y="110" width="8" height="35" rx="1" />
            <rect x="232" y="70" width="8" height="75" rx="1" />
            <rect x="262" y="40" width="8" height="105" rx="1" />
        </g>
    </svg>
);

export const WaveChart = () => (
    <svg width="100%" height="150" viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 dark:text-zinc-600">
        <line x1="30" y1="20" x2="280" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" className="opacity-30 dark:opacity-20" />
        <line x1="30" y1="80" x2="280" y2="80" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" className="opacity-30 dark:opacity-20" />
        <line x1="30" y1="140" x2="280" y2="140" stroke="currentColor" strokeWidth="1" className="opacity-50 dark:opacity-40" />

        <text x="5" y="24" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">300</text>
        <text x="5" y="84" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">200</text>
        <text x="5" y="144" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">100</text>

        {/* Wave Line 1 */}
        <path d="M40 130 C 80 130, 90 60, 130 50 C 170 40, 180 110, 220 100 C 250 90, 260 40, 280 40" stroke="currentColor" className="text-gray-300 dark:text-zinc-700" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Wave Line 2 (darker) */}
        <path d="M40 140 C 70 140, 80 100, 120 90 C 160 80, 170 130, 210 120 C 250 110, 260 50, 280 50" stroke="currentColor" className="text-brand-500" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Dots */}
        <g className="fill-white dark:fill-[#09090B] stroke-2 stroke-gray-300 dark:stroke-zinc-700">
            <circle cx="130" cy="50" r="3" />
            <circle cx="220" cy="100" r="3" />
        </g>

        <g className="fill-white dark:fill-[#09090B] stroke-2 stroke-brand-500">
            <circle cx="120" cy="90" r="3" />
            <circle cx="210" cy="120" r="3" />
        </g>

        {/* Legend Dots */}
        <circle cx="150" cy="5" r="3" className="fill-brand-500" />
        <text x="160" y="9" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">Ignition</text>

        <circle cx="210" cy="5" r="3" className="fill-gray-300 dark:fill-zinc-700" />
        <text x="220" y="9" fill="currentColor" fontSize="10" fontFamily="sans-serif" className="text-gray-400 dark:text-zinc-500">Boost</text>
    </svg>
);
