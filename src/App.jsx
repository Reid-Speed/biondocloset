import React, { useState, useEffect } from 'react';
import { ShoppingCart, Tag, Share2, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export default function ApartmentStore() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [discountCount, setDiscountCount] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', image: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadItems();
  }, []);

  useEffect(() => {
    if (userCode) {
      loadDiscountCount();
    }
  }, [userCode]);

  const loadUserData = async () => {
    let code = localStorage.getItem('my_referral_code');
    if (!code) {
      code = generateReferralCode();
      localStorage.setItem('my_referral_code', code);
    }
    
    // Always try to register the code (in case it wasn't registered before)
    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', code })
      });
      const data = await response.json();
      console.log('Referral code registered:', code, data);
    } catch (error) {
      console.error('Error registering referral code:', error);
    }
    
    setUserCode(code);
  };

  const loadItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscountCount = async () => {
    try {
      const res = await fetch(`/api/referrals?userCode=${userCode}`);
      const data = await res.json();
      setDiscountCount(data.count || 0);
    } catch (error) {
      console.error('Error loading discounts:', error);
    }
  };

  const generateReferralCode = () => {
    return 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const applyReferralCode = async () => {
    if (!referralCode.trim()) return;

    try {
      const validateRes = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', code: referralCode })
      });
      const validateData = await validateRes.json();

      if (!validateData.valid) {
        alert('Invalid referral code');
        return;
      }

      const useRes = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'use', userCode, usedCode: referralCode })
      });

      const useData = await useRes.json();

      if (useData.error) {
        alert(useData.error);
        return;
      }

      await loadDiscountCount();
      alert(`Referral code applied! You now have ${discountCount + 1} discount(s)`);
      setReferralCode('');
    } catch (error) {
      alert('Error applying referral code');
    }
  };

  const calculatePrice = (originalPrice) => {
    let price = originalPrice;
    for (let i = 0; i < discountCount; i++) {
      price = price * 0.5;
    }
    return price;
  };

  const addToCart = (item) => {
    setCart(item);
  };

  const checkout = async () => {
    if (!cart) return;

    try {
      await fetch('/api/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cart.id })
      });

      await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', code: userCode })
      });

      await loadItems();
      setShowCheckout(true);
    } catch (error) {
      alert('Error processing checkout');
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdmin(true);
    } else {
      alert('Incorrect password');
    }
  };

  const addItem = async () => {
    if (!newItem.name || !newItem.price) {
      alert('Please fill in name and price');
      return;
    }

    const item = {
      id: Date.now().toString(),
      name: newItem.name,
      price: parseFloat(newItem.price),
      description: newItem.description,
      image: newItem.image
    };

    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });

      await loadItems();
      setNewItem({ name: '', price: '', description: '', image: '' });
    } catch (error) {
      alert('Error adding item');
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await fetch('/api/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId })
      });

      await loadItems();
    } catch (error) {
      alert('Error deleting item');
    }
  };

  const updateItem = async () => {
    if (!editingItem) return;

    try {
      await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });

      await loadItems();
      setEditingItem(null);
    } catch (error) {
      alert('Error updating item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading store...</div>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-none shadow-2xl p-10 max-w-md w-full text-center border-4 border-stone-600">
          <Check className="w-20 h-20 text-lime-500 mx-auto mb-4" />
          <h2 className="text-4xl font-bold mb-6 text-stone-900 uppercase tracking-wide" style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>Order Confirmed!</h2>
          <p className="text-stone-800 mb-6 font-medium text-lg" style={{fontFamily: 'Georgia, serif'}}>
            Please send ${calculatePrice(cart.price).toFixed(2)} via Venmo to complete your purchase.
          </p>
          <div className="bg-lime-100 border-4 border-lime-500 rounded-none p-5 mb-6">
            <p className="font-bold text-2xl text-stone-900 uppercase tracking-wide">Venmo: @Reid-Biondo</p>
          </div>
          <div className="bg-stone-200 border-4 border-stone-500 rounded-none p-5 mb-6">
            <p className="text-sm font-bold mb-3 text-stone-800 uppercase tracking-wide">Your Referral Code:</p>
            <p className="text-3xl font-bold text-stone-900 tracking-widest" style={{fontFamily: 'Courier New, monospace'}}>{userCode}</p>
            <p className="text-xs text-stone-700 mt-3 font-medium">Share this with friends to earn 50% discounts!</p>
          </div>
          <button
            onClick={() => {
              setShowCheckout(false);
              setCart(null);
            }}
            className="bg-green-700 text-white px-8 py-3 rounded-none hover:bg-green-800 font-bold uppercase tracking-wide shadow-lg"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Simplified Greek Key Pattern Border */}
      <div className="h-12 bg-gradient-to-r from-green-700 via-lime-500 to-yellow-400 border-b-4 border-stone-800"></div>

      <div className="bg-stone-200 border-b-2 border-stone-400">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-stone-800 uppercase" 
                  style={{fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: '0.05em'}}>
                Reid's Collection
              </h1>
              <p className="text-stone-700 text-lg mt-2 font-medium" style={{fontFamily: 'Georgia, serif'}}>
                Timeless pieces for modern living
              </p>
            </div>
            {!isAdmin && (
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="border rounded px-3 py-2"
                />
                <button onClick={handleAdminLogin} className="bg-green-800 text-white px-5 py-2 rounded-none font-bold uppercase tracking-wide hover:bg-green-900" style={{fontFamily: 'Arial, sans-serif'}}>
                  Admin
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-slate-700 via-stone-700 to-slate-600 rounded-2xl p-8 mb-8 text-white shadow-2xl border-4 border-stone-400">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Share2 className="w-6 h-6" />
                <h2 className="text-2xl font-bold uppercase tracking-wide" style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>
                  Your Referral Code
                </h2>
              </div>
              <p className="text-4xl font-bold mb-3 tracking-widest" style={{fontFamily: 'Courier New, monospace'}}>{userCode}</p>
              <p className="text-stone-200 font-medium">Share with friends to earn 50% discounts!</p>
              <p className="text-sm mt-3 text-stone-300">Active discounts: <span className="font-bold text-2xl text-lime-400">{discountCount}</span> (stackable!)</p>
            </div>
            <div className="bg-white/20 rounded-xl p-5 backdrop-blur border-2 border-lime-400">
              <p className="text-sm mb-3 font-bold uppercase tracking-wide">Have a referral code?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER CODE"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="px-4 py-2 rounded-none border-2 border-stone-800 text-gray-900 font-bold uppercase"
                  style={{fontFamily: 'Courier New, monospace'}}
                />
                <button
                  onClick={applyReferralCode}
                  className="bg-lime-500 text-stone-900 px-5 py-2 rounded-none font-bold uppercase tracking-wide hover:bg-lime-400"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-stone-50 rounded-none shadow-lg p-6 mb-8 border-4 border-stone-400">
            <h2 className="text-2xl font-bold mb-4 text-stone-800 uppercase tracking-wide" style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>Add New Item</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                className="border rounded px-3 py-2 col-span-2"
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={newItem.image}
                onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                className="border rounded px-3 py-2 col-span-2"
              />
            </div>
            <button onClick={addItem} className="bg-green-700 text-white px-6 py-3 rounded-none hover:bg-green-800 flex items-center gap-2 font-bold uppercase tracking-wide shadow-lg">
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-none shadow-xl hover:shadow-2xl transition-shadow border-4 border-stone-300">
              {editingItem?.id === item.id ? (
                <div className="p-4">
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                    className="border rounded px-2 py-1 w-full mb-2"
                  />
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                    className="border rounded px-2 py-1 w-full mb-2"
                  />
                  <input
                    type="text"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    className="border rounded px-2 py-1 w-full mb-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={updateItem} className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingItem(null)} className="bg-gray-500 text-white px-3 py-1 rounded text-sm">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-xl mb-2 text-stone-900 uppercase tracking-wide" style={{fontFamily: 'Arial Black, sans-serif'}}>{item.name}</h3>
                    {item.description && (
                      <p className="text-stone-700 text-sm mb-4" style={{fontFamily: 'Georgia, serif'}}>{item.description}</p>
                    )}
                    <div className="mb-4">
                      <p className="text-stone-500 text-sm line-through font-medium">${parseFloat(item.price).toFixed(2)}</p>
                      <p className="text-4xl font-bold text-green-700">
                        ${calculatePrice(parseFloat(item.price)).toFixed(2)}
                      </p>
                      {discountCount > 0 && (
                        <p className="text-xs text-lime-600 font-bold uppercase mt-1">
                          {discountCount} discount{discountCount > 1 ? 's' : ''} applied!
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(item)}
                        className="flex-1 bg-green-700 text-white px-4 py-3 rounded-none hover:bg-green-800 flex items-center justify-center gap-2 font-bold uppercase tracking-wide shadow-lg"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy Now
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => setEditingItem(item)} className="bg-yellow-500 text-white px-3 py-2 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className="bg-red-500 text-white px-3 py-2 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-16 text-stone-700">
            <Tag className="w-20 h-20 mx-auto mb-4 opacity-40" />
            <p className="text-2xl font-bold uppercase tracking-wide" style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>No items available yet</p>
            {isAdmin && <p className="text-sm mt-2 font-medium">Add your first item above!</p>}
          </div>
        )}
      </div>

      {cart && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-100 rounded-none p-8 max-w-md w-full border-4 border-stone-600 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-stone-900 uppercase tracking-wide" style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>Checkout</h2>
            <div className="mb-6">
              <h3 className="font-bold text-lg text-stone-900 uppercase" style={{fontFamily: 'Arial Black, sans-serif'}}>{cart.name}</h3>
              <p className="text-stone-700 mb-4 mt-2" style={{fontFamily: 'Georgia, serif'}}>{cart.description}</p>
              <div className="bg-white p-4 rounded-none border-2 border-stone-400">
                <p className="text-sm text-stone-700 font-medium">Original price: ${parseFloat(cart.price).toFixed(2)}</p>
                {discountCount > 0 && (
                  <p className="text-sm text-lime-600 font-bold uppercase mt-1">With {discountCount} discount{discountCount > 1 ? 's' : ''}</p>
                )}
                <p className="text-3xl font-bold text-green-800 mt-3">
                  Final: ${calculatePrice(parseFloat(cart.price)).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={checkout}
                className="flex-1 bg-green-700 text-white px-6 py-4 rounded-none hover:bg-green-800 font-bold uppercase tracking-wide shadow-lg"
              >
                Confirm Purchase
              </button>
              <button
                onClick={() => setCart(null)}
                className="px-6 py-4 border-4 border-stone-700 text-stone-900 rounded-none hover:bg-stone-200 font-bold uppercase tracking-wide"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}