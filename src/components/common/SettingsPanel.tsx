import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import OutlookPanel from '../outlook/OutlookPanel';

export default function SettingsPanel() {
  const { settings, updateSettings, setShowSettings } = useApp();
  const [showOutlook, setShowOutlook] = useState(false);

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button className={`toggle ${on ? 'toggle--on' : ''}`} onClick={onToggle}>
      <div className="toggle__knob" />
    </button>
  );

  return (
    <>
      <div className="modal-overlay" onClick={() => setShowSettings(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal__header">
            <div className="modal__title">设置</div>
            <button className="btn btn--ghost btn--icon" onClick={() => setShowSettings(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="modal__body">
            <div className="settings-group">
              <div className="settings-group__title">提醒设置</div>
              <div className="settings-row">
                <div>
                  <div className="settings-row__label">启用定时提醒</div>
                  <div className="settings-row__desc">每30分钟提醒记录时间块</div>
                </div>
                <Toggle on={settings.reminderEnabled} onToggle={() => updateSettings({ reminderEnabled: !settings.reminderEnabled })} />
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-row__label">提醒声音</div>
                  <div className="settings-row__desc">播放提醒音效</div>
                </div>
                <Toggle on={settings.reminderSound} onToggle={() => updateSettings({ reminderSound: !settings.reminderSound })} />
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-group__title">显示设置</div>
              <div className="settings-row">
                <div className="settings-row__label">显示起始时间</div>
                <select
                  className="form-select"
                  style={{ width: 80 }}
                  value={settings.startHour}
                  onChange={(e) => updateSettings({ startHour: Number(e.target.value) })}
                >
                  {Array.from({ length: 13 }, (_, i) => (
                    <option key={i} value={i}>{`${String(i).padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </div>
              <div className="settings-row">
                <div className="settings-row__label">显示结束时间</div>
                <select
                  className="form-select"
                  style={{ width: 80 }}
                  value={settings.endHour}
                  onChange={(e) => updateSettings({ endHour: Number(e.target.value) })}
                >
                  {Array.from({ length: 13 }, (_, i) => i + 12).map((h) => (
                    <option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-group__title">日历集成</div>
              <div className="settings-row">
                <div>
                  <div className="settings-row__label">Outlook 日历</div>
                  <div className="settings-row__desc">
                    {settings.outlookConnected ? '已连接' : '未连接'}
                  </div>
                </div>
                <button className="btn btn--sm" onClick={() => setShowOutlook(true)}>配置</button>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-group__title">数据管理</div>
              <div className="settings-row">
                <div className="settings-row__label">导出数据</div>
                <button
                  className="btn btn--sm"
                  onClick={() => {
                    const data = {
                      blocks: JSON.parse(localStorage.getItem('30blocks_timeblocks') || '[]'),
                      categories: JSON.parse(localStorage.getItem('30blocks_categories') || '[]'),
                      settings: JSON.parse(localStorage.getItem('30blocks_settings') || '{}'),
                      exportDate: new Date().toISOString(),
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `30blocks-export-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  导出 JSON
                </button>
              </div>
              <div className="settings-row">
                <div className="settings-row__label">导入数据</div>
                <label className="btn btn--sm" style={{ cursor: 'pointer' }}>
                  导入 JSON
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      file.text().then((text) => {
                        try {
                          const data = JSON.parse(text);
                          if (data.blocks) localStorage.setItem('30blocks_timeblocks', JSON.stringify(data.blocks));
                          if (data.categories) localStorage.setItem('30blocks_categories', JSON.stringify(data.categories));
                          if (data.settings) localStorage.setItem('30blocks_settings', JSON.stringify(data.settings));
                          window.location.reload();
                        } catch {
                          alert('导入失败，请确保文件格式正确');
                        }
                      });
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showOutlook && <OutlookPanel onClose={() => setShowOutlook(false)} />}
    </>
  );
}
