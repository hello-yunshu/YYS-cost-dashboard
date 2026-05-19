import { loadFonts } from './fontLoader';
import { renderCharts } from './chartRenderer';
import {
  getProfitRateOption,
  getProfitAmountOption,
  getConfirmRateOption,
  getExpenseOption,
  getCostDonutOption,
  getProfitTrendOption,
  getProfitAmountTrendOption,
  getBranchTrendOption,
  getRevenueCostTrendOption,
  getCollectionTrendOption,
  getCostCompositionOption,
  getBranchRadarOption,
  getBranchScatterOption,
} from './reportCharts';
import { formatPercent, formatCurrency } from './format';

const COLORS = {
  primary: '#1e40af',
  success: '#dc2626',
  danger: '#10b981',
  warning: '#f59e0b',
  textDark: '#0f172a',
  textMedium: '#475569',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  bgGray: '#f8fafc',
  headerBg: '#1e293b',
  headerText: '#ffffff',
};

function profitRateColor(rate) {
  if (rate >= 0.05) return COLORS.success;
  if (rate >= 0) return COLORS.warning;
  return COLORS.danger;
}

function profitColor(val) {
  return val >= 0 ? COLORS.success : COLORS.danger;
}

function buildAnalysisBlock(title, items) {
  if (!items || items.length === 0) return [];
  return [
    { text: title, style: 'sectionTitle', margin: [0, 12, 0, 4] },
    {
      ul: items.map((item) => ({
        text: item,
        fontSize: 9,
        color: COLORS.textMedium,
        lineHeight: 1.5,
      })),
      margin: [8, 0, 0, 8],
    },
  ];
}

function analyzeMonthlyData(summary, branches) {
  const items = [];
  const rate = summary.currentProfitRate;
  const expected = summary.expectedProfitRate;
  const diff = rate - expected;

  if (rate >= 0.05) {
    items.push(`当前利润率 ${formatPercent(rate)}，达到预期目标（≥5%），整体经营状况良好。`);
  } else if (rate >= 0) {
    items.push(`当前利润率 ${formatPercent(rate)}，低于5%目标线，需关注成本控制。`);
  } else {
    items.push(`当前利润率 ${formatPercent(rate)}，处于亏损状态，需立即分析原因并采取措施。`);
  }

  if (Math.abs(diff) > 0.01) {
    const direction = diff > 0 ? '高于' : '低于';
    items.push(`当前利润率${direction}预期 ${formatPercent(Math.abs(diff))}，${diff > 0 ? '表现优于预期' : '存在改善空间'}。`);
  }

  const aboveTarget = branches.filter((b) => (b.currentProfitRate || 0) >= 0.05);
  const belowZero = branches.filter((b) => (b.currentProfitRate || 0) < 0);
  if (aboveTarget.length > 0) {
    items.push(`${aboveTarget.length} 个分公司达到利润率目标：${aboveTarget.map((b) => b.branchName).join('、')}。`);
  }
  if (belowZero.length > 0) {
    items.push(`${belowZero.length} 个分公司亏损：${belowZero.map((b) => b.branchName).join('、')}，需重点关注。`);
  }

  const avgCollection = branches.reduce((s, b) => s + (b.collectionRate || 0), 0) / (branches.length || 1);
  if (avgCollection < 0.8) {
    items.push(`平均收款率 ${formatPercent(avgCollection)}，低于80%，回款压力较大。`);
  } else if (avgCollection >= 0.9) {
    items.push(`平均收款率 ${formatPercent(avgCollection)}，回款情况良好。`);
  }

  return items;
}

function analyzeAnnualData(summary, monthlyData) {
  const items = [];
  const rate = summary.currentProfitRate;
  const change = summary.profitRateChange;

  if (rate >= 0.05) {
    items.push(`年末利润率 ${formatPercent(rate)}，整体经营状况良好。`);
  } else if (rate >= 0) {
    items.push(`年末利润率 ${formatPercent(rate)}，低于5%目标线。`);
  } else {
    items.push(`年末利润率 ${formatPercent(rate)}，处于亏损状态。`);
  }

  if (change !== undefined) {
    const pp = (change * 100).toFixed(2);
    if (change > 0.005) {
      items.push(`利润率较年初上升 ${pp} 个百分点，呈改善趋势。`);
    } else if (change < -0.005) {
      items.push(`利润率较年初下降 ${Math.abs(pp)} 个百分点，需关注下行风险。`);
    } else {
      items.push(`利润率较年初基本持平（变化 ${pp}pp）。`);
    }
  }

  if (monthlyData.length >= 3) {
    const last3 = monthlyData.slice(-3);
    const avgRate = last3.reduce((s, d) => s + (d.company?.currentProfitRate || 0), 0) / 3;
    const first3 = monthlyData.slice(0, 3);
    const avgRateFirst = first3.reduce((s, d) => s + (d.company?.currentProfitRate || 0), 0) / 3;
    const trend = avgRate - avgRateFirst;
    if (trend > 0.01) {
      items.push(`近3月平均利润率 ${formatPercent(avgRate)}，较年初3月均值上升，趋势向好。`);
    } else if (trend < -0.01) {
      items.push(`近3月平均利润率 ${formatPercent(avgRate)}，较年初3月均值下降，需警惕持续下滑。`);
    }
  }

  const profitVal = summary.currentProfit;
  if (profitVal >= 0) {
    items.push(`当前利润 ${formatCurrency(profitVal)}。`);
  } else {
    items.push(`当前亏损 ${formatCurrency(Math.abs(profitVal))}，需尽快扭亏。`);
  }

  return items;
}

function buildKpiSection(summary, isAnnual) {
  const kpis = [
    { label: '当前利润率', value: formatPercent(summary.currentProfitRate), color: profitRateColor(summary.currentProfitRate) },
    { label: '预期利润率', value: formatPercent(summary.expectedProfitRate), color: COLORS.primary },
    { label: '当前利润', value: formatCurrency(summary.currentProfit), color: profitColor(summary.currentProfit) },
    { label: '预期利润', value: formatCurrency(summary.expectedProfit), color: COLORS.primary },
  ];

  if (isAnnual && summary.profitRateChange !== undefined) {
    const change = summary.profitRateChange * 100;
    const arrow = change >= 0 ? '↑' : '↓';
    kpis[0].suffix = `${arrow} ${Math.abs(change).toFixed(2)}pp`;
    kpis[0].suffixColor = change >= 0 ? COLORS.success : COLORS.danger;
  }

  return {
    margin: [0, 10, 0, 15],
    table: {
      widths: ['*', '*', '*', '*'],
      body: [
        kpis.map((k) => ({
          text: k.label,
          fontSize: 9,
          color: COLORS.textLight,
          alignment: 'center',
          margin: [0, 8, 0, 2],
        })),
        kpis.map((k) => {
          const stack = [
            { text: k.value, fontSize: 16, bold: true, color: k.color, alignment: 'center', margin: [0, 0, 0, 2] },
          ];
          if (k.suffix) {
            stack.push({ text: k.suffix, fontSize: 9, color: k.suffixColor || COLORS.textMedium, alignment: 'center', margin: [0, 0, 0, 8] });
          }
          return { stack, alignment: 'center', margin: [0, 0, 0, 8] };
        }),
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COLORS.border,
      vLineColor: () => COLORS.border,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
  };
}

function buildChartSection(title, imageDataUrl, subtitle) {
  if (!imageDataUrl) return [];
  const content = [
    { text: title, style: 'sectionTitle', margin: [0, 10, 0, 6] },
  ];
  if (subtitle) {
    content.push({ text: subtitle, fontSize: 9, color: COLORS.textLight, margin: [0, 0, 0, 6] });
  }
  content.push({
    image: imageDataUrl,
    width: 490,
    alignment: 'center',
    margin: [0, 0, 0, 10],
  });
  return content;
}

function buildBranchTable(branches) {
  const header = ['分公司', '当前利润率', '预期利润率', '当前利润', '预期利润', '自营产值', '收款率'];
  const body = [header.map((h) => ({ text: h, style: 'tableHeader' }))];

  branches.forEach((b, idx) => {
    const bgColor = idx % 2 === 0 ? '#ffffff' : COLORS.bgGray;
    body.push([
      { text: b.branchName || '', style: 'tableCell', fillColor: bgColor },
      { text: formatPercent(b.currentProfitRate), style: 'tableCell', alignment: 'right', color: profitRateColor(b.currentProfitRate), fillColor: bgColor },
      { text: formatPercent(b.expectedProfitRate), style: 'tableCell', alignment: 'right', fillColor: bgColor },
      { text: formatCurrency(b.currentProfit), style: 'tableCell', alignment: 'right', color: profitColor(b.currentProfit), fillColor: bgColor },
      { text: formatCurrency(b.expectedProfit), style: 'tableCell', alignment: 'right', fillColor: bgColor },
      { text: formatCurrency(b.selfOperatedValue), style: 'tableCell', alignment: 'right', fillColor: bgColor },
      { text: formatPercent(b.collectionRate), style: 'tableCell', alignment: 'right', fillColor: bgColor },
    ]);
  });

  return {
    margin: [0, 10, 0, 0],
    table: {
      headerRows: 1,
      widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
      body,
    },
    layout: {
      hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
      vLineWidth: () => 0.5,
      hLineColor: (i) => (i === 0 || i === 1) ? COLORS.headerBg : COLORS.border,
      vLineColor: () => COLORS.border,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
  };
}

function buildMonthlyTable(monthlyData) {
  const header = ['月份', '当前利润率', '预期利润率', '当前利润', '预期利润', '自营产值', '收款率'];
  const body = [header.map((h) => ({ text: h, style: 'tableHeader' }))];

  monthlyData.forEach((d, idx) => {
    const c = d.company || {};
    const monthLabel = d.month ? `${parseInt(d.month.split('-')[1], 10)}月` : d.month;
    const bgColor = idx % 2 === 0 ? '#ffffff' : COLORS.bgGray;
    body.push([
      { text: monthLabel, style: 'tableCell', bold: true, fillColor: bgColor },
      { text: formatPercent(c.currentProfitRate), style: 'tableCell', alignment: 'right', color: profitRateColor(c.currentProfitRate), fillColor: bgColor },
      { text: formatPercent(c.expectedProfitRate), style: 'tableCell', alignment: 'right', fillColor: bgColor },
      { text: formatCurrency(c.currentProfit), style: 'tableCell', alignment: 'right', color: profitColor(c.currentProfit), fillColor: bgColor },
      { text: formatCurrency(c.expectedProfit), style: 'tableCell', alignment: 'right', fillColor: bgColor },
      { text: formatCurrency(c.selfOperatedValue), style: 'tableCell', alignment: 'right', fillColor: bgColor },
      { text: formatPercent(c.collectionRate), style: 'tableCell', alignment: 'right', fillColor: bgColor },
    ]);
  });

  return {
    margin: [0, 10, 0, 0],
    table: {
      headerRows: 1,
      widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
      body,
    },
    layout: {
      hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
      vLineWidth: () => 0.5,
      hLineColor: (i) => (i === 0 || i === 1) ? COLORS.headerBg : COLORS.border,
      vLineColor: () => COLORS.border,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
  };
}

function buildCoverPage(title, subtitle, dateRange) {
  return [
    { text: '', margin: [0, 120, 0, 0] },
    { text: '成本总表台账', fontSize: 28, bold: true, color: COLORS.primary, alignment: 'center', margin: [0, 0, 0, 8] },
    { text: title, fontSize: 20, color: COLORS.textDark, alignment: 'center', margin: [0, 0, 0, 24] },
    { canvas: [{ type: 'line', x1: 160, y1: 0, x2: 340, y2: 0, lineWidth: 1.5, lineColor: COLORS.primary }], margin: [0, 0, 0, 24] },
    { text: subtitle, fontSize: 13, color: COLORS.textMedium, alignment: 'center', margin: [0, 0, 0, 8] },
    { text: dateRange, fontSize: 11, color: COLORS.textLight, alignment: 'center', margin: [0, 0, 0, 8] },
    { text: `生成日期：${new Date().toLocaleDateString('zh-CN')}`, fontSize: 10, color: COLORS.textLight, alignment: 'center', margin: [0, 40, 0, 0] },
    { text: '', pageBreak: 'after' },
  ];
}

function getDocDefinition(reportTitle, content) {
  return {
    pageSize: 'A4',
    pageMargins: [50, 60, 50, 60],
    defaultStyle: {
      font: 'NotoSansSC',
      fontSize: 10,
      color: COLORS.textDark,
      lineHeight: 1.4,
    },
    styles: {
      sectionTitle: {
        fontSize: 13,
        bold: true,
        color: COLORS.textDark,
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        color: COLORS.headerText,
        fillColor: COLORS.headerBg,
        alignment: 'right',
      },
      tableCell: {
        fontSize: 9,
        color: COLORS.textDark,
      },
    },
    header: (currentPage, pageCount) => {
      if (currentPage === 1) return null;
      return {
        columns: [
          { text: reportTitle, fontSize: 8, color: COLORS.textLight, alignment: 'left', margin: [50, 20, 0, 0] },
          { text: '成本总表台账', fontSize: 8, color: COLORS.textLight, alignment: 'right', margin: [0, 20, 50, 0] },
        ],
      };
    },
    footer: (currentPage, pageCount) => {
      if (currentPage === 1) return null;
      return {
        text: `${currentPage} / ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        color: COLORS.textLight,
        margin: [0, 20, 0, 0],
      };
    },
    content,
  };
}

export async function generateMonthlyReport(overview, selectedMonth) {
  await loadFonts();

  const summary = overview.company || overview.summary || overview;
  const branches = overview.branches || [];
  const monthLabel = selectedMonth || '全量';
  const reportTitle = `月度报告 · ${monthLabel}`;

  const chartDefs = [
    { option: getProfitRateOption(branches), width: 780, height: 400 },
    { option: getProfitAmountOption(branches), width: 780, height: 400 },
    { option: getConfirmRateOption(branches), width: 780, height: 400 },
    { option: getExpenseOption(branches), width: 780, height: 400 },
    { option: getCostDonutOption(branches), width: 780, height: 400 },
  ];

  const chartImages = await renderCharts(chartDefs);

  const analysisItems = analyzeMonthlyData(summary, branches);

  const content = [
    ...buildCoverPage('月度报告', monthLabel, `数据期间：${monthLabel}`),
    buildKpiSection(summary, false),
    ...buildChartSection('利润率对比', chartImages[0], '各分公司当前利润率与预期利润率'),
    ...buildChartSection('利润额对比', chartImages[1], '各分公司当前利润与预期利润'),
    { text: '', pageBreak: 'after' },
    ...buildChartSection('综合评价', chartImages[2], '全部分公司五维指标雷达图'),
    ...buildChartSection('产值与经费', chartImages[3], '各分公司自营产值与实际成本'),
    ...buildChartSection('成本构成', chartImages[4], '各分公司成本占比'),
    { text: '', pageBreak: 'after' },
    ...buildAnalysisBlock('数据分析', analysisItems),
    { text: '分公司汇总', style: 'sectionTitle', margin: [0, 10, 0, 6] },
    buildBranchTable(branches),
  ];

  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const docDef = getDocDefinition(reportTitle, content);
  const pdfDocGenerator = pdfMake.createPdf(docDef);
  const blob = await pdfDocGenerator.getBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `成本总表台账_月度报告_${monthLabel}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function generateAnnualReport(annualData, selectedYear) {
  await loadFonts();

  const monthlyData = annualData?.monthlyData || [];
  const branchTrends = annualData?.branchTrends || [];

  if (monthlyData.length === 0) {
    throw new Error('暂无年度数据');
  }

  const first = monthlyData[0].company;
  const last = monthlyData[monthlyData.length - 1].company;
  const profitRateChange = last.currentProfitRate - first.currentProfitRate;
  const profitChange = last.currentProfit - first.currentProfit;
  const profitChangePercent = first.currentProfit !== 0
    ? (profitChange / Math.abs(first.currentProfit)) * 100
    : null;

  const summary = {
    currentProfitRate: last.currentProfitRate,
    expectedProfitRate: last.expectedProfitRate,
    currentProfit: last.currentProfit,
    expectedProfit: last.expectedProfit,
    profitRateChange,
    profitChange,
    profitChangePercent,
  };

  const reportTitle = `年度报告 · ${selectedYear}`;
  const dateRange = `${monthlyData[0].month} 至 ${monthlyData[monthlyData.length - 1].month}`;

  const chartDefs = [
    { option: getProfitTrendOption(monthlyData), width: 780, height: 400 },
    { option: getProfitAmountTrendOption(monthlyData), width: 780, height: 400 },
    { option: getBranchTrendOption(branchTrends, 'currentProfitRate'), width: 780, height: 400 },
    { option: getBranchTrendOption(branchTrends, 'currentProfit'), width: 780, height: 400 },
    { option: getRevenueCostTrendOption(monthlyData), width: 780, height: 400 },
    { option: getCollectionTrendOption(monthlyData), width: 780, height: 400 },
    { option: getCostCompositionOption(monthlyData, monthlyData[monthlyData.length - 1]?.month), width: 780, height: 400 },
    { option: getBranchRadarOption(monthlyData), width: 780, height: 400 },
    { option: getBranchScatterOption(monthlyData), width: 780, height: 400 },
  ];

  const chartImages = await renderCharts(chartDefs);

  const analysisItems = analyzeAnnualData(summary, monthlyData);

  const content = [
    ...buildCoverPage('年度报告', `${selectedYear} 年度`, `数据期间：${dateRange}`),
    buildKpiSection(summary, true),
    ...buildChartSection('利润率月度趋势', chartImages[0], '全公司当前利润率与预期利润率变化'),
    ...buildChartSection('利润额月度趋势', chartImages[1], '全公司当前利润与预期利润变化'),
    { text: '', pageBreak: 'after' },
    ...buildChartSection('分公司利润率趋势', chartImages[2], '各分公司利润率月度变化'),
    ...buildChartSection('分公司利润额趋势', chartImages[3], '各分公司利润额月度变化'),
    { text: '', pageBreak: 'after' },
    ...buildChartSection('产值与成本', chartImages[4], '自营产值与实际成本月度对比'),
    ...buildChartSection('收款情况', chartImages[5], '已收款与未收款月度对比'),
    ...buildChartSection('成本构成', chartImages[6], '各分公司成本占比'),
    { text: '', pageBreak: 'after' },
    ...buildChartSection('分公司综合对比', chartImages[7], '各分公司多维度雷达图对比'),
    ...buildChartSection('产值-利润率关系', chartImages[8], '自营产值与利润率散点分布'),
    { text: '', pageBreak: 'after' },
    ...buildAnalysisBlock('年度数据分析', analysisItems),
    { text: '月度数据对比', style: 'sectionTitle', margin: [0, 10, 0, 6] },
    { text: '各月关键指标一览', fontSize: 9, color: COLORS.textLight, margin: [0, 0, 0, 6] },
    buildMonthlyTable(monthlyData),
  ];

  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const docDef = getDocDefinition(reportTitle, content);
  const pdfDocGenerator = pdfMake.createPdf(docDef);
  const blob = await pdfDocGenerator.getBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `成本总表台账_年度报告_${selectedYear}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
