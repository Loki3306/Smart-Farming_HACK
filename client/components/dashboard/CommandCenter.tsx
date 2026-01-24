import React, { useState, useEffect } from 'react';

interface CommandCenterProps {
    farmId: string;
}

interface ControlMode {
    irrigation: 'manual' | 'auto';
    fertilization: 'manual' | 'auto';
}

interface ActuationState {
    irrigation: boolean;
    fertilization: boolean;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ farmId }) => {
    const [controlMode, setControlMode] = useState<ControlMode>({
        irrigation: 'manual',
        fertilization: 'manual'
    });

    const [actuationState, setActuationState] = useState<ActuationState>({
        irrigation: false,
        fertilization: false
    });

    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Listen for WebSocket acknowledgements
    useEffect(() => {
        const handleIoTData = (event: any) => {
            const data = event.detail;

            // Handle STATUS acknowledgements from ESP32
            if (data.type === 'STATUS') {
                if (data.irrigation) {
                    setActuationState(prev => ({
                        ...prev,
                        irrigation: data.irrigation === 'ON'
                    }));
                }
                if (data.fertilization) {
                    setActuationState(prev => ({
                        ...prev,
                        fertilization: data.fertilization === 'ON'
                    }));
                }
            }

            // Handle actuation_command broadcasts
            if (data.type === 'actuation_command') {
                setActuationState(prev => ({
                    ...prev,
                    [data.action]: data.value
                }));
            }
        };

        window.addEventListener('iot-data', handleIoTData);
        return () => window.removeEventListener('iot-data', handleIoTData);
    }, []);

    const sendCommand = async (action: 'irrigation' | 'fertilization', value: boolean) => {
        setLoading(prev => ({ ...prev, [action]: true }));
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('http://localhost:8000/iot/control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    farm_id: farmId,
                    action: action,
                    value: value,
                    mode: controlMode[action],
                    reason: `${controlMode[action] === 'manual' ? 'Manual' : 'Auto'} ${value ? 'activation' : 'deactivation'}`,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.status === 403) {
                const data = await response.json();
                setError(data.detail || 'Operation blocked by safety system');
            } else if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            } else {
                const data = await response.json();
                setSuccess(`${action} ${value ? 'activated' : 'deactivated'} successfully`);

                // Update local state optimistically
                setActuationState(prev => ({
                    ...prev,
                    [action]: value
                }));

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send command');
        } finally {
            setLoading(prev => ({ ...prev, [action]: false }));
        }
    };

    const toggleMode = (action: 'irrigation' | 'fertilization') => {
        setControlMode(prev => ({
            ...prev,
            [action]: prev[action] === 'manual' ? 'auto' : 'manual'
        }));
    };

    return (
        <div className="command-center-card">
            <div className="card-header">
                <h3>🎛️ Command Center</h3>
                <span className="subtitle">Hybrid Manual/Auto Control</span>
            </div>

            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">🚫</span>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <span className="alert-icon">✅</span>
                    <span>{success}</span>
                </div>
            )}

            {/* Irrigation Control */}
            <div className="control-section">
                <div className="control-header">
                    <div className="control-title">
                        <span className="control-icon">💧</span>
                        <h4>Irrigation System</h4>
                    </div>
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${controlMode.irrigation === 'manual' ? 'active' : ''}`}
                            onClick={() => setControlMode(prev => ({ ...prev, irrigation: 'manual' }))}
                        >
                            Manual
                        </button>
                        <button
                            className={`mode-btn ${controlMode.irrigation === 'auto' ? 'active' : ''}`}
                            onClick={() => setControlMode(prev => ({ ...prev, irrigation: 'auto' }))}
                        >
                            Auto
                        </button>
                    </div>
                </div>

                <div className="control-actions">
                    <div className="status-indicator">
                        <span className={`led ${actuationState.irrigation ? 'led-on' : 'led-off'}`}>
                            {actuationState.irrigation ? '🟢' : '⚫'}
                        </span>
                        <span className="status-text">
                            {actuationState.irrigation ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    </div>

                    {controlMode.irrigation === 'manual' && (
                        <div className="action-buttons">
                            <button
                                className="action-btn btn-on"
                                onClick={() => sendCommand('irrigation', true)}
                                disabled={loading.irrigation || actuationState.irrigation}
                            >
                                {loading.irrigation ? '⏳' : '▶️'} Turn ON
                            </button>
                            <button
                                className="action-btn btn-off"
                                onClick={() => sendCommand('irrigation', false)}
                                disabled={loading.irrigation || !actuationState.irrigation}
                            >
                                {loading.irrigation ? '⏳' : '⏹️'} Turn OFF
                            </button>
                        </div>
                    )}

                    {controlMode.irrigation === 'auto' && (
                        <div className="auto-mode-info">
                            <span className="auto-icon">🤖</span>
                            <span>Auto mode: System will activate when moisture {'<'} 35%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Fertilization Control */}
            <div className="control-section">
                <div className="control-header">
                    <div className="control-title">
                        <span className="control-icon">🌿</span>
                        <h4>Fertilization System</h4>
                    </div>
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${controlMode.fertilization === 'manual' ? 'active' : ''}`}
                            onClick={() => setControlMode(prev => ({ ...prev, fertilization: 'manual' }))}
                        >
                            Manual
                        </button>
                        <button
                            className={`mode-btn ${controlMode.fertilization === 'auto' ? 'active' : ''}`}
                            onClick={() => setControlMode(prev => ({ ...prev, fertilization: 'auto' }))}
                        >
                            Auto
                        </button>
                    </div>
                </div>

                <div className="control-actions">
                    <div className="status-indicator">
                        <span className={`led ${actuationState.fertilization ? 'led-on' : 'led-off'}`}>
                            {actuationState.fertilization ? '🟢' : '⚫'}
                        </span>
                        <span className="status-text">
                            {actuationState.fertilization ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    </div>

                    {controlMode.fertilization === 'manual' && (
                        <div className="action-buttons">
                            <button
                                className="action-btn btn-on"
                                onClick={() => sendCommand('fertilization', true)}
                                disabled={loading.fertilization || actuationState.fertilization}
                            >
                                {loading.fertilization ? '⏳' : '▶️'} Turn ON
                            </button>
                            <button
                                className="action-btn btn-off"
                                onClick={() => sendCommand('fertilization', false)}
                                disabled={loading.fertilization || !actuationState.fertilization}
                            >
                                {loading.fertilization ? '⏳' : '⏹️'} Turn OFF
                            </button>
                        </div>
                    )}

                    {controlMode.fertilization === 'auto' && (
                        <div className="auto-mode-info">
                            <span className="auto-icon">🤖</span>
                            <span>Auto mode: System will activate when NPK is low</span>
                            <span className="safety-note">⚠️ Blocked if wind {'>'} 20 km/h</span>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .command-center-card {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .card-header {
                    margin-bottom: 24px;
                }

                .card-header h3 {
                    font-size: 24px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 4px 0;
                }

                .subtitle {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .alert {
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                }

                .alert-error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #fca5a5;
                }

                .alert-success {
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    color: #86efac;
                }

                .control-section {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .control-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .control-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .control-icon {
                    font-size: 24px;
                }

                .control-title h4 {
                    font-size: 18px;
                    font-weight: 600;
                    color: #fff;
                    margin: 0;
                }

                .mode-toggle {
                    display: flex;
                    gap: 8px;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 4px;
                    border-radius: 8px;
                }

                .mode-btn {
                    padding: 6px 16px;
                    border: none;
                    border-radius: 6px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .mode-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                }

                .control-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 8px;
                }

                .led {
                    font-size: 24px;
                    filter: drop-shadow(0 0 8px currentColor);
                }

                .led-on {
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }

                .status-text {
                    font-size: 14px;
                    font-weight: 600;
                    color: #fff;
                }

                .action-buttons {
                    display: flex;
                    gap: 12px;
                }

                .action-btn {
                    flex: 1;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .btn-on {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: #fff;
                }

                .btn-on:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                }

                .btn-off {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: #fff;
                }

                .btn-off:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
                }

                .action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .auto-mode-info {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 12px;
                    background: rgba(102, 126, 234, 0.1);
                    border: 1px solid rgba(102, 126, 234, 0.3);
                    border-radius: 8px;
                    color: #a5b4fc;
                    font-size: 14px;
                }

                .auto-icon {
                    font-size: 20px;
                }

                .safety-note {
                    font-size: 12px;
                    color: #fbbf24;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};
