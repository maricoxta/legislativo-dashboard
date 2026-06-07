const PALETTE = [
  '#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ef4444',
  '#06b6d4','#ec4899','#84cc16','#f97316','#6366f1',
  '#14b8a6','#a855f7','#eab308','#10b981','#64748b',
];

let areaChart = null;
let statusChart = null;
let trendChart = null;

export function initAreaChart(canvasId, labels, values) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (areaChart) areaChart.destroy();

  areaChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: PALETTE.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 14, font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} proposições`
          }
        }
      }
    }
  });
  return areaChart;
}

export function initStatusChart(canvasId, labels, values) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (statusChart) statusChart.destroy();

  const colors = labels.map(l => {
    const lo = l.toLowerCase();
    if (lo.includes('tramit')) return '#3b82f6';
    if (lo.includes('aprovad') || lo.includes('lei')) return '#22c55e';
    if (lo.includes('arquivad') || lo.includes('retirad')) return '#9ca3af';
    if (lo.includes('vetad')) return '#f59e0b';
    if (lo.includes('prejudicad')) return '#ef4444';
    return '#6366f1';
  });

  statusChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.parsed.x} proposições` }
        }
      },
      scales: {
        x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
  return statusChart;
}

export function initTrendChart(canvasId, labels, datasets) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        ...ds,
        borderColor: PALETTE[i],
        backgroundColor: PALETTE[i] + '22',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
      },
      scales: {
        x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } },
        y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, stepSize: 1 } }
      },
      interaction: { mode: 'index', intersect: false }
    }
  });
  return trendChart;
}

export function destroyAllCharts() {
  [areaChart, statusChart, trendChart].forEach(c => c && c.destroy());
  areaChart = statusChart = trendChart = null;
}
