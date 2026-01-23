/**
 * Regime Management Page
 * Main interface for viewing and managing 30-day farming plans
 * Users can create, update, and track regime tasks
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card,
  Button,
  Tabs,
  Badge,
  Empty,
  Spin,
  Modal,
  message,
  Drawer,
  Space,
  Statistic,
  Row,
  Col,
  Timeline,
  Progress,
} from 'antd';
import {
  CheckOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  HistoryOutlined,
  CalendarOutlined,
  BugOutlined,
} from '@ant-design/icons';

import RegimeList from '../components/regime/RegimeList';
import RegimeDetail from '../components/regime/RegimeDetail';
import RegimeForm from '../components/regime/RegimeForm';
import RegimeTimeline from '../components/regime/RegimeTimeline';
import { regimeService } from '../services/regimeService';

interface Regime {
  regime_id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  valid_from: string;
  valid_until: string;
  task_count: number;
  version: number;
  tasks: RegimeTask[];
}

interface RegimeTask {
  task_id: string;
  task_name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  priority: 'high' | 'medium' | 'low';
  timing_type: string;
  timing_value: number;
  timing_window_start?: string;
  timing_window_end?: string;
  confidence_score: number;
  farmer_notes?: string;
}

export default function RegimesPage() {
  const { regimeId } = useParams();
  const navigate = useNavigate();
  const [detailDrawer, setDetailDrawer] = useState(!!regimeId);
  const [formDrawer, setFormDrawer] = useState(false);
  const [selectedRegime, setSelectedRegime] = useState<Regime | null>(null);
  const [historyDrawer, setHistoryDrawer] = useState(false);

  // Fetch list of regimes
  const { data: regimes, isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: ['regimes'],
    queryFn: () => regimeService.getRegimes(),
    staleTime: 30000,
  });

  // Fetch selected regime details
  const { data: regimeDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['regime', regimeId],
    queryFn: () => regimeService.getRegime(regimeId!),
    enabled: !!regimeId && detailDrawer,
  });

  // Create regime mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => regimeService.createRegime(data),
    onSuccess: () => {
      message.success('Regime created successfully!');
      setFormDrawer(false);
      refetchList();
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to create regime');
    },
  });

  // Delete regime mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => regimeService.deleteRegime(id),
    onSuccess: () => {
      message.success('Regime archived successfully');
      refetchList();
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to archive regime');
    },
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({
      regimeId,
      taskId,
      status,
      notes,
    }: {
      regimeId: string;
      taskId: string;
      status: string;
      notes?: string;
    }) => regimeService.updateTaskStatus(regimeId, taskId, status, notes),
    onSuccess: () => {
      message.success('Task updated');
      if (regimeId) {
        // Refetch regime details
      }
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to update task');
    },
  });

  const handleDeleteRegime = (id: string) => {
    Modal.confirm({
      title: 'Archive Regime?',
      content: 'This will move the regime to archived status. Data will be preserved.',
      okText: 'Archive',
      cancelText: 'Cancel',
      onOk() {
        deleteMutation.mutate(id);
      },
    });
  };

  const handleExportRegime = (id: string) => {
    regimeService
      .exportRegime(id, 'pdf')
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `regime-${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentElement?.removeChild(link);
      })
      .catch((error) => {
        message.error(error.message || 'Failed to export regime');
      });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'green',
      completed: 'blue',
      archived: 'default',
    };
    return colors[status] || 'default';
  };

  const getTaskStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'default',
      in_progress: 'processing',
      completed: 'success',
      skipped: 'warning',
      failed: 'error',
    };
    return colors[status] || 'default';
  };

  if (listLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Farming Regimes</h1>
          <p className="text-gray-600 mt-2">
            View and manage your 30-day farming plans with multi-step tasks
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          onClick={() => setFormDrawer(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          + New Regime
        </Button>
      </div>

      {/* Stats */}
      {regimes && regimes.length > 0 && (
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Regimes"
                value={regimes.filter((r) => r.status === 'active').length}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Completed"
                value={regimes.filter((r) => r.status === 'completed').length}
                prefix={<CheckOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Tasks"
                value={regimes.reduce((sum, r) => sum + r.task_count, 0)}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Avg Confidence"
                value="92.5"
                suffix="%"
                precision={1}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Regimes List */}
      {!regimes || regimes.length === 0 ? (
        <Empty
          description="No regimes yet"
          style={{ marginTop: 48, marginBottom: 48 }}
        >
          <Button type="primary" onClick={() => setFormDrawer(true)}>
            Create First Regime
          </Button>
        </Empty>
      ) : (
        <div className="space-y-4">
          {regimes.map((regime) => (
            <Card
              key={regime.regime_id}
              hoverable
              className="cursor-pointer transition-shadow"
              onClick={() => {
                setSelectedRegime(regime);
                setDetailDrawer(true);
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {regime.name}
                    </h3>
                    <Badge color={getStatusColor(regime.status)} text={regime.status} />
                    <Badge
                      count={`v${regime.version}`}
                      style={{ backgroundColor: '#108ee9' }}
                    />
                  </div>
                  <p className="text-gray-600 mb-3">{regime.description}</p>
                  <div className="flex gap-6 text-sm text-gray-500">
                    <span>
                      <CalendarOutlined /> {regime.task_count} tasks
                    </span>
                    <span>
                      Valid until {new Date(regime.valid_until).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    icon={<DownloadOutlined />}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportRegime(regime.regime_id);
                    }}
                  />
                  <Button
                    icon={<HistoryOutlined />}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRegime(regime);
                      setHistoryDrawer(true);
                    }}
                  />
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRegime(regime.regime_id);
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Regime Drawer */}
      <Drawer
        title="Create New Regime"
        placement="right"
        onClose={() => setFormDrawer(false)}
        open={formDrawer}
        width={600}
      >
        <RegimeForm
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
      </Drawer>

      {/* Regime Detail Drawer */}
      <Drawer
        title={selectedRegime?.name}
        placement="right"
        onClose={() => {
          setDetailDrawer(false);
          setSelectedRegime(null);
        }}
        open={detailDrawer && !!selectedRegime}
        width={700}
      >
        {selectedRegime && (
          <RegimeDetail
            regime={selectedRegime}
            onTaskStatusChange={(taskId, status, notes) => {
              updateTaskMutation.mutate({
                regimeId: selectedRegime.regime_id,
                taskId,
                status,
                notes,
              });
            }}
            loading={updateTaskMutation.isPending}
          />
        )}
      </Drawer>

      {/* History Drawer */}
      <Drawer
        title={`${selectedRegime?.name} - Version History`}
        placement="right"
        onClose={() => setHistoryDrawer(false)}
        open={historyDrawer && !!selectedRegime}
        width={700}
      >
        {selectedRegime && (
          <RegimeTimeline regimeId={selectedRegime.regime_id} />
        )}
      </Drawer>
    </div>
  );
}
