
import React from 'react';

export const Header: React.FC = () => (
  <header className="text-center">
    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
      AI Image Design Replacer
    </h1>
    <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
      Upload a base image and a pattern, then tell the AI how to combine them. Instantly see your design ideas come to life.
    </p>
  </header>
);
