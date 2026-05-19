const RATE_FIELDS = [
  'bid_profit_rate', 'price_diff_rate', 'baseline_benefit_rate',
  'responsibility_profit_rate', 'actual_profit_rate',
  'measurement_confirm_rate', 'value_confirm_rate',
  'later_forecast_profit_rate', 'total_expected_profit_rate',
  'collection_rate',
];

export function validateImportData(data) {
  const errors = [];
  const warnings = [];

  if (!data) {
    errors.push('数据为空');
    return { valid: false, errors, warnings };
  }

  if (!data.projects || data.projects.length === 0) {
    if (!data.branches || data.branches.length === 0) {
      errors.push('未找到任何项目或分公司数据，请检查 Excel 格式');
    } else {
      warnings.push('未找到项目明细数据，仅识别到分公司汇总行');
    }
  }

  if (!data.branches || data.branches.length === 0) {
    if (data.projects && data.projects.length > 0) {
      warnings.push('未找到分公司汇总行，项目将归入"未知分公司"');
    }
  }

  const branchNames = new Set((data.branches || []).map((b) => b.name));
  let emptyValueCount = 0;
  let rateOverflowCount = 0;
  const offlineProjects = [];

  for (const project of data.projects || []) {
    if (!project.project_name) {
      errors.push(`存在未命名的项目 (序号: ${project.seq || '未知'})`);
    }

    if (project.branch_name && !branchNames.has(project.branch_name)) {
      warnings.push(`项目"${project.project_name}"的分公司"${project.branch_name}"不在已知分公司列表中`);
    }

    if (!project.is_online) {
      offlineProjects.push(project.project_name);
      continue;
    }

    const keyFields = ['contract_self', 'actual_value', 'actual_cost'];
    for (const field of keyFields) {
      const val = project[field];
      if (val === null || val === undefined || val === 0) {
        emptyValueCount++;
      }
    }

    for (const field of RATE_FIELDS) {
      const val = project[field];
      if (val !== null && val !== undefined && val !== 0) {
        if (Math.abs(val) > 1) {
          rateOverflowCount++;
        }
      }
    }

    if (project.actual_value > 0 && project.actual_cost > project.actual_value) {
      warnings.push(`项目"${project.project_name}"的实际成本(${project.actual_cost})超过实际产值(${project.actual_value})`);
    }
  }

  if (offlineProjects.length > 0) {
    warnings.push(`${offlineProjects.length} 个项目未上线：${offlineProjects.join('、')}`);
  }

  if (emptyValueCount > 0) {
    const onlineProjects = (data.projects || []).filter((p) => p.is_online);
    const projectsWithEmpty = onlineProjects.filter(
      (p) => p.contract_self === null || p.contract_self === undefined || p.contract_self === 0
        || p.actual_value === null || p.actual_value === undefined || p.actual_value === 0
        || p.actual_cost === null || p.actual_cost === undefined || p.actual_cost === 0,
    ).length;
    warnings.push(`${projectsWithEmpty}/${onlineProjects.length} 个已上线项目的核心数值（合同额/产值/成本）为空，可能是模板数据或尚未填报`);
  }

  if (rateOverflowCount > 0) {
    warnings.push(`${rateOverflowCount} 个利润率字段的值超过100%，可能需要转换为小数格式`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
