import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * ZYRQUEN Ω∞ Sovereign React SDK & Hooks (LOCKED_FROZEN_v1.2_LTS)
 * Fully compliant with the Thai Electronic Transactions Act B.E. 2544 (Sections 9, 26, 28)
 * Designed for Service Layer integration with post-quantum signature verification frameworks.
 */

// --- TYPES & INTERFACES ---
export type ComplianceTier = 'Section_9_General' | 'Section_26_Secure' | 'Section_28_Sovereign' | 'QUARANTINED' | 'BLOCKED';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: UserProfile | null;
  ial: number;
  aal: number;
  cryptoScheme: 'Dilithium-5' | 'SPHINCS+' | 'ECDSA' | 'RSA-4096' | 'None';
  hsmSigned: boolean;
  complianceTier: ComplianceTier;
  riskScore: number;
  isAuthenticated: boolean;
  systemStatus: string;
  merkleGenesis: string;
}

interface ZyrquenAuthContextType {
  authState: AuthState;
  loginMock: (profile: UserProfile, requestedIal: number, requestedAal: number, scheme: AuthState['cryptoScheme']) => Promise<AuthState>;
  logout: () => void;
  triggerMockTamperAnomaly: () => void;
  evaluateChainModelValue: (segment: string) => number;
}

// --- CONTEXT CREATION ---
const ZyrquenAuthContext = createContext<ZyrquenAuthContextType | undefined>(undefined);

// --- COMPLIANCE HELPER ---
const evaluateComplianceLevel = (ial: number, aal: number, scheme: string, risk: number, hsm: boolean): ComplianceTier => {
  if (risk >= 0.85) return 'QUARANTINED';
  if (ial >= 2 && aal >= 2 && scheme === 'Dilithium-5' && hsm) return 'Section_28_Sovereign';
  if (ial >= 2 && aal >= 2 && (scheme === 'Dilithium-5' || scheme === 'SPHINCS+')) return 'Section_26_Secure';
  if (ial >= 1 && aal >= 1) return 'Section_9_General';
  return 'BLOCKED';
};

// --- AUTH PROVIDER COMPONENT ---
export const ZyrquenAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    ial: 0,
    aal: 0,
    cryptoScheme: 'None',
    hsmSigned: false,
    complianceTier: 'Section_9_General',
    riskScore: 0.02,
    isAuthenticated: false,
    systemStatus: 'LOCKED_FROZEN_v1.2_LTS',
    merkleGenesis: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
  });

  const loginMock = async (
    profile: UserProfile,
    requestedIal: number,
    requestedAal: number,
    scheme: AuthState['cryptoScheme']
  ): Promise<AuthState> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const risk = profile.id === 'USR-SUSPECT' ? 0.96 : requestedIal === 1 ? 0.12 : 0.02;
        const hsm = requestedIal >= 3 && requestedAal >= 3 && scheme === 'Dilithium-5';
        const tier = evaluateComplianceLevel(requestedIal, requestedAal, scheme, risk, hsm);

        const newAuthState: AuthState = {
          user: profile,
          ial: requestedIal,
          aal: requestedAal,
          cryptoScheme: scheme,
          hsmSigned: hsm,
          complianceTier: tier,
          riskScore: risk,
          isAuthenticated: tier !== 'QUARANTINED' && tier !== 'BLOCKED',
          systemStatus: 'LOCKED_FROZEN_v1.2_LTS',
          merkleGenesis: authState.merkleGenesis
        };

        setAuthState(newAuthState);
        resolve(newAuthState);
      }, 500); // Simulate API latency
    });
  };

  const logout = () => {
    setAuthState({
      user: null,
      ial: 0,
      aal: 0,
      cryptoScheme: 'None',
      hsmSigned: false,
      complianceTier: 'Section_9_General',
      riskScore: 0.02,
      isAuthenticated: false,
      systemStatus: 'LOCKED_FROZEN_v1.2_LTS',
      merkleGenesis: authState.merkleGenesis
    });
  };

  const triggerMockTamperAnomaly = () => {
    setAuthState(prev => ({
      ...prev,
      riskScore: 0.98,
      complianceTier: 'QUARANTINED',
      isAuthenticated: false
    }));
  };

  // Chain Model of Segment Value: Segment Value = Nc * Vc
  // Nc = Population (70M) * Segment Size % * Segment Penetration (80%)
  // Vc = Usage Rate * Unit Contribution (Thb)
  const evaluateChainModelValue = (segment: string): number => {
    const population = 70000000;
    const penetration = 0.80;
    let size = 0.0;
    let usageRate = 0;
    let contribution = 0.0;

    switch (segment) {
      case 'Gen_Z_Core':
        size = 0.24;
        usageRate = 5;
        contribution = 2.0;
        break;
      case 'Gen_Y_Pro':
        size = 0.32;
        usageRate = 8;
        contribution = 3.5;
        break;
      case 'Gen_X_Enterprise':
        size = 0.15;
        usageRate = 12;
        contribution = 10.0;
        break;
      case 'SMB_Retail':
        size = 0.10;
        usageRate = 15;
        contribution = 6.0;
        break;
      default:
        return 0;
    }

    const nc = population * size * penetration;
    const vc = usageRate * contribution;
    return nc * vc; // Returns exact Thai Baht Segment Value
  };

  return (
    <ZyrquenAuthContext.Provider value={{ authState, loginMock, logout, triggerMockTamperAnomaly, evaluateChainModelValue }}>
      {children}
    </ZyrquenAuthContext.Provider>
  );
};

// --- CUSTOM HOOK ---
export const useZyrquenAuth = () => {
  const context = useContext(ZyrquenAuthContext);
  if (context === undefined) {
    throw new Error('useZyrquenAuth must be used within a ZyrquenAuthProvider');
  }
  return context;
};

// --- RETAIL UI COMPLIANCE DISPLAY ---
export const ZyrquenComplianceBadge: React.FC = () => {
  const { authState } = useZyrquenAuth();

  const badgeStyles: Record<ComplianceTier, { bg: string; text: string; label: string }> = {
    Section_9_General: {
      bg: '#dcfce7',
      text: '#166534',
      label: 'มาตรา ๙ (ลายมือชื่อทั่วไป) - ผ่านการรับรองสิทธิ์'
    },
    Section_26_Secure: {
      bg: '#dbeafe',
      text: '#1e40af',
      label: 'มาตรา ๒๖ (ลายมือชื่อเชื่อถือได้) - ดิจิทัลไซน์ต้านควอนตัม'
    },
    Section_28_Sovereign: {
      bg: '#f3e8ff',
      text: '#6b21a8',
      label: 'มาตรา ๒๘ (ใบรับรองผู้ให้บริการ CA) - ผ่านสิทธิ์คลังอธิปไตย'
    },
    QUARANTINED: {
      bg: '#fee2e2',
      text: '#991b1b',
      label: 'กักโรคพยานผู้ใช้ (Chamber 02 Quarantine)'
    },
    BLOCKED: {
      bg: '#f3f4f6',
      text: '#1f2937',
      label: 'ถูกบล็อกการเข้าถึงสิทธิ์'
    }
  };

  const currentStyle = badgeStyles[authState.complianceTier];

  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '8px',
      backgroundColor: currentStyle.bg,
      color: currentStyle.text,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontWeight: 'bold',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      border: `1px solid ${currentStyle.text}22`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: currentStyle.text,
        display: 'inline-block'
      }} />
      {currentStyle.label}
    </div>
  );
};
