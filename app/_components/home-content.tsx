"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Users, ClipboardList, Trophy, ArrowRight } from "lucide-react";

export function HomeContent() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="relative w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl bg-white">
          <Image
            src="/lv-logo.jpg"
            alt="LV Logo"
            fill
            className="object-contain p-2"
            unoptimized
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          LV <span className="text-green-300">Team Builder</span>
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          Fair, balanced team generation for your weekly golf games. Check in, generate teams, and hit the course!
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-3 gap-6 mb-12"
      >
        <FeatureCard
          icon={<ClipboardList className="w-8 h-8" />}
          title="Easy Check-in"
          description="Players can check themselves in from their phones. Quick and simple."
          delay={0.3}
        />
        <FeatureCard
          icon={<Users className="w-8 h-8" />}
          title="Fair Teams"
          description="Snake draft algorithm ensures balanced teams based on handicaps and tiers."
          delay={0.4}
        />
        <FeatureCard
          icon={<Trophy className="w-8 h-8" />}
          title="Generate & Play"
          description="One tap to generate balanced teams. Then hit the course and compete!"
          delay={0.5}
        />
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <Link href="/login">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-800 font-bold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm shadow-xl"
    >
      <div className="w-14 h-14 rounded-xl bg-green-500/30 flex items-center justify-center text-green-300 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/70">{description}</p>
    </motion.div>
  );
}
