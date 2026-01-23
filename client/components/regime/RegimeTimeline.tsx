/**
 * Regime Timeline Component
 * Displays regime version history with changes summary and timestamps
 */

import React from 'react';
import { Timeline, Empty, Spin, Card, Row, Col, Tag, Statistic } from 'antd';
import { CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { regimeService } from '../../services/regimeService';

interface RegimeTimelineProps {
  regimeId: string;
}

export default function RegimeTimeline({ regimeId }: RegimeTimelineProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['regime-history', regimeId],
    queryFn: () => regimeService.getRegimeHistory(regimeId),
  });

  if (isLoading) {
    return <Spin />;
  }

  if (!history || history.versions.length === 0) {
    return <Empty description="No version history" />;
  }

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Current Version"
              value={history.current_version}
              prefix={<EditOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Total Versions"
              value={history.versions.length}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Version Timeline</h3>
        <Timeline
          items={history.versions.map((version: any) => ({
            dot:
              version.version_number === history.current_version ? (
                <EditOutlined className="timeline-icon" />
              ) : (
                <CheckCircleOutlined className="timeline-icon" />
              ),
            children: (
              <Card
                size="small"
                className="ml-4"
                style={{
                  borderLeft:
                    version.version_number === history.current_version
                      ? '2px solid #1890ff'
                      : '2px solid #d9d9d9',
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Version {version.version_number}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {version.changes_summary}
                    </p>
                  </div>
                  <Tag
                    color={
                      version.trigger_type === 'creation'
                        ? 'green'
                        : version.trigger_type === 'update'
                          ? 'blue'
                          : 'orange'
                    }
                  >
                    {version.trigger_type}
                  </Tag>
                </div>

                <div className="text-xs text-gray-500">
                  Created: {new Date(version.created_at).toLocaleString()}
                </div>

                {version.tasks_snapshot && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      📋 {Object.keys(version.tasks_snapshot).length} tasks in this
                      version
                    </p>
                  </div>
                )}
              </Card>
            ),
          }))}
        />
      </div>
    </div>
  );
}
