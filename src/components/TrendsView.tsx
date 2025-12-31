import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { G, Rect, Text as SvgText, Path, Circle } from 'react-native-svg';
import * as d3 from 'd3';
import { WorkoutLog, TrainingNode } from '../types';

interface TrendsViewProps {
  logs: WorkoutLog[];
  data: TrainingNode;
  colorMap: Record<string, string>;
}

type TimeRange = '1M' | '3M' | '1Y' | 'ALL';

export const TrendsView: React.FC<TrendsViewProps> = ({
  logs,
  data,
  colorMap,
}) => {
  const [range, setRange] = useState<TimeRange>('1M');

  // Filter logs based on range
  const filteredLogs = useMemo(() => {
    const now = new Date();
    let cutoff = new Date(0);

    if (range === '1M') {
      cutoff = new Date(now.setDate(now.getDate() - 31));
    } else if (range === '3M') {
      cutoff = new Date(now.setDate(now.getDate() - 90));
    } else if (range === '1Y') {
      cutoff = new Date(now.setDate(now.getDate() - 365));
    }

    return logs
      .filter((l) => new Date(l.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs, range]);

  // Aggregate data for Stacked Bar Chart
  const dailyData = useMemo(() => {
    const days: Record<string, any> = {};
    const allExIds = Array.from(new Set(logs.map((l) => l.nodeId)));

    filteredLogs.forEach((log) => {
      const d = new Date(log.date).toDateString();
      if (!days[d]) {
        days[d] = { date: new Date(log.date), total: 0 };
        allExIds.forEach((id) => (days[d][id] = 0));
      }
      days[d][log.nodeId] += log.value;
      days[d].total += log.value;
    });

    return Object.values(days).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [filteredLogs, logs]);

  // Aggregate data for Pie Chart
  const categoryData = useMemo(() => {
    const categories: Record<
      string,
      { name: string; value: number; color: string }
    > = {};

    // Use Level 1 nodes for high-level category grouping
    data.children?.forEach((cat) => {
      categories[cat.id] = {
        name: cat.name,
        value: 0,
        color: cat.color === '#e2e8f0' ? '#94a3b8' : cat.color,
      };
    });

    filteredLogs.forEach((log) => {
      const findParentCat = (node: TrainingNode, id: string): string | null => {
        if (node.children) {
          for (const child of node.children) {
            if (child.id === id) return node.id;
            const found = findParentCat(child, id);
            if (found) return found;
          }
        }
        return null;
      };

      data.children?.forEach((cat) => {
        if (findParentCat(cat, log.nodeId) || cat.id === log.nodeId) {
          categories[cat.id].value += log.value;
        }
      });
    });

    return Object.values(categories).filter((c) => c.value > 0);
  }, [filteredLogs, data]);

  const screenWidth = Dimensions.get('window').width;
  const barChartWidth = Math.min(800, screenWidth - 80);
  const barChartHeight = 400;
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };

  const pieChartWidth = 300;
  const pieChartHeight = 300;
  const pieRadius = Math.min(pieChartWidth, pieChartHeight) / 2;

  // Bar chart scales
  const xScale = d3
    .scaleBand()
    .domain(dailyData.map((d) => d.date.toDateString()))
    .range([margin.left, barChartWidth - margin.right])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(dailyData, (d) => d.total) || 10])
    .nice()
    .range([barChartHeight - margin.bottom, margin.top]);

  const stack = d3.stack().keys(Array.from(new Set(logs.map((l) => l.nodeId))));
  const series = stack(dailyData as any);

  // Pie chart
  const pie = d3
    .pie<any>()
    .value((d) => d.value)
    .sort(null);

  const arc = d3
    .arc()
    .innerRadius(pieRadius * 0.5)
    .outerRadius(pieRadius - 1);

  const labelArc = d3
    .arc()
    .innerRadius(pieRadius * 0.7)
    .outerRadius(pieRadius * 0.7);

  const pieData = pie(categoryData);

  const topCategory = categoryData.sort((a, b) => b.value - a.value)[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Training <Text style={styles.subtitle}>Insights</Text>
        </Text>
        <View style={styles.rangeSelector}>
          {(['1M', '3M', '1Y', 'ALL'] as TimeRange[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setRange(t)}
              style={[styles.rangeButton, range === t && styles.rangeButtonActive]}
            >
              <Text
                style={[
                  styles.rangeButtonText,
                  range === t && styles.rangeButtonTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.chartsContainer}>
        {/* Bar Chart */}
        <View style={styles.barChartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartHeaderText}>Exercise Intensity Heatmap</Text>
          </View>
          {filteredLogs.length > 0 ? (
            <Svg width={barChartWidth} height={barChartHeight}>
              <G>
                {series.map((s, i) => (
                  <G key={i} fill={colorMap[s.key] || '#cbd5e1'}>
                    {s.map((d: any, j: number) => {
                      const dateStr = d.data.date.toDateString();
                      const x = xScale(dateStr);
                      const y0 = yScale(d[0]);
                      const y1 = yScale(d[1]);
                      if (!x) return null;
                      return (
                        <Rect
                          key={j}
                          x={x}
                          y={y1}
                          width={xScale.bandwidth()}
                          height={y0 - y1}
                          rx={2}
                        />
                      );
                    })}
                  </G>
                ))}
              </G>
              {/* X Axis */}
              <G>
                {dailyData.map((d, i) => {
                  const dateStr = d.date.toDateString();
                  const x = xScale(dateStr);
                  if (!x) return null;
                  const shouldShowLabel =
                    d.date.getDate() === 1 || dailyData.length < 15;
                  return (
                    <SvgText
                      key={i}
                      x={(x || 0) + xScale.bandwidth() / 2}
                      y={barChartHeight - margin.bottom + 20}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight="bold"
                      fill="#94a3b8"
                    >
                      {shouldShowLabel
                        ? d.date.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : ''}
                    </SvgText>
                  );
                })}
              </G>
              {/* Y Axis */}
              <G>
                {yScale.ticks(5).map((tick, i) => (
                  <G key={i}>
                    <SvgText
                      x={margin.left - 10}
                      y={yScale(tick)}
                      textAnchor="end"
                      fontSize={10}
                      fontWeight="bold"
                      fill="#94a3b8"
                    >
                      {tick}
                    </SvgText>
                  </G>
                ))}
              </G>
            </Svg>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No data for this range.</Text>
            </View>
          )}
        </View>

        {/* Pie Chart and Stats */}
        <View style={styles.sidePanel}>
          <View style={styles.pieChartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartHeaderText}>Category Balance</Text>
            </View>
            {categoryData.length > 0 ? (
              <Svg
                width={pieChartWidth}
                height={pieChartHeight}
                viewBox={`${-pieChartWidth / 2} ${-pieChartHeight / 2} ${pieChartWidth} ${pieChartHeight}`}
              >
                <G>
                  {pieData.map((d, i) => {
                    const arcPath = arc(d as any);
                    if (!arcPath) return null;
                    const [x, y] = labelArc.centroid(d as any);
                    return (
                      <G key={i}>
                        <Path
                          d={arcPath}
                          fill={d.data.color}
                          stroke="white"
                          strokeWidth={2}
                        />
                        {d.data.value > 0 && (
                          <SvgText
                            x={x}
                            y={y}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight="bold"
                            fill="white"
                          >
                            {d.data.name.split(' ')[1] || d.data.name}
                          </SvgText>
                        )}
                      </G>
                    );
                  })}
                </G>
              </Svg>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Log workouts to see pie.</Text>
              </View>
            )}
            <View style={styles.categoryList}>
              {categoryData.map((cat) => (
                <View key={cat.name} style={styles.categoryItem}>
                  <View
                    style={[styles.categoryDot, { backgroundColor: cat.color }]}
                  />
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryValue}>{cat.value} pts</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Insight</Text>
            <Text style={styles.insightTitle}>Consistency is Key</Text>
            <Text style={styles.insightText}>
              Your most trained category in this period is{' '}
              <Text style={styles.insightHighlight}>
                {topCategory?.name || 'N/A'}
              </Text>
              . Keep up the balance!
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    color: '#cbd5e1',
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 4,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rangeButtonActive: {
    backgroundColor: 'white',
  },
  rangeButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  rangeButtonTextActive: {
    color: '#1e293b',
  },
  chartsContainer: {
    gap: 24,
  },
  barChartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#1e293b',
    padding: 24,
    minHeight: 450,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyChart: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  sidePanel: {
    gap: 24,
  },
  pieChartContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#1e293b',
    padding: 24,
    alignItems: 'center',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    width: '100%',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flex: 1,
    minWidth: '45%',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  insightCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  insightHighlight: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
});

