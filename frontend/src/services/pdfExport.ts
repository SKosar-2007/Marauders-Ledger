import type { AnomalyResult } from '../types'

export function exportAnomalyReport(anomaly: AnomalyResult, narrative?: string) {
  const severityColors: Record<string, string> = {
    high: '#dc2626', medium: '#d4af37', low: '#2d6a4f',
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Anomaly Report — ${anomaly.merchant}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Crimson+Pro:wght@400;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Crimson Pro', serif; color: #2c1810; padding: 40px; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #735c00; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-family: 'Cinzel Decorative', serif; font-size: 24px; color: #735c00; letter-spacing: 2px; }
    .header p { font-style: italic; color: #504440; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-family: 'Cinzel Decorative', serif; font-size: 14px; color: #735c00; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #735c0030; padding-bottom: 6px; margin-bottom: 12px; }
    .field { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #735c0020; }
    .field-label { font-size: 13px; color: #504440; }
    .field-value { font-weight: 600; font-size: 13px; }
    .severity { display: inline-block; padding: 2px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; color: white; }
    .gauge-row { display: flex; gap: 20px; margin-top: 8px; }
    .gauge { flex: 1; text-align: center; padding: 12px; border: 1px solid #735c0020; border-radius: 8px; }
    .gauge-value { font-family: 'JetBrains Mono', monospace; font-size: 24px; color: #735c00; }
    .gauge-label { font-size: 11px; color: #504440; margin-top: 4px; }
    .narrative { background: #faf3e6; padding: 16px; border-radius: 8px; border-left: 3px solid #735c00; font-style: italic; line-height: 1.6; }
    .rules { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .rule { background: #dc262610; color: #dc2626; padding: 2px 10px; border-radius: 10px; font-size: 11px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #735c00; font-size: 11px; color: #504440; }
  </style>
</head>
<body>
  <div class="header">
    <h1>The Marauder's Ledger</h1>
    <p>Anomaly Investigation Report</p>
  </div>

  <div class="section">
    <h2>Transaction Details</h2>
    <div class="field"><span class="field-label">Merchant</span><span class="field-value">${anomaly.merchant}</span></div>
    <div class="field"><span class="field-label">Amount</span><span class="field-value">₹${anomaly.amount.toFixed(2)}</span></div>
    <div class="field"><span class="field-label">Category</span><span class="field-value">${anomaly.category}</span></div>
    <div class="field"><span class="field-label">Time</span><span class="field-value">${anomaly.hour}:00</span></div>
    <div class="field"><span class="field-label">Severity</span><span class="severity" style="background:${severityColors[anomaly.severity] || '#504440'}">${anomaly.severity.toUpperCase()}</span></div>
  </div>

  <div class="section">
    <h2>Analysis Scores</h2>
    <div class="gauge-row">
      <div class="gauge">
        <div class="gauge-value">${Math.round(anomaly.isolation_score * 100)}%</div>
        <div class="gauge-label">ML Model Confidence</div>
      </div>
      <div class="gauge">
        <div class="gauge-value">${Math.round(anomaly.rule_score * 100)}%</div>
        <div class="gauge-label">Rule Flags</div>
      </div>
      <div class="gauge">
        <div class="gauge-value">${Math.round(anomaly.final_score * 100)}%</div>
        <div class="gauge-label">Final Score</div>
      </div>
    </div>
  </div>

  ${anomaly.triggered_rules.length > 0 ? `
  <div class="section">
    <h2>Triggered Rules</h2>
    <div class="rules">
      ${anomaly.triggered_rules.map((r) => `<span class="rule">${r.replace(/_/g, ' ')}</span>`).join('')}
    </div>
  </div>` : ''}

  ${narrative ? `
  <div class="section">
    <h2>Investigation Notes</h2>
    <div class="narrative">"${narrative}"</div>
  </div>` : ''}

  <div class="footer">
    <p>The Marauder's Ledger — Generated ${new Date().toLocaleString()}</p>
    <p>"I solemnly swear that I am up to no good."</p>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `anomaly-report-${anomaly.merchant.replace(/\s+/g, '-').toLowerCase()}.html`
  a.click()
  URL.revokeObjectURL(url)
}