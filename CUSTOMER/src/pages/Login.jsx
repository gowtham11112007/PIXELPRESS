import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Login() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!phone.match(/^\d{10}$/)) { setError('Please enter a valid 10-digit phone number.'); return; }
    login(name.trim(), phone);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top accent */}
      <div className="h-1 bg-black w-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-black rounded flex items-center justify-center mb-3">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black">PixelPress</h1>
          <p className="text-gray-500 text-sm mt-1 text-center">
            Custom Posters, Delivered on Campus
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            Enter your details to continue
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Gowtham Yuvaraj"
                className="w-full border border-gray-300 rounded-none px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1.5">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="w-full border border-gray-300 rounded-none px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors placeholder-gray-400"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 border border-red-200 bg-red-50 px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white text-sm font-semibold py-3 tracking-widest uppercase transition-colors mt-2 active:scale-[0.98]"
            >
              Continue
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            No password required — just your name & phone number.
          </p>
        </div>
      </div>
    </div>
  );
}
