"use client";

import { Box, Typography } from "@mui/material";
import { tokens } from "@/lib/theme";

/**
 * Adapted from a reference video (Wealthstein's "How It Flows" section) -
 * multiple weighted input factors, each on its own curved path, converge
 * into a central engine node, which flows on to a single decision output.
 * The video used this to show a credit-scoring engine; the same visual
 * shape maps naturally onto Radar's own multi-signal trust model for
 * businesses, and onto the multi-tier earning structure for affiliates.
 *
 * Dots animate along each path using SVG's native <animateMotion> -
 * declarative, no JS animation loop or state needed, runs continuously
 * on loop.
 *
 * @param {{percent: string, label: string}[]} nodes - left-side weighted inputs, top to bottom
 * @param {string} engineLabel - center node label
 * @param {string} decisionLabel - right-side output node label
 */
export default function ConvergingFlowDiagram({ nodes, engineLabel, decisionLabel }) {
  const width = 640;
  const height = 260;
  const nodeX = 90;
  const engineX = 340;
  const decisionX = 560;
  const centerY = height / 2;
  const spacing = height / (nodes.length + 1);

  const nodePositions = nodes.map((_, i) => ({ x: nodeX, y: spacing * (i + 1) }));

  function pathFor(pos) {
    // A smooth curve from each input node into the engine's left edge.
    const midX = (pos.x + engineX) / 2;
    return `M ${pos.x} ${pos.y} C ${midX} ${pos.y}, ${midX} ${centerY}, ${engineX - 28} ${centerY}`;
  }

  return (
    <Box
      sx={{
        bgcolor: tokens.canvas,
        borderRadius: 3,
        p: { xs: 2, md: 4 },
        overflowX: "auto",
      }}
    >
      <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: "100%", height: "auto", minWidth: 480, display: "block" }}>
        {/* Connecting paths, input -> engine */}
        {nodePositions.map((pos, i) => (
          <path key={`path-${i}`} id={`flow-path-${i}`} d={pathFor(pos)} fill="none" stroke={tokens.border} strokeWidth="1.5" />
        ))}

        {/* Engine -> decision path */}
        <path
          id="flow-path-out"
          d={`M ${engineX + 28} ${centerY} L ${decisionX - 26} ${centerY}`}
          fill="none"
          stroke={tokens.border}
          strokeWidth="1.5"
        />

        {/* Animated dots flowing along each input path, staggered so they don't all arrive at once */}
        {nodePositions.map((_, i) => (
          <circle key={`dot-${i}`} r="4" fill={tokens.brand}>
            <animateMotion dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite">
              <mpath href={`#flow-path-${i}`} />
            </animateMotion>
          </circle>
        ))}

        {/* Dot flowing from engine to decision */}
        <circle r="4" fill={tokens.ink}>
          <animateMotion dur="1.2s" begin="1.6s" repeatCount="indefinite">
            <mpath href="#flow-path-out" />
          </animateMotion>
        </circle>

        {/* Input nodes - percentage + label */}
        {nodePositions.map((pos, i) => (
          <g key={`input-${i}`}>
            <circle cx={pos.x} cy={pos.y} r="26" fill={tokens.paper} stroke={tokens.border} strokeWidth="1.5" />
            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={tokens.ink}>
              {nodes[i].percent}
            </text>
            <text x={pos.x + 34} y={pos.y + 4} fontSize="11" fill={tokens.muted}>
              {nodes[i].label}
            </text>
          </g>
        ))}

        {/* Engine node */}
        <circle cx={engineX} cy={centerY} r="30" fill={tokens.brand} />
        <text x={engineX} y={centerY + 45} textAnchor="middle" fontSize="12" fontWeight="700" fill={tokens.ink}>
          {engineLabel}
        </text>

        {/* Decision node */}
        <circle cx={decisionX} cy={centerY} r="26" fill={tokens.ink} />
        <text x={decisionX} y={centerY + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={tokens.paper}>
          DECISION
        </text>
        <text x={decisionX} y={centerY + 45} textAnchor="middle" fontSize="12" fontWeight="700" fill={tokens.ink}>
          {decisionLabel}
        </text>
      </Box>
    </Box>
  );
}
