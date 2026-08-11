'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { LogoIcon } from '@/components/LogoIcon';

export function FooterReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end end'],
  });

  const opacity = useTransform(scrollYProgress, [0.6, 1], [0, 1]);
  const scale = useTransform(scrollYProgress, [0.6, 1], [0.94, 1]);
  const y = useTransform(scrollYProgress, [0.6, 1], [40, 0]);

  return (
    <div ref={containerRef} className="relative">
      {/* Sticky footer that reveals underneath */}
      <motion.footer
        style={{ opacity, scale, y }}
        className="sticky bottom-0 z-0 bg-[#1a2a3a] pt-20 pb-12 px-6 overflow-hidden"
      >
        {/* Large wordmark with stagger reveal */}
        <div className="max-w-6xl mx-auto mb-16 overflow-hidden">
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-4 mb-2"
          >
            <LogoIcon size={32} monochrome className="text-[#C8D9E6]" />
            <span className="font-heading font-bold text-5xl md:text-7xl text-[#FFFFFF] tracking-tight">
              CodeAtlas
            </span>
          </motion.div>
          <motion.p
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 0.6 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-[#C8D9E6]/60 text-lg md:text-xl font-light max-w-lg"
          >
            Software that understands software.
          </motion.p>
        </div>

        {/* Link columns */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16 mb-16">
            {/* Product */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="text-[11px] font-bold text-[#C8D9E6] uppercase tracking-[0.2em] mb-5">
                Product
              </h4>
              <ul className="space-y-3.5">
                {[
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Analyze Repository', href: '/dashboard/upload' },
                  { label: 'Capabilities', href: '/dashboard/capabilities' },
                  { label: 'Reports', href: '/dashboard/reports' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group relative text-sm text-[#C8D9E6]/55 hover:text-[#FFFFFF] transition-colors duration-300 inline-flex items-center gap-2"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-[#C8D9E6] group-hover:w-full transition-all duration-300" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Developers */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="text-[11px] font-bold text-[#C8D9E6] uppercase tracking-[0.2em] mb-5">
                Developers
              </h4>
              <ul className="space-y-3.5">
                {[
                  { label: 'GitHub', href: 'https://github.com/neevrambhia06/CodeAtlas', external: true },
                  { label: 'Documentation', href: '#' },
                  { label: 'API Reference', href: '#' },
                ].map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative text-sm text-[#C8D9E6]/55 hover:text-[#FFFFFF] transition-colors duration-300 inline-flex items-center gap-2"
                      >
                        <span className="relative">
                          {link.label}
                          <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-[#C8D9E6] group-hover:w-full transition-all duration-300" />
                        </span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-60 transition-opacity">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="group relative text-sm text-[#C8D9E6]/55 hover:text-[#FFFFFF] transition-colors duration-300 inline-flex items-center gap-2"
                      >
                        <span className="relative">
                          {link.label}
                          <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-[#C8D9E6] group-hover:w-full transition-all duration-300" />
                        </span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Company */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="text-[11px] font-bold text-[#C8D9E6] uppercase tracking-[0.2em] mb-5">
                Company
              </h4>
              <ul className="space-y-3.5">
                {[
                  { label: 'About', href: '#' },
                  { label: 'Blog', href: '#' },
                  { label: 'Contact', href: 'mailto:neevrambhia@example.com' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group relative text-sm text-[#C8D9E6]/55 hover:text-[#FFFFFF] transition-colors duration-300 inline-flex items-center gap-2"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-[#C8D9E6] group-hover:w-full transition-all duration-300" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Legal */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h4 className="text-[11px] font-bold text-[#C8D9E6] uppercase tracking-[0.2em] mb-5">
                Legal
              </h4>
              <ul className="space-y-3.5">
                {[
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group relative text-sm text-[#C8D9E6]/55 hover:text-[#FFFFFF] transition-colors duration-300 inline-flex items-center gap-2"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-[#C8D9E6] group-hover:w-full transition-all duration-300" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Bottom bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[#C8D9E6]/10 gap-4"
          >
            <span className="text-xs text-[#C8D9E6]/35 font-light">
              &copy; {new Date().getFullYear()} CodeAtlas. All rights reserved.
            </span>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/neevrambhia06/CodeAtlas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C8D9E6]/35 hover:text-[#C8D9E6] transition-colors duration-300"
                aria-label="GitHub"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}
