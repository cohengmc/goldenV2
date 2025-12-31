import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { G, Path, Text, Circle } from 'react-native-svg';
import * as d3 from 'd3';
import { TrainingNode } from '../types';
import { Animated } from 'react-native';

interface SunburstChartProps {
  data: TrainingNode;
  onNodeClick: (node: any) => void;
  onNodeEdit: (node: any) => void;
  onAddChild: (parentId: string) => void;
}

interface HierarchyNode extends d3.HierarchyNode<any> {
  current?: any;
  target?: any;
  data: any;
}

export const SunburstChart: React.FC<SunburstChartProps> = ({ 
  data, 
  onNodeClick, 
  onNodeEdit, 
  onAddChild 
}) => {
  const [currentRootId, setCurrentRootId] = useState<string>('root');
  const [focusedNode, setFocusedNode] = useState<HierarchyNode | null>(null);
  const animationRef = useRef<Animated.Value>(new Animated.Value(0));

  const { width, height, radius, root, arc } = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = Math.min(700, screenWidth - 40);
    const chartHeight = chartWidth;
    const chartRadius = chartWidth / 6;

    const partition = (data: any): HierarchyNode => {
      const rootHierarchy = d3.hierarchy(data, (d: any) => {
        const children = d.children ? [...d.children] : [];
        if (d.level < 3) {
          children.push({
            id: `add-${d.id}`,
            name: '➕',
            color: '#ffffff',
            level: d.level + 1,
            value: 1,
            isAddButton: true,
            parentId: d.id
          } as any);
        }
        return children;
      })
      .sum((d: any) => d.children ? 0 : 1)
      .sort((a, b) => {
        if ((a.data as any).isAddButton) return 1;
        if ((b.data as any).isAddButton) return -1;
        return d3.ascending(a.data.id, b.data.id);
      });

      const partitioned = d3.partition()
        .size([2 * Math.PI, rootHierarchy.height + 1])(rootHierarchy) as HierarchyNode;
      
      partitioned.each((d: any) => {
        d.current = d;
      });

      return partitioned;
    };

    const rootNode = partition(data);
    const arcGenerator = d3.arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.01))
      .padRadius(chartRadius * 1.5)
      .innerRadius((d: any) => d.y0 * chartRadius)
      .outerRadius((d: any) => Math.max(d.y0 * chartRadius, d.y1 * chartRadius - 1));

    return {
      width: chartWidth,
      height: chartHeight,
      radius: chartRadius,
      root: rootNode,
      arc: arcGenerator,
    };
  }, [data]);

  useEffect(() => {
    if (focusedNode) {
      // Update target positions for animation
      root.each((d: any) => {
        d.target = {
          x0: Math.max(0, Math.min(1, (d.x0 - focusedNode.x0) / (focusedNode.x1 - focusedNode.x0))) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (d.x1 - focusedNode.x0) / (focusedNode.x1 - focusedNode.x0))) * 2 * Math.PI,
          y0: Math.max(0, d.y0 - focusedNode.depth),
          y1: Math.max(0, d.y1 - focusedNode.depth)
        };
      });

      // Animate
      Animated.timing(animationRef.current, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }).start(() => {
        // Update current positions after animation
        root.each((d: any) => {
          d.current = d.target;
        });
        animationRef.current.setValue(0);
      });
    }
  }, [focusedNode, root]);

  const focusOn = (node: HierarchyNode) => {
    setCurrentRootId(node.data.id);
    setFocusedNode(node);
  };

  const isEditable = (d: any, currentFocusId: string) => {
    return d.parent && d.parent.data.id === currentFocusId && !d.data.isAddButton;
  };

  const labelVisible = (d: any) => {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  };

  const labelTransform = (d: any) => {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    const rotation = x - 90;
    const translateX = y;
    const textRotation = x < 180 ? 0 : 180;
    return { rotation, translateX, textRotation };
  };

  const getArcPath = (d: any) => {
    const node = focusedNode ? d.target : d.current;
    if (!node) return '';
    try {
      return arc(node) || '';
    } catch (e) {
      return '';
    }
  };

  const descendants = root.descendants().slice(1) as HierarchyNode[];
  const parentNode = focusedNode?.parent || root;
  const centerText = focusedNode === root ? 'WHY' : (focusedNode?.data.name.split(' ')[0] || 'WHY');

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <G x={width / 2} y={height / 2}>
          {/* Parent circle (clickable center) */}
          <Circle
            r={radius}
            fill="white"
            fillOpacity={0.05}
            onPress={() => focusOn(root)}
          />

          {/* Central text */}
          <Text
            textAnchor="middle"
            dy="0.35em"
            fill="#1e293b"
            fontSize="24"
            fontWeight="bold"
          >
            {centerText}
          </Text>

          {/* Arc paths */}
          {descendants.map((d: any, i: number) => {
            const pathData = getArcPath(d);
            if (!pathData) return null;

            const isAddButton = d.data.isAddButton;
            const parentMatches = d.parent?.data.id === currentRootId;
            const fillOpacity = isAddButton 
              ? (parentMatches ? 0.3 : 0)
              : (d.children ? 1 : 0.7);
            const strokeOpacity = isAddButton && parentMatches ? 1 : 0;

            return (
              <G key={`path-${i}`}>
                <Path
                  d={pathData}
                  fill={isAddButton ? '#f8fafc' : d.data.color}
                  fillOpacity={fillOpacity}
                  stroke={isAddButton ? '#cbd5e1' : 'none'}
                  strokeDasharray={isAddButton ? '4,4' : 'none'}
                  strokeOpacity={strokeOpacity}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (isAddButton) {
                      onAddChild(d.data.parentId);
                    } else if (d.children && d.children.length > 0) {
                      focusOn(d);
                    } else {
                      onNodeClick(d);
                    }
                  }}
                />
              </G>
            );
          })}

          {/* Labels */}
          {descendants.map((d: any, i: number) => {
            const node = focusedNode ? d.target : d.current;
            if (!node) return null;

            const isAddButton = d.data.isAddButton;
            const parentMatches = d.parent?.data.id === currentRootId;
            const visible = isAddButton 
              ? parentMatches 
              : labelVisible(node);
            
            if (!visible) return null;

            const transform = labelTransform(node);
            const editable = isEditable(d, currentRootId);
            const labelText = isAddButton 
              ? '➕' 
              : (d.data.name + (editable ? ' ✏️' : ''));

            return (
              <G
                key={`label-${i}`}
                transform={`rotate(${transform.rotation}) translate(${transform.translateX}, 0) rotate(${transform.textRotation})`}
              >
                <Text
                  textAnchor="middle"
                  dy="0.35em"
                  fill={isAddButton ? '#94a3b8' : '#1e293b'}
                  fontSize={d.children ? 14 : 11}
                  onPress={() => {
                    if (isAddButton && parentMatches) {
                      onAddChild(d.data.parentId);
                    } else if (editable) {
                      onNodeEdit(d);
                    }
                  }}
                >
                  {labelText}
                </Text>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});

