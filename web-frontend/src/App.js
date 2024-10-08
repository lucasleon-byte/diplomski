import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import ScanForm from './components/scanForm';
import ResultsList from './components/resultsList';
import AlertDetails from './components/ZapalertDetails';
import './styles.css';
import logoZap from './images/zap.png';
import logoNmap from './images/nmap.jpg';
import logoVirustotal from './images/virustotal.jpeg';
import ResultsPage from './components/virustotalDetails';

const TOOL_API_URLS = {
  zap: 'http://localhost:5000/scan',
  nmap: 'http://localhost:5000/nmap_scan',
  virustotal: 'http://localhost:5000/virustotal_scan',
};

const App = () => {
  const [scanResults, setScanResults] = useState({});
  const [alertDetails, setAlertDetails] = useState({});
  const [selectedAlertType, setSelectedAlertType] = useState(null);
  const [scannedUrl, setScannedUrl] = useState('');
  const [showScanForm, setShowScanForm] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleScan = async (urlToScan) => {
    if (!currentTool) return;

    const scanUrl = TOOL_API_URLS[currentTool];
    setScannedUrl(urlToScan);
    setLoading(true);
    try {
      const response = await fetch(scanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScan }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      setScanResults(data);
      setSelectedAlertType(null);
      setAlertDetails({});
      setScanCompleted(true);
    } catch (error) {
      console.error('Error:', error);
      alert('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = async (urlToRescan) => {
    if (!currentTool) return;

    const scanUrl = `${TOOL_API_URLS[currentTool]}_again?url=${encodeURIComponent(urlToRescan)}`;
    setLoading(true);
    try {
      const response = await fetch(scanUrl, {
        method: 'POST',
      });
      const data = await response.json();
      console.log('API Response:', data);
      if (response.ok) {
        setScanResults(data);
        setSelectedAlertType(null);
        setAlertDetails({});
        setScanCompleted(true);
      } else {
        alert(data.error || 'Error occurred');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertTypeSelect = (alertType) => {
    const urlParams = new URLSearchParams({
      alertType: alertType,
      url: scannedUrl,
    }).toString();

    const newUrl = `/alert?${urlParams}`;
    window.open(newUrl, '_blank');
  };

  const handleIconClick = (tool) => {
    setCurrentTool(tool);
    setShowScanForm(true);
    setScanCompleted(false);
  };

  return (
    <div className="app-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      <header className="app-header">
        <h1>URL Security Scanner</h1>
        <p>Scan your URLs for potential security risks using industry-leading tools.</p>
      </header>
      <section className="tools-section">
        <h2>Supported Tools</h2>
        <div className="tools-icons">
          <div
            className={`tool ${currentTool === 'zap' ? 'selected' : ''}`}
            onClick={() => handleIconClick('zap')}
          >
            <img src={logoZap} alt="OWASP ZAP" className="tool-icon" />
            <p>OWASP ZAP</p>
          </div>

          <div
            className={`tool ${currentTool === 'virustotal' ? 'selected' : ''}`}
            onClick={() => handleIconClick('virustotal')}
          >
            <img src={logoVirustotal} alt="VIRUSTOTAL" className="tool-icon" />
            <p>VIRUSTOTAL</p>
          </div>

          <div
            className={`tool ${currentTool === 'nmap' ? 'selected' : ''}`}
            onClick={() => handleIconClick('nmap')}
          >
            <img src={logoNmap} alt="Nmap" className="tool-icon" />
            <p>NMAP</p>
          </div>
        </div>
      </section>
      <main className="app-content">
        {showScanForm && (
          <ScanForm
            onScan={handleScan}
            onRescan={handleRescan}
            scannedUrl={scannedUrl}
            currentTool={currentTool}
            loading={loading}
          />
        )}
        {scanCompleted && (
          <ResultsList
            results={scanResults}
            onSelectAlertType={handleAlertTypeSelect}
            scannedUrl={scannedUrl}
            currentTool={currentTool}
            loading={loading} 
          />
        )}
        <Routes>
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/alert" element={<AlertDetails />} />
          <Route path="/results/:analysisId" element={<ResultsPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;