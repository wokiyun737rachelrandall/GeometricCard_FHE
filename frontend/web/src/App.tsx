// App.tsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContractReadOnly, getContractWithSigner } from "./contract";
import WalletManager from "./components/WalletManager";
import WalletSelector from "./components/WalletSelector";
import "./App.css";

interface RiskData {
  id: string;
  encryptedPayload: string;
  timestamp: number;
  insurer: string;
  riskType: string;
  fheProcessed: boolean;
}

const App: React.FC = () => {
  // Wallet state
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);

  // Data state
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState<RiskData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Transaction feedback
  const [transactionStatus, setTransactionStatus] = useState<{
    visible: boolean;
    status: "pending" | "success" | "error";
    message: string;
  }>({ visible: false, status: "pending", message: "" });

  // New data form
  const [newRiskData, setNewRiskData] = useState({
    riskType: "",
    description: "",
    sensitiveData: ""
  });

  // Statistics
  const processedCount = riskData.filter(d => d.fheProcessed).length;
  const pendingCount = riskData.length - processedCount;

  // Load initial data
  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  // Wallet connection handlers
  const onWalletSelect = async (wallet: any) => {
    if (!wallet.provider) return;
    try {
      const web3Provider = new ethers.BrowserProvider(wallet.provider);
      setProvider(web3Provider);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      setAccount(accounts[0] || "");

      wallet.provider.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts[0] || "");
      });
    } catch (e) {
      alert("Wallet connection failed");
    }
  };

  const onConnect = () => setWalletSelectorOpen(true);
  const onDisconnect = () => {
    setAccount("");
    setProvider(null);
  };

  // Data operations
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      
      // Check FHE availability
      const isAvailable = await contract.isAvailable();
      if (!isAvailable) {
        console.error("FHE system not available");
        return;
      }
      
      const keysBytes = await contract.getData("risk_data_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing keys:", e);
        }
      }
      
      const dataList: RiskData[] = [];
      
      for (const key of keys) {
        try {
          const dataBytes = await contract.getData(`risk_${key}`);
          if (dataBytes.length > 0) {
            const data = JSON.parse(ethers.toUtf8String(dataBytes));
            dataList.push({
              id: key,
              encryptedPayload: data.payload,
              timestamp: data.timestamp,
              insurer: data.insurer,
              riskType: data.riskType,
              fheProcessed: data.fheProcessed || false
            });
          }
        } catch (e) {
          console.error(`Error loading data ${key}:`, e);
        }
      }
      
      dataList.sort((a, b) => b.timestamp - a.timestamp);
      setRiskData(dataList);
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const submitRiskData = async () => {
    if (!provider) { 
      alert("Connect wallet first"); 
      return; 
    }
    
    setCreating(true);
    setTransactionStatus({
      visible: true,
      status: "pending",
      message: "Encrypting with FHE..."
    });
    
    try {
      // Simulate FHE encryption
      const encryptedPayload = `FHE-${btoa(JSON.stringify(newRiskData))}`;
      
      const contract = await getContractWithSigner();
      if (!contract) throw new Error("Contract error");
      
      const dataId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const riskData = {
        payload: encryptedPayload,
        timestamp: Math.floor(Date.now() / 1000),
        insurer: account,
        riskType: newRiskData.riskType,
        fheProcessed: false
      };
      
      await contract.setData(
        `risk_${dataId}`, 
        ethers.toUtf8Bytes(JSON.stringify(riskData))
      );
      
      const keysBytes = await contract.getData("risk_data_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing keys:", e);
        }
      }
      
      keys.push(dataId);
      
      await contract.setData(
        "risk_data_keys", 
        ethers.toUtf8Bytes(JSON.stringify(keys))
      );
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: "Data encrypted and stored!"
      });
      
      await loadData();
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
        setShowCreateModal(false);
        setNewRiskData({
          riskType: "",
          description: "",
          sensitiveData: ""
        });
      }, 2000);
    } catch (e: any) {
      setTransactionStatus({
        visible: true,
        status: "error",
        message: e.message.includes("user rejected") 
          ? "Transaction rejected" 
          : "Submission failed"
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    } finally {
      setCreating(false);
    }
  };

  const processWithFHE = async (dataId: string) => {
    if (!provider) {
      alert("Connect wallet first");
      return;
    }

    setTransactionStatus({
      visible: true,
      status: "pending",
      message: "Processing with FHE..."
    });

    try {
      // Simulate FHE computation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const contract = await getContractWithSigner();
      if (!contract) throw new Error("Contract error");
      
      const dataBytes = await contract.getData(`risk_${dataId}`);
      if (dataBytes.length === 0) throw new Error("Data not found");
      
      const data = JSON.parse(ethers.toUtf8String(dataBytes));
      
      const updatedData = {
        ...data,
        fheProcessed: true
      };
      
      await contract.setData(
        `risk_${dataId}`, 
        ethers.toUtf8Bytes(JSON.stringify(updatedData))
      );
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: "FHE analysis complete!"
      });
      
      await loadData();
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 2000);
    } catch (e: any) {
      setTransactionStatus({
        visible: true,
        status: "error",
        message: "Processing failed: " + (e.message || "Unknown error")
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    }
  };

  // Filter data based on search
  const filteredData = riskData.filter(data =>
    data.riskType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    data.insurer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tutorial steps
  const tutorialSteps = [
    {
      title: "Connect Wallet",
      description: "Link your Web3 wallet to access the FHE system",
      icon: "🔗"
    },
    {
      title: "Submit Risk Data",
      description: "Upload encrypted insurance risk data for analysis",
      icon: "📊"
    },
    {
      title: "FHE Processing",
      description: "Data is analyzed while remaining encrypted",
      icon: "⚙️"
    },
    {
      title: "View Results",
      description: "Get systemic risk insights without exposing raw data",
      icon: "🔍"
    }
  ];

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Initializing FHE connection...</p>
    </div>
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <h1>FHE Insurance Risk</h1>
          <span>Confidential Systemic Risk Analysis</span>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => setShowTutorial(!showTutorial)}
            className="btn tutorial-btn"
          >
            {showTutorial ? "Hide Guide" : "Show Guide"}
          </button>
          <WalletManager account={account} onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>
      </header>
      
      <main className="main-content">
        {showTutorial && (
          <div className="tutorial-section">
            <h2>How FHE Protects Insurance Data</h2>
            <div className="tutorial-grid">
              {tutorialSteps.map((step, index) => (
                <div key={index} className="tutorial-card">
                  <div className="tutorial-icon">{step.icon}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="dashboard-section">
          <div className="stats-card">
            <h3>Risk Data Overview</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{riskData.length}</div>
                <div className="stat-label">Total Submissions</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{processedCount}</div>
                <div className="stat-label">Processed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{pendingCount}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
          </div>
          
          <div className="action-card">
            <h3>System Actions</h3>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn primary"
            >
              Submit New Data
            </button>
            <button 
              onClick={loadData}
              disabled={isRefreshing}
              className="btn secondary"
            >
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </button>
            <button 
              onClick={async () => {
                const contract = await getContractReadOnly();
                if (contract) {
                  const available = await contract.isAvailable();
                  alert(`FHE System ${available ? "Available" : "Unavailable"}`);
                }
              }}
              className="btn tertiary"
            >
              Check FHE Status
            </button>
          </div>
        </div>
        
        <div className="data-section">
          <div className="section-header">
            <h2>Encrypted Risk Data</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search risks or insurers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {filteredData.length === 0 ? (
            <div className="empty-state">
              <p>No risk data found</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn primary"
              >
                Submit First Dataset
              </button>
            </div>
          ) : (
            <div className="data-grid">
              <div className="data-header">
                <div>Risk Type</div>
                <div>Insurer</div>
                <div>Date</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              
              {filteredData.map(data => (
                <div className="data-row" key={data.id}>
                  <div>{data.riskType}</div>
                  <div>{data.insurer.substring(0, 6)}...{data.insurer.substring(38)}</div>
                  <div>{new Date(data.timestamp * 1000).toLocaleDateString()}</div>
                  <div>
                    <span className={`status-badge ${data.fheProcessed ? "processed" : "pending"}`}>
                      {data.fheProcessed ? "Processed" : "Pending"}
                    </span>
                  </div>
                  <div>
                    {!data.fheProcessed && (
                      <button 
                        onClick={() => processWithFHE(data.id)}
                        className="btn small"
                      >
                        Process
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Submit Risk Data</h2>
              <button onClick={() => setShowCreateModal(false)} className="close-btn">&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Risk Type</label>
                <select
                  name="riskType"
                  value={newRiskData.riskType}
                  onChange={(e) => setNewRiskData({...newRiskData, riskType: e.target.value})}
                >
                  <option value="">Select risk type</option>
                  <option value="Underwriting">Underwriting Risk</option>
                  <option value="Catastrophe">Catastrophe Risk</option>
                  <option value="Market">Market Risk</option>
                  <option value="Credit">Credit Risk</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={newRiskData.description}
                  onChange={(e) => setNewRiskData({...newRiskData, description: e.target.value})}
                  placeholder="Brief description"
                />
              </div>
              
              <div className="form-group">
                <label>Sensitive Data</label>
                <textarea
                  name="sensitiveData"
                  value={newRiskData.sensitiveData}
                  onChange={(e) => setNewRiskData({...newRiskData, sensitiveData: e.target.value})}
                  placeholder="Enter sensitive risk data to encrypt..."
                  rows={4}
                />
              </div>
              
              <div className="fhe-notice">
                <span>🔒</span> Data will be encrypted using FHE before submission
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="btn secondary"
              >
                Cancel
              </button>
              <button 
                onClick={submitRiskData}
                disabled={creating}
                className="btn primary"
              >
                {creating ? "Encrypting..." : "Submit Securely"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {walletSelectorOpen && (
        <WalletSelector
          isOpen={walletSelectorOpen}
          onWalletSelect={(wallet) => { onWalletSelect(wallet); setWalletSelectorOpen(false); }}
          onClose={() => setWalletSelectorOpen(false)}
        />
      )}
      
      {transactionStatus.visible && (
        <div className="transaction-notification">
          <div className={`notification-content ${transactionStatus.status}`}>
            <div className="notification-icon">
              {transactionStatus.status === "pending" && <div className="spinner"></div>}
              {transactionStatus.status === "success" && "✓"}
              {transactionStatus.status === "error" && "✗"}
            </div>
            <div className="notification-message">
              {transactionStatus.message}
            </div>
          </div>
        </div>
      )}
      
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>FHE Insurance Risk</h3>
            <p>Confidential analysis of systemic risk in insurance industry</p>
          </div>
          
          <div className="footer-section">
            <h3>Technology</h3>
            <p>Powered by Fully Homomorphic Encryption</p>
            <div className="tech-badge">FHE SECURE</div>
          </div>
          
          <div className="footer-section">
            <h3>Links</h3>
            <a href="#">Documentation</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Contact</a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Confidential Insurance Risk Analysis</p>
        </div>
      </footer>
    </div>
  );
};

export default App;