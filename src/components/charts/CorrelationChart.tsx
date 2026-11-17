'use client';

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { CorrelationPoint } from '@/types/market';

interface Props {
  data: CorrelationPoint[];
  height?: number;
}

export const CorrelationChart: React.FC<Props> = ({ data, height = 75 }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const times = data.map((d) => d.time);
    const ewz = data.map((d) => d.indiceEwz);
    const dol = data.map((d) => d.indiceDolar);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: false,
      grid: {
        top: 6,
        left: 20,
        right: 15,
        bottom: 18,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0C1626',
        borderColor: '#1D3048',
        textStyle: { color: '#F0F4FA', fontSize: 9 },
        padding: 4,
      },
      xAxis: {
        type: 'category',
        data: times,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#1D3048' } },
        axisLabel: {
          color: '#8191A8',
          fontSize: 8,
          fontFamily: 'monospace',
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: -1.0,
        max: 1.0,
        splitLine: { lineStyle: { color: '#16253b', type: 'dashed' } },
        axisLabel: {
          color: '#8191A8',
          fontSize: 8,
          fontFamily: 'monospace',
          formatter: (v: number) => `${v.toFixed(1)}`,
        },
      },
      series: [
        {
          name: 'Índice × EWZ',
          type: 'line',
          data: ewz,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#42A5F5', width: 1.5 },
        },
        {
          name: 'Índice × Dólar',
          type: 'line',
          data: dol,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#FF4D5A', width: 1.5 },
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
};
