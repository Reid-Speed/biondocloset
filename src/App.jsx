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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Order Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Please send ${calculatePrice(cart.price).toFixed(2)} via Venmo to complete your purchase.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="font-semibold text-lg">Venmo: @Reid-Biondo</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold mb-2">Your Referral Code:</p>
            <p className="text-2xl font-bold text-green-600">{userCode}</p>
            <p className="text-xs text-gray-600 mt-2">Share this with friends to earn 50% discounts!</p>
          </div>
          <button
            onClick={() => {
              setShowCheckout(false);
              setCart(null);
            }}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Apartment Sale</h1>
              <p className="text-gray-600">Everything must go!</p>
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
                <button onClick={handleAdminLogin} className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
                  Admin
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8 text-white">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-5 h-5" />
                <h2 className="text-xl font-bold">Your Referral Code</h2>
              </div>
              <p className="text-3xl font-bold mb-2">{userCode}</p>
              <p className="text-blue-100">Share with friends to earn 50% discounts!</p>
              <p className="text-sm mt-2">Active discounts: <span className="font-bold text-xl">{discountCount}</span> (stackable!)</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
              <p className="text-sm mb-2">Have a referral code?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="px-3 py-2 rounded border-0 text-gray-900"
                />
                <button
                  onClick={applyReferralCode}
                  className="bg-white text-purple-600 px-4 py-2 rounded font-semibold hover:bg-blue-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Add New Item</h2>
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
            <button onClick={addItem} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
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
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded-t-lg" />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                    )}
                    <div className="mb-3">
                      <p className="text-gray-500 text-sm line-through">${parseFloat(item.price).toFixed(2)}</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${calculatePrice(parseFloat(item.price)).toFixed(2)}
                      </p>
                      {discountCount > 0 && (
                        <p className="text-xs text-green-600">
                          {discountCount} discount{discountCount > 1 ? 's' : ''} applied!
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(item)}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2"
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
          <div className="text-center py-12 text-gray-500">
            <Tag className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No items available yet</p>
            {isAdmin && <p className="text-sm">Add your first item above!</p>}
          </div>
        )}
      </div>

      {cart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Checkout</h2>
            <div className="mb-4">
              <h3 className="font-semibold text-lg">{cart.name}</h3>
              <p className="text-gray-600 mb-2">{cart.description}</p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Original price: ${parseFloat(cart.price).toFixed(2)}</p>
                {discountCount > 0 && (
                  <p className="text-sm text-green-600">With {discountCount} discount{discountCount > 1 ? 's' : ''}</p>
                )}
                <p className="text-2xl font-bold text-green-600 mt-2">
                  Final: ${calculatePrice(parseFloat(cart.price)).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={checkout}
                className="flex-1 bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 font-semibold"
              >
                Confirm Purchase
              </button>
              <button
                onClick={() => setCart(null)}
                className="px-4 py-3 border rounded hover:bg-gray-50"
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