import { useState } from 'react'
import { useGeoCategories } from '../../hooks/useGeoCategories'
import { useGeoIntel } from '../../hooks/useGeoIntel'
import type { PlaceCategoryDef } from '../../types/geo'

type Props = {
  open: boolean
  onClose: () => void
}

export function CategoryManageModal({ open, onClose }: Props) {
  const { categories, addCategory, updateCategory, removeCategory } = useGeoCategories()
  const { countByCategory, reassignCategory } = useGeoIntel()
  const [newLabel, setNewLabel] = useState('')
  const [newLabelKo, setNewLabelKo] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  function handleAdd() {
    setError('')
    const created = addCategory(newLabel, newLabelKo)
    if (!created) {
      setError('영문명과 한글명을 모두 입력하세요.')
      return
    }
    setNewLabel('')
    setNewLabelKo('')
  }

  function handleRename(cat: PlaceCategoryDef, field: 'label' | 'labelKo', value: string) {
    updateCategory(cat.id, { [field]: value })
  }

  function handleDelete(cat: PlaceCategoryDef) {
    if (cat.id === 'other') return
    const count = countByCategory(cat.id)
    const msg =
      count > 0
        ? `「${cat.labelKo}」 카테고리를 삭제할까요?\n사용 중인 장소 ${count}개는 기타(other)로 이동합니다.`
        : `「${cat.labelKo}」 카테고리를 삭제할까요?`
    if (!window.confirm(msg)) return
    if (count > 0) reassignCategory(cat.id, 'other')
    removeCategory(cat.id)
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel hud-panel category-manage-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-manage-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="hud-corner tl" />
        <span className="hud-corner tr" />
        <span className="hud-corner bl" />
        <span className="hud-corner br" />

        <div className="modal-header">
          <div>
            <p className="section-code">// CATEGORY REGISTRY</p>
            <h2 id="category-manage-title" className="modal-title glow-text">
              카테고리 관리
            </h2>
          </div>
          <button type="button" className="btn-ghost modal-close" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <ul className="category-manage-list">
          {categories.map((cat) => (
            <li key={cat.id} className="category-manage-row">
              <span className="category-manage-id font-mono">{cat.id}</span>
              <input
                className="category-manage-input"
                value={cat.labelKo}
                onChange={(e) => handleRename(cat, 'labelKo', e.target.value)}
                aria-label={`${cat.id} 한글명`}
              />
              <input
                className="category-manage-input"
                value={cat.label}
                onChange={(e) => handleRename(cat, 'label', e.target.value)}
                aria-label={`${cat.id} 영문명`}
              />
              <span className="category-manage-count font-mono">
                {countByCategory(cat.id)}
              </span>
              <button
                type="button"
                className="btn-danger category-manage-delete"
                disabled={cat.id === 'other'}
                onClick={() => handleDelete(cat)}
                title={cat.id === 'other' ? '기타는 삭제할 수 없습니다' : '삭제'}
              >
                Del
              </button>
            </li>
          ))}
        </ul>

        <div className="category-manage-add">
          <p className="field-label">+ ADD CATEGORY</p>
          <div className="field-row">
            <label className="field">
              <span className="field-label">한글명</span>
              <input
                value={newLabelKo}
                onChange={(e) => setNewLabelKo(e.target.value)}
                placeholder="예: 해변"
              />
            </label>
            <label className="field">
              <span className="field-label">영문명</span>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="예: Beach"
              />
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="button" className="btn-primary" onClick={handleAdd}>
            Add Category
          </button>
        </div>
      </div>
    </div>
  )
}
