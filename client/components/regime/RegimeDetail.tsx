/**
 * Regime Detail Component
 * Shows all tasks for a regime with ability to update task status
 * Displays confidence scores, timing windows, farmer notes
 */

import React, { useState } from 'react';
import {
  List,
  Card,
  Button,
  Modal,
  Input,
  Select,
  Tag,
  Progress,
  Space,
  Empty,
  Collapse,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';

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
  quantity?: number;
}

interface RegimeDetailProps {
  regime: {
    regime_id: string;
    name: string;
    description: string;
    status: string;
    tasks: RegimeTask[];
    task_count: number;
    version: number;
    valid_until: string;
  };
  onTaskStatusChange: (taskId: string, status: string, notes?: string) => void;
  loading?: boolean;
}

export default function RegimeDetail({
  regime,
  onTaskStatusChange,
  loading = false,
}: RegimeDetailProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  if (!regime.tasks || regime.tasks.length === 0) {
    return <Empty description="No tasks in this regime" />;
  }

  // Calculate stats
  const completedCount = regime.tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = regime.tasks.filter((t) => t.status === 'in_progress').length;
  const avgConfidence =
    regime.tasks.reduce((sum, t) => sum + t.confidence_score, 0) / regime.tasks.length;

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      completed: <CheckCircleOutlined className="text-green-500" />,
      in_progress: <ClockCircleOutlined className="text-blue-500" />,
      pending: <ClockCircleOutlined className="text-gray-400" />,
      failed: <ExclamationCircleOutlined className="text-red-500" />,
      skipped: <ExclamationCircleOutlined className="text-yellow-500" />,
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'red',
      medium: 'orange',
      low: 'green',
    };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'green',
      in_progress: 'blue',
      pending: 'default',
      failed: 'red',
      skipped: 'orange',
    };
    return colors[status] || 'default';
  };

  const handleEditTask = (task: RegimeTask) => {
    setEditingTaskId(task.task_id);
    setEditStatus(task.status);
    setEditNotes(task.farmer_notes || '');
  };

  const handleSaveTask = () => {
    if (editingTaskId) {
      onTaskStatusChange(editingTaskId, editStatus, editNotes);
      setEditingTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Statistic
            title="Progress"
            value={(completedCount / regime.tasks.length) * 100}
            suffix="%"
            precision={0}
          />
          <Progress
            percent={(completedCount / regime.tasks.length) * 100}
            status={completedCount === regime.tasks.length ? 'success' : 'active'}
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title="Completed Tasks"
            value={`${completedCount}/${regime.tasks.length}`}
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="In Progress" value={inProgressCount} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title="Avg Confidence"
            value={avgConfidence.toFixed(1)}
            suffix="%"
          />
        </Col>
      </Row>

      {/* Tasks List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>

        {regime.tasks.map((task) => (
          <Card
            key={task.task_id}
            className="hover:shadow-md transition"
            style={{
              borderLeft: `4px solid ${
                getStatusColor(task.status) === 'green'
                  ? '#52c41a'
                  : getStatusColor(task.status) === 'blue'
                    ? '#1890ff'
                    : '#d9d9d9'
              }`,
            }}
          >
            {editingTaskId === task.task_id ? (
              // Edit mode
              <div className="space-y-4">
                <h4 className="font-semibold">{task.task_name}</h4>
                <p className="text-gray-600 text-sm">{task.description}</p>

                <Select
                  value={editStatus}
                  onChange={setEditStatus}
                  style={{ width: '100%' }}
                  options={[
                    { label: 'Pending', value: 'pending' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Skipped', value: 'skipped' },
                    { label: 'Failed', value: 'failed' },
                  ]}
                />

                <Input.TextArea
                  placeholder="Add farmer notes..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                />

                <Space>
                  <Button
                    type="primary"
                    onClick={handleSaveTask}
                    loading={loading}
                  >
                    Save
                  </Button>
                  <Button onClick={() => setEditingTaskId(null)}>Cancel</Button>
                </Space>
              </div>
            ) : (
              // View mode
              <>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      {task.task_name}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                  </div>
                  <Button
                    icon={<EditOutlined />}
                    type="text"
                    size="small"
                    onClick={() => handleEditTask(task)}
                  />
                </div>

                <div className="flex flex-wrap gap-3 items-center text-sm">
                  <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                  <Tag color={getPriorityColor(task.priority)}>
                    {task.priority} priority
                  </Tag>
                  <span className="text-gray-500">
                    📅 Day {task.timing_value}{' '}
                    {task.timing_type && `(${task.timing_type})`}
                  </span>
                  <span className="text-gray-500">
                    📊 Confidence: {task.confidence_score}%
                  </span>
                  {task.quantity && (
                    <span className="text-gray-500">📦 Qty: {task.quantity}</span>
                  )}
                </div>

                {task.farmer_notes && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-gray-700">
                    <strong>Notes:</strong> {task.farmer_notes}
                  </div>
                )}

                {task.timing_window_start && (
                  <div className="mt-2 text-xs text-gray-500">
                    Window: {new Date(task.timing_window_start).toLocaleDateString()} -{' '}
                    {new Date(task.timing_window_end!).toLocaleDateString()}
                  </div>
                )}
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
