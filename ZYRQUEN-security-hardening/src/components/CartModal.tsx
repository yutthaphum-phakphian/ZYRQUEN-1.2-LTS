import React from 'react';
import { ShoppingCart, X, Trash2, Plus, Minus, Check, ArrowRight, Sparkles } from 'lucide-react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  desc?: string;
  icon?: string;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (id: number, delta: number) => void;
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm transition-opacity">
      <div className="bg-stone-900 border-l border-stone-800 w-full max-w-md h-full shadow-2xl flex flex-col text-stone-100 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">ตะกร้าสินค้า</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-stone-950">
                  {totalQty} ชิ้น
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                คีย์ลัด <kbd className="px-1 py-0.5 bg-stone-800 border border-stone-700 rounded text-[10px] font-mono text-amber-300">Ctrl+Shift+C</kbd> เพื่อเปิด/ปิด
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            title="ปิดตะกร้า (Esc หรือ Ctrl+Shift+C)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-3 text-stone-500">
              <div className="text-4xl">🛒</div>
              <p className="text-sm font-medium">ยังไม่มีสินค้าในตะกร้า</p>
              <p className="text-xs text-stone-600 max-w-xs mx-auto">
                เลือกสั่งเครื่องดื่มจากเมนูในหน้าเว็บ หรือสั่ง AI ด้วยเสียง เช่น “เพิ่มเอสเพรสโซ่ลงตะกร้า 2 แก้ว”
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-3 shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{item.icon || '☕'}</div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.name}</h4>
                    <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                      ฿{item.price} / แก้ว
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
                    <button
                      onClick={() => onUpdateQty(item.id, -1)}
                      className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-mono text-xs font-bold text-stone-200">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.id, 1)}
                      className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-bold text-xs text-amber-300 w-12 text-right">
                    ฿{item.price * item.qty}
                  </span>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer rounded hover:bg-rose-950/40"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950 space-y-3">
          <div className="space-y-1.5 text-xs text-stone-400">
            <div className="flex items-center justify-between">
              <span>ราคาสินค้ารวม:</span>
              <span className="font-mono text-stone-200">฿{totalPrice}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>ส่วนลดโปรโมชั่น:</span>
              <span className="text-emerald-400 font-mono">-฿0</span>
            </div>
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-sm">
              <span className="font-bold text-white">ยอดชำระสุทธิ:</span>
              <span className="font-extrabold text-xl text-amber-400 font-mono">฿{totalPrice}</span>
            </div>
          </div>

          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <span>ดำเนินการสั่งซื้อและชำระเงิน</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
