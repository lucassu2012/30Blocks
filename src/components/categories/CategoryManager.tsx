import React, { useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../../store/AppContext';
import type { CategoryLevel1, CategoryLevel2, CategoryLevel3 } from '../../types';

export default function CategoryManager() {
  const { categories, updateCategories, setShowCategoryManager } = useApp();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const commitEdit = () => {
    if (!editingId || !editName.trim()) { setEditingId(null); return; }
    const updated = categories.map((l1) => {
      if (l1.id === editingId) return { ...l1, name: editName.trim() };
      return {
        ...l1,
        children: l1.children.map((l2) => {
          if (l2.id === editingId) return { ...l2, name: editName.trim() };
          return {
            ...l2,
            children: l2.children.map((l3) =>
              l3.id === editingId ? { ...l3, name: editName.trim() } : l3
            ),
          };
        }),
      };
    });
    updateCategories(updated);
    setEditingId(null);
  };

  const addL1 = () => {
    const newCat: CategoryLevel1 = {
      id: uuidv4(), name: '新分类', color: '#6366F1', children: [],
    };
    updateCategories([...categories, newCat]);
    startEdit(newCat.id, newCat.name);
  };

  const addL2 = (l1Id: string) => {
    const newSub: CategoryLevel2 = { id: uuidv4(), parentId: l1Id, name: '新子类', children: [] };
    const updated = categories.map((l1) =>
      l1.id === l1Id ? { ...l1, children: [...l1.children, newSub] } : l1
    );
    updateCategories(updated);
    startEdit(newSub.id, newSub.name);
  };

  const addL3 = (l1Id: string, l2Id: string) => {
    const newItem: CategoryLevel3 = { id: uuidv4(), parentId: l2Id, name: '新活动' };
    const updated = categories.map((l1) =>
      l1.id === l1Id
        ? {
            ...l1,
            children: l1.children.map((l2) =>
              l2.id === l2Id ? { ...l2, children: [...l2.children, newItem] } : l2
            ),
          }
        : l1
    );
    updateCategories(updated);
    startEdit(newItem.id, newItem.name);
  };

  const deleteL1 = (id: string) => updateCategories(categories.filter((c) => c.id !== id));

  const deleteL2 = (l1Id: string, l2Id: string) => {
    updateCategories(
      categories.map((l1) =>
        l1.id === l1Id ? { ...l1, children: l1.children.filter((c) => c.id !== l2Id) } : l1
      )
    );
  };

  const deleteL3 = (l1Id: string, l2Id: string, l3Id: string) => {
    updateCategories(
      categories.map((l1) =>
        l1.id === l1Id
          ? {
              ...l1,
              children: l1.children.map((l2) =>
                l2.id === l2Id ? { ...l2, children: l2.children.filter((c) => c.id !== l3Id) } : l2
              ),
            }
          : l1
      )
    );
  };

  const updateColor = (l1Id: string, color: string) => {
    updateCategories(categories.map((l1) => l1.id === l1Id ? { ...l1, color } : l1));
  };

  const renderName = (id: string, name: string) => {
    if (editingId === id) {
      return (
        <input
          className="form-input"
          style={{ padding: '2px 6px', width: 120 }}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
          autoFocus
        />
      );
    }
    return <span onDoubleClick={() => startEdit(id, name)}>{name}</span>;
  };

  return (
    <div className="modal-overlay" onClick={() => setShowCategoryManager(false)}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">活动分类管理</div>
          <button className="btn btn--ghost btn--icon" onClick={() => setShowCategoryManager(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="modal__body">
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
            双击名称可编辑 · 三级分类体系：大类 → 子类 → 具体活动
          </div>
          <div className="cat-manager">
            {categories.map((l1) => (
              <div className="cat-l1" key={l1.id}>
                <div className="cat-l1__header" onClick={() => toggle(l1.id)}>
                  {expanded[l1.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <input
                    type="color"
                    value={l1.color}
                    onChange={(e) => updateColor(l1.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 20, height: 20, border: 'none', padding: 0, cursor: 'pointer' }}
                  />
                  <div className="cat-l1__name">{renderName(l1.id, l1.name)}</div>
                  <button className="btn btn--ghost btn--icon btn--sm" onClick={(e) => { e.stopPropagation(); deleteL1(l1.id); }}>
                    <Trash2 size={13} />
                  </button>
                </div>

                {expanded[l1.id] && (
                  <>
                    {l1.children.map((l2) => (
                      <React.Fragment key={l2.id}>
                        <div className="cat-l2">
                          <div className="cat-l2__name">{renderName(l2.id, l2.name)}</div>
                          <button className="btn btn--ghost btn--icon btn--sm" onClick={() => addL3(l1.id, l2.id)} title="添加三级活动">
                            <Plus size={13} />
                          </button>
                          <button className="btn btn--ghost btn--icon btn--sm" onClick={() => deleteL2(l1.id, l2.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {l2.children.map((l3) => (
                          <div className="cat-l3" key={l3.id}>
                            <div className="cat-l3__name">{renderName(l3.id, l3.name)}</div>
                            <button className="btn btn--ghost btn--icon btn--sm" onClick={() => deleteL3(l1.id, l2.id, l3.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                    <div className="cat-add" onClick={() => addL2(l1.id)}>
                      <Plus size={13} /> 添加子类
                    </div>
                  </>
                )}
              </div>
            ))}
            <button className="btn" onClick={addL1}>
              <Plus size={14} /> 添加活动大类
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
