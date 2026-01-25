/**
 * Calendar View Component for Regime Tasks
 * Displays regime tasks in a monthly calendar format
 * Supports clicking on days to view/edit tasks
 */

import React, { useState } from 'react';
import { Calendar, Badge, Modal, Card, Tag, Button, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';

interface RegimeTask {
  task_id: string;
  task_name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  priority: 'high' | 'medium' | 'low';
  timing_window_start?: string;
  timing_window_end?: string;
  confidence_score: number;
  farmer_notes?: string;
  task_type: string;
}

interface RegimeCalendarViewProps {
  tasks: RegimeTask[];
  onTaskClick: (task: RegimeTask) => void;
  onDateClick: (date: Dayjs) => void;
}

export default function RegimeCalendarView({
  tasks,
  onTaskClick,
  onDateClick,
}: RegimeCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<RegimeTask[]>([]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Dayjs): RegimeTask[] => {
    return tasks.filter((task) => {
      if (!task.timing_window_start) return false;
      
      const taskDate = dayjs(task.timing_window_start);
      return taskDate.isSame(date, 'day');
    });
  };

  // Get badge status for calendar cell
  const getDateCellRender = (value: Dayjs) => {
    const dateTasks = getTasksForDate(value);
    if (dateTasks.length === 0) return null;

    const completed = dateTasks.filter(t => t.status === 'completed').length;
    const pending = dateTasks.filter(t => t.status === 'pending').length;
    const inProgress = dateTasks.filter(t => t.status === 'in_progress').length;
    const highPriority = dateTasks.filter(t => t.priority === 'high').length;

    return (
      <div className="flex flex-col gap-1 p-1">
        {completed > 0 && (
          <Badge
            status="success"
            text={`${completed} completed`}
            className="text-xs"
          />
        )}
        {inProgress > 0 && (
          <Badge
            status="processing"
            text={`${inProgress} in progress`}
            className="text-xs"
          />
        )}
        {pending > 0 && (
          <Badge
            status="default"
            text={`${pending} pending`}
            className="text-xs"
          />
        )}
        {highPriority > 0 && (
          <Tag color="red" className="text-xs">
            {highPriority} urgent
          </Tag>
        )}
      </div>
    );
  };

  // Handle date selection
  const onSelect = (date: Dayjs) => {
    const dateTasks = getTasksForDate(date);
    setSelectedDate(date);
    if (dateTasks.length > 0) {
      setSelectedTasks(dateTasks);
      setModalVisible(true);
    } else {
      onDateClick(date);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'in_progress':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <WarningOutlined style={{ color: '#faad14' }} />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg p-4">
        <Calendar
          fullscreen={true}
          cellRender={getDateCellRender}
          onSelect={onSelect}
        />
      </div>

      <Modal
        title={
          <div className="flex items-center justify-between">
            <span>Tasks for {selectedDate.format('MMMM D, YYYY')}</span>
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={() => {
                setModalVisible(false);
                onDateClick(selectedDate);
              }}
            >
              Add Task
            </Button>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <div className="space-y-3">
          {selectedTasks.map((task) => (
            <Card
              key={task.task_id}
              size="small"
              hoverable
              onClick={() => {
                onTaskClick(task);
                setModalVisible(false);
              }}
              className="cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(task.status)}
                    <h4 className="font-semibold mb-0">{task.task_name}</h4>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {task.description}
                  </p>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag color={getPriorityColor(task.priority)}>
                      {task.priority.toUpperCase()}
                    </Tag>
                    <Tag>{task.status.replace('_', ' ').toUpperCase()}</Tag>
                    <Tooltip title="Confidence Score">
                      <Tag color="blue">{task.confidence_score.toFixed(0)}%</Tag>
                    </Tooltip>
                    {task.timing_window_end && (
                      <Tag color="purple">
                        Due: {dayjs(task.timing_window_end).format('MMM D')}
                      </Tag>
                    )}
                  </div>
                  
                  {task.farmer_notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <strong>Notes:</strong> {task.farmer_notes}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </>
  );
}
