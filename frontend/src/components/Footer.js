import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1A1A1A] text-[#FDFBF7] py-24">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-2xl mb-6">Mfrida</h3>
            <p className="text-[#F5F2EB]/70 text-sm leading-relaxed">
              Luxury fragrances crafted with passion. Experience the essence of elegance.
            </p>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-widest mb-6">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/products?category=attar" className="text-sm text-[#F5F2EB]/70 hover:text-[#B76E79] transition-colors">
                  Attar
                </Link>
              </li>
              <li>
                <Link to="/products?category=perfume-spray" className="text-sm text-[#F5F2EB]/70 hover:text-[#B76E79] transition-colors">
                  Perfume Spray
                </Link>
              </li>
              <li>
                <Link to="/products?category=bakhoor" className="text-sm text-[#F5F2EB]/70 hover:text-[#B76E79] transition-colors">
                  Bakhoor
                </Link>
              </li>
              <li>
                <Link to="/products?new=true" className="text-sm text-[#F5F2EB]/70 hover:text-[#B76E79] transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-[#F5F2EB]/70 hover:text-[#B76E79] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-[#F5F2EB]/70 hover:text-[#B76E79] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sm text-[#F5F2EB]/70 hover:text-[#B76E79] transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-sm text-[#F5F2EB]/70 hover:text-[#B76E79] transition-colors">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-widest mb-6">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 border border-[#F5F2EB]/20 flex items-center justify-center hover:border-[#B76E79] hover:text-[#B76E79] transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 border border-[#F5F2EB]/20 flex items-center justify-center hover:border-[#B76E79] hover:text-[#B76E79] transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 border border-[#F5F2EB]/20 flex items-center justify-center hover:border-[#B76E79] hover:text-[#B76E79] transition-colors">
                <Twitter size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[#F5F2EB]/10 text-center">
          <p className="text-sm text-[#F5F2EB]/50">
            © 2025 Mfrida Fragrance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
