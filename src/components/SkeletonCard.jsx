import React from 'react';

const Shimmer = () => (
    <>
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
            animation: 'shimmer 1.5s infinite'
        }} />
        <style>
            {`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}
        </style>
    </>
);

export const SkeletonStatCard = () => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-tertiary)',
            flexShrink: 0
        }} />
        <div style={{ flex: 1 }}>
            <div style={{ height: '14px', width: '60%', backgroundColor: 'var(--bg-tertiary)', marginBottom: '8px', borderRadius: '4px' }} />
            <div style={{ height: '28px', width: '40%', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }} />
        </div>
        <Shimmer />
    </div>
);

export const SkeletonQuickActionCard = () => (
    <div className="card center-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', height: '120px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-tertiary)'
        }} />
        <div style={{ height: '16px', width: '70%', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }} />
        <Shimmer />
    </div>
);

export const SkeletonChartCard = () => (
    <div className="card" style={{ height: '400px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '24px', width: '30%', backgroundColor: 'var(--bg-tertiary)', marginBottom: '2rem', borderRadius: '4px' }} />
        <div style={{ flex: 1, backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', opacity: 0.5 }} />
        <Shimmer />
    </div>
);

export const SkeletonListCard = () => (
    <div className="card" style={{ height: '400px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)' }} />
            <div style={{ height: '24px', width: '40%', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }} />
        </div>
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }} />
                        <div style={{ width: '100px', height: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }} />
                    </div>
                    <div style={{ width: '60px', height: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }} />
                </div>
            ))}
        </div>
        <Shimmer />
    </div>
);
