export function computeStatus(field) {
    if (field.stage === 'Harvested') return 'Completed'
  
    const plantedDays =
      (Date.now() - new Date(field.planting_date)) / (1000 * 60 * 60 * 24)
  
    if (plantedDays > 90 && field.stage !== 'Ready') return 'At Risk'
  
    return 'Active'
  }