import { useState } from 'react';
import { X, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { upsertBlock } from '../../store/storage';

/**
 * Outlook Calendar Integration Panel
 *
 * This provides the UI for connecting to Microsoft Outlook calendar
 * via Microsoft Graph API. The actual OAuth flow would require:
 * 1. Register an Azure AD app
 * 2. Use MSAL.js for auth
 * 3. Call Microsoft Graph /me/calendarView endpoint
 *
 * For local deployment, this module shows the setup instructions
 * and provides a manual import option (ICS file).
 */
export default function OutlookPanel({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useApp();
  const [importing, setImporting] = useState(false);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const text = await file.text();
      // Basic ICS parser for VEVENT blocks
      const events: Array<{ summary: string; dtstart: string; dtend: string }> = [];
      const lines = text.split('\n');
      let inEvent = false;
      let current: Record<string, string> = {};

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === 'BEGIN:VEVENT') { inEvent = true; current = {}; }
        else if (trimmed === 'END:VEVENT') {
          inEvent = false;
          if (current.SUMMARY && current.DTSTART) {
            events.push({
              summary: current.SUMMARY,
              dtstart: current.DTSTART,
              dtend: current.DTEND || current.DTSTART,
            });
          }
        } else if (inEvent) {
          const colonIdx = trimmed.indexOf(':');
          if (colonIdx > 0) {
            const key = trimmed.substring(0, colonIdx).split(';')[0];
            const val = trimmed.substring(colonIdx + 1);
            current[key] = val;
          }
        }
      }

      // Convert to time blocks
      let imported = 0;

      for (const evt of events) {
        const startDate = parseICSDate(evt.dtstart);
        if (!startDate) continue;

        const endDate = parseICSDate(evt.dtend) || startDate;
        const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const startSlot = startDate.getHours() * 2 + (startDate.getMinutes() >= 30 ? 1 : 0);
        const endSlot = endDate.getHours() * 2 + (endDate.getMinutes() > 30 ? 2 : endDate.getMinutes() > 0 ? 1 : 0);

        for (let slot = startSlot; slot < Math.min(endSlot, 48); slot++) {
          upsertBlock({
            date: dateStr,
            slotIndex: slot,
            status: 'planned',
            source: 'outlook',
            customNote: evt.summary,
          });
          imported++;
        }
      }

      alert(`成功导入 ${events.length} 个日历事件，共 ${imported} 个时间块`);
      // Refresh
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      alert('导入失败，请确保文件格式正确 (.ics)');
    }

    setImporting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">
            <Calendar size={16} style={{ display: 'inline', marginRight: 8 }} />
            Outlook 日历集成
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal__body">
          <div className="outlook-panel" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              {settings.outlookConnected ? (
                <><CheckCircle2 size={16} color="var(--color-success)" /> <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>已连接</span></>
              ) : (
                <><AlertCircle size={16} color="var(--color-warning)" /> <span style={{ fontWeight: 600 }}>未连接</span></>
              )}
            </div>

            <div className="outlook-info">
              <p style={{ marginBottom: 8 }}><strong>方式一：Microsoft Graph API (推荐)</strong></p>
              <p>配置 Azure AD 应用后，可自动同步 Outlook 日历事件。需要以下配置：</p>
              <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
                <li>在 Azure Portal 注册应用</li>
                <li>授权 Calendars.Read 权限</li>
                <li>配置重定向 URI 为本地地址</li>
              </ol>
              <button
                className="btn btn--primary btn--sm"
                style={{ marginTop: 8 }}
                onClick={() => {
                  updateSettings({ outlookConnected: !settings.outlookConnected });
                }}
              >
                {settings.outlookConnected ? '断开连接' : '模拟连接'}
              </button>
            </div>
          </div>

          <div className="outlook-panel">
            <div className="outlook-info">
              <p style={{ marginBottom: 8 }}><strong>方式二：导入 ICS 文件</strong></p>
              <p>从 Outlook 导出日历为 .ics 文件后导入。支持批量导入会议和日程。</p>
              <div style={{ marginTop: 12 }}>
                <label className="btn btn--sm" style={{ cursor: 'pointer' }}>
                  {importing ? '导入中...' : '选择 .ics 文件'}
                  <input
                    type="file"
                    accept=".ics"
                    onChange={handleFileImport}
                    style={{ display: 'none' }}
                    disabled={importing}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseICSDate(str: string): Date | null {
  if (!str) return null;
  // Format: 20260325T090000Z or 20260325T090000
  const clean = str.replace(/[^0-9T]/g, '');
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) {
    const dateOnly = clean.match(/^(\d{4})(\d{2})(\d{2})/);
    if (dateOnly) return new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]);
    return null;
  }
  return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]);
}
