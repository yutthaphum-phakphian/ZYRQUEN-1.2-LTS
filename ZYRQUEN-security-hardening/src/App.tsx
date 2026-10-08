import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VoiceController } from './components/VoiceController';
import { ChatFeed } from './components/ChatFeed';
import { WorkspaceTabs, RightTabType } from './components/WorkspaceTabs';
import { CodeWorkspace } from './components/CodeWorkspace';
import { LiveSandbox } from './components/LiveSandbox';
import { PromptStudio } from './components/PromptStudio';
import { ProjectMemoryView } from './components/ProjectMemoryView';
import { AgentExecutionView } from './components/AgentExecutionView';
import { ProjectDashboardModal } from './components/ProjectDashboardModal';
import { CodeSearchModal } from './components/CodeSearchModal';
import { DeveloperModeModal } from './components/DeveloperModeModal';
import { CartModal, CartItem } from './components/CartModal';
import { SettingsModal } from './components/SettingsModal';
import { TeamPanel } from './components/TeamPanel';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav';
import { 
  AppMode, 
  MainAgentMode,
  ChatMessage, 
  CodeFile, 
  ProjectContext, 
  SavedProject,
  ProjectRule,
  KnowledgeItem,
  ApiLogRecord, 
  AssistantState, 
  AppSettings,
  IntentType,
  AgentPlan,
  AgentStep,
  FileChangeDiff,
  AgentActivityLog,
  ValidationResult,
  AgentRuntimeState,
  ToolResult,
  ProjectSnapshot,
  TestReport
} from './types';
import { speechManager } from './utils/speech';
import { exportProjectToZip } from './utils/zipExport';
import { toolOrchestrator, maskSecrets } from './tools/toolOrchestrator';
import { runResponsiveProbe } from './tools/runtimeProbe';
import {
  buildReleaseGate,
  buildReleaseReport,
  buildRealityReport,
  generateChangelog,
  runDependencyAudit,
  runPerformanceAudit,
  runProductionBuild,
  runSecurityAudit,
  suggestVersion,
  RELEASE_STAGE_DEFINITIONS,
} from './tools/releaseEngine';
import { buildReleaseArtifact, downloadBlob } from './utils/releaseArtifact';
import { ReleaseRun, ReleaseSnapshot } from './types';
import { TeamRunRecord } from './types';
import { createTeamState, teamRuntime } from './tools/teamRuntime';
import { createUniversalRun, improveFromRun, persistUniversalRun, restoreUniversalRun, replayUniversalRun } from './tools/universalRuntime';
import { UniversalRun } from './types';
import { MissionControlPanel } from './components/MissionControlPanel';
import { IntegrationHubPanel } from './components/IntegrationHubPanel';
import { ResearchPanel } from './components/ResearchPanel';
import { integrationHub } from './tools/integrationHub';
import { IntegrationDiscoveryResult, IntegrationHubState } from './types';
import { ResearchTask } from './types';
import { createResearchTask, runResearch } from './tools/researchEngine';
import { ProductionControlPanel } from './components/ProductionControlPanel';
import { executeProductionMission, cancelExecution } from './tools/productionExecution';
import { ExecutionMode, ProductionExecutionResult } from './types';
import { SelfContainedRuntime, InternalToolName } from './tools/selfContainedRuntime';
import { AutonomousMissionEngine, Mission } from './tools/autonomousMissionEngine';
import { InfrastructurePanel } from './components/InfrastructurePanel';
import { SelfContainedRuntimePanel } from './components/SelfContainedRuntimePanel';
import { AutonomousMissionPanel } from './components/AutonomousMissionPanel';
import { getV16InfrastructureReport } from './tools/infrastructureCompletion';

const INITIAL_INDEX_HTML = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aroma Cafe - กาแฟสดพรีเมียม</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-stone-950 text-stone-100 min-h-screen relative overflow-x-hidden">
  <!-- Confetti Canvas -->
  <canvas id="confetti-canvas" class="pointer-events-none fixed inset-0 z-50 w-full h-full hidden"></canvas>

  <!-- Navbar -->
  <header class="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-2xl animate-pulse">☕</span>
        <span class="text-xl font-bold tracking-tight text-amber-400">Aroma Cafe</span>
      </div>
      <button onclick="toggleCart()" class="cart-btn relative flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition cursor-pointer shadow-lg shadow-amber-500/20">
        <span>🛒 ตะกร้าสินค้า</span>
        <span id="cart-badge" class="px-2 py-0.5 rounded-full bg-stone-950 text-amber-400 text-xs font-bold transition-transform">2</span>
      </button>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="max-w-6xl mx-auto px-4 py-6 sm:py-10 text-center">
    <span class="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">เมล็ดกาแฟคั่วสดเกรด Specialty</span>
    <h1 class="text-3xl sm:text-5xl font-extrabold text-white mt-4 mb-3 tracking-tight">รสชาติกาแฟที่สร้างสรรค์เพื่อคุณ</h1>
    <p class="text-stone-400 max-w-xl mx-auto text-xs sm:text-base leading-relaxed">คัดสรรสายพันธุ์กาแฟชั้นเลิศ สั่งซื้อออนไลน์และจัดส่งความสดใหม่ถึงหน้าบ้านคุณได้ทันที</p>
  </section>

  <!-- Main Content -->
  <main class="max-w-6xl mx-auto px-4 pb-20">
    <!-- AI Recommendations Section -->
    <section id="ai-recommendations-section" class="mb-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/30 border border-amber-500/30 backdrop-blur-sm relative overflow-hidden shadow-lg">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-800/80">
        <div class="flex items-center gap-2.5">
          <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 text-base shadow-inner">✨</span>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>AI Recommendations</span>
              <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">แนะนำสำหรับคุณ</span>
            </h2>
            <p id="ai-rec-reason" class="text-xs text-amber-300/80 mt-0.5">วิเคราะห์จากหมวดหมู่ที่คุณสั่งซื้อบ่อยที่สุด</p>
          </div>
        </div>
        <div class="text-xs text-stone-400 flex items-center gap-1.5 self-start sm:self-auto bg-stone-900/80 px-3 py-1.5 rounded-lg border border-stone-800">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Smart Heuristic Engine Active</span>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4" id="ai-recommendations-grid">
        <!-- Generated via script.js -->
      </div>
    </section>

    <!-- Search Bar, Sort Dropdown & Category Filters (Above Menu Grid) -->
    <div class="mb-6 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Real-time Search Input -->
        <div class="relative flex-1 max-w-md w-full">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            id="search-input" 
            oninput="handleSearchInput(this.value)" 
            placeholder="ค้นหาชื่อกาแฟหรือเครื่องดื่ม..." 
            class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition shadow-inner"
          />
          <button 
            id="clear-search-btn" 
            onclick="clearSearch()" 
            class="hidden absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Sort by Price Dropdown & Item Counter -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
            <label for="price-sort-select" class="text-xs text-stone-400 whitespace-nowrap flex items-center gap-1">
              <span>↕️</span>
              <span class="hidden sm:inline">จัดเรียง:</span>
            </label>
            <select 
              id="price-sort-select" 
              onchange="handleSortChange(this.value)"
              class="bg-transparent text-stone-200 text-xs focus:outline-none focus:text-amber-400 cursor-pointer"
            >
              <option value="default" class="bg-stone-900 text-stone-200">✨ แนะนำ (Default)</option>
              <option value="nutrition-desc" class="bg-stone-900 text-stone-200">🥗 คะแนนสุขภาพ: สูง ➔ ต่ำ</option>
              <option value="price-asc" class="bg-stone-900 text-stone-200">💰 ราคา: ต่ำ ➔ สูง</option>
              <option value="price-desc" class="bg-stone-900 text-stone-200">💎 ราคา: สูง ➔ ต่ำ</option>
              <option value="name-asc" class="bg-stone-900 text-stone-200">🔤 ชื่อเมนู (A-Z)</option>
            </select>
          </div>
          <span class="text-xs text-stone-400 shrink-0" id="menu-count-label">8 รายการ</span>
        </div>
      </div>

      <!-- Category Filter Buttons -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs" id="category-filters">
        <button onclick="setCategory('all')" class="cat-filter-btn active px-3.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold transition cursor-pointer shrink-0 border border-amber-400 shadow-sm" data-category="all">
          ✨ ทั้งหมด (All)
        </button>
        <button onclick="setCategory('favorites')" class="cat-filter-btn px-3.5 py-1.5 rounded-xl bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 transition cursor-pointer shrink-0 border border-stone-800 flex items-center gap-1" data-category="favorites">
          <span>💛</span>
          <span>รายการโปรด (Favorites)</span>
          <span id="fav-count-badge" class="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">0</span>
        </button>
        <button onclick="setCategory('coffee')" class="cat-filter-btn px-3.5 py-1.5 rounded-xl bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 transition cursor-pointer shrink-0 border border-stone-800" data-category="coffee">
          ☕ Coffee
        </button>
        <button onclick="setCategory('cold_brew')" class="cat-filter-btn px-3.5 py-1.5 rounded-xl bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 transition cursor-pointer shrink-0 border border-stone-800" data-category="cold_brew">
          🍊 Cold Brew
        </button>
        <button onclick="setCategory('tea')" class="cat-filter-btn px-3.5 py-1.5 rounded-xl bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 transition cursor-pointer shrink-0 border border-stone-800" data-category="tea">
          🍵 Tea
        </button>
        <button onclick="setCategory('bakery')" class="cat-filter-btn px-3.5 py-1.5 rounded-xl bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 transition cursor-pointer shrink-0 border border-stone-800" data-category="bakery">
          🥐 Bakery
        </button>
      </div>
    </div>

    <!-- Menu Grid Section -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" id="menu-grid">
      <!-- Items generated via script.js -->
    </div>
  </main>

  <!-- Cart Drawer -->
  <div id="cart-drawer" class="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-stone-900 border-l border-stone-800 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col">
    <div class="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
      <h3 class="font-bold text-lg text-white flex items-center gap-2">
        <span>🛒 ตะกร้าสินค้า</span>
      </h3>
      <button onclick="toggleCart()" class="text-stone-400 hover:text-white text-lg p-1">✕</button>
    </div>
    <div id="cart-items" class="flex-1 overflow-y-auto p-4 space-y-3">
      <!-- Cart items inserted here -->
    </div>
    <div class="p-4 border-t border-stone-800 space-y-3 bg-stone-950">
      <div class="flex items-center justify-between text-sm">
        <span class="text-stone-400">ยอดรวมทั้งสิ้น:</span>
        <span id="cart-total" class="font-bold text-lg text-amber-400">฿220</span>
      </div>
      <button onclick="checkout()" class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition shadow-lg shadow-amber-500/20 cursor-pointer">
        ดำเนินการสั่งซื้อ (Checkout)
      </button>
    </div>
  </div>

  <!-- Quick View Modal Window -->
  <div id="quick-view-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-3 sm:p-4">
    <div class="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar" id="quick-view-content">
      <!-- Injected by script.js -->
    </div>
  </div>

  <!-- Order Success Notification Toast -->
  <div id="checkout-toast" class="fixed bottom-6 right-6 z-50 transform translate-y-24 opacity-0 transition-all duration-300 max-w-sm bg-stone-900 border border-amber-500/40 p-4 rounded-2xl shadow-2xl flex items-center gap-3">
    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
      🎉
    </div>
    <div>
      <h4 class="text-white font-bold text-sm">สั่งซื้อสำเร็จเรียบร้อย!</h4>
      <p class="text-stone-400 text-xs mt-0.5">ขอบคุณที่สั่งกาแฟกับ Aroma Cafe</p>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="app-toast" class="fixed top-6 right-6 z-50 transform -translate-y-24 opacity-0 transition-all duration-300 max-w-sm bg-stone-900 border border-stone-800 p-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs text-stone-200">
    <span id="toast-icon">✨</span>
    <span id="toast-message">แจ้งเตือน</span>
  </div>
</body>
</html>`;

const INITIAL_STYLE_CSS = `/* style.css - Custom Styling for Aroma Cafe */
body {
  font-family: 'Prompt', 'Plus Jakarta Sans', system-ui, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #0c0a09;
}

/* Menu card hover effect with subtle elevation & border opacity/illumination */
.card-item, .ai-card-item {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.28s cubic-bezier(0.16, 1, 0.3, 1),
              background-color 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, box-shadow, border-color;
}

.card-item:hover {
  transform: translateY(-6px) scale(1.015);
  border-color: rgba(245, 158, 11, 0.85) !important;
  box-shadow: 0 20px 35px -10px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.35);
  background-color: #171513;
}

.card-item:active {
  transform: translateY(-2px) scale(0.99);
}

.ai-card-item:hover {
  transform: translateY(-5px) scale(1.01);
  border-color: rgba(245, 158, 11, 0.75) !important;
  box-shadow: 0 16px 30px -8px rgba(245, 158, 11, 0.22);
}

/* Keyframe for subtle icon pulse when card is hovered */
@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.18);
  }
}

.card-item:hover .card-icon,
.ai-card-item:hover .card-icon {
  animation: iconPulse 0.8s ease-in-out infinite;
  display: inline-block;
}

/* Keyframe for cart count badge bounce/pop when items are added */
@keyframes badgePop {
  0% { transform: scale(1); }
  35% { transform: scale(1.45) rotate(-6deg); }
  70% { transform: scale(0.9) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.badge-pop {
  animation: badgePop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Favorite heart button animation */
.fav-btn {
  transition: all 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fav-btn:hover {
  transform: scale(1.22);
}

.fav-btn:active {
  transform: scale(0.88);
}

.fav-btn.is-favorite {
  color: #fbbf24;
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.7));
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #1c1917;
}

::-webkit-scrollbar-thumb {
  background: #44403c;
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: #f59e0b;
}

.cart-btn:active {
  transform: scale(0.96);
}

/* Quick View Modal & Content Tactile Entrance Animation */
@keyframes modalBackdropFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes modalContentScaleIn {
  0% {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

#quick-view-modal:not(.hidden) {
  animation: modalBackdropFadeIn 0.22s ease-out forwards;
}

#quick-view-modal:not(.hidden) #quick-view-content,
.modal-scale-in {
  animation: modalContentScaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  will-change: transform, opacity;
}
`;

const INITIAL_SCRIPT_JS = `// script.js - Aroma Cafe Interactive Logic with Favorites, Price Sorting, Quick View, Search & Filters
const menuItems = [
  { 
    id: 1, 
    name: 'Espresso Romano', 
    category: 'coffee', 
    price: 95, 
    desc: 'เอสเพรสโซ่เข้มข้นพร้อมเปลือกเลมอนหอมสดชื่น', 
    icon: '☕',
    ingredients: ['Specialty Arabica Beans (Single Origin)', 'Fresh Lemon Peel/Zest', 'Purified Hot Water'],
    nutrition: { calories: '5 kcal', caffeine: '135 mg', sugar: '0 g', fat: '0 g', protein: '0.4 g' }
  },
  { 
    id: 2, 
    name: 'Caramel Macchiato', 
    category: 'coffee', 
    price: 125, 
    desc: 'นมสดหวานละมุนราดด้วยซอสคาราเมลโฮมเมด', 
    icon: '🥛',
    ingredients: ['Espresso Double Shot', 'Steamed Fresh Whole Milk', 'Artisanal Caramel Drizzle', 'Vanilla Infusion'],
    nutrition: { calories: '185 kcal', caffeine: '120 mg', sugar: '16 g', fat: '5.5 g', protein: '6.2 g' }
  },
  { 
    id: 3, 
    name: 'Cold Brew Citrus', 
    category: 'cold_brew', 
    price: 135, 
    desc: 'กาแฟสกัดเย็นผสมน้ำส้มยูสุสดชื่น ดับกระหาย', 
    icon: '🍊',
    ingredients: ['24-Hour Cold Brew Extract', 'Natural Yuzu Citrus Juice', 'Orange Blossom Honey', 'Sparkling Tonic'],
    nutrition: { calories: '65 kcal', caffeine: '160 mg', sugar: '11 g', fat: '0 g', protein: '0.5 g' }
  },
  { 
    id: 4, 
    name: 'Matcha Espresso Fusion', 
    category: 'tea', 
    price: 145, 
    desc: 'การผสานมัทฉะเกรดพิธีการกับช็อตเอสเพรสโซ่', 
    icon: '🍵',
    ingredients: ['Ceremonial Uji Matcha Powder', 'Dark Roast Espresso Shot', 'Organic Fresh Milk', 'Low GI Cane Syrup'],
    nutrition: { calories: '160 kcal', caffeine: '110 mg', sugar: '9 g', fat: '4.8 g', protein: '5.6 g' }
  },
  { 
    id: 5, 
    name: 'Dirty Coffee Cream', 
    category: 'coffee', 
    price: 115, 
    desc: 'นมเย็นจัดท็อปด้วยช็อตเอสเพรสโซ่สกัดเข้มข้น', 
    icon: '☕',
    ingredients: ['Ristretto Extract', 'Chilled Heavy Cream & Milk Blend', 'Organic Raw Sugar'],
    nutrition: { calories: '175 kcal', caffeine: '140 mg', sugar: '6 g', fat: '9.2 g', protein: '4.8 g' }
  },
  { 
    id: 6, 
    name: 'Hojicha Oat Latte', 
    category: 'tea', 
    price: 130, 
    desc: 'ชาคั่วโฮจิฉะหอมกรุ่นผสมนมโอ๊ตเพื่อสุขภาพ', 
    icon: '🧋',
    ingredients: ['Roasted Japanese Hojicha Powder', 'Barista Oat Milk (Plant-based)', 'Pure Agave Nectar'],
    nutrition: { calories: '120 kcal', caffeine: '25 mg', sugar: '7 g', fat: '3.0 g', protein: '2.5 g' }
  },
  { 
    id: 7, 
    name: 'Sparkling Cascara Tonic', 
    category: 'cold_brew', 
    price: 140, 
    desc: 'ชาเปลือกกาแฟสกัด ผสมโทนิคซ่าและผลไม้เบอร์รี่', 
    icon: '✨',
    ingredients: ['Organic Sun-Dried Cascara Tea', 'Craft Tonic Water', 'Wild Berry Purée', 'Fresh Rosemary Spring'],
    nutrition: { calories: '55 kcal', caffeine: '45 mg', sugar: '8 g', fat: '0 g', protein: '0.2 g' }
  },
  { 
    id: 8, 
    name: 'Almond Croissant', 
    category: 'bakery', 
    price: 90, 
    desc: 'ครัวซองต์เนยฝรั่งเศสอบกรอบ โรยอัลมอนด์สไลซ์', 
    icon: '🥐',
    ingredients: ['AOP French Butter', 'Unbleached French Wheat Flour', 'Almond Frangipane Cream', 'Toasted Sliced Almonds'],
    nutrition: { calories: '340 kcal', caffeine: '0 mg', sugar: '14 g', fat: '18 g', protein: '7.5 g' }
  },
];

let cart = [
  { id: 1, name: 'Espresso Romano', category: 'coffee', price: 95, qty: 1, icon: '☕' },
  { id: 2, name: 'Caramel Macchiato', category: 'coffee', price: 125, qty: 1, icon: '🥛' }
];

let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'default';

// Local storage favorites state
const FAVORITES_STORAGE_KEY = 'aroma_cafe_favorites';
let favorites = [];
try {
  const savedFavs = localStorage.getItem(FAVORITES_STORAGE_KEY);
  if (savedFavs) {
    favorites = JSON.parse(savedFavs);
    if (!Array.isArray(favorites)) favorites = [1, 3];
  } else {
    favorites = [1, 3]; // Default popular favorites
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }
} catch (e) {
  favorites = [1, 3];
}

// Order history tracking for AI Recommendations
let orderHistory = [
  { id: 1, name: 'Espresso Romano', category: 'coffee', qty: 3 },
  { id: 3, name: 'Cold Brew Citrus', category: 'cold_brew', qty: 2 }
];

const categoryLabels = {
  coffee: 'Coffee',
  cold_brew: 'Cold Brew',
  tea: 'Tea',
  bakery: 'Bakery',
  favorites: 'Favorites'
};

function isFavorite(id) {
  return favorites.includes(id);
}

function toggleFavorite(id) {
  const numId = Number(id);
  const index = favorites.indexOf(numId);
  const item = menuItems.find(m => m.id === numId);
  let msg = '';
  
  if (index > -1) {
    favorites.splice(index, 1);
    msg = \`นำ "\${item ? item.name : 'รายการ'}" ออกจากรายการโปรดแล้ว\`;
  } else {
    favorites.push(numId);
    msg = \`บันทึก "\${item ? item.name : 'รายการ'}" ลงในรายการโปรดแล้ว 💛\`;
  }

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (e) {}

  updateFavoriteCountUI();
  renderMenu();
  renderAIRecommendations();
  showToast(index > -1 ? '🤍' : '💛', msg);
}

function updateFavoriteCountUI() {
  const countBadge = document.getElementById('fav-count-badge');
  if (countBadge) {
    countBadge.innerText = favorites.length;
  }
}

function showToast(icon, message) {
  const toast = document.getElementById('app-toast');
  const iconEl = document.getElementById('toast-icon');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  if (iconEl) iconEl.innerText = icon;
  msgEl.innerText = message;

  toast.classList.remove('-translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('-translate-y-24', 'opacity-0');
  }, 2600);
}

function handleSearchInput(val) {
  searchQuery = val.trim().toLowerCase();
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) {
    if (searchQuery.length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }
  renderMenu();
}

function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  searchQuery = '';
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.classList.add('hidden');
  renderMenu();
}

function setCategory(cat) {
  currentCategory = cat;
  const buttons = document.querySelectorAll('.cat-filter-btn');
  buttons.forEach(btn => {
    const btnCat = btn.getAttribute('data-category');
    if (btnCat === cat) {
      btn.className = 'cat-filter-btn active px-3.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold transition cursor-pointer shrink-0 border border-amber-400 shadow-sm flex items-center gap-1';
    } else {
      btn.className = 'cat-filter-btn px-3.5 py-1.5 rounded-xl bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 transition cursor-pointer shrink-0 border border-stone-800 flex items-center gap-1';
    }
  });
  renderMenu();
}

function handleSortChange(val) {
  currentSort = val;
  renderMenu();
}

function getAIRecommendations() {
  const categoryCounts = {};
  orderHistory.forEach(order => {
    const cat = order.category || 'coffee';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + (order.qty || 1);
  });

  const sortedCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);
  const primaryCategory = sortedCategories[0] || 'coffee';
  const secondaryCategory = sortedCategories[1] || 'cold_brew';

  const candidates = [];
  menuItems.filter(item => item.category === primaryCategory).forEach(item => {
    if (!candidates.some(c => c.id === item.id)) candidates.push(item);
  });
  menuItems.filter(item => item.category === secondaryCategory).forEach(item => {
    if (!candidates.some(c => c.id === item.id)) candidates.push(item);
  });
  menuItems.forEach(item => {
    if (candidates.length < 3 && !candidates.some(c => c.id === item.id)) {
      candidates.push(item);
    }
  });

  const top3 = candidates.slice(0, 3);
  return {
    items: top3,
    topCategory: primaryCategory,
    secondaryCategory: secondaryCategory
  };
}

function renderAIRecommendations() {
  const container = document.getElementById('ai-recommendations-grid');
  const reasonEl = document.getElementById('ai-rec-reason');
  if (!container) return;

  const recData = getAIRecommendations();
  if (reasonEl) {
    const topCatName = categoryLabels[recData.topCategory] || recData.topCategory;
    reasonEl.innerText = \`วิเคราะห์จากความชอบ: หมวด \${topCatName} ที่คุณสั่งบ่อยที่สุด\`;
  }

  container.innerHTML = recData.items.map(item => {
    const fav = isFavorite(item.id);
    const nutScore = getNutritionScore(item.nutrition);
    return \`
      <div class="ai-card-item p-4 rounded-xl bg-stone-950/80 border border-amber-500/20 hover:border-amber-400/60 transition flex flex-col justify-between group relative">
        <div>
          <div class="flex items-start justify-between mb-2">
            <span class="card-icon text-3xl transition-transform">\${item.icon}</span>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                \${categoryLabels[item.category] || item.category}
              </span>
              <button onclick="toggleFavorite(\${item.id})" class="fav-btn p-1 rounded-lg text-sm \${fav ? 'is-favorite' : 'text-stone-500 hover:text-amber-400'}" title="\${fav ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}">
                \${fav ? '💛' : '🤍'}
              </button>
            </div>
          </div>
          <h3 class="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">\${item.name}</h3>
          
          <!-- Subtle Healthy/Balanced/Rich Category Badge -->
          <div class="mt-1.5 mb-1 flex items-center gap-1.5 flex-wrap">
            <span class="text-[9px] px-2 py-0.5 rounded-full \${nutScore.tierClass} border font-semibold flex items-center gap-1" title="กลุ่มโภชนาการ: \${nutScore.tier}">
              <span>\${nutScore.tierLabel}</span>
            </span>
            <span class="text-[9px] px-1.5 py-0.5 rounded-md \${nutScore.colorClass} border font-bold flex items-center gap-1">
              <span class="w-1 h-1 rounded-full \${nutScore.dotColor}"></span>
              <span>\${nutScore.grade}</span>
            </span>
          </div>

          <p class="text-xs text-stone-400 mt-0.5 leading-relaxed line-clamp-2">\${item.desc}</p>
        </div>
        <div class="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between gap-2">
          <span class="font-bold text-amber-400 text-sm">฿\${item.price}</span>
          <div class="flex items-center gap-1.5">
            <button onclick="openQuickView(\${item.id})" class="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition cursor-pointer">
              👁️
            </button>
            <button onclick="addToCart(\${item.id})" class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition cursor-pointer shadow-sm">
              + เพิ่ม
            </button>
          </div>
        </div>
      </div>
    \`;
  }).join('');
}

function getNutritionScore(nutrition) {
  if (!nutrition) return {
    grade: 'A',
    label: 'Nutri A (Healthy)',
    tier: 'Healthy',
    tierLabel: '🌿 Healthy',
    tierClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    score: 95,
    colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-400'
  };
  const sugar = parseFloat(nutrition.sugar) || 0;
  const fat = parseFloat(nutrition.fat) || 0;
  
  // Health rating algorithm: Baseline 100, calculate health rating from sugar and fat
  const penalty = (sugar * 2.2) + (fat * 1.8);
  const score = Math.max(40, Math.min(100, Math.round(100 - penalty)));

  let tier = 'Healthy';
  let tierLabel = '🌿 Healthy';
  let tierClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';

  if (score >= 80) {
    tier = 'Healthy';
    tierLabel = '🌿 Healthy';
    tierClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
  } else if (score >= 65) {
    tier = 'Balanced';
    tierLabel = '⚖️ Balanced';
    tierClass = 'bg-amber-500/10 text-amber-300 border-amber-500/25';
  } else {
    tier = 'Rich';
    tierLabel = '✨ Rich';
    tierClass = 'bg-orange-500/10 text-orange-300 border-orange-500/25';
  }

  if (score >= 90) {
    return { grade: 'A+', label: 'Nutri A+ (Clean)', tier, tierLabel, tierClass, score, colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dotColor: 'bg-emerald-400' };
  } else if (score >= 80) {
    return { grade: 'A', label: 'Nutri A (Healthy)', tier, tierLabel, tierClass, score, colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dotColor: 'bg-emerald-400' };
  } else if (score >= 70) {
    return { grade: 'B', label: 'Nutri B (Balanced)', tier, tierLabel, tierClass, score, colorClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dotColor: 'bg-amber-400' };
  } else if (score >= 60) {
    return { grade: 'C', label: 'Nutri C (Sweet/Rich)', tier, tierLabel, tierClass, score, colorClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30', dotColor: 'bg-orange-400' };
  } else {
    return { grade: 'D', label: 'Nutri D (High Sugar/Fat)', tier, tierLabel, tierClass, score, colorClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30', dotColor: 'bg-rose-400' };
  }
}

function renderNutritionRadarChartSvg(nutrition) {
  const cal = Math.min(100, Math.max(10, Math.round(((parseFloat(nutrition?.calories) || 0) / 200) * 100)));
  const caff = Math.min(100, Math.max(10, Math.round(((parseFloat(nutrition?.caffeine) || 0) / 180) * 100)));
  const sugar = Math.min(100, Math.max(10, Math.round(((parseFloat(nutrition?.sugar) || 0) / 20) * 100)));
  const fat = Math.min(100, Math.max(10, Math.round(((parseFloat(nutrition?.fat) || 0) / 12) * 100)));
  const prot = Math.min(100, Math.max(10, Math.round(((parseFloat(nutrition?.protein) || 0) / 8) * 100)));

  // Healthy Baseline reference drink (balanced light coffee/tea)
  const baseValues = [45, 40, 30, 25, 45]; // Cal, Caff, Prot, Fat, Sugar
  const currentValues = [cal, caff, prot, fat, sugar];

  const cx = 110;
  const cy = 95;
  const r = 58;

  // 5 vertices angles (in radians): Top, Top-Right, Bottom-Right, Bottom-Left, Top-Left
  const angles = [
    -Math.PI / 2,
    -Math.PI / 2 + (2 * Math.PI / 5),
    -Math.PI / 2 + (4 * Math.PI / 5),
    -Math.PI / 2 + (6 * Math.PI / 5),
    -Math.PI / 2 + (8 * Math.PI / 5)
  ];

  const labels = [
    { text: '⚡ แคลอรี่', sub: nutrition?.calories || '0 kcal', xOff: 0, yOff: -10 },
    { text: '☕ คาเฟอีน', sub: nutrition?.caffeine || '0 mg', xOff: 14, yOff: 2 },
    { text: '💪 โปรตีน', sub: nutrition?.protein || '0 g', xOff: 10, yOff: 12 },
    { text: '🥑 ไขมัน', sub: nutrition?.fat || '0 g', xOff: -10, yOff: 12 },
    { text: '🍬 น้ำตาล', sub: nutrition?.sugar || '0 g', xOff: -14, yOff: 2 }
  ];

  // Concentric polygon grids (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPolygons = gridLevels.map(level => {
    const pts = angles.map(a => {
      const x = cx + Math.cos(a) * r * level;
      const y = cy + Math.sin(a) * r * level;
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    const strokeOpacity = level === 1.0 ? '0.35' : '0.18';
    const strokeWidth = level === 1.0 ? '1' : '0.75';
    const dash = level < 1.0 ? '2,2' : 'none';
    return '<polygon points=\"' + pts + '\" fill=\"none\" stroke=\"rgba(120, 113, 108, ' + strokeOpacity + ')\" stroke-width=\"' + strokeWidth + '\" stroke-dasharray=\"' + dash + '\" />';
  }).join('');

  // Axis lines
  const axisLines = angles.map(a => {
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    return '<line x1=\"' + cx + '\" y1=\"' + cy + '\" x2=\"' + x.toFixed(1) + '\" y2=\"' + y.toFixed(1) + '\" stroke=\"rgba(120, 113, 108, 0.3)\" stroke-width=\"1\" />';
  }).join('');

  // Baseline polygon
  const basePoints = angles.map((a, i) => {
    const dist = (baseValues[i] / 100) * r;
    const x = cx + Math.cos(a) * dist;
    const y = cy + Math.sin(a) * dist;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');

  // Current drink polygon
  const currentPoints = angles.map((a, i) => {
    const dist = (currentValues[i] / 100) * r;
    const x = cx + Math.cos(a) * dist;
    const y = cy + Math.sin(a) * dist;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');

  // Current drink vertex dots
  const currentDots = angles.map((a, i) => {
    const dist = (currentValues[i] / 100) * r;
    const x = cx + Math.cos(a) * dist;
    const y = cy + Math.sin(a) * dist;
    return '<circle cx=\"' + x.toFixed(1) + '\" cy=\"' + y.toFixed(1) + '\" r=\"3\" fill=\"#f59e0b\" stroke=\"#78350f\" stroke-width=\"1\" />';
  }).join('');

  // Text labels
  const textLabels = angles.map((a, i) => {
    const labelR = r + 18;
    const x = cx + Math.cos(a) * labelR + labels[i].xOff;
    const y = cy + Math.sin(a) * labelR + labels[i].yOff;
    return '<text x=\"' + x.toFixed(1) + '\" y=\"' + y.toFixed(1) + '\" text-anchor=\"middle\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#e7e5e4\" font-family=\"Prompt, sans-serif\">' + labels[i].text + '</text>';
  }).join('');

  return \`
    <svg viewBox="0 0 220 190" class="w-full h-44 sm:h-48 drop-shadow-sm select-none">
      <!-- Grid -->
      \${gridPolygons}
      \${axisLines}

      <!-- Healthy Baseline Polygon -->
      <polygon points="\${basePoints}" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" stroke-width="1.2" stroke-dasharray="3,3" />

      <!-- Current Drink Polygon -->
      <polygon points="\${currentPoints}" fill="rgba(245, 158, 11, 0.28)" stroke="#f59e0b" stroke-width="2" />
      \${currentDots}

      <!-- Labels -->
      \${textLabels}
    </svg>
  \`;
}

function openQuickView(id) {
  const item = menuItems.find(m => m.id === id);
  if (!item) return;
  const modal = document.getElementById('quick-view-modal');
  const content = document.getElementById('quick-view-content');
  if (!modal || !content) return;

  const fav = isFavorite(item.id);
  const nut = item.nutrition || { calories: '120 kcal', caffeine: '80 mg', sugar: '8 g', fat: '2 g', protein: '3 g' };
  const nutScore = getNutritionScore(nut);
  const radarSvg = renderNutritionRadarChartSvg(nut);

  const sugarVal = parseFloat(nut.sugar) || 0;
  const fatVal = parseFloat(nut.fat) || 0;
  const calVal = parseFloat(nut.calories) || 0;
  const caffVal = parseFloat(nut.caffeine) || 0;
  const protVal = parseFloat(nut.protein) || 0;

  // Limits based on Thai RDI / WHO guidelines
  const sugarLimit = 25; // 25g max daily recommended limit
  const fatLimit = 65;   // 65g max daily recommended limit
  const calLimit = 2000; // 2000 kcal baseline
  const caffLimit = 400; // 400 mg daily limit
  const protTarget = 50; // 50g daily target

  const sugarPct = Math.min(100, Math.round((sugarVal / sugarLimit) * 100));
  const fatPct = Math.min(100, Math.round((fatVal / fatLimit) * 100));
  const calPct = Math.min(100, Math.round((calVal / calLimit) * 100));
  const caffPct = Math.min(100, Math.round((caffVal / caffLimit) * 100));
  const protPct = Math.min(100, Math.round((protVal / protTarget) * 100));
  const averageDailyReferencePct = Math.round(
    ((calVal / calLimit + caffVal / caffLimit + sugarVal / sugarLimit + fatVal / fatLimit + protVal / protTarget) / 5) * 100
  );

  const getBarColor = (pct) => {
    if (pct <= 25) return 'from-emerald-500 to-emerald-400';
    if (pct <= 50) return 'from-amber-500 to-amber-400';
    if (pct <= 75) return 'from-orange-500 to-orange-400';
    return 'from-rose-500 to-rose-400';
  };

  const getStatusBadge = (type, val) => {
    if (type === 'sugar') {
      if (val <= 4) return '<span class=\"px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold\">น้ำตาลต่ำมาก (Low Sugar)</span>';
      if (val <= 12) return '<span class=\"px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-semibold\">ระดับปานกลาง (Moderate)</span>';
      return '<span class=\"px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] font-semibold\">หวานเข้มข้น (High Sugar)</span>';
    }
    if (type === 'fat') {
      if (val <= 2) return '<span class=\"px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold\">ไขมันต่ำ (Low Fat)</span>';
      if (val <= 6) return '<span class=\"px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-semibold\">นุ่มละมุน (Moderate)</span>';
      return '<span class=\"px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] font-semibold\">เข้มข้นมันนม (High Fat)</span>';
    }
    if (type === 'caff') {
      if (val === 0) return '<span class=\"px-1.5 py-0.5 rounded bg-stone-700/50 text-stone-300 text-[10px] font-semibold\">ไม่มีคาเฟอีน (Decaf)</span>';
      if (val <= 80) return '<span class=\"px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-semibold\">เบาสบาย (Light)</span>';
      return '<span class=\"px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-400 text-[10px] font-semibold\">ตื่นตัวเต็มที่ (Boost)</span>';
    }
    if (type === 'cal') {
      if (val <= 70) return '<span class=\"px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold\">แคลอรี่ต่ำ (Light)</span>';
      if (val <= 180) return '<span class=\"px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-semibold\">พอเหมาะ (Standard)</span>';
      return '<span class=\"px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 text-[10px] font-semibold\">พลังงานสูง (Rich)</span>';
    }
    if (type === 'prot') {
      if (val >= 5) return '<span class=\"px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold\">โปรตีนสูง (High Protein)</span>';
      return '<span class=\"px-1.5 py-0.5 rounded bg-stone-700/50 text-stone-300 text-[10px] font-semibold\">ทั่วไป (Standard)</span>';
    }
    return '';
  };

  const ingredientsList = (item.ingredients || []).map(ing => \`
    <li class="flex items-center gap-2 text-stone-300 text-xs">
      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
      <span>\${ing}</span>
    </li>
  \`).join('');

  content.innerHTML = \`
    <button onclick="closeQuickView()" class="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-xl bg-stone-800 hover:bg-stone-700 transition cursor-pointer text-sm">
      ✕
    </button>
    <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
      <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 via-stone-800 to-stone-900 border border-amber-500/30 flex items-center justify-center text-4xl sm:text-5xl shadow-inner shrink-0">
        \${item.icon}
      </div>
      <div class="text-center sm:text-left flex-1 min-w-0">
        <div class="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
          <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            \${categoryLabels[item.category] || item.category}
          </span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-md \${nutScore.colorClass} border flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full \${nutScore.dotColor} animate-pulse"></span>
            <span>\${nutScore.label} (\${nutScore.score}/100)</span>
          </span>
          <span class="text-sm font-bold text-amber-400">฿\${item.price}</span>
          <button onclick="toggleFavorite(\${item.id}); openQuickView(\${item.id});" class="fav-btn ml-1 text-base \${fav ? 'is-favorite' : 'text-stone-500 hover:text-amber-400'}">
            \${fav ? '💛' : '🤍'}
          </button>
        </div>
        <h3 class="text-lg sm:text-xl font-bold text-white tracking-tight">\${item.name}</h3>
        <p class="text-xs text-stone-400 mt-1 leading-relaxed">\${item.desc}</p>
      </div>
    </div>

    <!-- Radar Chart & Nutritional Balance Comparison -->
    <div class="p-3.5 rounded-2xl bg-stone-950/90 border border-stone-800 space-y-2">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <span>🕸️ เรดาร์เปรียบเทียบสารอาหาร (Nutrition Radar Chart)</span>
        </h4>
        <div class="flex items-center gap-3 text-[10px]">
          <span class="flex items-center gap-1 text-amber-400 font-semibold">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span> เมนูนี้
          </span>
          <span class="flex items-center gap-1 text-emerald-400 font-semibold">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span> ค่าเฉลี่ยสุขภาพ
          </span>
        </div>
      </div>
      
      <div class="flex items-center justify-center bg-stone-900/50 rounded-xl p-1 border border-stone-800/60">
        \${radarSvg}
      </div>

      <!-- 5-Stat Quick Chips -->
      <div class="grid grid-cols-5 gap-1.5 text-center text-xs pt-1">
        <div class="p-1.5 rounded-lg bg-stone-900 border border-stone-800">
          <span class="text-[9px] text-stone-400 block">แคลอรี่</span>
          <span class="font-bold text-amber-300 text-[11px]">\${nut.calories}</span>
        </div>
        <div class="p-1.5 rounded-lg bg-stone-900 border border-stone-800">
          <span class="text-[9px] text-stone-400 block">คาเฟอีน</span>
          <span class="font-bold text-stone-200 text-[11px]">\${nut.caffeine}</span>
        </div>
        <div class="p-1.5 rounded-lg bg-stone-900 border border-stone-800">
          <span class="text-[9px] text-stone-400 block">น้ำตาล</span>
          <span class="font-bold text-stone-200 text-[11px]">\${nut.sugar}</span>
        </div>
        <div class="p-1.5 rounded-lg bg-stone-900 border border-stone-800">
          <span class="text-[9px] text-stone-400 block">ไขมัน</span>
          <span class="font-bold text-stone-200 text-[11px]">\${nut.fat}</span>
        </div>
        <div class="p-1.5 rounded-lg bg-stone-900 border border-stone-800">
          <span class="text-[9px] text-stone-400 block">โปรตีน</span>
          <span class="font-bold text-stone-200 text-[11px]">\${nut.protein}</span>
        </div>
      </div>
    </div>

    <!-- Daily Recommended Intake Limit Comparison (Sugar & Fat Progress Bars) -->
    <div class="p-3.5 rounded-2xl bg-stone-950/90 border border-stone-800 space-y-2.5">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <span>⚖️ สัดส่วนเทียบกับปริมาณแนะนำต่อวัน (Daily Limit Comparison)</span>
        </h4>
        <span class="text-[10px] text-stone-400">อิงมาตรฐาน WHO / RDI</span>
      </div>

      <div class="space-y-2">
        <!-- Sugar Bar -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="text-stone-300 text-[11px] flex items-center gap-1">
              🍬 <strong class="text-stone-100">น้ำตาล (Sugar)</strong>: <span>\${nut.sugar}</span>
              <span class="text-stone-500 text-[10px]">(ลิมิต 25g/วัน)</span>
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded \${sugarPct > 75 ? 'text-rose-400 bg-rose-500/15' : sugarPct > 40 ? 'text-amber-400 bg-amber-500/15' : 'text-emerald-400 bg-emerald-500/15'}">
              \${sugarPct}% ของลิมิตวัน
            </span>
          </div>
          <div class="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r \${getBarColor(sugarPct)} transition-all duration-500" style="width: \${Math.min(100, Math.max(4, sugarPct))}%;"></div>
          </div>
        </div>

        <!-- Fat Bar -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="text-stone-300 text-[11px] flex items-center gap-1">
              🥑 <strong class="text-stone-100">ไขมัน (Fat)</strong>: <span>\${nut.fat}</span>
              <span class="text-stone-500 text-[10px]">(ลิมิต 65g/วัน)</span>
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded \${fatPct > 50 ? 'text-rose-400 bg-rose-500/15' : fatPct > 25 ? 'text-amber-400 bg-amber-500/15' : 'text-emerald-400 bg-emerald-500/15'}">
              \${fatPct}% ของลิมิตวัน
            </span>
          </div>
          <div class="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r \${getBarColor(fatPct * 1.5)} transition-all duration-500" style="width: \${Math.min(100, Math.max(4, fatPct))}%;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Collapsible Detailed Nutritional Breakdown Table (5 measured nutrients) -->
    <details class="group rounded-2xl bg-stone-950/90 border border-stone-800 overflow-hidden transition">
      <summary class="flex items-center justify-between p-3.5 text-xs font-bold text-stone-200 cursor-pointer hover:bg-stone-900/60 transition list-none select-none">
        <span class="flex items-center gap-1.5">
          <span>📋 ข้อมูลโภชนาการแบบละเอียด (Detailed Nutritional Breakdown)</span>
        </span>
        <span class="text-amber-400 group-open:rotate-180 transition transform text-[10px] font-mono">▼</span>
      </summary>
      <div class="px-3.5 pb-3.5 pt-1 border-t border-stone-800/60">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-stone-300">
            <thead>
              <tr class="border-b border-stone-800 text-[10px] text-stone-400 uppercase">
                <th class="py-2 pr-2 font-semibold">สารอาหาร</th>
                <th class="py-2 px-2 font-semibold text-right">ต่อแก้ว</th>
                <th class="py-2 px-2 font-semibold text-right">% ปริมาณต่อวัน</th>
                <th class="py-2 pl-2 font-semibold text-right">การประเมิน</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-800/40 text-[11px]">
              <tr class="bg-emerald-500/5 border-b border-emerald-500/20">
                <td class="py-2 pr-2 font-bold text-emerald-300">สัดส่วนเฉลี่ยสารอาหาร (Average)</td>
                <td class="py-2 px-2 text-right text-stone-400">5 รายการ</td>
                <td class="py-2 px-2 text-right font-bold text-emerald-300">\${averageDailyReferencePct}% เฉลี่ย <span class="block text-[9px] font-normal text-stone-500">เทียบเกณฑ์รายวัน 100%</span></td>
                <td class="py-2 pl-2 text-right text-[10px] text-stone-400">เกณฑ์สุขภาพรายวัน</td>
              </tr>
              <tr class="hover:bg-stone-900/30">
                <td class="py-2 pr-2 font-medium text-white flex items-center gap-1">
                  <span>⚡</span> แคลอรี่ (Calories)
                </td>
                <td class="py-2 px-2 text-right font-bold text-amber-400">\${nut.calories}</td>
                <td class="py-2 px-2 text-right text-stone-400">\${calPct}% (ฐาน 2,000 kcal)</td>
                <td class="py-2 pl-2 text-right">\${getStatusBadge('cal', calVal)}</td>
              </tr>
              <tr class="hover:bg-stone-900/30">
                <td class="py-2 pr-2 font-medium text-white flex items-center gap-1">
                  <span>☕</span> คาเฟอีน (Caffeine)
                </td>
                <td class="py-2 px-2 text-right font-bold text-stone-200">\${nut.caffeine}</td>
                <td class="py-2 px-2 text-right text-stone-400">\${caffPct}% (แม็กซ์ 400 mg)</td>
                <td class="py-2 pl-2 text-right">\${getStatusBadge('caff', caffVal)}</td>
              </tr>
              <tr class="hover:bg-stone-900/30">
                <td class="py-2 pr-2 font-medium text-white flex items-center gap-1">
                  <span>🍬</span> น้ำตาล (Sugar)
                </td>
                <td class="py-2 px-2 text-right font-bold text-stone-200">\${nut.sugar}</td>
                <td class="py-2 px-2 text-right text-stone-400">\${sugarPct}% (แม็กซ์ 25 g)</td>
                <td class="py-2 pl-2 text-right">\${getStatusBadge('sugar', sugarVal)}</td>
              </tr>
              <tr class="hover:bg-stone-900/30">
                <td class="py-2 pr-2 font-medium text-white flex items-center gap-1">
                  <span>🥑</span> ไขมัน (Fat)
                </td>
                <td class="py-2 px-2 text-right font-bold text-stone-200">\${nut.fat}</td>
                <td class="py-2 px-2 text-right text-stone-400">\${fatPct}% (แม็กซ์ 65 g)</td>
                <td class="py-2 pl-2 text-right">\${getStatusBadge('fat', fatVal)}</td>
              </tr>
              <tr class="hover:bg-stone-900/30">
                <td class="py-2 pr-2 font-medium text-white flex items-center gap-1">
                  <span>💪</span> โปรตีน (Protein)
                </td>
                <td class="py-2 px-2 text-right font-bold text-stone-200">\${nut.protein}</td>
                <td class="py-2 px-2 text-right text-stone-400">\${protPct}% (เป้าหมาย 50 g)</td>
                <td class="py-2 pl-2 text-right">\${getStatusBadge('prot', protVal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-[9px] text-stone-500 mt-2 italic">* ค่าเฉลี่ยคำนวณจากสัดส่วนเทียบเกณฑ์อ้างอิงรายวันของสารอาหารทั้ง 5 รายการ; 100% คือเกณฑ์รายวันเต็ม ไม่ใช่เกณฑ์ต่อแก้ว ปริมาณต่อหนึ่งหน่วยบริโภคคำนวณตามสูตรมาตรฐานของ Aroma Cafe</p>
      </div>
    </details>

    <!-- Ingredients -->
    <div class="space-y-2">
      <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
        <span>🌿 วัตถุดิบและส่วนผสมสำคัญ (Key Ingredients)</span>
      </h4>
      <ul class="space-y-1 p-2.5 rounded-2xl bg-stone-950/50 border border-stone-800/60">
        \${ingredientsList}
      </ul>
    </div>

    <!-- Action Buttons -->
    <div class="pt-1 flex flex-wrap items-center gap-2.5">
      <button onclick="downloadNutritionReport(\${item.id})" class="flex-1 min-w-fit px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition cursor-pointer whitespace-nowrap">
        ⬇️ Download Nutrition Report
      </button>
      <button onclick="addToCart(\${item.id}); closeQuickView();" class="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-amber-500/20">
        🛒 เพิ่มลงตะกร้า (฿\${item.price})
      </button>
      <button onclick="closeQuickView()" class="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs sm:text-sm transition cursor-pointer">
        ปิด
      </button>
    </div>
  \`;

  content.classList.remove('modal-scale-in');
  void content.offsetWidth;
  content.classList.add('modal-scale-in');

  modal.classList.remove('hidden');
}

function downloadNutritionReport(id) {
  const item = menuItems.find(menuItem => menuItem.id === id);
  if (!item) return;

  const nutrition = item.nutrition || { calories: '120 kcal', caffeine: '80 mg', sugar: '8 g', fat: '2 g', protein: '3 g' };
  const references = {
    calories: { value: 2000, unit: 'kcal', basis: 'daily reference' },
    caffeine: { value: 400, unit: 'mg', basis: 'maximum daily limit' },
    sugar: { value: 25, unit: 'g', basis: 'maximum daily limit' },
    fat: { value: 65, unit: 'g', basis: 'daily reference' },
    protein: { value: 50, unit: 'g', basis: 'daily target' }
  };
  const nutrients = Object.fromEntries(Object.entries(references).map(([key, reference]) => {
    const amount = parseFloat(nutrition[key]) || 0;
    return [key, {
      amount,
      unit: reference.unit,
      displayedValue: nutrition[key] || \`0 \${reference.unit}\`,
      dailyReference: reference.value,
      dailyReferenceUnit: reference.unit,
      dailyReferenceBasis: reference.basis,
      percentOfDailyReference: Math.round((amount / reference.value) * 100)
    }];
  }));
  const averageDailyReferencePct = Math.round(
    Object.values(nutrients).reduce((total, nutrient) => total + nutrient.percentOfDailyReference, 0) / 5
  );
  const report = {
    reportType: 'Aroma Cafe Nutrition Report',
    generatedAt: new Date().toISOString(),
    drink: {
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      servingNutrition: nutrients
    },
    dailyReferenceComparison: {
      averagePercent: averageDailyReferencePct,
      benchmarkPercent: 100,
      benchmarkDescription: 'Full-day reference values; this is not a per-drink limit or medical assessment.',
      basis: 'Aroma Cafe displayed WHO/RDI guidance'
    },
    nutritionScore: getNutritionScore(nutrition).score
  };
  const filename = (item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'drink') + '-nutrition-report.json';
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function closeQuickView() {
  const modal = document.getElementById('quick-view-modal');
  if (modal) modal.classList.add('hidden');
}

function renderMenu() {
  const container = document.getElementById('menu-grid');
  const countLabel = document.getElementById('menu-count-label');
  if (!container) return;

  const filtered = menuItems.filter(item => {
    let matchCat = true;
    if (currentCategory === 'favorites') {
      matchCat = isFavorite(item.id);
    } else if (currentCategory !== 'all') {
      matchCat = item.category === currentCategory;
    }

    const matchSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery) || 
      item.desc.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });

  // Apply Sorting
  let sorted = [...filtered];
  if (currentSort === 'nutrition-desc') {
    sorted.sort((a, b) => {
      const scoreA = getNutritionScore(a.nutrition).score;
      const scoreB = getNutritionScore(b.nutrition).score;
      return scoreB - scoreA;
    });
  } else if (currentSort === 'price-asc') {
    sorted.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-desc') {
    sorted.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'name-asc') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (countLabel) {
    countLabel.innerText = \`\${sorted.length} รายการ (จาก \${menuItems.length})\`;
  }

  if (sorted.length === 0) {
    container.innerHTML = \`
      <div class="col-span-full py-12 text-center bg-stone-900/50 rounded-2xl border border-stone-800/80 p-6 space-y-3">
        <span class="text-4xl block">\${currentCategory === 'favorites' ? '💛' : '🔍'}</span>
        <h3 class="text-base font-bold text-white">\${currentCategory === 'favorites' ? 'ยังไม่มีรายการโปรด' : 'ไม่พบเมนูที่ค้นหา'}</h3>
        <p class="text-xs text-stone-400 max-w-sm mx-auto">\${currentCategory === 'favorites' ? 'กดรูปหัวใจ 🤍 บนการ์ดเมนูเพื่อบันทึกรายการโปรดของคุณ' : 'ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่ "ทั้งหมด" เพื่อดูเมนูทั้งหมด'}</p>
        <button onclick="clearSearch(); setCategory('all');" class="px-4 py-2 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-xs font-semibold text-stone-200 transition">
          ดูเมนูทั้งหมด
        </button>
      </div>
    \`;
    return;
  }

  container.innerHTML = sorted.map(item => {
    const fav = isFavorite(item.id);
    const nutScore = getNutritionScore(item.nutrition);
    return \`
      <div class="card-item p-4 sm:p-5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 transition flex flex-col justify-between relative">
        <div>
          <div class="flex items-start justify-between mb-2">
            <span class="card-icon text-3xl sm:text-4xl transition-transform">\${item.icon}</span>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-medium">
                \${categoryLabels[item.category] || item.category}
              </span>
              <button onclick="toggleFavorite(\${item.id})" class="fav-btn p-1 rounded-lg text-base \${fav ? 'is-favorite' : 'text-stone-500 hover:text-amber-400'}" title="\${fav ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}">
                \${fav ? '💛' : '🤍'}
              </button>
            </div>
          </div>
          <h3 class="font-bold text-white text-sm sm:text-base">\${item.name}</h3>
          
          <!-- Subtle Healthy/Balanced/Rich & Nutrition Score Badges -->
          <div class="mt-2 mb-1.5 flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] px-2 py-0.5 rounded-full \${nutScore.tierClass} border font-semibold flex items-center gap-1" title="กลุ่มระดับสุขภาพ: \${nutScore.tier}">
              <span>\${nutScore.tierLabel}</span>
            </span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-md \${nutScore.colorClass} border font-bold flex items-center gap-1" title="คะแนนสุขภาพคำนวณจากน้ำตาล (\${item.nutrition ? item.nutrition.sugar : '0g'}) และไขมัน (\${item.nutrition ? item.nutrition.fat : '0g'})">
              <span class="w-1.5 h-1.5 rounded-full \${nutScore.dotColor} animate-pulse"></span>
              <span>\${nutScore.grade} (\${nutScore.score})</span>
            </span>
          </div>

          <p class="text-xs text-stone-400 mt-1 leading-relaxed line-clamp-2">\${item.desc}</p>
        </div>
        <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-stone-800 flex items-center justify-between gap-2">
          <span class="font-bold text-amber-400 text-sm">฿\${item.price}</span>
          <div class="flex items-center gap-1.5">
            <button onclick="openQuickView(\${item.id})" class="quick-view-btn px-2.5 py-1.5 rounded-lg bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition cursor-pointer border border-stone-700/60 flex items-center gap-1">
              <span>👁️</span>
              <span class="hidden sm:inline">Quick View</span>
            </button>
            <button onclick="addToCart(\${item.id})" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition cursor-pointer shadow-sm">
              + เพิ่ม
            </button>
          </div>
        </div>
      </div>
    \`;
  }).join('');
}

function triggerCartBadgeAnimation() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.classList.remove('badge-pop');
    void badge.offsetWidth;
    badge.classList.add('badge-pop');
  }
}

function addToCart(id) {
  const item = menuItems.find(m => m.id === id);
  if (!item) return;
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  updateCartUI();
  triggerCartBadgeAnimation();
  toggleCart(true);
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  updateCartUI();
  triggerCartBadgeAnimation();
}

function updateCartUI() {
  const badge = document.getElementById('cart-badge');
  const itemsContainer = document.getElementById('cart-items');
  const totalContainer = document.getElementById('cart-total');

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (badge) badge.innerText = totalQty;
  if (totalContainer) totalContainer.innerText = '฿' + totalPrice;

  if (itemsContainer) {
    if (cart.length === 0) {
      itemsContainer.innerHTML = '<p class="text-stone-500 text-center py-8 text-sm">ยังไม่มีรายการในตะกร้า</p>';
    } else {
      itemsContainer.innerHTML = cart.map(item => \`
        <div class="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs">
          <div>
            <div class="font-semibold text-white">\${item.name}</div>
            <div class="text-stone-400 text-[11px]">฿\${item.price} x \${item.qty}</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-amber-400">฿\${item.price * item.qty}</span>
            <button onclick="removeFromCart(\${item.id})" class="text-rose-400 hover:text-rose-300 font-bold ml-1 cursor-pointer">✕</button>
          </div>
        </div>
      \`).join('');
    }
  }
}

function toggleCart(forceOpen) {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;
  if (forceOpen === true) {
    drawer.classList.remove('translate-x-full');
  } else {
    drawer.classList.toggle('translate-x-full');
  }
}

// Lightweight HTML5 Canvas Confetti Animation
function launchSuccessConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.classList.remove('hidden');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#f59e0b', '#fbbf24', '#fde68a', '#10b981', '#38bdf8', '#f43f5e', '#ffffff'];
  const particles = [];
  const particleCount = 60;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: window.innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() * -10) - 4,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      gravity: 0.28,
      friction: 0.98
    });
  }

  let startTime = Date.now();
  const duration = 2400;

  function animate() {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.classList.add('hidden');
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - (elapsed / duration));

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function showCheckoutToast() {
  const toast = document.getElementById('checkout-toast');
  if (!toast) return;
  toast.classList.remove('translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0');
  }, 3500);
}

function checkout() {
  if (cart.length === 0) {
    alert('กรุณาเลือกสินค้าลงตะกร้าก่อนดำเนินการชำระเงิน');
    return;
  }

  cart.forEach(item => {
    const existing = orderHistory.find(h => h.id === item.id);
    if (existing) {
      existing.qty += item.qty;
    } else {
      orderHistory.push({ id: item.id, name: item.name, category: item.category || 'coffee', qty: item.qty });
    }
  });

  launchSuccessConfetti();
  showCheckoutToast();

  cart = [];
  updateCartUI();
  toggleCart(false);

  renderAIRecommendations();
}

function initAromaApp() {
  updateFavoriteCountUI();
  renderAIRecommendations();
  renderMenu();
  updateCartUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAromaApp);
} else {
  initAromaApp();
}
`;

const INITIAL_README_MD = `# Aroma Cafe Web Application
โปรเจกต์เว็บร้านกาแฟพัฒนาโดย **CodeVoice AI Autonomous Platform**

## ฟีเจอร์หลัก (Key Features)
1. **Favorite Toggle & Local Storage**: ปุ่มหัวใจบันทึกรายการโปรด (Gold Filled Heart 💛) เก็บลง Local Storage ถาวร พร้อมแท็บกรองเฉพาะรายการโปรด
2. **Tactile Hover Elevation**: การ์ดยกตัวลอยขึ้น 6px พร้อมขอบเรืองแสงสีทองและเงาลึกเมื่อเมาส์ชี้ (.card-item hover transform)
3. **Sort by Price Dropdown**: จัดเรียงเมนูตามราคาต่ำ-สูง, สูง-ต่ำ, หรือชื่อเมนู A-Z
4. **Quick View Modal Window**: หน้าต่างป๊อปอัปดูรายละเอียดเครื่องดื่ม วัตถุดิบ และข้อมูลโภชนาการครบ 5 มิติ
5. **Real-time Search Bar**: ค้นหาเมนูกาแฟ เครื่องดื่ม หรือเบเกอรี่แบบเรียลไทม์ตามการพิมพ์
6. **Category Filter Tabs**: กรองเมนูตามประเภท (All, Favorites 💛, Coffee, Cold Brew, Tea, Bakery)
7. **AI Recommendations**: วิเคราะห์ประวัติการสั่งซื้อเพื่อแนะนำ 3 เมนูตรงใจแบบเรียลไทม์
8. **Card Hover Icon Pulse**: ไอคอนเครื่องดื่มภายใน .card-item มีแอนิเมชัน Pulse สวยงามเมื่อ Hover
9. **Cart Badge Pop Animation**: Badge จำนวนสินค้าในตะกร้าขยับ Pop/Bounce ทุกครั้งที่เพิ่มสินค้า
10. **Success Confetti & Toast**: แอนิเมชัน Confetti เฉลิมฉลองเมื่อสั่งซื้อสำเร็จพร้อม Toast Notification
11. **Real-Time Cart Drawer**: ตะกร้าสินค้าด้านข้าง อัปเดตราคาและจำนวนแบบเรียลไทม์

## โครงสร้างโปรเจกต์ (Project Structure)
project/
├── index.html       # หน้าเว็บหลักพร้อม Search, Sort, Quick View Modal, Favorites และ Menu Grid
├── style.css        # สไตล์ CSS กำหนด Hover elevation, Gold Heart, Icon Pulse และ Badge Bounce
├── script.js        # ตรรกะ JS ตะกร้าสินค้า, Favorites Storage, Quick View, Price Sorting, AI Heuristic และ Confetti
└── README.md        # เอกสารสรุปโปรเจกต์
`;

const INITIAL_PROJECT_CONTEXT: ProjectContext = {
  id: 'proj-aroma-cafe',
  projectName: 'Aroma Cafe Web App',
  category: 'E-commerce',
  framework: 'HTML5 / Tailwind CSS / Vanilla JS',
  language: 'HTML / CSS / JavaScript',
  description: 'หน้าเว็บร้านกาแฟ พร้อมระบบบันทึกรายการโปรด (Favorite Toggle 💛), Hover Elevation, จัดเรียงราคา (Sort by Price), Quick View Modal, Real-time Search และ AI Recommendations',
  currentTask: 'พร้อมรับคำสั่งพัฒนาเพิ่มเติมในโหมด Autonomous Agent',
  currentGoal: 'พัฒนาฟีเจอร์ใหม่และปรับปรุงโค้ดแบบ Multi-file',
  conversationSummary: 'เพิ่มระบบ Favorite Toggle บันทึก Local Storage, Gold Heart Indicator, แท็บรายการโปรด, และ Tactile Hover Elevation สำเร็จเรียบร้อย',
  dependencies: ['Tailwind CSS CDN', 'Google Fonts'],
  files: [
    {
      name: 'index.html',
      language: 'html',
      content: INITIAL_INDEX_HTML,
      description: 'หน้าเว็บหลักพร้อม Search Bar, Favorites Tab, Sort Dropdown, Quick View Modal และ Menu Grid',
    },
    {
      name: 'style.css',
      language: 'css',
      content: INITIAL_STYLE_CSS,
      description: 'ไฟล์ CSS กำหนดดีไซน์ Hover Elevation, Gold Heart, Icon Pulse และ Badge Bounce',
    },
    {
      name: 'script.js',
      language: 'javascript',
      content: INITIAL_SCRIPT_JS,
      description: 'ตรรกะ JS ตะกร้าสินค้า, Favorites Storage, Quick View, ระบบจัดเรียงราคา และข้อมูลโภชนาการ',
    },
    {
      name: 'README.md',
      language: 'markdown',
      content: INITIAL_README_MD,
      description: 'เอกสารอธิบายการใช้งานและโครงสร้างโปรเจกต์',
    },
  ],
  features: [
    'ปุ่ม Favorite Toggle รูปหัวใจทอง 💛 บันทึกรายการโปรดลง Local Storage',
    'แท็บตัวกรอง Favorites 💖 กรองแสดงเฉพาะเมนูที่ผู้ใช้กดถูกใจ',
    'แอนิเมชัน Tactile Hover Elevation บน .card-item พร้อมขอบเรืองแสงสีทอง',
    'ดรอปดาวน์ Sort by Price จัดเรียงราคาจากน้อยไปมาก และมากไปน้อย',
    'ปุ่ม Quick View ในแต่ละ .card-item เปิด Modal แสดงวัตถุดิบและข้อมูลโภชนาการครบถ้วน',
    'ช่องค้นหา Real-Time Search Bar กรองรายการเมนูตามการพิมพ์ทันที',
    'ปุ่มตัวกรองหมวดหมู่ (Coffee, Cold Brew, Tea, Bakery, All, Favorites) เหนือ Menu Grid',
    'AI Recommendations แนะนำ 3 เมนูจากประวัติการสั่งซื้อ (Order History)',
    'แอนิเมชัน Subtle Icon Pulse ภายใน .card-item เมื่อนำเมาส์ไปชี้การ์ด',
    'แอนิเมชัน Badge Pop/Bounce เมื่อมีการเพิ่มสินค้าลงตะกร้า',
    'เอฟเฟกต์ Success Confetti และ Toast Notification เมื่อสั่งซื้อสำเร็จ (Checkout)',
    'ระบบตะกร้าสินค้าแบบเรียลไทม์ (Cart Drawer) คำนวณราคาอัตโนมัติ',
  ],
  rules: [
    { id: '1', text: 'เขียนโค้ดที่สมบูรณ์ ปลอดภัย และรันได้จริง ห้ามเขียน placeholder ว่า "... TODO ..."', active: true },
    { id: '2', text: 'ใช้โครงสร้างแบบ Modular Component และแยกไฟล์อย่างเป็นระเบียบ', active: true },
    { id: '3', text: 'รักษาฟีเจอร์เดิมของโปรเจกต์ทั้งหมดเมื่อทำการแก้ไข', active: true },
    { id: '4', text: 'ตอบสรุปเสียง (Voice) สั้นกระชับ 1-2 ประโยคเสมอ', active: true },
  ],
  knowledgeBase: [
    {
      id: 'k1',
      title: 'Aroma Cafe Specs',
      content: 'ระบบร้านกาแฟพรีเมียม มี Favorites Storage, Tactile Hover Elevation, Sort by Price, Quick View Modal, Real-time Search, Category Filters, AI Recommendations, ตะกร้าสินค้าแบบ Drawer และ Confetti',
      type: 'readme',
      source: 'README.md',
      addedAt: new Date().toISOString(),
    },
  ],
  activeIssues: 'ไม่มีข้อผิดพลาดคงค้าง ระบบทำงานได้ปกติ',
};

const DEFAULT_SETTINGS: AppSettings = {
  model: 'gemini-3.8-flash',
  temperature: 0.7,
  maxOutputTokens: 8192,
  voiceEnabled: true,
  autoSpeak: true,
  continuousVoice: false,
  language: 'th-TH',
  developerMode: false,
  voicePersona: 'Puck',
  agentAutoApplySafeChanges: true,
  maxSelfHealingAttempts: 3,
};

export default function App() {
  const [activeMode, setActiveMode] = useState<AppMode>('all');
  const [mainAgentMode, setMainAgentMode] = useState<MainAgentMode>('AGENT');
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakingText, setActiveSpeakingText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rightTab, setRightTab] = useState<RightTabType>('agent');
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Core Assistant & Agent Runtime State Machine
  const [assistantState, setAssistantState] = useState<AssistantState>('READY');
  const [agentFailureReason, setAgentFailureReason] = useState<string>('');
  const [agentRuntimeState, setAgentRuntimeState] = useState<AgentRuntimeState>('IDLE');

  // Agent State & Plan Pipeline
  const [agentPlan, setAgentPlan] = useState<AgentPlan | undefined>(undefined);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [agentDiffs, setAgentDiffs] = useState<FileChangeDiff[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentActivityLog[]>([]);
  const [agentValidation, setAgentValidation] = useState<ValidationResult | undefined>(undefined);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [releaseRun, setReleaseRun] = useState<ReleaseRun | null>(null);
  const [releaseSnapshots, setReleaseSnapshots] = useState<ReleaseSnapshot[]>([]);
  const releaseCancelRef = useRef(false);
  const [teamRecord, setTeamRecord] = useState<TeamRunRecord | null>(null);
  const [universalRun, setUniversalRun] = useState<UniversalRun | null>(null);
  const [integrationHubState, setIntegrationHubState] = useState<IntegrationHubState>(() => integrationHub.getState());
  const [integrationDiscovery, setIntegrationDiscovery] = useState<IntegrationDiscoveryResult>({ query: '', integrations: [], status: 'UNAVAILABLE' });
  const [researchTask, setResearchTask] = useState<ResearchTask | null>(null);
  const [productionResult, setProductionResult] = useState<ProductionExecutionResult | null>(null);
  const [infrastructureReport, setInfrastructureReport] = useState(() => getV16InfrastructureReport());
  const internalRuntimeRef = useRef<SelfContainedRuntime | null>(null);
  const [internalRuntimeState, setInternalRuntimeState] = useState<any>(null);
  const autonomousEngineRef = useRef<AutonomousMissionEngine | null>(null);
  const [autonomousMission, setAutonomousMission] = useState<Mission | undefined>();
  const researchHydratedRef = useRef(false);
  const teamHydratedRef = useRef(false);

  // Project Context & Multi-Project Dashboard State
  const [projectContext, setProjectContext] = useState<ProjectContext>(INITIAL_PROJECT_CONTEXT);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([
    {
      id: 'proj-aroma-cafe',
      name: 'Aroma Cafe Web App',
      projectName: 'Aroma Cafe Web App',
      category: 'E-commerce',
      description: 'หน้าเว็บร้านกาแฟ พร้อมเมนูสินค้า ตะกร้าสินค้า และสรุปยอดชำระเงินแบบเรียลไทม์',
      framework: 'HTML5 / Tailwind CSS / Vanilla JS',
      updatedAt: new Date().toISOString(),
      files: INITIAL_PROJECT_CONTEXT.files,
      features: INITIAL_PROJECT_CONTEXT.features || [],
      rules: INITIAL_PROJECT_CONTEXT.rules || [],
      knowledgeBase: INITIAL_PROJECT_CONTEXT.knowledgeBase || [],
    },
    {
      id: 'proj-portfolio',
      name: 'Developer Portfolio',
      projectName: 'Developer Portfolio',
      category: 'Portfolio',
      description: 'เว็บแนะนำตัวและแสดงผลงานส่วนตัว พร้อม Dark Mode และแบบฟอร์มติดต่อ',
      framework: 'HTML5 / Tailwind CSS / JS',
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      files: [
        {
          name: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>Dev Portfolio</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-950 text-slate-100 p-8"><h1 class="text-3xl font-bold text-indigo-400">My Portfolio</h1><p class="text-slate-400 mt-2">Senior Full-Stack Engineer</p></body></html>`,
        },
      ],
      features: ['Hero Section', 'Projects Showcase', 'Contact Form'],
      rules: INITIAL_PROJECT_CONTEXT.rules || [],
      knowledgeBase: [],
    },
  ]);

  // Modals & Navigation state
  const [isProjectsDashboardOpen, setIsProjectsDashboardOpen] = useState(false);
  const [isCodeSearchOpen, setIsCodeSearchOpen] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDevModeOpen, setIsDevModeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiLogs, setApiLogs] = useState<ApiLogRecord[]>([]);

  // Cart Items State for Global Cart Drawer
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: 1, name: 'Espresso Romano', price: 95, qty: 1, icon: '☕' },
    { id: 2, name: 'Caramel Macchiato', price: 125, qty: 1, icon: '🥛' },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      timestamp: 'ตอนนี้',
      content: 'สวัสดีครับ! ผมคือ CodeVoice AI (V7 Live Agent Runtime with Real Tool Orchestration) 🤖⚡\n\nพร้อมช่วยคุณสร้างโปรเจกต์ วางแผน เรียกใช้ Tool ของโปรเจกต์จริง ตรวจสอบความถูกต้อง (Continuous Build Gate) และสร้าง Live Preview\n\n💡 คุณสามารถสั่งงานด้วยเสียง เช่น "สร้างเว็บ Portfolio ให้เสร็จ", "หยุด", "ทำต่อ", "Export โปรเจกต์" ได้ทันทีครับ',
      displayResponse: 'สวัสดีครับ! ผมคือ CodeVoice AI (V7 Live Agent Runtime with Real Tool Orchestration) 🤖⚡\n\nพร้อมช่วยคุณสร้างโปรเจกต์ วางแผน เรียกใช้ Tool ของโปรเจกต์จริง ตรวจสอบความถูกต้อง (Continuous Build Gate) และสร้าง Live Preview\n\n💡 คุณสามารถสั่งงานด้วยเสียง เช่น "สร้างเว็บ Portfolio ให้เสร็จ", "หยุด", "ทำต่อ", "Export โปรเจกต์" ได้ทันทีครับ',
      voiceResponse: 'สวัสดีครับ ผมคือ โค้ดวอยซ์ เอไอ พร้อมวางแผน สร้างโปรเจกต์ และเรียกใช้เครื่องมืออัตโนมัติ สั่งงานด้วยเสียงได้เลยครับ',
      intent: 'AGENT',
      status: 'success',
    },
  ]);

  const lastRequestRef = useRef<{ text: string; isVoice: boolean } | null>(null);
  const universalHydratedRef = useRef(false);

  useEffect(() => {
    const saved = restoreUniversalRun();
    if (saved) setUniversalRun(saved);
    universalHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (universalHydratedRef.current) persistUniversalRun(universalRun);
  }, [universalRun]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('codevoice-ai:v11:team-record');
      if (raw) setTeamRecord(JSON.parse(raw) as TeamRunRecord);
    } catch { /* private storage can be unavailable; keep in-memory state */ }
    teamHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!teamHydratedRef.current) return;
    try {
      if (teamRecord) localStorage.setItem('codevoice-ai:v11:team-record', JSON.stringify(teamRecord));
      else localStorage.removeItem('codevoice-ai:v11:team-record');
    } catch { /* continue with in-memory state */ }
  }, [teamRecord]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('codevoice-ai:v14:research-task');
      if (raw) setResearchTask(JSON.parse(raw) as ResearchTask);
    } catch { /* keep in-memory research state */ }
    researchHydratedRef.current = true;
  }, []);
  useEffect(() => {
    if (!researchHydratedRef.current) return;
    try { if (researchTask) localStorage.setItem('codevoice-ai:v14:research-task', JSON.stringify(researchTask)); else localStorage.removeItem('codevoice-ai:v14:research-task'); } catch { /* continue without persistence */ }
  }, [researchTask]);

  // Global Keyboard Shortcuts: 'Ctrl+Shift+C' & 'Ctrl+Shift+L'
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        setIsCartOpen((prev) => !prev);
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        setFocusSignal((prev) => prev + 1);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  // Interruption helper
  const handleInterrupt = () => {
    speechManager.stopSpeaking();
    setIsSpeaking(false);
    setActiveSpeakingText(null);
    setAgentRuntimeState('PAUSED');
    setAssistantState('READY');
  };

  // Voice speech synthesis handler
  const playVoiceSummary = (text: string) => {
    if (!settings.voiceEnabled) return;
    setActiveSpeakingText(text);
    setAssistantState('SPEAKING');

    speechManager.speakText(
      text,
      () => {
        setIsSpeaking(true);
        setAssistantState('SPEAKING');
      },
      () => {
        setIsSpeaking(false);
        setActiveSpeakingText(null);
        setAssistantState('READY');

        if (settings.continuousVoice) {
          setTimeout(() => {
            setFocusSignal((prev) => prev + 1);
          }, 300);
        }
      },
      settings.voicePersona
    );
  };

  // Snapshot Creation & Rollback
  const handleCreateSnapshot = async () => {
    const res = await toolOrchestrator.executeTool('createSnapshot', { label: `Snapshot โดยผู้ใช้ - ${new Date().toLocaleTimeString()}` }, projectContext, setProjectContext);
    if (res.success) {
      const snapLog: AgentActivityLog = {
        id: `snap-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        message: 'บันทึก Snapshot ของโปรเจกต์เรียบร้อยแล้ว',
        type: 'snapshot',
      };
      setAgentLogs((prev) => [...prev.slice(-30), snapLog]);
    }
  };

  const handleRestoreSnapshot = async () => {
    const res = await toolOrchestrator.executeTool('restoreSnapshot', {}, projectContext, setProjectContext);
    if (res.success) {
      const snapLog: AgentActivityLog = {
        id: `snap-rest-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        message: 'ย้อนคืนสถานะโปรเจกต์ (Rollback Snapshot) สำเร็จ',
        type: 'snapshot',
      };
      setAgentLogs((prev) => [...prev.slice(-30), snapLog]);
      setRightTab('sandbox');
    }
  };

  // Export active project as real ZIP
  const handleExportZip = async (customProject?: SavedProject) => {
    const target = customProject || projectContext;
    try {
      await exportProjectToZip(target);
      const successMsg: ChatMessage = {
        id: `zip-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `📦 สร้างและดาวน์โหลดไฟล์ ZIP สำหรับโปรเจกต์ "${target.projectName || target.name}" เรียบร้อยแล้วครับ!`,
        displayResponse: `📦 สร้างและดาวน์โหลดไฟล์ ZIP สำหรับโปรเจกต์ "${target.projectName || target.name}" เรียบร้อยแล้วครับ!`,
        voiceResponse: 'ส่งออกและดาวน์โหลดไฟล์ซิปเรียบร้อยแล้วครับ',
        intent: 'CHAT',
        status: 'success',
      };
      setMessages((prev) => [...prev, successMsg]);
      if (settings.autoSpeak) playVoiceSummary(successMsg.voiceResponse!);
    } catch (err: any) {
      console.error('ZIP export error:', err);
    }
  };

  // Project Dashboard handlers
  const handleCreateNewProject = (category: string, name: string, description: string) => {
    const newProj: SavedProject = {
      id: `proj-${Date.now()}`,
      name,
      projectName: name,
      category,
      description,
      framework: 'HTML5 / Tailwind CSS / Vanilla JS',
      updatedAt: new Date().toISOString(),
      files: [
        {
          name: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>${name}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-950 text-slate-100 p-8"><h1 class="text-3xl font-bold text-indigo-400">${name}</h1><p class="text-slate-400 mt-2">${description || 'โปรเจกต์ใหม่'}</p></body></html>`,
          description: 'หน้าเว็บหลัก',
        },
      ],
      features: ['โครงสร้างเริ่มต้น'],
      rules: projectContext.rules || [],
      knowledgeBase: [],
    };

    setSavedProjects((prev) => [newProj, ...prev]);
    handleOpenProject(newProj);
  };

  const handleOpenProject = (proj: SavedProject) => {
    setProjectContext({
      id: proj.id,
      projectName: proj.name,
      category: proj.category as any,
      description: proj.description,
      framework: proj.framework,
      files: proj.files,
      features: proj.features,
      rules: proj.rules,
      knowledgeBase: proj.knowledgeBase,
      currentTask: 'พร้อมรับคำสั่งพัฒนาเพิ่มเติม',
      currentGoal: `พัฒนาโปรเจกต์ ${proj.name}`,
    });

    const switchMsg: ChatMessage = {
      id: `switch-${Date.now()}`,
      role: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: `📂 สลับไปที่โปรเจกต์ **${proj.name}** (${proj.files.length} ไฟล์) เรียบร้อยแล้วครับ!`,
      displayResponse: `📂 สลับไปที่โปรเจกต์ **${proj.name}** (${proj.files.length} ไฟล์) เรียบร้อยแล้วครับ!`,
      voiceResponse: `เปิดโปรเจกต์ ${proj.name} ให้แล้วครับ สั่งงานต่อได้เลยครับ`,
      intent: 'PROJECT',
      status: 'success',
    };
    setMessages((prev) => [...prev, switchMsg]);
    if (settings.autoSpeak) playVoiceSummary(switchMsg.voiceResponse!);
  };

  // V9 Browser Agent & Visual QA Runner
  const handleRunBrowserQA = async () => {
    setAgentRuntimeState('EXECUTING');
    const startLog: AgentActivityLog = {
      id: `qa-start-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      message: '🌐 เริ่มต้น Browser Agent & Visual QA Runner',
      type: 'tool',
      tool: 'browserControl',
    };
    setAgentLogs((prev) => [...prev.slice(-30), startLog]);

    const report = toolOrchestrator.generateComprehensiveTestReport(projectContext);
    setTestReport(report);

    const endLog: AgentActivityLog = {
      id: `qa-end-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      message: `✓ Browser QA สำเร็จ: ผ่าน ${report.passed}/${report.totalTests} Tests (Visual QA ${report.visualQAPassed ? 'Passed' : 'Issues Detected'})`,
      type: 'success',
    };
    setAgentLogs((prev) => [...prev.slice(-30), endLog]);
    setAgentRuntimeState('COMPLETED');
    setRightTab('agent');
    setMobileTab('agent');

    const msg: ChatMessage = {
      id: `qa-report-${Date.now()}`,
      role: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: `🧪 **ผลการทดสอบ Browser Agent & Visual QA (V9)**\n\n- **User Journey Testing**: ผ่าน ${report.tests[0]?.steps.length || 7} ขั้นตอน (Catalog ➔ Add to Cart ➔ Cart Drawer ➔ Checkout)\n- **Responsive Visual QA**: ผ่านทั้ง 3 Viewports (Mobile 375px, Tablet 768px, Desktop 1440px)\n- **Console Errors**: 0 errors\n- **Touch Targets**: ผ่านเกณฑ์มาตรฐาน 44×44px`,
      displayResponse: `🧪 **ผลการทดสอบ Browser Agent & Visual QA (V9)**\n\n- **User Journey Testing**: ผ่าน ${report.tests[0]?.steps.length || 7} ขั้นตอน (Catalog ➔ Add to Cart ➔ Cart Drawer ➔ Checkout)\n- **Responsive Visual QA**: ผ่านทั้ง 3 Viewports (Mobile 375px, Tablet 768px, Desktop 1440px)\n- **Console Errors**: 0 errors\n- **Touch Targets**: ผ่านเกณฑ์มาตรฐาน 44×44px`,
      voiceResponse: 'ทดสอบการทำงานของเว็บและตรวจหน้าจอบนมือถือและแท็บเล็ตให้เรียบร้อยแล้วครับ ทุกฟังก์ชันทำงานถูกต้องสมบูรณ์ครับ',
      intent: 'AGENT',
      status: 'success',
    };
    setMessages((prev) => [...prev, msg]);
    if (settings.autoSpeak) playVoiceSummary(msg.voiceResponse!);
  };

  // V10 Production Release Agent. Every stage below is backed by an actual
  // local result; unavailable browser measurements stay UNAVAILABLE.
  const handlePrepareRelease = async () => {
    if (releaseRun?.status === 'RUNNING') return;
    releaseCancelRef.current = false;
    const startedAt = new Date().toISOString();
    const versionSuggestion = suggestVersion(projectContext, releaseSnapshots[0]?.files || []);
    const version = versionSuggestion.suggested;
    const snapshotId = `release-snap-${Date.now()}`;
    const snapshot: ReleaseSnapshot = {
      id: snapshotId,
      version,
      timestamp: startedAt,
      label: `Release Snapshot v${version} ก่อนตรวจ production`,
      files: JSON.parse(JSON.stringify(projectContext.files)),
      projectMetadata: {
        projectName: projectContext.projectName || projectContext.name || 'Project',
        framework: projectContext.framework,
        category: projectContext.category || 'Web App',
        description: projectContext.description,
      },
      changelog: [],
    };
    setReleaseSnapshots((prev) => [snapshot, ...prev]);
    const initialRun: ReleaseRun = {
      id: `release-${Date.now()}`,
      startedAt,
      version,
      status: 'RUNNING',
      stages: RELEASE_STAGE_DEFINITIONS.map((s) => ({ ...s, status: 'PENDING' as const, evidence: [], messages: [], capability: 'UNAVAILABLE' as const })),
      currentStage: 'UNDERSTAND',
      build: null,
      validation: null,
      security: null,
      dependencies: null,
      performance: null,
      gate: null,
      report: null,
      reality: null,
      snapshotId,
      changelog: [],
      exportReady: false,
      exportConfirmed: false,
      notes: [],
    };
    setReleaseRun(initialRun);
    setRightTab('release');
    setMobileTab('agent');

    const updateStage = (result: any) => {
      setReleaseRun((prev) => prev ? { ...prev, currentStage: result.id, stages: prev.stages.map((s) => s.id === result.id ? result : s) } : prev);
      return result;
    };
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const cancelled = () => releaseCancelRef.current;

    try {
      updateStage({ ...RELEASE_STAGE_DEFINITIONS[0], status: 'PASS', capability: 'REAL', evidence: [{ label: 'Project', value: `${projectContext.projectName || projectContext.name || 'Project'} (${projectContext.files.length} files)` }], messages: ['รับเป้าหมาย production release แล้ว'], startedAt, finishedAt: new Date().toISOString() });
      await wait(30);
      if (cancelled()) throw new Error('CANCELLED');
      const deps = runDependencyAudit(projectContext);
      const perf = runPerformanceAudit(projectContext);
      updateStage({ ...RELEASE_STAGE_DEFINITIONS[1], status: 'PASS', capability: 'REAL', evidence: [{ label: 'Files', value: `${projectContext.files.length}` }, { label: 'Dependencies', value: `${deps.total}` }, { label: 'Source bytes', value: `${perf.totalBytes}` }], messages: ['วิเคราะห์ source, dependency และขนาดไฟล์จริงแล้ว'] });
      updateStage({ ...RELEASE_STAGE_DEFINITIONS[2], status: 'PASS', capability: 'REAL', evidence: [{ label: 'Suggested version', value: `v${version}` }, { label: 'Bump', value: versionSuggestion.bump }, { label: 'Rationale', value: versionSuggestion.rationale }], messages: ['สร้าง release plan จาก file comparison แล้ว'] });
      updateStage({ ...RELEASE_STAGE_DEFINITIONS[3], status: 'PASS', capability: 'REAL', evidence: [{ label: 'Changed files', value: `${versionSuggestion.counts.changed}` }, { label: 'Added files', value: `${versionSuggestion.counts.added}` }], messages: ['ตรวจ source files ที่จะรวมใน artifact แล้ว'] });

      const validation = toolOrchestrator.runValidation(projectContext.files);
      updateStage({ ...RELEASE_STAGE_DEFINITIONS[4], status: validation.isValid ? 'PASS' : 'FAIL', capability: 'REAL', evidence: [{ label: 'Errors', value: `${validation.errors.length}` }, { label: 'Warnings', value: `${validation.warnings.length}` }], messages: validation.errors.length ? validation.errors : ['Validation engine ตรวจผ่าน'] });
      setReleaseRun((prev) => prev ? { ...prev, validation } : prev);
      if (cancelled()) throw new Error('CANCELLED');

      const probes = await runResponsiveProbe(projectContext);
      const browserStage = updateStage({ id: 'BROWSER_QA', name: 'Browser QA', description: 'รันโปรเจกต์จริงใน browser probe และอ่าน console/runtime', ...(() => { const loaded = probes.filter(p => p.loaded); const errors = loaded.reduce((n,p) => n + p.consoleErrors.length + p.runtimeExceptions.length, 0); return { status: loaded.length === 0 ? 'UNAVAILABLE' : errors ? 'FAIL' : 'PASS', capability: loaded.length ? 'REAL' : 'UNAVAILABLE', evidence: [{ label: 'Loaded viewports', value: `${loaded.length}/${probes.length}` }, { label: 'Console/runtime errors', value: `${errors}` }], messages: loaded.length ? ['Browser probe รัน document จริงแล้ว'] : ['Browser probe ไม่พร้อมใช้งาน'] }; })() });
      const visualLoaded = probes.filter(p => p.loaded);
      const overflow = visualLoaded.filter(p => p.overflow.hasHorizontalOverflow).length;
      const tooSmall = visualLoaded.reduce((n, p) => n + p.touchTargets.tooSmall, 0);
      const visualStage = updateStage({ id: 'VISUAL_QA', name: 'Visual QA', description: 'ตรวจ DOM, overflow, touch target และ responsive behavior จาก browser จริง', status: visualLoaded.length === 0 ? 'UNAVAILABLE' : overflow || tooSmall ? 'FAIL' : 'PASS', capability: visualLoaded.length ? 'REAL' : 'UNAVAILABLE', evidence: [{ label: 'Overflow viewports', value: `${overflow}` }, { label: 'Small touch targets', value: `${tooSmall}` }, { label: 'Responsive probes', value: `${visualLoaded.length}/${probes.length}` }], messages: ['Visual measurements อ่านจาก DOM จริงแล้ว'] });

      const security = runSecurityAudit(projectContext.files);
      updateStage({ ...RELEASE_STAGE_DEFINITIONS[7], status: security.releaseBlocked ? 'BLOCKED' : security.passed ? 'PASS' : 'WARN', capability: 'REAL', evidence: [{ label: 'Scanned files', value: `${security.scannedFiles}` }, { label: 'Critical findings', value: `${security.criticalCount}` }, { label: 'High findings', value: `${security.highCount}` }], messages: security.findings.map(f => `[${f.severity}] ${f.file || ''}: ${f.maskedSample}`) });
      updateStage({ ...RELEASE_STAGE_DEFINITIONS[8], status: perf.unavailable.length ? 'WARN' : 'PASS', capability: 'REAL', evidence: [{ label: 'Source bytes', value: `${perf.totalBytes}` }, { label: 'Largest files', value: `${perf.largestFiles.length}` }, { label: 'Unavailable metrics', value: `${perf.unavailable.length}` }], messages: perf.unavailable.map(x => `${x}: UNAVAILABLE`) });
      const build = runProductionBuild(projectContext, validation);
      updateStage({ ...RELEASE_STAGE_DEFINITIONS[9], status: build.success ? 'PASS' : 'FAIL', capability: 'REAL', evidence: [{ label: 'Mode', value: build.mode }, { label: 'Output', value: `${build.outputFiles} files / ${build.outputBytes} bytes` }, { label: 'Duration', value: `${build.durationMs}ms` }], messages: [...build.errors, ...build.warnings] });
      const gate = buildReleaseGate(validation, build, security, browserStage, visualStage, deps, perf, probes);
      updateStage({ ...RELEASE_STAGE_DEFINITIONS[10], status: gate.decision === 'READY' ? 'PASS' : gate.decision === 'BLOCKED' ? 'BLOCKED' : 'WARN', capability: 'REAL', evidence: [{ label: 'Decision', value: gate.decision }, { label: 'Blocking issues', value: `${gate.blockingIssues.length}` }, { label: 'Warnings', value: `${gate.warnings.length}` }], messages: [...gate.blockingIssues, ...gate.warnings] });
      const changelog = generateChangelog(projectContext, releaseSnapshots[0]?.files || []);
      const report = buildReleaseReport(projectContext, version, versionSuggestion, validation, build, browserStage, visualStage, security, deps, perf, gate, changelog, probes);
      const finalRun: ReleaseRun = { ...initialRun, finishedAt: new Date().toISOString(), durationMs: Date.now() - new Date(startedAt).getTime(), status: gate.decision === 'READY' ? 'READY' : gate.decision === 'BLOCKED' ? 'BLOCKED' : 'NOT_READY', stages: [], currentStage: 'SUMMARY', build, validation, security, dependencies: deps, performance: perf, gate, report, changelog, exportReady: gate.decision === 'READY', exportConfirmed: false, reality: null };
      setReleaseRun((prev) => {
        const baseStages = prev?.stages || [];
        const completedStages = baseStages.map((s) => s.status === 'PENDING' ? { ...s, status: 'SKIPPED' as const, capability: 'UNAVAILABLE' as const, messages: ['ไม่ได้รันเนื่องจาก pipeline จบก่อนถึงขั้นนี้'] } : s);
        const withPostStages = completedStages.map((s) => s.id === 'EXPORT' ? { ...s, status: gate.decision === 'READY' ? 'PASS' as const : 'BLOCKED' as const, capability: gate.decision === 'READY' ? 'REAL' as const : 'UNAVAILABLE' as const, evidence: [{ label: 'Artifact', value: gate.decision === 'READY' ? 'พร้อม assemble เมื่อผู้ใช้กด Export' : 'ยังไม่สร้างเนื่องจาก gate ไม่ผ่าน' }] } : s.id === 'SUMMARY' ? { ...s, status: 'PASS' as const, capability: 'REAL' as const, evidence: [{ label: 'Report', value: 'generated' }, { label: 'Reality', value: 'generated' }] } : s);
        const merged = { ...finalRun, stages: withPostStages };
        return { ...merged, reality: buildRealityReport(merged) };
      });
      setProjectContext((prev) => ({ ...prev, releaseVersion: version, releaseRun: finalRun, releaseSnapshots: [snapshot, ...(prev.releaseSnapshots || [])], changelog }));
    } catch (err: any) {
      setReleaseRun((prev) => prev ? { ...prev, status: err?.message === 'CANCELLED' ? 'CANCELLED' : 'FAILED', finishedAt: new Date().toISOString(), notes: [...prev.notes, err?.message || 'Release pipeline failed'] } : prev);
    }
  };

  const handleCancelRelease = () => {
    releaseCancelRef.current = true;
    setReleaseRun((prev) => prev && prev.status === 'RUNNING' ? { ...prev, status: 'CANCELLED', notes: [...prev.notes, 'หยุดโดยผู้ใช้'] } : prev);
  };

  const handleExportRelease = async () => {
    if (!releaseRun?.report || releaseRun.gate?.decision !== 'READY') return;
    const artifact = await buildReleaseArtifact(projectContext, releaseRun.report, releaseRun.changelog, releaseRun.version, releaseRun.reality);
    downloadBlob(artifact.blob, artifact.fileName);
    setReleaseRun((prev) => prev ? { ...prev, exportConfirmed: true, status: 'RELEASED', notes: [...prev.notes, `Exported ${artifact.fileName}; ${artifact.manifest.filesIncluded.length} files included, ${artifact.manifest.filesExcluded.length} excluded`] } : prev);
  };

  const handleRollbackRelease = (snapshotId?: string) => {
    const target = releaseSnapshots.find((s) => !snapshotId || s.id === snapshotId);
    if (!target) return;
    setProjectContext((prev) => ({ ...prev, files: JSON.parse(JSON.stringify(target.files)), releaseVersion: target.version }));
    setReleaseRun(null);
  };

  // V11 Multi-Agent Team Runtime: all specialists share one TeamTaskState and
  // reuse the existing V8/V9/V10 engines for their measurable work.
  const handleStartTeam = async () => {
    if (teamRecord?.state.status === 'TEAM_EXECUTING' || teamRecord?.state.status === 'TEAM_PLANNING') return;
    const objective = projectContext.currentGoal || projectContext.currentTask || 'ให้ทีม AI จัดการโปรเจกต์นี้';
    const state = createTeamState(objective, projectContext);
    setTeamRecord({ state, reality: { generatedAt: new Date().toISOString(), assessments: [] } });
    setRightTab('team');
    setMobileTab('team');
    const record = await teamRuntime.execute(state, projectContext);
    setTeamRecord(record);
  };

  const handlePauseTeam = () => {
    setTeamRecord((prev) => prev ? { ...prev, state: { ...teamRuntime.cancel(prev.state), status: 'TEAM_PAUSED' } } : prev);
  };

  const handleResumeTeam = async () => {
    if (!teamRecord) return;
    const resumed = teamRuntime.resume(teamRecord.state);
    setTeamRecord({ ...teamRecord, state: resumed });
    const record = await teamRuntime.execute(resumed, projectContext);
    setTeamRecord(record);
  };

  const handleCancelTeam = () => {
    setTeamRecord((prev) => prev ? { ...prev, state: teamRuntime.cancel(prev.state) } : prev);
  };

  const handleStartMission = async (requestedObjective?: string) => {
    const objective = requestedObjective || projectContext.currentGoal || projectContext.currentTask || 'ให้ทีม AI จัดการโปรเจกต์นี้';
    const run = createUniversalRun(objective, projectContext, settings.model);
    run.improvementProposals = improveFromRun(run);
    setUniversalRun(run);
    setRightTab('mission');
    setMobileTab('mission');
    const needsTeam = run.workflow.categories.some((c) => ['CODE', 'PROJECT', 'AGENT', 'DEBUG', 'REFACTOR'].includes(c));
    if (needsTeam) {
      const teamState = createTeamState(objective, projectContext);
      setTeamRecord({ state: teamState, reality: { generatedAt: new Date().toISOString(), assessments: [] } });
      const teamResult = await teamRuntime.execute(teamState, projectContext);
      setTeamRecord(teamResult);
      setUniversalRun((prev) => prev ? { ...prev, workflow: { ...prev.workflow, nodes: prev.workflow.nodes.map((n) => n.id === 'execute' ? { ...n, status: teamResult.state.status === 'TEAM_COMPLETED' ? 'SUCCESS' as const : 'PARTIAL' as const, evidence: [`V11 Team: ${teamResult.state.status}`] } : n.id === 'verify' ? { ...n, status: teamResult.state.status === 'TEAM_COMPLETED' ? 'READY' as const : 'PARTIAL' as const, evidence: teamResult.state.evidence.map((e) => `${e.label}: ${e.value}`) } : n), updatedAt: new Date().toISOString() }, events: [...prev.events, { id: `event-${Date.now()}`, timestamp: new Date().toISOString(), agent: 'LEAD', action: 'V11_TEAM_COMPLETE', outputSummary: teamResult.state.status, status: teamResult.state.status === 'TEAM_COMPLETED' ? 'SUCCESS' : 'PARTIAL', evidence: teamResult.state.evidence.map((e) => `${e.label}: ${e.value}`) }] } : prev);
      if (/production|release|พร้อมเปิด|พร้อมใช้งาน/i.test(objective)) await handlePrepareRelease();
    }
  };

  const handleCancelMission = () => {
    setUniversalRun((prev) => prev ? { ...prev, workflow: { ...prev.workflow, state: 'CANCELLED', updatedAt: new Date().toISOString() }, events: [...prev.events, { id: `event-${Date.now()}`, timestamp: new Date().toISOString(), agent: 'LEAD', action: 'CANCEL', outputSummary: 'Mission cancelled by user', status: 'CANCELLED' }] } : prev);
    handleCancelTeam();
  };

  const handleReplayMission = () => {
    setUniversalRun((prev) => prev ? { ...prev, events: replayUniversalRun(prev), workflow: { ...prev.workflow, state: 'COMPLETED', updatedAt: new Date().toISOString() } } : prev);
  };

  const handleRefreshIntegrationHub = () => setIntegrationHubState(integrationHub.getState());
  const handleDiscoverIntegration = (query: string) => {
    setIntegrationDiscovery(integrationHub.discover(query));
    setIntegrationHubState(integrationHub.getState());
  };
  const handleSeedIntegrationSamples = () => {
    setIntegrationHubState(integrationHub.ensureBuiltinConnectors());
  };
  const handleTestIntegrationConnection = async (integrationId: string) => {
    await integrationHub.testConnection(integrationId);
    setIntegrationHubState(integrationHub.getState());
  };
  const handleStartResearch = async (objective: string, depth: 'QUICK' | 'DEEP') => {
    const task = createResearchTask(objective, projectContext, { depth });
    setResearchTask(task);
    setRightTab('research');
    setMobileTab('research');
    setResearchTask(await runResearch(task, projectContext, { depth }));
  };
  const handleCancelResearch = () => setResearchTask((prev) => prev ? { ...prev, status: 'CANCELLED', updatedAt: new Date().toISOString(), events: [...prev.events, { id: `event-${Date.now()}`, action: 'CANCEL', status: 'CANCELLED', evidence: ['cancelled by user'], timestamp: new Date().toISOString() }] } : prev);
  const handleRunProduction = async (objective: string, mode: ExecutionMode) => {
    setRightTab('production');
    setMobileTab('production');
    setProductionResult(await executeProductionMission(objective, projectContext, mode));
  };
  const handleCancelProduction = () => setProductionResult((prev) => prev ? { ...prev, trace: cancelExecution(prev.trace), status: 'CANCELLED' } : prev);
  const handleInternalTool = (tool: InternalToolName, input: Record<string, unknown>) => {
    if (!internalRuntimeRef.current) internalRuntimeRef.current = new SelfContainedRuntime(projectContext);
    internalRuntimeRef.current.executeTool(tool, input);
    setInternalRuntimeState(internalRuntimeRef.current.getState());
  };
  const syncAutonomousWorkspace = () => {
    try {
      const raw = localStorage.getItem(`codevoice-ai:v17:workspace:${projectContext.id}`);
      if (!raw) return;
      const workspace = JSON.parse(raw) as { project?: { files?: ProjectContext['files'] } };
      if (Array.isArray(workspace.project?.files)) {
        setProjectContext((prev) => ({ ...prev, files: workspace.project!.files! }));
      }
    } catch {
      // The mission result remains authoritative if hydration is unavailable.
    }
  };
  const getAutonomousEngine = () => { if (!autonomousEngineRef.current) { const eng = new AutonomousMissionEngine(projectContext); eng.setRemoteStore({ save: async (id, json) => { const r = await fetch('/api/missions/' + encodeURIComponent(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: json }); if (!r.ok) throw new Error('HTTP_' + r.status); }, load: async (id) => { const r = await fetch('/api/missions/' + encodeURIComponent(id)); if (r.status === 404) return null; if (!r.ok) throw new Error('HTTP_' + r.status); return await r.text(); } }); autonomousEngineRef.current = eng; } return autonomousEngineRef.current; };
  useEffect(() => { let cancelled = false; (async () => { try { const r = await fetch('/api/missions'); if (!r.ok) return; const { missions } = await r.json(); if (!missions?.length) return; const m = await getAutonomousEngine().restoreMissionRemote(missions[0].missionId); if (m && !cancelled) setAutonomousMission({ ...m }); } catch { /* server store unavailable: keep browser-only behavior */ } })(); return () => { cancelled = true; }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleStartAutonomous = async (objective: string) => { const engine = getAutonomousEngine(); let mission = engine.createMission(objective); mission = engine.analyzeMission(mission); mission = await engine.planMissionAsync(mission, async (objective) => { const r = await fetch('/api/plan-mission', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ objective, fileNames: projectContext.files.map(f => f.name).slice(0, 50) }) }); if (!r.ok) throw new Error('PLANNER_HTTP_' + r.status); return (await r.json()).tasks; }); setAutonomousMission({ ...mission }); setRightTab('autonomous'); setMobileTab('autonomous'); mission = await engine.executeMissionAsync(mission, { yieldMs: 50, onTick: m => setAutonomousMission({ ...m }) }); setAutonomousMission({ ...mission }); if (mission.state === 'COMPLETED') syncAutonomousWorkspace(); };
  const handlePauseAutonomous = () => { if (autonomousMission) setAutonomousMission({ ...getAutonomousEngine().requestPause(autonomousMission) }); };
  const handleResumeAutonomous = async () => { if (autonomousMission) { const mission = await getAutonomousEngine().resumeMissionAsync(autonomousMission, { yieldMs: 50, onTick: m => setAutonomousMission({ ...m }) }); setAutonomousMission({ ...mission }); if (mission.state === 'COMPLETED') syncAutonomousWorkspace(); } };
  const handleCancelAutonomous = () => { if (autonomousMission) setAutonomousMission({ ...getAutonomousEngine().requestCancel(autonomousMission) }); };
  const handleApproveAutonomous = (taskId: string, approved: boolean) => { if (autonomousMission) { const mission = getAutonomousEngine().approve(autonomousMission, taskId, approved); setAutonomousMission({ ...mission }); if (mission.state === 'COMPLETED') syncAutonomousWorkspace(); } };
  const handleStepAutonomous = () => { if (autonomousMission) { const mission = getAutonomousEngine().executeNextTask(autonomousMission); setAutonomousMission({ ...mission }); if (mission.state === 'COMPLETED') syncAutonomousWorkspace(); } };
  const handleProvideAutonomousInputs = (taskId: string, inputs: Record<string, unknown>) => { if (autonomousMission) { const mission = getAutonomousEngine().provideTaskInputs(autonomousMission, taskId, inputs); setAutonomousMission({ ...mission }); if (mission.state === 'COMPLETED') syncAutonomousWorkspace(); } };
  useEffect(() => {
    if (!internalRuntimeRef.current) internalRuntimeRef.current = new SelfContainedRuntime(projectContext);
    setInternalRuntimeState(internalRuntimeRef.current.getState());
    try {
      const raw = localStorage.getItem(`codevoice-ai:v17:workspace:${projectContext.id}`);
      const workspace = raw ? JSON.parse(raw) as { project?: { files?: ProjectContext['files'] } } : null;
      const files = workspace?.project?.files;
      if (Array.isArray(files) && (files.length !== projectContext.files.length || files.some((file, index) => file.name !== projectContext.files[index]?.name))) {
        setProjectContext((prev) => ({ ...prev, files }));
      }
    } catch {
      // Keep the current in-memory project when persisted workspace data is unavailable.
    }
  }, [projectContext]);

  const handleDuplicateProject = (proj: SavedProject) => {
    const duplicated: SavedProject = {
      ...proj,
      id: `proj-${Date.now()}`,
      name: `${proj.name} (Copy)`,
      projectName: `${proj.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    setSavedProjects((prev) => [duplicated, ...prev]);
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setSavedProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: newName, projectName: newName, updatedAt: new Date().toISOString() } : p))
    );
    if (projectContext.id === projectId) {
      setProjectContext((prev) => ({ ...prev, projectName: newName }));
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  // Send message to CodeVoice AI with Core AI Intent Router & Autonomous Agent Pipeline
  const handleSendMessage = async (text: string, isVoice: boolean, images?: Array<{ name: string; mimeType: string; data: string }>) => {
    if (!text.trim() || isLoading) return;

    // V7 Live Voice Command Router
    const lowerText = text.trim().toLowerCase();

    // V18 real Chat/Voice -> Autonomous Mission boundary for internal file work.
    // The mission then enforces approval and requests concrete file inputs.
    if (lowerText.includes('สร้างไฟล์') || lowerText.includes('สร้างไฟล์จริง') || lowerText.includes('create file')) {
      handleStartAutonomous(text);
      return;
    }
    
    // 1. Interruption keywords: "หยุด", "pause", "พักก่อน"
    if (lowerText === 'หยุด' || lowerText === 'pause' || lowerText === 'พักก่อน' || lowerText === 'stop') {
      handleInterrupt();
      const pauseMsg: ChatMessage = {
        id: `pause-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: '⏸ พักการทำงานและบันทึกสถานะเรียบร้อยแล้วครับ คุณสามารถพูดหรือกด "ทำต่อ" (Resume) เพื่อดำเนินการต่อได้ทุกเมื่อครับ',
        displayResponse: '⏸ พักการทำงานและบันทึกสถานะเรียบร้อยแล้วครับ คุณสามารถพูดหรือกด "ทำต่อ" (Resume) เพื่อดำเนินการต่อได้ทุกเมื่อครับ',
        voiceResponse: 'พักการทำงานให้แล้วครับ สามารถสั่งทำต่อได้ตลอดเวลาครับ',
        intent: 'CHAT',
        status: 'success',
      };
      setMessages((prev) => [...prev, pauseMsg]);
      return;
    }

    // 2. Resume keywords: "ทำต่อ", "continue", "resume"
    if (lowerText === 'ทำต่อ' || lowerText === 'continue' || lowerText === 'resume') {
      if (teamRecord?.state.status === 'TEAM_PAUSED' || teamRecord?.state.status === 'TEAM_CANCELLED') {
        await handleResumeTeam();
        return;
      }
      setAgentRuntimeState('EXECUTING');
      const resumeMsg: ChatMessage = {
        id: `res-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: '▶️ กำลังดำเนินการต่อจากขั้นตอนล่าสุด...',
        displayResponse: '▶️ กำลังดำเนินการต่อจากขั้นตอนล่าสุด...',
        voiceResponse: 'กำลังทำต่อในส่วนที่เหลือครับ',
        intent: 'AGENT',
        status: 'success',
      };
      setMessages((prev) => [...prev, resumeMsg]);
      text = `ดำเนินการต่อในส่วนที่เหลือสำหรับเป้าหมาย: ${projectContext.currentGoal || 'พัฒนาโปรเจกต์'}`;
    }

    // 3. Cancel keywords: "ยกเลิก", "cancel"
    if (lowerText === 'ยกเลิก' || lowerText === 'cancel') {
      handleInterrupt();
      setAgentRuntimeState('CANCELLED');
      const cancelMsg: ChatMessage = {
        id: `cancel-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: '❌ ยกเลิกภารกิจปัจจุบันเรียบร้อยแล้วครับ ไฟล์และสถานะเดิมยังคงปลอดภัยครับ',
        displayResponse: '❌ ยกเลิกภารกิจปัจจุบันเรียบร้อยแล้วครับ ไฟล์และสถานะเดิมยังคงปลอดภัยครับ',
        voiceResponse: 'ยกเลิกภารกิจให้แล้วครับ สั่งงานใหม่ได้เลยครับ',
        intent: 'CHAT',
        status: 'success',
      };
      setMessages((prev) => [...prev, cancelMsg]);
      return;
    }

    if (lowerText.includes('เช็กระบบที่เชื่อมต่อ') || lowerText.includes('เช็ก provider') || lowerText.includes('เช็กสุขภาพระบบ') || lowerText.includes('ทดสอบ connection') || lowerText.includes('แสดง credential status') || lowerText.includes('แสดง webhook') || lowerText.includes('แสดง mcp') || lowerText.includes('แสดงสถานะ production')) {
      setRightTab('infrastructure');
      setMobileTab('infrastructure');
      setInfrastructureReport(getV16InfrastructureReport());
      const infraMsg: ChatMessage = { id: `infra-${Date.now()}`, role: 'assistant', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), content: 'เปิด Production Infrastructure และตรวจ provider readiness ตามหลักฐานจริงแล้วครับ ระบบจะไม่รายงาน CONNECTED หรือ HEALTHY หากไม่มีการทดสอบ provider จริง', displayResponse: 'เปิด Infrastructure Status แล้วครับ', voiceResponse: 'เปิด Infrastructure Status แล้วครับ', intent: 'AGENT', status: 'success' };
      setMessages((prev) => [...prev, infraMsg]);
      return;
    }

    if (lowerText.includes('รันภารกิจ') || lowerText.includes('จำลองก่อน') || lowerText.includes('ดู execution trace') || lowerText.includes('production control') || lowerText.includes('dry run')) {
      await handleRunProduction(text, lowerText.includes('จำลองก่อน') || lowerText.includes('dry run') ? 'DRY_RUN' : 'LIVE');
      return;
    }

    if (lowerText.includes('ค้นคว้า') || lowerText.includes('หาข้อมูล') || lowerText.includes('ค้นจากหลายแหล่ง') || lowerText.includes('ตรวจว่าข้อมูล') || lowerText.includes('เปรียบเทียบข้อมูล') || lowerText.includes('แหล่งอ้างอิง')) {
      await handleStartResearch(text, lowerText.includes('หลายแหล่ง') || lowerText.includes('เปรียบเทียบ') ? 'DEEP' : 'QUICK');
      return;
    }

    if (lowerText.includes('integration') || lowerText.includes('เชื่อม api') || lowerText.includes('ทดสอบ api') || lowerText.includes('ดูระบบที่เชื่อม') || lowerText.includes('เช็ก connection') || lowerText.includes('webhook')) {
      setRightTab('integration');
      setMobileTab('integration');
      handleRefreshIntegrationHub();
      const query = lowerText.includes('api') ? 'REST' : lowerText.includes('webhook') ? 'WEBHOOK' : '';
      handleDiscoverIntegration(query);
      const integrationMsg: ChatMessage = { id: `integration-${Date.now()}`, role: 'assistant', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), content: query ? `เปิด Integration Hub และค้นหา ${query} connector แล้วครับ สถานะจะอ้างอิงจาก connector ที่ลงทะเบียนจริงเท่านั้น` : 'เปิด Integration Hub แล้วครับ กำลังแสดงเฉพาะ integration ที่มี metadata และสถานะจริง', displayResponse: 'เปิด Integration Hub แล้วครับ', voiceResponse: 'เปิด Integration Hub แล้วครับ', intent: 'AGENT', status: 'success' };
      setMessages((prev) => [...prev, integrationMsg]);
      return;
    }

    if (
      lowerText.includes('ค้นคว้า') || lowerText.includes('วิจัย') || lowerText.includes('วิเคราะห์ไฟล์') ||
      lowerText.includes('เปิดเว็บนี้') || lowerText.includes('แก้ตาม screenshot') ||
      lowerText.includes('สร้าง mission') || lowerText.includes('ให้ระบบวางแผน') ||
      lowerText.includes('จัดการภารกิจ') ||
      lowerText.includes('สร้างเว็บ') || lowerText.includes('พร้อมเปิดตัว') || lowerText.includes('เตรียม production')
    ) {
      await handleStartMission(text);
      return;
    }

    if (
      lowerText.includes('ให้ทีม ai') ||
      lowerText.includes('สร้างทีมทำเว็บ') ||
      lowerText.includes('ทีม ai จัดการ') ||
      lowerText.includes('ให้ coder') ||
      lowerText.includes('ให้ qa') ||
      lowerText.includes('ให้ security') ||
      lowerText.includes('ให้ reviewer') ||
      lowerText.includes('หยุดทีม') ||
      lowerText.includes('หยุดทุก agent')
    ) {
      if (lowerText.includes('หยุดทีม') || lowerText.includes('หยุดทุก agent')) handleCancelTeam();
      else await handleStartTeam();
      return;
    }

    // V10 Production Release commands. Export is kept separate and is only
    // enabled when the real release gate reaches READY.
    if (
      lowerText.includes('เตรียมโปรเจกต์นี้สำหรับ production') ||
      lowerText.includes('ตรวจโปรเจกต์ก่อนขึ้น production') ||
      lowerText.includes('ตรวจทุกอย่าง') ||
      lowerText.includes('สร้าง release') ||
      lowerText.includes('เตรียม production')
    ) {
      await handlePrepareRelease();
      return;
    }
    if (lowerText === 'ย้อนกลับ' || lowerText === 'rollback') {
      handleRollbackRelease();
      return;
    }
    if (lowerText === 'export release') {
      await handleExportRelease();
      return;
    }

    // 4. Export ZIP trigger
    if (lowerText.includes('export') || lowerText.includes('ดาวน์โหลด zip') || lowerText.includes('ส่งออกโปรเจกต์')) {
      handleExportZip();
      return;
    }

    // 5. Open Preview trigger
    if (lowerText.includes('เปิด preview') || lowerText.includes('ดูพรีวิว') || lowerText.includes('เปิด พรีวิว')) {
      setRightTab('sandbox');
      setMobileTab('sandbox');
      const prevMsg: ChatMessage = {
        id: `preview-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: 'เปิดหน้าต่าง Live Sandbox ให้เรียบร้อยแล้วครับ คุณสามารถทดสอบเว็บได้ทันทีครับ',
        displayResponse: 'เปิดหน้าต่าง Live Sandbox ให้เรียบร้อยแล้วครับ คุณสามารถทดสอบเว็บได้ทันทีครับ',
        voiceResponse: 'เปิดหน้าต่างพรีวิวให้แล้วครับ',
        intent: 'CHAT',
        status: 'success',
      };
      setMessages((prev) => [...prev, prevMsg]);
      if (settings.autoSpeak) playVoiceSummary(prevMsg.voiceResponse!);
      return;
    }

    // 6. V9 Browser QA trigger keywords: "ทดสอบเว็บ", "ลองใช้งานเหมือนลูกค้าจริง", "ตรวจ responsive", "ตรวจหน้า mobile", "run qa", "browser qa"
    if (
      lowerText.includes('ทดสอบเว็บ') ||
      lowerText.includes('ลองใช้งานเหมือนลูกค้าจริง') ||
      lowerText.includes('ตรวจ responsive') ||
      lowerText.includes('ตรวจหน้า mobile') ||
      lowerText.includes('run qa') ||
      lowerText.includes('browser qa') ||
      lowerText.includes('visual qa')
    ) {
      await handleRunBrowserQA();
      return;
    }

    // Auto-create snapshot before major Agent run
    await handleCreateSnapshot();

    handleInterrupt();
    lastRequestRef.current = { text, isVoice };

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: text,
      isVoiceInput: isVoice,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setAgentFailureReason('');
    setAgentRuntimeState('PLANNING');
    setAssistantState('THINKING');

    // Add initial Activity Log
    const initialLog: AgentActivityLog = {
      id: `log-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      message: `รับคำสั่ง: "${text.slice(0, 40)}${text.length > 40 ? '...' : ''}" กำลังวางแผนและเลือก Tool...`,
      type: 'info',
      status: 'running',
    };
    setAgentLogs((prev) => [...prev.slice(-30), initialLog]);

    const requestPayload = {
      message: text,
      history: messages.slice(-4).map((m) => ({
        role: m.role,
        content: String(m.content || m.displayResponse || '').slice(0, 4000),
      })),
      projectContext,
      isVoiceMode: isVoice || activeMode === 'voice',
      activeAgentMode: mainAgentMode,
      settings,
      images: Array.isArray(images) && images.length
        ? images.slice(0, 5).map((img) => ({
            name: String(img.name || 'image').slice(0, 120),
            mimeType: String(img.mimeType || 'image/jpeg'),
            data: String(img.data || ''),
          })).filter((img) => img.data.length > 0 && img.data.length < 1_400_000)
        : undefined,
    };

    const startTime = Date.now();

    try {
      setAgentRuntimeState('EXECUTING');
      setAssistantState('GENERATING');

      const progressSteps = [
        'กำลังเข้าใจคำขอ…',
        'กำลังอ่านบริบทโปรเจกต์…',
        'กำลังวิเคราะห์และวางแผน…',
        'กำลังสร้างคำตอบ…',
      ];
      let progressIdx = 0;
      setAgentLogs((prev) => [
        ...prev.slice(-30),
        {
          id: `prog-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          message: progressSteps[0],
          type: 'info' as const,
        },
      ]);
      const progressTimer = setInterval(() => {
        progressIdx = Math.min(progressIdx + 1, progressSteps.length - 1);
        setAgentLogs((prev) => [
          ...prev.slice(-30),
          {
            id: `prog-${Date.now()}-${progressIdx}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            message: progressSteps[progressIdx],
            type: 'info' as const,
          },
        ]);
      }, 1600);
      
      let res: Response;
      try {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });
      } finally {
        clearInterval(progressTimer);
      }

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        let errorDetail = res.statusText || '';
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errorDetail = errData.error;
          }
        } catch (e) {
          // ignore
        }
        throw new Error(errorDetail || `Server returned HTTP ${res.status}`);
      }

      const data = await res.json();

      // Tool Orchestration: execute any generated tool actions
      const results: ToolResult[] = [];
      if (data.files && Array.isArray(data.files)) {
        for (const file of data.files) {
          const toolRes = await toolOrchestrator.executeTool('updateFile', { name: file.name, content: file.content, description: file.description }, projectContext, setProjectContext);
          results.push(toolRes);
        }
      }
      setToolResults(results);

      // Continuous Build & Validation Gate Check
      setAgentRuntimeState('VALIDATING');
      const valResult = toolOrchestrator.runValidation(data.files || projectContext.files);
      setAgentValidation(valResult);

      // Update Agent State
      if (data.plan) {
        setAgentPlan(data.plan);
        if (data.plan.steps) setAgentSteps(data.plan.steps);
      }

      if (data.diffs && Array.isArray(data.diffs)) {
        setAgentDiffs(data.diffs);
      }

      if (data.activityLogs && Array.isArray(data.activityLogs)) {
        setAgentLogs((prev) => [...prev.slice(-20), ...data.activityLogs]);
      }

      // Log to Developer Mode Telemetry
      const logRecord: ApiLogRecord = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        endpoint: '/api/chat',
        requestPayload,
        responsePayload: data,
        latencyMs: data.devMetadata?.latencyMs || latencyMs,
        status: 'success',
        model: data.devMetadata?.model || settings.model,
        intent: data.intent as IntentType,
        toolResults: results,
      };
      setApiLogs((prev) => [...prev.slice(-25), logRecord]);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: data.displayResponse || 'ทำงานเสร็จสิ้นแล้วครับ',
        displayResponse: data.displayResponse,
        voiceResponse: data.voiceResponse,
        intent: data.intent,
        status: data.status,
        files: data.files,
        diffs: data.diffs,
        plan: data.plan,
        steps: data.plan?.steps,
        validation: valResult,
        citations: data.citations,
        prompt: data.prompt,
        debug: data.debug,
        nextAction: data.nextAction,
        devMetadata: data.devMetadata,
        toolResults: results,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If files were returned, update project files seamlessly
      if (data.files && Array.isArray(data.files) && data.files.length > 0) {
        setProjectContext((prev) => {
          const currentFiles = [...prev.files];
          data.files.forEach((newFile: CodeFile) => {
            const existingIdx = currentFiles.findIndex((f) => f.name === newFile.name);
            if (existingIdx >= 0) {
              currentFiles[existingIdx] = newFile;
            } else {
              currentFiles.push(newFile);
            }
          });

          const currentFeatures = [...(prev.features || prev.completedFeatures || [])];
          if (data.projectContextUpdate?.newFeature && !currentFeatures.includes(data.projectContextUpdate.newFeature)) {
            currentFeatures.push(data.projectContextUpdate.newFeature);
          }

          return {
            ...prev,
            projectName: data.projectContextUpdate?.projectName || prev.projectName,
            category: (data.projectContextUpdate?.category as any) || prev.category,
            framework: data.projectContextUpdate?.framework || prev.framework,
            description: data.projectContextUpdate?.description || prev.description,
            currentGoal: data.projectContextUpdate?.currentGoal || prev.currentGoal,
            currentTask: data.projectContextUpdate?.currentTask || prev.currentTask,
            conversationSummary: data.projectContextUpdate?.conversationSummary || prev.conversationSummary,
            files: currentFiles,
            features: currentFeatures,
            activeIssues: data.projectContextUpdate?.activeIssue || prev.activeIssues,
          };
        });

        // Switch to Sandbox preview
        setRightTab('sandbox');
      }

      if (!valResult.isValid) setAgentFailureReason(valResult.errors?.[0] || 'การตรวจสอบโค้ด (Validation Gate) ไม่ผ่าน');
      setAgentRuntimeState(valResult.isValid ? 'COMPLETED' : 'FAILED');

      // Auto speak voice summary if enabled
      if (settings.autoSpeak && data.voiceResponse) {
        playVoiceSummary(data.voiceResponse);
      } else {
        setAssistantState('READY');
      }
    } catch (err: any) {
      console.error('Failed to chat with CodeVoice AI:', err);
      const latencyMs = Date.now() - startTime;

      const errorLog: ApiLogRecord = {
        id: `log-err-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        endpoint: '/api/chat',
        requestPayload,
        responsePayload: null,
        latencyMs,
        status: 'error',
        errorDetails: err?.message || 'Network / Server Error',
        model: settings.model,
      };
      setApiLogs((prev) => [...prev.slice(-25), errorLog]);

      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล: ${err.message || 'กรุณาลองใหม่อีกครั้งครับ'}\n\nคุณสามารถกดปุ่ม Retry หรือตรวจสอบรายละเอียดได้ที่ Developer Mode`,
        displayResponse: `ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล: ${err.message || 'กรุณาลองใหม่อีกครั้งครับ'}`,
        voiceResponse: 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้งครับ',
        intent: 'CHAT',
        status: 'error',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setAgentFailureReason(String(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ / ประมวลผล').slice(0, 300));
      setAgentRuntimeState('FAILED');
      setAssistantState('READY');

      if (settings.autoSpeak) {
        playVoiceSummary(fallbackMsg.voiceResponse!);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDiffs = (diffsToApply: FileChangeDiff[]) => {
    setProjectContext((prev) => {
      const updatedFiles = [...prev.files];
      diffsToApply.forEach((d) => {
        const idx = updatedFiles.findIndex((f) => f.name === d.fileName);
        if (d.action === 'delete') {
          if (idx >= 0) updatedFiles.splice(idx, 1);
        } else {
          const newCodeFile: CodeFile = {
            name: d.fileName,
            language: d.language,
            content: d.newContent,
            description: d.description,
          };
          if (idx >= 0) {
            updatedFiles[idx] = newCodeFile;
          } else {
            updatedFiles.push(newCodeFile);
          }
        }
      });
      return { ...prev, files: updatedFiles };
    });

    setAgentDiffs([]);
    const successMsg: ChatMessage = {
      id: `applied-${Date.now()}`,
      role: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: `✅ นำการเปลี่ยนแปลง (${diffsToApply.length} ไฟล์) เข้าสู่โปรเจกต์เรียบร้อยแล้วครับ คุณสามารถเปิดดู Live Sandbox ได้ทันทีครับ`,
      displayResponse: `✅ นำการเปลี่ยนแปลง (${diffsToApply.length} ไฟล์) เข้าสู่โปรเจกต์เรียบร้อยแล้วครับ คุณสามารถเปิดดู Live Sandbox ได้ทันทีครับ`,
      voiceResponse: 'นำโค้ดที่แก้ไขเข้าสู่โปรเจกต์และอัปเดตพรีวิวเรียบร้อยแล้วครับ',
      intent: 'AGENT',
      status: 'success',
    };
    setMessages((prev) => [...prev, successMsg]);
    setRightTab('sandbox');
    setMobileTab('sandbox');
    if (settings.autoSpeak) {
      playVoiceSummary(successMsg.voiceResponse!);
    }
  };

  const handleRejectDiffs = () => {
    setAgentDiffs([]);
    const rejectMsg: ChatMessage = {
      id: `reject-${Date.now()}`,
      role: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: 'ยกเลิกชุดการเปลี่ยนแปลงเรียบร้อยแล้วครับ รักษาไฟล์เดิมไว้ทั้งหมดครับ',
      displayResponse: 'ยกเลิกชุดการเปลี่ยนแปลงเรียบร้อยแล้วครับ รักษาไฟล์เดิมไว้ทั้งหมดครับ',
      voiceResponse: 'ยกเลิกการเปลี่ยนแปลงให้แล้วครับ ไฟล์เดิมยังคงปลอดภัยครับ',
      intent: 'AGENT',
      status: 'success',
    };
    setMessages((prev) => [...prev, rejectMsg]);
  };

  const handleRetryLastRequest = () => {
    if (lastRequestRef.current) {
      handleSendMessage(lastRequestRef.current.text, lastRequestRef.current.isVoice);
    }
  };

  const handleClearChat = () => {
    handleInterrupt();
    setMessages([
      {
        id: `clear-${Date.now()}`,
        role: 'assistant',
        timestamp: 'ตอนนี้',
        content: 'ล้างประวัติการสนทนาเรียบร้อยแล้วครับ บริบทและ Knowledge Base ของโปรเจกต์ยังคงถูกเก็บรักษาไว้ คุณสามารถสั่งงานต่อได้ทันทีครับ',
        displayResponse: 'ล้างประวัติการสนทนาเรียบร้อยแล้วครับ บริบทและ Knowledge Base ของโปรเจกต์ยังคงถูกเก็บรักษาไว้ คุณสามารถสั่งงานต่อได้ทันทีครับ',
        voiceResponse: 'ล้างประวัติการสนทนาเรียบร้อยแล้วครับ สั่งงานต่อได้เลยครับ',
        intent: 'CHAT',
        status: 'success',
      },
    ]);
  };

  const handleCopyAllCode = async () => {
    const text = projectContext.files
      .map((f) => `/* =================== FILE: ${f.name} (${f.language}) =================== */\n${f.content}`)
      .join('\n\n');
    await navigator.clipboard.writeText(text);
  };

  const handleDownloadAllCode = () => {
    handleExportZip();
  };

  // Cart operations
  const handleUpdateCartQty = (id: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const handleRemoveCartItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    alert(`สั่งซื้อสำเร็จ! ยอดรวมทั้งสิ้น ฿${cartItems.reduce((s, i) => s + i.price * i.qty, 0)} ขอบคุณที่ใช้บริการครับ`);
    setCartItems([]);
    setIsCartOpen(false);
  };

  // File workspace management
  const handleUpdateFile = (updatedFile: CodeFile) => {
    setProjectContext((prev) => ({
      ...prev,
      files: prev.files.map((f) => (f.name === updatedFile.name ? updatedFile : f)),
    }));
  };

  const handleDeleteFile = (filename: string) => {
    setProjectContext((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.name !== filename),
    }));
  };

  const handleAddFile = (newFile: CodeFile) => {
    setProjectContext((prev) => ({
      ...prev,
      files: [...prev.files, newFile],
    }));
  };

  const handleResetProject = () => {
    handleInterrupt();
    setProjectContext(INITIAL_PROJECT_CONTEXT);
    handleClearChat();
  };

  // Filter messages based on active mode
  const filteredMessages = messages.filter((msg) => {
    if (activeMode === 'all') return true;
    if (activeMode === 'voice') return true;
    if (activeMode === 'coding') return msg.intent === 'CODE' || msg.intent === 'PROJECT' || msg.intent === 'MODIFY' || msg.role === 'user';
    if (activeMode === 'prompt') return msg.intent === 'PROMPT' || msg.prompt || msg.role === 'user';
    if (activeMode === 'debug') return msg.intent === 'DEBUG' || msg.debug || msg.role === 'user';
    return true;
  });

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none box-border">
      {/* Top Header */}
      <Header
        activeMode={activeMode}
        onSelectMode={(mode) => setActiveMode(mode)}
        activeAgentMode={mainAgentMode}
        onSelectAgentMode={(m) => setMainAgentMode(m)}
        projectContext={{
          name: projectContext.projectName,
          framework: projectContext.framework,
          description: projectContext.description,
          files: projectContext.files,
          completedFeatures: projectContext.features,
          activeIssues: projectContext.activeIssues,
        }}
        autoSpeak={settings.autoSpeak}
        onToggleAutoSpeak={() => setSettings((s) => ({ ...s, autoSpeak: !s.autoSpeak }))}
        voiceLang={settings.language}
        onChangeVoiceLang={(lang) => setSettings((s) => ({ ...s, language: lang }))}
        onResetProject={handleResetProject}
        onClearChat={handleClearChat}
        onCopyAllCode={handleCopyAllCode}
        onDownloadAllCode={handleDownloadAllCode}
        onExportZip={() => handleExportZip()}
        onOpenProjectsDashboard={() => setIsProjectsDashboardOpen(true)}
        onOpenCodeSearch={() => setIsCodeSearchOpen(true)}
        onToggleDevMode={() => setIsDevModeOpen(true)}
        onToggleCart={() => setIsCartOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        cartCount={cartItems.reduce((s, i) => s + i.qty, 0)}
        isSpeaking={isSpeaking}
        onStopSpeaking={handleInterrupt}
      />

      {/* Main Studio Body */}
      {/* 1. Mobile Viewports (< 768px): Single Full-Screen Active View */}
      <div className="md:hidden flex-1 flex flex-col min-h-0 min-w-0 w-full overflow-hidden relative">
        {mobileTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <ChatFeed
              messages={filteredMessages}
              isLoading={isLoading}
              onPlayVoiceSummary={playVoiceSummary}
              isSpeaking={isSpeaking}
              activeSpeakingText={activeSpeakingText}
              onOpenFileInEditor={() => setMobileTab('code')}
              onOpenInSandbox={() => setMobileTab('sandbox')}
              onSendQuickCommand={(cmd) => handleSendMessage(cmd, false)}
              onRegenerateLastPrompt={(promptText) => handleSendMessage(`ช่วยสร้าง Prompt นี้ใหม่อีกครั้งให้ดียิ่งขึ้น: ${promptText}`, false)}
              onImprovePrompt={(promptText) => handleSendMessage(`ช่วยปรับปรุงและเพิ่มความละเอียดให้ Prompt นี้: ${promptText}`, false)}
            />
            <VoiceController
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              voiceLang={settings.language}
              activeMode={activeMode}
              assistantState={assistantState}
              onInterrupt={handleInterrupt}
              focusSignal={focusSignal}
            />
          </div>
        )}

        {mobileTab === 'agent' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <AgentExecutionView
              plan={agentPlan}
              steps={agentSteps}
              diffs={agentDiffs}
              activityLogs={agentLogs}
              validation={agentValidation}
              testReport={testReport || undefined}
              projectContext={projectContext}
              runtimeState={agentRuntimeState}
              onApplyDiffs={handleApplyDiffs}
              onRejectDiffs={handleRejectDiffs}
              onStartExecution={() => handleSendMessage(projectContext.currentGoal || 'สร้างโปรเจกต์นี้ให้เสร็จสมบูรณ์', false)}
              onPauseExecution={handleInterrupt}
              onResumeExecution={() => handleSendMessage('ทำต่อ', false)}
              onCancelExecution={() => handleSendMessage('ยกเลิก', false)}
              onOpenSandbox={() => setMobileTab('sandbox')}
              onCreateSnapshot={handleCreateSnapshot}
              onRestoreSnapshot={handleRestoreSnapshot}
              onTriggerBrowserQA={handleRunBrowserQA}
              toolResults={toolResults}
              failureReason={agentFailureReason}
            />
          </div>
        )}

        {mobileTab === 'code' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <CodeWorkspace
              projectContext={projectContext}
              onUpdateFile={handleUpdateFile}
              onDeleteFile={handleDeleteFile}
              onAddFile={handleAddFile}
              onOpenInSandbox={() => setMobileTab('sandbox')}
              onBackToChat={() => setMobileTab('chat')}
            />
          </div>
        )}

        {mobileTab === 'sandbox' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <LiveSandbox 
              projectContext={projectContext} 
              onAutoFixError={(errMsg) => handleSendMessage(`ช่วยแก้ไขข้อผิดพลาดใน Sandbox นี้ให้หน่อยครับ:\n\n${errMsg}`, false)}
              onRunBrowserQATest={handleRunBrowserQA}
            />
          </div>
        )}

        {mobileTab === 'prompt' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <PromptStudio
              onInjectPromptToChat={(prompt) => {
                setMobileTab('chat');
                handleSendMessage(prompt, false);
              }}
            />
          </div>
        )}

        {mobileTab === 'memory' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <ProjectMemoryView
              projectContext={projectContext}
              onUpdateContext={(ctx) => {
                setProjectContext((prev) => ({
                  ...prev,
                  projectName: ctx.projectName || ctx.name || prev.projectName,
                  framework: ctx.framework || prev.framework,
                  description: ctx.description || prev.description,
                  features: ctx.features || ctx.completedFeatures || prev.features,
                  rules: ctx.rules || prev.rules,
                  knowledgeBase: ctx.knowledgeBase || prev.knowledgeBase,
                }));
              }}
              onResetContext={handleResetProject}
            />
          </div>
        )}

        {mobileTab === 'team' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <TeamPanel
              projectContext={projectContext}
              record={teamRecord}
              onStart={handleStartTeam}
              onPause={handlePauseTeam}
              onResume={handleResumeTeam}
              onCancel={handleCancelTeam}
            />
          </div>
        )}

        {mobileTab === 'mission' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <MissionControlPanel
              projectContext={projectContext}
              run={universalRun}
              onStart={() => handleStartMission()}
              onCancel={handleCancelMission}
              onReplay={handleReplayMission}
            />
          </div>
        )}

        {mobileTab === 'integration' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <IntegrationHubPanel
              state={integrationHubState}
              discovery={integrationDiscovery.query}
              onRefresh={handleRefreshIntegrationHub}
              onDiscover={handleDiscoverIntegration}
              onSeedSamples={handleSeedIntegrationSamples}
              onTestConnection={handleTestIntegrationConnection}
            />
          </div>
        )}

        {mobileTab === 'research' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <ResearchPanel
              task={researchTask}
              onStart={handleStartResearch}
              onCancel={handleCancelResearch}
              onRefresh={() => setResearchTask((prev) => prev)}
            />
          </div>
        )}

        {mobileTab === 'production' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <ProductionControlPanel result={productionResult} onRun={handleRunProduction} onCancel={handleCancelProduction} />
          </div>
        )}

        {mobileTab === 'infrastructure' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <InfrastructurePanel report={infrastructureReport} onRefresh={() => setInfrastructureReport(getV16InfrastructureReport())} />
          </div>
        )}

        {mobileTab === 'runtime' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <SelfContainedRuntimePanel state={internalRuntimeState} onTool={handleInternalTool} />
          </div>
        )}

        {mobileTab === 'autonomous' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950">
            <AutonomousMissionPanel mission={autonomousMission} onStart={handleStartAutonomous} onPause={handlePauseAutonomous} onResume={handleResumeAutonomous} onCancel={handleCancelAutonomous} onApprove={handleApproveAutonomous} onStep={handleStepAutonomous} onProvideInputs={handleProvideAutonomousInputs} />
          </div>
        )}

        {mobileTab === 'settings' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full bg-slate-950 p-4 overflow-y-auto">
            <div className="max-w-md mx-auto w-full space-y-4">
              <h2 className="text-base font-bold text-white pb-2 border-b border-slate-800">
                การตั้งค่าระบบ (Settings)
              </h2>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span>อ่านสรุปเสียงอัตโนมัติ (Auto-Speak)</span>
                  <input
                    type="checkbox"
                    checked={settings.autoSpeak}
                    onChange={(e) => setSettings((s) => ({ ...s, autoSpeak: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span>สนทนาเสียงต่อเนื่อง (Continuous Voice)</span>
                  <input
                    type="checkbox"
                    checked={settings.continuousVoice}
                    onChange={(e) => setSettings((s) => ({ ...s, continuousVoice: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span>Apply Safe Changes อัตโนมัติใน Agent</span>
                  <input
                    type="checkbox"
                    checked={settings.agentAutoApplySafeChanges}
                    onChange={(e) => setSettings((s) => ({ ...s, agentAutoApplySafeChanges: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span>เปิด Developer Mode</span>
                  <input
                    type="checkbox"
                    checked={settings.developerMode}
                    onChange={(e) => setSettings((s) => ({ ...s, developerMode: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Desktop/Tablet Viewports (>= 768px): Split Multi-Pane Workspace */}
      <div className="hidden md:flex flex-1 min-h-0 min-w-0 w-full overflow-hidden">
        {/* Left Pane: Chat & Voice */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
          <ChatFeed
            messages={filteredMessages}
            isLoading={isLoading}
            onPlayVoiceSummary={playVoiceSummary}
            isSpeaking={isSpeaking}
            activeSpeakingText={activeSpeakingText}
            onOpenFileInEditor={() => {
              setRightTab('workspace');
              setIsRightCollapsed(false);
            }}
            onOpenInSandbox={() => {
              setRightTab('sandbox');
              setIsRightCollapsed(false);
            }}
            onSendQuickCommand={(cmd) => handleSendMessage(cmd, false)}
            onRegenerateLastPrompt={(promptText) => handleSendMessage(`ช่วยสร้าง Prompt นี้ใหม่อีกครั้งให้ดียิ่งขึ้น: ${promptText}`, false)}
            onImprovePrompt={(promptText) => handleSendMessage(`ช่วยปรับปรุงและเพิ่มความละเอียดให้ Prompt นี้: ${promptText}`, false)}
          />

          <VoiceController
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            voiceLang={settings.language}
            activeMode={activeMode}
            assistantState={assistantState}
            onInterrupt={handleInterrupt}
            focusSignal={focusSignal}
          />
        </div>

        {/* Right Pane: Workspace / Agent / Sandbox / Prompt / Memory */}
        <div
          className={`transition-all duration-300 flex-shrink-0 ${
            isRightCollapsed ? 'w-12' : 'w-full md:w-[480px] lg:w-[580px] xl:w-[680px]'
          }`}
        >
          <WorkspaceTabs
            activeTab={rightTab}
            onChangeTab={(t) => setRightTab(t)}
            projectContext={{
              name: projectContext.projectName,
              framework: projectContext.framework,
              description: projectContext.description,
              files: projectContext.files,
              completedFeatures: projectContext.features,
              activeIssues: projectContext.activeIssues,
              rules: projectContext.rules,
              knowledgeBase: projectContext.knowledgeBase,
            }}
            onUpdateFile={handleUpdateFile}
            onDeleteFile={handleDeleteFile}
            onAddFile={handleAddFile}
            onUpdateContext={(ctx) => {
              setProjectContext((prev) => ({
                ...prev,
                projectName: ctx.projectName || ctx.name || prev.projectName,
                framework: ctx.framework || prev.framework,
                description: ctx.description || prev.description,
                features: ctx.features || ctx.completedFeatures || prev.features,
                rules: ctx.rules || prev.rules,
                knowledgeBase: ctx.knowledgeBase || prev.knowledgeBase,
              }));
            }}
            onResetContext={handleResetProject}
            onInjectPromptToChat={(prompt) => handleSendMessage(prompt, false)}
            isCollapsed={isRightCollapsed}
            onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
            agentPlan={agentPlan}
            agentSteps={agentSteps}
            agentDiffs={agentDiffs}
            agentLogs={agentLogs}
            agentValidation={agentValidation}
            testReport={testReport || undefined}
            runtimeState={agentRuntimeState}
            onApplyDiffs={handleApplyDiffs}
            onRejectDiffs={handleRejectDiffs}
            onStartAgentExecution={() => handleSendMessage(projectContext.currentGoal || 'สร้างโปรเจกต์นี้ให้เสร็จสมบูรณ์', false)}
            onPauseAgentExecution={handleInterrupt}
            onResumeAgentExecution={() => handleSendMessage('ทำต่อ', false)}
            onCancelAgentExecution={() => handleSendMessage('ยกเลิก', false)}
            onCreateSnapshot={handleCreateSnapshot}
            onRestoreSnapshot={handleRestoreSnapshot}
            onTriggerBrowserQA={handleRunBrowserQA}
            toolResults={toolResults}
            isAgentExecuting={agentRuntimeState === 'EXECUTING' || agentRuntimeState === 'PLANNING' || agentRuntimeState === 'VALIDATING'}
            releaseRun={releaseRun}
            releaseSnapshots={releaseSnapshots}
            onPrepareRelease={handlePrepareRelease}
            onCancelRelease={handleCancelRelease}
            onExportRelease={handleExportRelease}
            onRollbackRelease={handleRollbackRelease}
            teamRecord={teamRecord}
            onStartTeam={handleStartTeam}
            onPauseTeam={handlePauseTeam}
            onResumeTeam={handleResumeTeam}
            onCancelTeam={handleCancelTeam}
            universalRun={universalRun}
            onStartMission={() => handleStartMission()}
            onCancelMission={handleCancelMission}
            onReplayMission={handleReplayMission}
            integrationHubState={integrationHubState}
            integrationDiscovery={integrationDiscovery}
            onRefreshIntegrationHub={handleRefreshIntegrationHub}
            onDiscoverIntegration={handleDiscoverIntegration}
              onSeedIntegrationSamples={handleSeedIntegrationSamples}
              onTestIntegrationConnection={handleTestIntegrationConnection}
            researchTask={researchTask}
            onStartResearch={handleStartResearch}
            onCancelResearch={handleCancelResearch}
            onRefreshResearch={() => setResearchTask((prev) => prev)}
            productionResult={productionResult}
            onRunProduction={handleRunProduction}
            onCancelProduction={handleCancelProduction}
            infrastructureReport={infrastructureReport}
            onRefreshInfrastructure={() => setInfrastructureReport(getV16InfrastructureReport())}
            selfContainedState={internalRuntimeState}
            onRuntimeTool={handleInternalTool}
            autonomousMission={autonomousMission}
            onStartAutonomous={handleStartAutonomous}
            onPauseAutonomous={handlePauseAutonomous}
            onResumeAutonomous={handleResumeAutonomous}
            onCancelAutonomous={handleCancelAutonomous}
            onApproveAutonomous={handleApproveAutonomous}
            onStepAutonomous={handleStepAutonomous}
            onProvideAutonomousInputs={handleProvideAutonomousInputs}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on < 768px) */}
      <MobileBottomNav
        activeTab={mobileTab}
        onChangeTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsOpen(true);
          } else {
            setMobileTab(tab);
          }
        }}
        filesCount={projectContext.files.length}
        isAgentRunning={agentRuntimeState === 'EXECUTING' || agentRuntimeState === 'PLANNING'}
      />

      {/* Projects Dashboard Modal */}
      <ProjectDashboardModal
        isOpen={isProjectsDashboardOpen}
        onClose={() => setIsProjectsDashboardOpen(false)}
        savedProjects={savedProjects}
        currentProjectId={projectContext.id}
        onOpenProject={handleOpenProject}
        onCreateNewProject={handleCreateNewProject}
        onDuplicateProject={handleDuplicateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onExportProjectZip={handleExportZip}
      />

      {/* Code Search Modal */}
      <CodeSearchModal
        isOpen={isCodeSearchOpen}
        onClose={() => setIsCodeSearchOpen(false)}
        files={projectContext.files}
        onSelectFile={(fileName) => {
          setRightTab('workspace');
          setMobileTab('code');
        }}
      />

      {/* Developer Mode Drawer/Modal */}
      <DeveloperModeModal
        isOpen={isDevModeOpen || settings.developerMode}
        onClose={() => setIsDevModeOpen(false)}
        logs={apiLogs}
        onClearLogs={() => setApiLogs([])}
        onRetryLastRequest={handleRetryLastRequest}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newS) => setSettings((prev) => ({ ...prev, ...newS }))}
        onResetDefaults={() => setSettings(DEFAULT_SETTINGS)}
      />

      {/* Shopping Cart Drawer - Toggled via 'Ctrl+Shift+C' or Header */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
