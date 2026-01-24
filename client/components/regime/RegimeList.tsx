/**
 * Regime List Component
 * Displays regimes in a filterable/sortable list or card view
 */

import React, { useState } from 'react';
import { Input, Select, Button, Space, List, Empty } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';

interface RegimeListProps {
  regimes: any[];
  onSelectRegime: (regime: any) => void;
  onCreateRegime: () => void;
  loading?: boolean;
}

export default function RegimeList({
  regimes,
  onSelectRegime,
  onCreateRegime,
  loading = false,
}: RegimeListProps) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = regimes.filter((regime) => {
    const matchesSearch =
      regime.name.toLowerCase().includes(searchText.toLowerCase()) ||
      regime.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || regime.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Space>
        <Input
          placeholder="Search regimes..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
        <Select
          placeholder="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 150 }}
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Completed', value: 'completed' },
            { label: 'Archived', value: 'archived' },
          ]}
        />
        <Button type="primary" onClick={onCreateRegime}>
          + New Regime
        </Button>
      </Space>

      {/* List */}
      {filtered.length === 0 ? (
        <Empty description="No regimes found" />
      ) : (
        <List
          dataSource={filtered}
          loading={loading}
          renderItem={(regime) => (
            <List.Item
              onClick={() => onSelectRegime(regime)}
              className="cursor-pointer hover:bg-gray-50 px-4 py-3 rounded transition"
            >
              <List.Item.Meta
                title={regime.name}
                description={regime.description}
              />
              <span className="text-gray-500">{regime.task_count} tasks</span>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
