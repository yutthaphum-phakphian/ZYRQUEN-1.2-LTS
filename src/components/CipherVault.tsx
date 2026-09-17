"use client";

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  FileKey,
  Sparkles,
  AlertCircle,
  Database,
  RefreshCw,
  FolderLock,
  LockKeyhole,
} from 'lucide-react';
import {
  EncryptedPayload,
  encryptSnippet,
  decryptSnippet,
  computeDigest,
} from '../utils/cipherVaultCrypto';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { SSOT } from '../lib/ssot-data';

const STORAGE_KEY = 'zyrquen_cipher_vault_v1';

const INITIAL_DEFAULT_SNIPPETS: EncryptedPayload[] = [];

export const CipherVault: React.FC = () => {
  const [sessionPassphrase, setSessionPassphrase] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [vaultItems, setVaultItems] = useState<EncryptedPayload[]>([]);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const [visibleSnippets, setVisibleSnippets] = useState<Record<string, boolean>>({});

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'CONFIG' | 'CREDENTIAL' | 'LEGAL_NOTE' | 'KEY_BACKUP'>('CREDENTIAL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load encrypted items from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setVaultItems(JSON.parse(saved));
      }
    } catch {
      // Ignored
    }
  }, []);

  // Save encrypted items to localStorage
  const saveVault = (items: EncryptedPayload[]) => {
    setVaultItems(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignored
    }
  };

  // Unlock Vault with Session Key
  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sessionPassphrase.trim()) {
      setErrorMessage('โปรดระบุ Session Passphrase เพื่อถอดรหัสและสร้างกุญแจเซสชัน');
      playTone(300, 0.1);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    playTone(550, 0.05);

    try {
      // If we have items, test decryption on the first item or accept if empty
      const decryptedMap: Record<string, string> = {};
      let failureCount = 0;

      for (const item of vaultItems) {
        try {
          const plain = await decryptSnippet(item, sessionPassphrase);
          decryptedMap[item.id] = plain;
        } catch {
          failureCount++;
        }
      }

      if (vaultItems.length > 0 && failureCount === vaultItems.length) {
        throw new Error('รหัสผ่านเซสชันไม่ถูกต้อง (Decryption Tag Mismatch) ไม่สามารถถอดรหัสข้อมูลในคลังได้');
      }

      setDecryptedCache(decryptedMap);
      setIsUnlocked(true);
      playAuditChime();
      setSuccessMessage('ปลดล็อก Cipher Vault ด้วย AES-GCM (PBKDF2 100,000 Iterations) สำเร็จ');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'การยืนยันรหัสผ่านล้มเหลว');
      playTone(280, 0.15);
    } finally {
      setIsProcessing(false);
    }
  };

  // Lock Vault and Purge Session Key from memory
  const handleLock = () => {
    playTone(400, 0.08);
    setIsUnlocked(false);
    setSessionPassphrase('');
    setDecryptedCache({});
    setVisibleSnippets({});
    setSuccessMessage('ล็อกคลังรหัสลับแล้ว ข้อมูลกุญแจเซสชันถูกล้างออกจากหน่วยความจำเรียบร้อย');
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Add a new encrypted snippet
  const handleAddSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setErrorMessage('โปรดระบุทั้งหัวข้อและเนื้อหาข้อความลับ');
      return;
    }
    if (!sessionPassphrase) {
      setErrorMessage('เซสชันถูกล็อกอยู่');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    playTone(600, 0.04);

    try {
      const encrypted = await encryptSnippet(
        newTitle.trim(),
        newContent.trim(),
        newCategory,
        sessionPassphrase
      );

      const updated = [encrypted, ...vaultItems];
      saveVault(updated);

      // Update in-memory decrypted cache
      setDecryptedCache((prev) => ({ ...prev, [encrypted.id]: newContent.trim() }));
      setNewTitle('');
      setNewContent('');
      playAuditChime();
      setSuccessMessage(`เข้ารหัสและบันทึกข้อความลับ "${encrypted.title}" ด้วย AES-GCM เรียบร้อย`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'การเข้ารหัสล้มเหลว');
      playTone(300, 0.1);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete an item from vault
  const handleDeleteItem = (id: string) => {
    playTone(350, 0.06);
    const updated = vaultItems.filter((i) => i.id !== id);
    saveVault(updated);
    setDecryptedCache((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Toggle visibility of a specific snippet
  const toggleVisibility = (id: string) => {
    playTone(620, 0.02);
    setVisibleSnippets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy text to clipboard
  const handleCopyText = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(720, 0.04);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#121824]/90 via-[#0b0e1a]/80 to-[#07080F] border border-amber-500/30 backdrop-blur-xl space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <LockKeyhole className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                WEB CRYPTO API (AES-GCM-256)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50 text-[10px] font-mono">
                PBKDF2 100K ITERATIONS
              </span>
            </div>
            <h3 className="text-lg font-bold font-mono text-zinc-100 mt-0.5">
              Cipher Vault &bull; Local Encrypted Snippet Storage
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <button
              onClick={handleLock}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-700/60 text-xs font-mono font-bold flex items-center gap-1.5 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Session &amp; Purge Key</span>
            </button>
          ) : (
            <span className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono flex items-center gap-1.5">
              <FolderLock className="w-3.5 h-3.5 text-amber-400" />
              <span>VAULT LOCKED</span>
            </span>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Unlock / Key Derivation Banner */}
      {!isUnlocked ? (
        <form onSubmit={handleUnlock} className="p-5 rounded-2xl bg-black/50 border border-amber-500/20 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-amber-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>ระบุกุญแจเซสชันสำหรับการถอดรหัส (Session Passphrase / Master Passkey):</span>
            </label>
            <p className="text-[11px] text-zinc-400 font-sans">
              กุญแจจะถูกแปลงผ่านฟังก์ชัน PBKDF2 (SHA-256, 100,000 รอบการคำนวณ) ในหน่วยความจำชั่วคราว ไม่มีการส่งออกนอกเบราว์เซอร์
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={sessionPassphrase}
              onChange={(e) => setSessionPassphrase(e.target.value)}
              placeholder="ป้อนรหัสผ่านเซสชันส่วนบุคคล (e.g. MasterPassphrase#849202)..."
              className="flex-1 bg-zinc-900/90 border border-zinc-700 focus:border-amber-400 rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              <span>{isProcessing ? 'Deriving Key...' : 'Unlock Cipher Vault'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
            <span>รายการที่ถูกเข้ารหัสสะสม: {vaultItems.length} รายการ</span>
            <span>Zero-Knowledge / In-Memory Session Key</span>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Add New Secret Snippet Form */}
          <form onSubmit={handleAddSnippet} className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>เพิ่มข้อความลับหรือกุญแจสำรองใหม่ (Encrypt New Snippet)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                AES-GCM ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ชื่อหัวข้อ (เช่น HSM Backup Seed, API Token, Private Note)..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none"
                >
                  <option value="CREDENTIAL">🔑 Credential / Secret</option>
                  <option value="KEY_BACKUP">🛡️ Key Backup / Seed</option>
                  <option value="CONFIG">⚙️ Sovereign Config</option>
                  <option value="LEGAL_NOTE">⚖️ Legal / PDPA Note</option>
                </select>
              </div>
            </div>

            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="พิมพ์ข้อความลับหรือรหัสคีย์ที่ต้องการเข้ารหัส (ข้อมูลจะถูกเข้ารหัสก่อนบันทึกลง Local Storage)..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-500/20"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Encrypt &amp; Store Locally</span>
              </button>
            </div>
          </form>

          {/* Stored Snippets List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>รายการข้อมูลลับในคลัง ({vaultItems.length} รายการ):</span>
              <span className="text-amber-300">Session Key Active (256-bit AES-GCM)</span>
            </div>

            {vaultItems.length === 0 ? (
              <div className="p-8 text-center bg-black/20 border border-dashed border-zinc-800 rounded-2xl space-y-2">
                <FileKey className="w-8 h-8 text-zinc-600 mx-auto" />
                <div className="text-xs font-mono text-zinc-400">ยังไม่มีข้อมูลลับในคลัง Cipher Vault</div>
                <p className="text-[11px] text-zinc-500">
                  เพิ่มข้อความลับหรือคีย์สำรองโดยใช้ฟอร์มด้านบนเพื่อเข้ารหัสและจัดเก็บอย่างปลอดภัย
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {vaultItems.map((item) => {
                  const plain = decryptedCache[item.id];
                  const isVisible = visibleSnippets[item.id];

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#0b0e1a]/80 border border-white/8 hover:border-amber-500/30 transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                              {item.category}
                            </span>
                            <h4 className="text-sm font-bold text-zinc-100 font-mono">
                              {item.title}
                            </h4>
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 mt-1">
                            ID: {item.id} &bull; Created: {item.createdAt.slice(0, 19)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleVisibility(item.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs transition"
                            title={isVisible ? 'ซ่อนข้อความ' : 'แสดงข้อความ'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          {plain && (
                            <button
                              onClick={() => handleCopyText(item.id, plain)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs transition"
                              title="คัดลอกข้อความลับ"
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs transition"
                            title="ลบออกจากคลัง"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Box */}
                      <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-200">
                        {plain ? (
                          isVisible ? (
                            <pre className="whitespace-pre-wrap font-mono text-xs text-amber-200 select-all leading-relaxed">
                              {plain}
                            </pre>
                          ) : (
                            <div className="text-zinc-500 flex items-center gap-2">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>••••••••••••••••••••••••••••••••••••••••••••••••</span>
                            </div>
                          )
                        ) : (
                          <div className="text-rose-400 flex items-center gap-1.5 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>ไม่สามารถถอดรหัสได้ (Invalid Decryption Key)</span>
                          </div>
                        )}
                      </div>

                      {/* Digest & Cipher metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/60">
                        <span className="truncate">Digest: {item.digest}</span>
                        <span className="text-cyan-400">AES-GCM (IV: 96-bit, Salt: 128-bit)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
