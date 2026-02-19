
import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
               <a href="/" className="block">
                  <img 
                    src="https://images.squarespace-cdn.com/content/v1/5f4d40b11b4f1e6a11b920b5/1598967776211-2JVFU1R4U8PQM71BWUVE/WorldClassTitle_Logos-RGB-Primary.png?format=1500w" 
                    alt="World Class Title" 
                    className="h-9 w-auto object-contain"
                  />
               </a>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-slate-500 hover:text-brand-blue text-sm font-medium transition-colors">Services</a>
              <a href="#" className="text-slate-500 hover:text-brand-blue text-sm font-medium transition-colors">Locations</a>
              <a href="#" className="text-slate-500 hover:text-brand-blue text-sm font-medium transition-colors">About</a>
              <a href="#" className="bg-brand-blue text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-blue-800 transition-all shadow-sm">Contact Us</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-brand-blue text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <img 
                src="https://images.squarespace-cdn.com/content/v1/5f4d40b11b4f1e6a11b920b5/1598967776211-2JVFU1R4U8PQM71BWUVE/WorldClassTitle_Logos-RGB-Primary.png?format=1500w" 
                alt="World Class Title" 
                className="h-8 w-auto brightness-0 invert mx-auto md:mx-0"
              />
              <p className="text-brand-lightBlue text-xs leading-relaxed max-w-xs mx-auto md:mx-0">Providing premium title and escrow services with confidence and clarity across the nation.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-xs text-brand-lightBlue">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Wire Fraud Notice</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider">Contact</h4>
              <p className="text-xs text-brand-lightBlue leading-loose">
                123 Premium Lane, Suite 100<br/>
                New York, NY 10001<br/>
                <span className="text-white font-medium">(888) WCT-TITLE</span>
              </p>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-blue-900 text-[10px] text-brand-greyBlue text-center">
            © {new Date().getFullYear()} World Class Title. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
