'use client';

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { CumulativeFlowPoint } from '@/types/market';

interface Props {
  data: CumulativeFlowPoint[];
  height?: number;
  title?: string;
  totalText?: string;
}

export const CumulativeFlowChart: React.FC<Props> = ({
  data,
  height = 95,
}) => {
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
    const totals = data.map((d) => d.total);
    const est = data.map((d) => d.estrangeiro);
    const ban = data.map((d) => d.bancos);
    const pf = data.map((d) => d.pessoaFisica);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: false,
      grid: {
        top: 6,
        left: 24,
        right: 10,
        bottom: 20,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0C1626',
        borderColor: '#1D3048',
        textStyle: { color: '#F0F4FA', fontSize: 10 },
        padding: 4,
      },
      xAxis: {
        type: 'category',
        data: times,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#1D3048' } },
        axisLabel: {
          color: '#8191A8',
          fontSize: 9,
          fontFamily: 'monospace',
          interval: 0,
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#16253b', type: 'dashed' } },
        axisLabel: {
          color: '#8191A8',
          fontSize: 8,
          fontFamily: 'monospace',
          formatter: (v: number) => `${v}`,
        },
      },
      series: [
        {
          name: 'Saldo Total',
          type: 'line',
          data: totals,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#F0F4FA', width: 1.5 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(240, 244, 250, 0.15)' },
              { offset: 1, color: 'rgba(240, 244, 250, 0.0)' },
            ]),
          },
        },
        {
          name: 'Estrangeiro',
          type: 'line',
          data: est,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#21D787', width: 1 },
        },
        {
          name: 'Bancos',
          type: 'line',
          data: ban,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#42A5F5', width: 1 },
        },
        {
          name: 'Pessoa Física',
          type: 'line',
          data: pf,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#FF4D5A', width: 1 },
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
