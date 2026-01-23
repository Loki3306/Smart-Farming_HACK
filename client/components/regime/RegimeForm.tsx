/**
 * Regime Form Component
 * Create new regime by selecting crop type, weather data, and initial recommendations
 * Interfaces with RegimeService to generate multi-step tasks
 */

import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Card,
  Alert,
  DatePicker,
  Slider,
  Row,
  Col,
  Spin,
} from 'antd';
import { SmileOutlined, FrownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface RegimeFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
}

export default function RegimeForm({
  onSubmit,
  loading = false,
  initialData,
}: RegimeFormProps) {
  const [form] = Form.useForm();
  const [cropType, setCropType] = useState<string>(initialData?.crop_type || '');
  const [showWeather, setShowWeather] = useState(false);

  const CROP_TYPES = [
    'rice',
    'wheat',
    'cotton',
    'sugarcane',
    'corn',
    'potato',
    'tomato',
    'onion',
    'groundnut',
    'soybean',
  ];

  const CROP_STAGES = [
    { label: 'Seedling', value: 'seedling' },
    { label: 'Vegetative', value: 'vegetative' },
    { label: 'Flowering', value: 'flowering' },
    { label: 'Fruiting', value: 'fruiting' },
    { label: 'Maturity', value: 'maturity' },
  ];

  const handleSubmit = (values: any) => {
    const data = {
      ...values,
      sowing_date: values.sowing_date
        ? values.sowing_date.toISOString()
        : undefined,
      crop_type: cropType,
    };
    onSubmit(data);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialData}
    >
      <Spin spinning={loading}>
        {/* Crop Selection */}
        <Form.Item
          label="Crop Type *"
          required
          tooltip="Select the primary crop for this regime"
        >
          <Select
            placeholder="Select crop type..."
            value={cropType}
            onChange={setCropType}
            options={CROP_TYPES.map((crop) => ({
              label: crop.charAt(0).toUpperCase() + crop.slice(1),
              value: crop,
            }))}
          />
        </Form.Item>

        {cropType && (
          <>
            {/* Regime Details */}
            <Card className="mb-6" title="Regime Details">
              <Form.Item
                name="regime_name"
                label="Regime Name *"
                rules={[{ required: true, message: 'Please enter regime name' }]}
              >
                <Input placeholder="e.g., Rice Growing Season 2026" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                rules={[{ max: 500 }]}
              >
                <Input.TextArea
                  placeholder="Describe the farming plan objectives..."
                  rows={3}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="crop_stage"
                    label="Current Crop Stage *"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="Select stage..." options={CROP_STAGES} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="sowing_date"
                    label="Sowing Date"
                    tooltip="When the crop was sown"
                  >
                    <DatePicker />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="regime_validity_days"
                label="Regime Validity (days)"
                tooltip="How long this regime plan is valid"
                initialValue={30}
              >
                <InputNumber min={7} max={90} />
              </Form.Item>
            </Card>

            {/* Weather Data */}
            <Card
              className="mb-6"
              title="Current Weather Conditions"
              extra={
                <Button
                  type="text"
                  size="small"
                  onClick={() => setShowWeather(!showWeather)}
                >
                  {showWeather ? 'Hide' : 'Show'}
                </Button>
              }
            >
              {showWeather && (
                <div className="space-y-4">
                  <Alert
                    message="Weather data helps adjust task timing and confidence scores"
                    type="info"
                    showIcon
                    className="mb-4"
                  />

                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="temperature"
                        label="Temperature (°C)"
                        tooltip="Current ambient temperature"
                      >
                        <InputNumber
                          placeholder="e.g., 28"
                          min={-50}
                          max={50}
                          step={0.1}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="humidity"
                        label="Humidity (%)"
                        tooltip="Current air humidity level"
                      >
                        <Slider min={0} max={100} marks={{ 0: '0%', 100: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="rainfall"
                        label="Recent Rainfall (mm)"
                        tooltip="Rainfall in last 7 days"
                      >
                        <InputNumber placeholder="e.g., 15" min={0} step={0.1} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}
            </Card>

            {/* Recommendations */}
            <Card className="mb-6" title="Initial Recommendations">
              <Alert
                message="These recommendations will be expanded into multi-step tasks"
                type="success"
                showIcon
                className="mb-4"
              />

              <Form.Item
                name="recommendations"
                label="AI Recommendations *"
                rules={[
                  {
                    required: true,
                    message: 'At least one recommendation is required',
                  },
                  {
                    validator: (_, value) => {
                      if (!value || value.length === 0) {
                        return Promise.reject(
                          new Error('Please add recommendations')
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select recommendations from AI analysis..."
                  options={[
                    { label: 'Schedule irrigation', value: 'irrigation' },
                    { label: 'Apply fertilizer', value: 'fertilizer' },
                    { label: 'Pest management', value: 'pest' },
                    { label: 'Weed control', value: 'weed' },
                    { label: 'Disease prevention', value: 'disease' },
                    { label: 'Soil treatment', value: 'soil' },
                  ]}
                />
              </Form.Item>
            </Card>

            {/* Submit */}
            <div className="flex justify-between">
              <Button type="default" onClick={() => form.resetFields()}>
                Reset
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                Generate Regime Plan
              </Button>
            </div>
          </>
        )}
      </Spin>
    </Form>
  );
}
