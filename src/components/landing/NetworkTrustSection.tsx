import React from 'react';
import { ShieldCheck, Wifi, MapPin, Gauge, Lock, Smartphone } from 'lucide-react';

export const NetworkTrustSection: React.FC = () => {
  return (
    <section id="network" className="py-16 sm:py-24 bg-[#08281D] text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-0 right-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/70 px-3.5 py-1 text-xs font-semibold text-emerald-300 mb-3">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Infrastructure Transparency</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Powered by the Telus Nationwide 5G Network
          </h2>
          <p className="mt-3 text-sm sm:text-base text-emerald-100/80">
            CTExcel subscribers connect to identical Telus cell towers, frequencies, and low-latency nodes used by Canada's most demanding mobile users.
          </p>
        </div>

        {/* 4 Feature Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-6 backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">99% Canadian Coverage</h3>
            <p className="text-xs text-emerald-100/70 leading-relaxed">
              Stay connected from coast to coast across urban centers, rural highways, cottage country, and mountain transit corridors.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-6 backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 mb-4">
              <Gauge className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Blazing 5G Speeds</h3>
            <p className="text-xs text-emerald-100/70 leading-relaxed">
              Experience up to 250 Mbps to 1 Gbps download speeds for seamless 4K streaming, rapid file transfers, and crystal-clear video calls.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-6 backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 mb-4">
              <Smartphone className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Instant eSIM Delivery</h3>
            <p className="text-xs text-emerald-100/70 leading-relaxed">
              No waiting for couriers. Scan a secure QR code sent directly to your email and activate your phone line in under 5 minutes.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-6 backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Keep Your Number 100%</h3>
            <p className="text-xs text-emerald-100/70 leading-relaxed">
              Effortlessly port your existing number from Rogers, Bell, Freedom, Fido, Virgin, Koodo, or Chatr with zero service downtime.
            </p>
          </div>
        </div>

        {/* Speed Comparison Strip */}
        <div className="mt-10 rounded-2xl border border-emerald-700/40 bg-emerald-900/30 p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-emerald-500/20 p-3 text-emerald-300">
                <Wifi className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Full Telus 5G+ Network Access</h4>
                <p className="text-xs text-emerald-200/80">Includes VoLTE, Wi-Fi Calling, Visual Voicemail, and full-speed hotspot sharing.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 rounded-xl bg-emerald-950/70 border border-emerald-800/50">
                <div className="text-xs text-emerald-300">Average Latency</div>
                <div className="text-lg font-bold text-white">18ms</div>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-emerald-950/70 border border-emerald-800/50">
                <div className="text-xs text-emerald-300">Peak Download</div>
                <div className="text-lg font-bold text-white">1,000 Mbps</div>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-emerald-950/70 border border-emerald-800/50">
                <div className="text-xs text-emerald-300">Uptime SLA</div>
                <div className="text-lg font-bold text-white">99.98%</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
