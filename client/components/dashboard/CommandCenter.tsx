import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';

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

    return (
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    <span>🎛️</span> Control Center
                </h3>
                <p className="text-sm text-slate-400">Hybrid Manual/Auto Control</p>
            </div>

            <div className="p-6 space-y-4">
                {/* Alerts */}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        <span className="text-xl">🚫</span>
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                        <span className="text-xl">✅</span>
                        <span className="text-sm">{success}</span>
                    </div>
                )}

                {/* Irrigation Control */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">💧</span>
                            <h4 className="text-lg font-semibold text-white">Irrigation System</h4>
                        </div>
                        <div className="flex gap-2 bg-black/30 p-1 rounded-lg">
                            <button
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${controlMode.irrigation === 'manual'
                                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                                        : 'text-white/60 hover:text-white/80'
                                    }`}
                                onClick={() => setControlMode(prev => ({ ...prev, irrigation: 'manual' }))}
                            >
                                Manual
                            </button>
                            <button
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${controlMode.irrigation === 'auto'
                                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                                        : 'text-white/60 hover:text-white/80'
                                    }`}
                                onClick={() => setControlMode(prev => ({ ...prev, irrigation: 'auto' }))}
                            >
                                Auto
                            </button>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                        <span className={`text-2xl ${actuationState.irrigation ? 'animate-pulse' : ''}`}>
                            {actuationState.irrigation ? '🟢' : '⚫'}
                        </span>
                        <span className="font-semibold text-white">
                            {actuationState.irrigation ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    </div>

                    {/* Manual Controls */}
                    {controlMode.irrigation === 'manual' && (
                        <div className="flex gap-3">
                            <button
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                onClick={() => sendCommand('irrigation', true)}
                                disabled={loading.irrigation || actuationState.irrigation}
                            >
                                {loading.irrigation ? '⏳' : '▶️'} Turn ON
                            </button>
                            <button
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                onClick={() => sendCommand('irrigation', false)}
                                disabled={loading.irrigation || !actuationState.irrigation}
                            >
                                {loading.irrigation ? '⏳' : '⏹️'} Turn OFF
                            </button>
                        </div>
                    )}

                    {/* Auto Mode Info */}
                    {controlMode.irrigation === 'auto' && (
                        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <div className="flex items-center gap-2 text-purple-300">
                                <span className="text-xl">🤖</span>
                                <span className="text-sm">Auto mode: System will activate when moisture &lt; 35%</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Fertilization Control */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🌿</span>
                            <h4 className="text-lg font-semibold text-white">Fertilization System</h4>
                        </div>
                        <div className="flex gap-2 bg-black/30 p-1 rounded-lg">
                            <button
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${controlMode.fertilization === 'manual'
                                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                                        : 'text-white/60 hover:text-white/80'
                                    }`}
                                onClick={() => setControlMode(prev => ({ ...prev, fertilization: 'manual' }))}
                            >
                                Manual
                            </button>
                            <button
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${controlMode.fertilization === 'auto'
                                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                                        : 'text-white/60 hover:text-white/80'
                                    }`}
                                onClick={() => setControlMode(prev => ({ ...prev, fertilization: 'auto' }))}
                            >
                                Auto
                            </button>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                        <span className={`text-2xl ${actuationState.fertilization ? 'animate-pulse' : ''}`}>
                            {actuationState.fertilization ? '🟢' : '⚫'}
                        </span>
                        <span className="font-semibold text-white">
                            {actuationState.fertilization ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    </div>

                    {/* Manual Controls */}
                    {controlMode.fertilization === 'manual' && (
                        <div className="flex gap-3">
                            <button
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                onClick={() => sendCommand('fertilization', true)}
                                disabled={loading.fertilization || actuationState.fertilization}
                            >
                                {loading.fertilization ? '⏳' : '▶️'} Turn ON
                            </button>
                            <button
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                onClick={() => sendCommand('fertilization', false)}
                                disabled={loading.fertilization || !actuationState.fertilization}
                            >
                                {loading.fertilization ? '⏳' : '⏹️'} Turn OFF
                            </button>
                        </div>
                    )}

                    {/* Auto Mode Info */}
                    {controlMode.fertilization === 'auto' && (
                        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-purple-300">
                                <span className="text-xl">🤖</span>
                                <span className="text-sm">Auto mode: System will activate when NPK is low</span>
                            </div>
                            <div className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                                <span>⚠️</span>
                                <span>Blocked if wind &gt; 20 km/h</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
