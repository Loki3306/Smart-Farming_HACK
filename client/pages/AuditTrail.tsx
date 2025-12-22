import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Copy, Check } from "lucide-react";
import { useFarmContext } from "../context/FarmContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export const AuditTrail: React.FC = () => {
  const { blockchainRecords, refreshBlockchain } = useFarmContext();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    refreshBlockchain();
  }, [refreshBlockchain]);

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case "irrigation":
        return "bg-blue-100 text-blue-700";
      case "fertilization":
        return "bg-emerald-100 text-emerald-700";
      case "sensor_reading":
        return "bg-purple-100 text-purple-700";
      case "autonomous_action":
        return "bg-amber-100 text-amber-700";
      case "system_status":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getActionTypeIcon = (actionType: string): string => {
    switch (actionType) {
      case "irrigation":
        return "💧";
      case "fertilization":
        return "🌱";
      case "sensor_reading":
        return "📊";
      case "autonomous_action":
        return "🤖";
      case "system_status":
        return "⚙️";
      default:
        return "📝";
    }
  };

  const copyToClipboard = (text: string, hash: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatActionType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-sage-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link to="/">
            <Button variant="ghost" className="gap-2 mb-4">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Blockchain Audit Trail
          </h1>
          <p className="text-muted-foreground text-lg">
            Immutable record of all system actions and decisions
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Records</div>
            <div className="text-3xl font-bold text-primary mt-2">
              {blockchainRecords.length}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Verified</div>
            <div className="text-3xl font-bold text-emerald-600 mt-2">
              {blockchainRecords.filter((r) => r.verified).length}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Last Block</div>
            <div className="text-lg font-bold text-foreground mt-2">
              #{blockchainRecords[0]?.blockNumber || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Integrity</div>
            <div className="text-3xl font-bold text-green-600 mt-2">100%</div>
          </Card>
        </div>

        {/* Audit Trail Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-white/30 backdrop-blur-sm">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Transaction Hash
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {blockchainRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-muted-foreground">
                        No audit records yet
                      </p>
                    </td>
                  </tr>
                ) : (
                  blockchainRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-white/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">
                        {record.timestamp.toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {getActionTypeIcon(record.actionType)}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getActionTypeColor(
                              record.actionType,
                            )}`}
                          >
                            {formatActionType(record.actionType)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        <div
                          className="max-w-xs truncate"
                          title={record.details}
                        >
                          {record.details}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">
                        {record.quantity ? (
                          <>
                            {record.quantity}
                            {record.unit && (
                              <span className="text-xs text-muted-foreground ml-1">
                                {record.unit}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-white/30 px-2 py-1 rounded font-mono text-foreground/80">
                            {record.transactionHash.substring(0, 12)}...
                          </code>
                          <button
                            onClick={() =>
                              copyToClipboard(record.transactionHash, record.id)
                            }
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            title="Copy hash"
                          >
                            {copiedHash === record.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {record.verified ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            ✓ Verified
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                            ⏳ Pending
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Info Box */}
        <Card className="p-6 bg-blue-50 border border-blue-200">
          <div className="flex gap-4">
            <div className="text-3xl">🔐</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Blockchain Verification
              </h3>
              <p className="text-blue-800 text-sm">
                All records are cryptographically verified and stored on an
                immutable ledger. Each action is timestamped and linked to the
                previous record, creating an unbreakable chain of custody for
                your farming operations.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
