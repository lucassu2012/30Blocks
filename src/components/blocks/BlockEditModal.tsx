import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { slotToTime, slotToEndTime } from '../../utils/time';
import type { TimeBlock, BlockStatus } from '../../types';

interface Props {
  date: string;
  slotIndex: number;
  existingBlock?: TimeBlock;
  onClose: () => void;
}

export default function BlockEditModal({ date, slotIndex, existingBlock, onClose }: Props) {
  const { categories, upsertBlock, deleteBlock } = useApp();

  const [l1Id, setL1Id] = useState(existingBlock?.categoryL1Id || '');
  const [l2Id, setL2Id] = useState(existingBlock?.categoryL2Id || '');
  const [l3Id, setL3Id] = useState(existingBlock?.categoryL3Id || '');
  const [note, setNote] = useState(existingBlock?.customNote || '');
  const [status, setStatus] = useState<BlockStatus>(existingBlock?.status || 'recorded');

  const selectedL1 = categories.find((c) => c.id === l1Id);
  const selectedL2 = selectedL1?.children.find((c) => c.id === l2Id);

  useEffect(() => {
    setL2Id('');
    setL3Id('');
  }, [l1Id]);

  useEffect(() => {
    setL3Id('');
  }, [l2Id]);

  const handleSave = () => {
    if (!l1Id) return;
    upsertBlock({
      date,
      slotIndex,
      categoryL1Id: l1Id,
      categoryL2Id: l2Id || undefined,
      categoryL3Id: l3Id || undefined,
      customNote: note || undefined,
      status,
      source: existingBlock?.source || 'manual',
    });
    onClose();
  };

  const handleDelete = () => {
    deleteBlock(date, slotIndex);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">
            {date} {slotToTime(slotIndex)} - {slotToEndTime(slotIndex)}
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal__body">
          <div className="form-group">
            <label className="form-label">状态</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as BlockStatus)}>
              <option value="recorded">已记录</option>
              <option value="planned">已规划</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">活动大类 (一级)</label>
            <select className="form-select" value={l1Id} onChange={(e) => setL1Id(e.target.value)}>
              <option value="">-- 请选择 --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedL1 && selectedL1.children.length > 0 && (
            <div className="form-group">
              <label className="form-label">活动子类 (二级)</label>
              <select className="form-select" value={l2Id} onChange={(e) => setL2Id(e.target.value)}>
                <option value="">-- 请选择 --</option>
                {selectedL1.children.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedL2 && selectedL2.children.length > 0 && (
            <div className="form-group">
              <label className="form-label">具体活动 (三级)</label>
              <select className="form-select" value={l3Id} onChange={(e) => setL3Id(e.target.value)}>
                <option value="">-- 请选择 --</option>
                {selectedL2.children.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">备注</label>
            <textarea
              className="form-input form-input--textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选：补充说明"
            />
          </div>
        </div>

        <div className="modal__footer">
          {existingBlock && existingBlock.status !== 'empty' && (
            <button className="btn btn--danger" onClick={handleDelete}>删除</button>
          )}
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={!l1Id}>保存</button>
        </div>
      </div>
    </div>
  );
}
