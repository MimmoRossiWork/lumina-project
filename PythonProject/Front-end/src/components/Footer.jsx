import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-left">
          <div>© {new Date().getFullYear()} Benessere360</div>
          <div className="footer-small">All rights reserved</div>
        </div>
        <div className="footer-center">
          <div>Una piattaforma per il benessere fisico e mentale a 360°</div>
        </div>
        <div className="footer-right">
          <a className="footer-link" href="/privacy">Privacy</a>
        </div>
      </div>
    </footer>
  );
}